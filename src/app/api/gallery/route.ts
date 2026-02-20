// Enable ISR caching - revalidate every 60 seconds
export const revalidate = 60

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - GALLERY API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/gallery - List gallery photos
// Created: Day 2 - Public API Endpoints
// Phase 4: Pagination support (November 29, 2025)
// Phase 5: Enhanced caching + Edge Runtime (November 29, 2025)

import { NextRequest, NextResponse } from 'next/server'

// Enable Edge Runtime for faster global response times
export const runtime = 'edge';
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateQuery, galleryQuerySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Photo } from '@/types/api'

/**
 * GET /api/gallery?year=2024&limit=20&page=1
 * GET /api/gallery?event_id=uuid-here
 * GET /api/gallery?category=NOAI
 * GET /api/gallery?exclude_category=NOAI
 * Returns gallery photos ordered by year (desc) and display_order
 *
 * Query Parameters:
 * - year (optional): Filter by year (2000-2100)
 * - event_id (optional): Filter by event UUID
 * - category (optional): Filter by category (e.g., NOAI, General, Keynotes)
 * - exclude_category (optional): Exclude photos with this category
 * - limit (optional): Maximum number of results per page (1-200, default: 20)
 * - page (optional): Page number (1-based, default: 1)
 *
 * Response includes pagination metadata:
 * - pagination.page: Current page number
 * - pagination.limit: Items per page
 * - pagination.total: Total number of photos matching filters
 * - pagination.totalPages: Total number of pages
 * - pagination.hasNextPage: Whether there are more pages
 *
 * Note: RLS policy allows public to view all photos
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQuery(galleryQuerySchema, searchParams)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { year, event_id, category, exclude_category, limit } = validation.data
    const event_name = searchParams.get('event_name')

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = limit || 20 // Default 20 photos per page
    const offset = (page - 1) * pageSize

    // Build query - select fields that match the database schema
    // Use count: 'exact' to get total count for pagination
    let query = supabase
      .from('photos')
      .select('id, image_url, thumbnail_url, caption, year, event_id, event_name, photographer, display_order, uploaded_by, created_at, category, media_type', { count: 'exact' })

    // Apply year filter if provided
    if (year) {
      query = query.eq('year', year)
    }

    // Apply event filter if provided
    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Apply exclude category filter if provided
    if (exclude_category) {
      query = query.neq('category', exclude_category)
    }

    // Apply event name filter if provided
    if (event_name) {
      query = query.eq('event_name', event_name)
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    // Order by year (newest first), then display_order
    query = query
      .order('year', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Gallery query error:', error)
      return handleDatabaseError(error)
    }

    // Data already matches Photo interface
    const photos: Photo[] = (data || []) as Photo[]

    // Fetch available years for filters (distinct years from database)
    let availableYearsQuery = supabase
      .from('photos')
      .select('year')

    // Apply same exclude filter for consistency
    if (exclude_category) {
      availableYearsQuery = availableYearsQuery.neq('category', exclude_category)
    }

    const { data: yearsData } = await availableYearsQuery
    const availableYears = yearsData
      ? Array.from(new Set(yearsData.map((y: { year: number }) => y.year))).sort((a, b) => b - a)
      : []

    // Fetch available events for filters (distinct event names from database)
    let availableEventsQuery = supabase
      .from('photos')
      .select('event_name')
      .not('event_name', 'is', null)

    // Apply same exclude filter for consistency
    if (exclude_category) {
      availableEventsQuery = availableEventsQuery.neq('category', exclude_category)
    }

    const { data: eventsData } = await availableEventsQuery
    const availableEvents = eventsData
      ? Array.from(new Set(eventsData.map((e: { event_name: string }) => e.event_name).filter(Boolean))).sort()
      : []

    // Calculate pagination metadata
    const totalPhotos = count || 0
    const totalPages = Math.ceil(totalPhotos / pageSize)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Success response with pagination, available years, and available events
    const response: ApiSuccessResponse<Photo[]> & {
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPrevPage: boolean
      }
      availableYears: number[]
      availableEvents: string[]
    } = {
      success: true,
      data: photos,
      count: photos.length,
      pagination: {
        page,
        limit: pageSize,
        total: totalPhotos,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      availableYears,
      availableEvents,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Balanced Caching for admin updates:
        // - s-maxage=60: CDN caches for 1 minute (allows quick updates)
        // - stale-while-revalidate=120: Serve stale for 2 minutes max while revalidating
        // - max-age=30: Browser caches for 30 seconds
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
