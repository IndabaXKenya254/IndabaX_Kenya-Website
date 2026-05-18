export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE EVENT API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/events/[id] - Get single event
// PATCH /api/admin/events/[id] - Update event
// DELETE /api/admin/events/[id] - Delete event
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateEventSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Event } from '@/types/api'

/**
 * GET /api/admin/events/[id]
 * Get a single event by ID (includes tags and speakers by default)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Fetch event
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Event fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Event')
    }

    const event: any = data

    // Fetch tags for this event
    const { data: tagData } = await supabase
      .from('event_tag_relations')
      .select('tag:event_tags(id, name, slug)')
      .eq('event_id', id)

    event.tags = tagData?.map(t => t.tag) || []

    // Fetch speakers for this event (ordered)
    const { data: speakerData } = await supabase
      .from('event_speakers')
      .select('display_order, speaker:speakers(id, name, title, organization, photo_url, country)')
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    event.speakers = speakerData?.map(s => s.speaker) || []

    // Fetch sponsors for this event (ordered)
    const { data: sponsorData } = await supabase
      .from('event_sponsors')
      .select('display_order, sponsor:sponsors(id, name, logo_url, tier, website_url)')
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    event.sponsors = sponsorData?.map(s => s.sponsor) || []

    // Fetch team members for this event (ordered)
    const { data: teamMemberData } = await supabase
      .from('event_team_members')
      .select('display_order, team_member:team_members(id, name, role, photo_url)')
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    event.team_members = teamMemberData?.map(t => t.team_member) || []

    const response: ApiSuccessResponse<Event> = {
      success: true,
      data: event as Event,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/events/[id]
 * Update an event
 *
 * Request Body (all fields optional):
 * {
 *   "slug": "updated-slug",
 *   "title": "Updated Title",
 *   "description": "Updated description...",
 *   "excerpt": "Short summary...",
 *   "start_date": "2025-12-01",
 *   "end_date": "2025-12-03",
 *   "location": "Nairobi, Kenya",
 *   "venue": "KICC",
 *   "featured_image": "https://...",
 *   "status": "published",
 *   "event_type": "upcoming",
 *   "is_featured": true,
 *   "venue_details": { "address": "...", "map_url": "...", "hotels": [...] },
 *   "tag_ids": ["uuid1", "uuid2"],
 *   "speaker_ids": ["uuid3", "uuid4"]
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params

    // Validate request body
    const body = await request.json()
    const validation = updateEventSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data
    const { tag_ids, speaker_ids, sponsor_ids, team_member_ids, ...eventUpdates } = validation.data

    // Update event
    const { data, error } = await supabase
      .from('events')
      .update(eventUpdates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Event update error:', error)

      // Check for duplicate slug
      if (error.code === '23505' && error.message.includes('slug')) {
        return handleValidationError('An event with this slug already exists.')
      }

      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Event')
    }

    // Update tag relationships (if provided)
    if (tag_ids !== undefined) {
      // Delete existing tag relationships
      await supabase
        .from('event_tag_relations')
        .delete()
        .eq('event_id', id)

      // Insert new tag relationships
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tagId => ({
          event_id: id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase
          .from('event_tag_relations')
          .insert(tagRelations)

        if (tagError) {
          console.error('Tag relations update error:', tagError)
        }
      }
    }

    // Update speaker relationships (if provided)
    if (speaker_ids !== undefined) {
      // Delete existing speaker relationships
      await supabase
        .from('event_speakers')
        .delete()
        .eq('event_id', id)

      // Insert new speaker relationships
      if (speaker_ids.length > 0) {
        const speakerRelations = speaker_ids.map((speakerId, index) => ({
          event_id: id,
          speaker_id: speakerId,
          display_order: index,
        }))

        const { error: speakerError } = await supabase
          .from('event_speakers')
          .insert(speakerRelations)

        if (speakerError) {
          console.error('Speaker relations update error:', speakerError)
        }
      }
    }

    // Update sponsor relationships (if provided)
    if (sponsor_ids !== undefined) {
      // Delete existing sponsor relationships
      await supabase
        .from('event_sponsors')
        .delete()
        .eq('event_id', id)

      // Insert new sponsor relationships
      if (sponsor_ids.length > 0) {
        const sponsorRelations = sponsor_ids.map((sponsorId, index) => ({
          event_id: id,
          sponsor_id: sponsorId,
          display_order: index,
        }))

        const { error: sponsorError } = await supabase
          .from('event_sponsors')
          .insert(sponsorRelations)

        if (sponsorError) {
          console.error('Sponsor relations update error:', sponsorError)
        }
      }
    }

    // Update team member relationships (if provided)
    if (team_member_ids !== undefined) {
      // Delete existing team member relationships
      await supabase
        .from('event_team_members')
        .delete()
        .eq('event_id', id)

      // Insert new team member relationships
      if (team_member_ids.length > 0) {
        const teamMemberRelations = team_member_ids.map((memberId, index) => ({
          event_id: id,
          team_member_id: memberId,
          display_order: index,
        }))

        const { error: teamMemberError } = await supabase
          .from('event_team_members')
          .insert(teamMemberRelations)

        if (teamMemberError) {
          console.error('Team member relations update error:', teamMemberError)
        }
      }
    }

    const response: ApiSuccessResponse<Event> = {
      success: true,
      data: data as Event,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/events/[id]
 * Issues #14/#16 FIX: Soft-delete events by setting status to 'archived'
 * instead of hard-deleting. This preserves reviewer assignments and applications.
 * Use ?force=true to permanently delete (only for events with no applications).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params
    const force = request.nextUrl.searchParams.get('force') === 'true'

    if (force) {
      // Check if event has applications before allowing hard delete
      const { count } = await supabase
        .from('form_responses')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id)

      if (count && count > 0) {
        return NextResponse.json(
          { success: false, error: `Cannot permanently delete: ${count} application(s) are linked to this event. Archive it instead.` },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Event hard delete error:', error)
        return handleDatabaseError(error)
      }

      return NextResponse.json({
        success: true,
        data: { message: 'Event permanently deleted' },
      }, { status: 200 })
    }

    // Default: soft-delete by archiving + setting deleted_at (Issues #14/#16)
    const { error } = await supabase
      .from('events')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString(),  // Issue #14/#16 FIX: Set soft-delete timestamp
      })
      .eq('id', id)

    if (error) {
      console.error('Event archive error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'Event archived. Applications and reviewer records are preserved.' },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
