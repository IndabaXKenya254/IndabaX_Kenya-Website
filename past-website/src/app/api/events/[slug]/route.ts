export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT DETAIL API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/events/[slug] - Get single event with speakers and schedule
// Created: Day 2 - Public API Endpoints

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  handleError,
  handleDatabaseError,
  handleNotFound,
  handleValidationError,
} from '@/lib/api-errors'
import { validateParam, eventSlugSchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, EventDetail } from '@/types/api'

/**
 * GET /api/events/indabax-kenya-2026
 * Returns a single event with associated speakers and schedule
 *
 * Path Parameters:
 * - slug (required): Event slug (unique identifier)
 *
 * Response includes:
 * - Event details
 * - Speakers (with role: keynote, speaker, etc.)
 * - Schedule items (sessions, talks, breaks)
 *
 * Note: RLS policy only shows published events
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerClient()

    // Validate path parameter
    const validation = validateParam(eventSlugSchema, params.slug)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const slug = validation.data

    // Query event with related data using Supabase joins
    // This is a complex query with multiple table joins
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_speakers (
          id,
          role,
          display_order,
          speaker:speakers (
            id,
            name,
            title,
            organization,
            photo_url,
            bio_short,
            bio_full,
            linkedin_url,
            twitter_url,
            website_url,
            is_featured,
            display_order,
            created_at,
            updated_at
          )
        ),
        event_sponsors (
          id,
          sponsorship_level,
          display_order,
          sponsor:sponsors (
            id,
            name,
            logo_url,
            website_url,
            tier,
            display_order,
            is_active,
            sponsor_year,
            created_at
          )
        ),
        event_team_members (
          id,
          event_role,
          display_order,
          team_member:team_members (
            id,
            name,
            role,
            photo_url,
            bio,
            linkedin_url,
            twitter_url,
            display_order,
            is_active,
            created_at,
            updated_at
          )
        ),
        schedule_items (
          id,
          event_id,
          day_number,
          start_time,
          end_time,
          title,
          description,
          session_type,
          location,
          speaker_ids,
          created_at
        )
      `)
      .eq('slug', slug)
      .in('status', ['published', 'upcoming', 'ongoing', 'past', 'archived']) // Show all public events
      .single() // Expect exactly one result (slug is unique)

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        // PGRST116 = no rows returned
        return handleNotFound(`Event '${slug}' not found or not published`)
      }

      console.error('Event detail query error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound(`Event '${slug}' not found`)
    }

    // Transform the data to match EventDetail type
    const eventDetail: EventDetail = {
      ...data,
      includes_saturday: data.includes_saturday ?? true,
      includes_sunday: data.includes_sunday ?? true,
      event_dates: data.event_dates || null,
      event_speakers: (data.event_speakers || [])
        .map((es: any) => ({
          id: es.id,
          role: es.role,
          display_order: es.display_order,
          speaker: es.speaker,
        }))
        .filter((es: any) => es.speaker !== null) // Remove any null speakers
        .sort((a: any, b: any) => a.display_order - b.display_order), // Sort by display order

      event_sponsors: (data.event_sponsors || [])
        .map((es: any) => ({
          id: es.id,
          sponsorship_level: es.sponsorship_level,
          display_order: es.display_order,
          sponsor: es.sponsor,
        }))
        .filter((es: any) => es.sponsor !== null && es.sponsor.is_active) // Remove null or inactive sponsors
        .sort((a: any, b: any) => a.display_order - b.display_order),

      event_team_members: (data.event_team_members || [])
        .map((et: any) => ({
          id: et.id,
          event_role: et.event_role,
          display_order: et.display_order,
          team_member: et.team_member,
        }))
        .filter((et: any) => et.team_member !== null && et.team_member.is_active) // Remove null or inactive team members
        .sort((a: any, b: any) => a.display_order - b.display_order),

      schedule_items: (data.schedule_items || [])
        .map((item: any) => ({
          id: item.id,
          event_id: item.event_id,
          day_number: item.day_number,
          start_time: item.start_time,
          end_time: item.end_time,
          title: item.title,
          description: item.description,
          session_type: item.session_type,
          location: item.location,
          speaker_ids: item.speaker_ids,
          created_at: item.created_at,
        }))
        .sort((a: any, b: any) => {
          // Sort by day, then start time
          if (a.day_number !== b.day_number) {
            return a.day_number - b.day_number
          }
          return a.start_time.localeCompare(b.start_time)
        }),
    }

    // Success response
    const response: ApiSuccessResponse<EventDetail> = {
      success: true,
      data: eventDetail,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        // Event details are fairly static - cache for 10 minutes
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
