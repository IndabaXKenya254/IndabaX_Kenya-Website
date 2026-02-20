export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/events - List published events
// Created: Day 2 - Public API Endpoints

import { NextRequest, NextResponse } from 'next/server'

// Issue #2 FIX: Removed Edge Runtime - incompatible with createServerClient() which uses cookies()
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateQuery, eventsQuerySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Event } from '@/types/api'

/**
 * GET /api/events?type=upcoming&limit=10&event_category=noai&event_year=2026
 * Returns events ordered by start_date
 *
 * Query Parameters:
 * - type (optional): Filter by lifecycle status (upcoming | past)
 *   - 'upcoming' = shows events with status='upcoming' or 'ongoing'
 *   - 'past' = shows events with status='past' or 'archived'
 *   - omit = shows all events except 'cancelled'
 * - limit (optional): Maximum number of results (1-100, default: 100)
 * - event_category (optional): Filter by event category (indabax | noai | general)
 * - event_year (optional): Filter by event year (2000-2100)
 *
 * Note: The 'event_type' field (workshop, conference, meetup, webinar) is different
 * from the 'status' field (upcoming, ongoing, past, archived, cancelled). This endpoint filters by status.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQuery(eventsQuerySchema, searchParams)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { type, limit, event_category, event_year } = validation.data

    // Build query - select all fields
    let query = supabase
      .from('events')
      .select('*')
      .is('deleted_at', null)  // Issue #14/#16 FIX: Exclude soft-deleted events

    // Apply lifecycle status filter if provided
    if (type === 'upcoming') {
      query = query.in('status', ['upcoming', 'ongoing', 'published'])
    } else if (type === 'past') {
      query = query.in('status', ['past', 'archived'])
    } else {
      // Default: show all events except cancelled and draft
      query = query.in('status', ['upcoming', 'ongoing', 'past', 'archived', 'published'])
    }

    // Apply event_category filter if provided
    if (event_category) {
      query = query.eq('event_category', event_category)
    }

    // Apply event_year filter if provided
    if (event_year) {
      query = query.eq('event_year', event_year)
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    // Order by start_date
    // Upcoming: ascending (soonest first)
    // Past: descending (most recent first)
    const orderDirection = type === 'past' ? { ascending: false } : { ascending: true }
    query = query.order('start_date', orderDirection)

    // Secondary sort by featured flag
    query = query.order('is_featured', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Events query error:', error)
      return handleDatabaseError(error)
    }

    // Success response
    const response: ApiSuccessResponse<Event[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    // Issue #2 FIX: Allow short caching for public endpoints to reduce DB load
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
