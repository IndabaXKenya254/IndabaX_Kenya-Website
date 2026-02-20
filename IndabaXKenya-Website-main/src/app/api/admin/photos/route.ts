export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN GALLERY PHOTOS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/photos - List all gallery photos
// POST /api/admin/photos - Create new photo
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createPhotoSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Photo } from '@/types/api'

// Helper to invalidate all gallery-related caches
function invalidateGalleryCache() {
  revalidatePath('/gallery')
  revalidatePath('/noai/gallery')
  revalidatePath('/api/gallery')
  revalidatePath('/admin/gallery')
}

/**
 * GET /api/admin/photos
 * List all gallery photos for admin
 *
 * Query Parameters:
 * - year: number (e.g., 2023, 2024)
 * - event_id: uuid (optional)
 * - is_featured: 'true' | 'false' (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const year = searchParams.get('year')
    const eventId = searchParams.get('event_id')
    const isFeatured = searchParams.get('is_featured')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('photos')
      .select('*', { count: 'exact' })
      .order('year', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (year) {
      const yearInt = parseInt(year)
      if (!isNaN(yearInt)) {
        query = query.eq('year', yearInt)
      }
    }

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (isFeatured === 'true') {
      query = query.eq('is_featured', true)
    } else if (isFeatured === 'false') {
      query = query.eq('is_featured', false)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('caption', `%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Photos list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Photo[]> = {
      success: true,
      data: (data || []) as Photo[],
      count: count || 0,
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/photos
 * Create a new photo
 *
 * Request Body:
 * {
 *   "url": "https://...",
 *   "title": "Photo title" (optional),
 *   "description": "Photo description" (optional),
 *   "year": 2024,
 *   "event_id": "uuid" (optional),
 *   "is_featured": true/false (default: false),
 *   "display_order": 0 (default: 0)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { email } = authCheck.data // Get logged-in admin email

    // Validate request body
    const body = await request.json()
    console.log('Photo create request body:', body)

    const validation = createPhotoSchema.safeParse(body)

    if (!validation.success) {
      console.error('Photo validation error:', validation.error)
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const validatedData = validation.data

    // Normalize field names for database
    // Database uses: image_url, thumbnail_url, caption, year (string), event_id, event_name
    // Accept both old and new field names
    const photoData: any = {
      image_url: validatedData.image_url || validatedData.url,
      thumbnail_url: validatedData.thumbnail_url,
      caption: validatedData.caption || validatedData.title,
      year: typeof validatedData.year === 'string' ? validatedData.year : validatedData.year.toString(),
      category: validatedData.category,
      description: validatedData.description,
      media_type: validatedData.media_type || 'image',
      event_id: validatedData.event_id || null,
      event_name: validatedData.event_name,
      photographer: validatedData.photographer,
      display_order: validatedData.display_order || 0,
      is_featured: validatedData.is_featured || false,
      photo_date: new Date().toISOString().split('T')[0], // Use date only (YYYY-MM-DD) for date column
      uploaded_by: email,
    }

    // Remove undefined/null values except event_id
    Object.keys(photoData).forEach(key => {
      if (photoData[key] === undefined || (photoData[key] === null && key !== 'event_id')) {
        delete photoData[key]
      }
    })

    console.log('Inserting photo data:', photoData)

    // Insert photo
    const { data, error } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single()

    if (error) {
      console.error('Photo insert error:', error)
      return handleDatabaseError(error)
    }

    // Invalidate gallery caches after successful creation
    invalidateGalleryCache()

    const response: ApiSuccessResponse<Photo> = {
      success: true,
      data: data as Photo,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
