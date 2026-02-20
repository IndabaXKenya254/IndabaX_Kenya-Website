export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SCHEDULE ITEMS PUBLIC API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/schedule-items - Get schedule items grouped by day
// Created: Dynamic Schedule Display

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/schedule-items?event_id=uuid
 * Returns schedule items grouped by day_number
 *
 * Query Parameters:
 * - event_id (optional): Filter by event ID
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "day_number": 1,
 *       "day_name": "Day 1",
 *       "schedule_date": "March 15, 2026",
 *       "sessions": [
 *         {
 *           "id": "uuid",
 *           "title": "Opening Keynote",
 *           "description": "...",
 *           "start_time": "09:00",
 *           "end_time": "10:00",
 *           "location": "Main Hall",
 *           "session_type": "keynote",
 *           "speakers": [...]
 *         }
 *       ]
 *     }
 *   ],
 *   "event": { "id": "uuid", "title": "IndabaX Kenya 2026", ... }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    const eventId = searchParams.get('event_id')

    // Build query for schedule items - select only needed fields for performance
    let query = supabase
      .from('schedule_items')
      .select('id, day_number, day_name, schedule_date, start_time, end_time, title, description, location, session_type, speaker_ids, event_id')
      .order('day_number', { ascending: true })
      .order('start_time', { ascending: true })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: scheduleItems, error } = await query

    if (error) {
      console.error('Schedule items query error:', error)
      return handleDatabaseError(error)
    }

    // Get event info
    let eventInfo = null

    // If event_id provided, fetch that specific event
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, slug, title, description, start_date, end_date, location, venue, featured_image')
        .eq('id', eventId)
        .single()

      if (eventError) {
        console.error('Event fetch error:', eventError)
      }
      eventInfo = event
    }
    // Otherwise, if we have schedule items, get event info from the first item
    else if (scheduleItems && scheduleItems.length > 0 && scheduleItems[0].event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, slug, title, description, start_date, end_date, location, venue, featured_image')
        .eq('id', scheduleItems[0].event_id)
        .single()

      if (eventError) {
        console.error('Event fetch error (from first schedule item):', eventError)
      }
      eventInfo = event
    }

    // Group schedule items by day
    const groupedByDay: Record<number, any> = {}

    for (const item of scheduleItems || []) {
      const dayNum = item.day_number
      if (!groupedByDay[dayNum]) {
        groupedByDay[dayNum] = {
          day_number: dayNum,
          day_name: item.day_name || `Day ${dayNum}`,
          schedule_date: item.schedule_date || null,
          sessions: [],
        }
      }

      groupedByDay[dayNum].sessions.push({
        id: item.id,
        time: item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : null,
        start_time: item.start_time,
        end_time: item.end_time,
        title: item.title,
        description: item.description,
        location: item.location,
        session_type: item.session_type,
        speaker_ids: item.speaker_ids || [],
      })
    }

    // Convert to array and sort by day_number
    const schedule = Object.values(groupedByDay).sort((a, b) => a.day_number - b.day_number)

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: {
        schedule,
        event: eventInfo,
      },
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        // Schedule changes infrequently - cache for 10 minutes
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
