export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SCHEDULES API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/schedules - List all schedule items
// POST /api/admin/schedules - Create new schedule item

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/schedules
 * List all schedule items with optional pagination and filtering
 *
 * Query Parameters:
 * - limit: number (default: 100, max: 200)
 * - offset: number (default: 0)
 * - event_id: string (optional) - Filter by event ID
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const eventId = searchParams.get('event_id')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('schedule_items')
      .select('*, event:events(id, title), speakers:schedule_speakers(speaker:speakers(id, name))', { count: 'exact' })
      .order('day_number', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply event filter if provided
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Schedules list error:', error)
      return handleDatabaseError(error)
    }

    // Transform the data to match the expected format
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      event: item.event,
      speaker_ids: item.speakers?.map((s: any) => s.speaker?.id).filter(Boolean) || [],
      speakers: item.speakers?.map((s: any) => s.speaker).filter(Boolean) || []
    }))

    const response: ApiSuccessResponse<any[]> = {
      success: true,
      data: transformedData,
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
 * POST /api/admin/schedules
 * Create a new schedule item
 *
 * Request Body:
 * {
 *   "event_id": "uuid",
 *   "day_number": 1,
 *   "start_time": "09:00",
 *   "end_time": "10:00",
 *   "title": "Opening Keynote",
 *   "description": "...",
 *   "session_type": "keynote",
 *   "location": "Main Hall",
 *   "speaker_ids": ["uuid1", "uuid2"]
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Parse request body
    const body = await request.json()
    const { speaker_ids, ...scheduleData } = body

    // Validate required fields
    if (!scheduleData.event_id || !scheduleData.title) {
      return handleValidationError('Event ID and title are required')
    }

    // Insert schedule item
    const { data: scheduleItem, error: scheduleError } = await supabase
      .from('schedule_items')
      .insert(scheduleData)
      .select()
      .single()

    if (scheduleError) {
      console.error('Schedule item insert error:', scheduleError)
      return handleDatabaseError(scheduleError)
    }

    // Insert speaker associations if provided
    if (speaker_ids && Array.isArray(speaker_ids) && speaker_ids.length > 0) {
      const speakerAssociations = speaker_ids.map(speakerId => ({
        schedule_item_id: scheduleItem.id,
        speaker_id: speakerId
      }))

      const { error: speakersError } = await supabase
        .from('schedule_speakers')
        .insert(speakerAssociations)

      if (speakersError) {
        console.error('Schedule speakers insert error:', speakersError)
        // Don't fail the whole request if speaker association fails
      }
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: scheduleItem,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
