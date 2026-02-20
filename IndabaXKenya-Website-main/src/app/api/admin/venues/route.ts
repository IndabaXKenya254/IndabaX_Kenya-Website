export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUES ADMIN API
// ═══════════════════════════════════════════════════════════════════════
// CRUD operations for venues management
// Requires authentication and admin role

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/middleware/admin'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

// Validation schema
const venueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('Kenya'),
  description: z.string().optional().nullable(), // QuillJS HTML
  facilities: z.string().optional().nullable(), // QuillJS HTML
  getting_there: z.string().optional().nullable(), // QuillJS HTML
  nearby_amenities: z.string().optional().nullable(), // QuillJS HTML
  capacity: z.number().int().min(0).optional().nullable(),
  image_url: z.string().url('Invalid image URL').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  map_embed_url: z.string().optional().nullable(),
  map_latitude: z.number().min(-90).max(90).optional().nullable(),
  map_longitude: z.number().min(-180).max(180).optional().nullable(),
  website_url: z.string().url('Invalid website URL').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
})

/**
 * GET /api/admin/venues
 * List all venues (including inactive) with pagination
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('is_active')

    // Build query
    let query = supabase
      .from('venues')
      .select('*', { count: 'exact' })

    // Filter by active status
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    query = query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Venues query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || [],
      count: count || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/venues
 * Create a new venue
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate input
    const validation = venueSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const validatedData = validation.data

    // Insert venue
    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: validatedData.name,
        slug: validatedData.slug,
        address: validatedData.address || null,
        city: validatedData.city || null,
        country: validatedData.country,
        description: validatedData.description || null,
        facilities: validatedData.facilities || null,
        getting_there: validatedData.getting_there || null,
        nearby_amenities: validatedData.nearby_amenities || null,
        capacity: validatedData.capacity || null,
        image_url: validatedData.image_url || null,
        map_embed_url: validatedData.map_embed_url || null,
        map_latitude: validatedData.map_latitude || null,
        map_longitude: validatedData.map_longitude || null,
        website_url: validatedData.website_url || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        is_active: validatedData.is_active,
        display_order: validatedData.display_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Venue creation error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/admin/venues
 * Update a venue
 */
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Venue ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = venueSchema.partial().safeParse(updateData)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const validatedData = validation.data

    // Update venue
    const { data, error } = await supabase
      .from('venues')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Venue update error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/venues
 * Delete a venue
 */
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Venue ID is required' },
        { status: 400 }
      )
    }

    // Check if venue is used by any events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('venue_id', id)
      .limit(5)

    if (eventsError) {
      console.error('Error checking events:', eventsError)
    }

    if (events && events.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete venue. It is used by ${events.length} event(s): ${events.map(e => e.title).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Delete venue
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Venue deletion error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: { deleted: true },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
