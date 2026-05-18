export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN EVENTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/events - List all events
// POST /api/admin/events - Create new event
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createEventSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Event } from '@/types/api'

/**
 * GET /api/admin/events
 * List all events for admin
 *
 * Query Parameters:
 * - status: 'draft' | 'published' | 'archived' (optional)
 * - event_type: 'upcoming' | 'past' (optional)
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
    const status = searchParams.get('status')
    const eventType = searchParams.get('event_type')
    const search = searchParams.get('search')
    const venueId = searchParams.get('venue_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Issue #14/#16 FIX: Exclude soft-deleted events unless ?include_deleted=true
    // Issue #17/#19: When filtering by 'archived' status, include deleted events
    const includeDeleted = searchParams.get('include_deleted') === 'true'
    const isArchiveFilter = status === 'archived'

    if (!includeDeleted && !isArchiveFilter) {
      query = query.is('deleted_at', null)
    }

    // Apply filters
    if (status && ['draft', 'published', 'upcoming', 'ongoing', 'past', 'archived', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    if (eventType && ['upcoming', 'past', 'workshop', 'conference', 'meetup', 'webinar'].includes(eventType)) {
      query = query.eq('event_type', eventType)
    }

    if (venueId) {
      query = query.eq('venue_id', venueId)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Events list error:', error)
      return handleDatabaseError(error)
    }

    const events = data || []

    // Optionally include relationships (query param: include=tags,speakers)
    const include = searchParams.get('include')
    const includeTags = include?.includes('tags')
    const includeSpeakers = include?.includes('speakers')

    // Fetch tags for all events (if requested)
    if (includeTags && events.length > 0) {
      const eventIds = events.map(e => e.id)
      const { data: tagData } = await supabase
        .from('event_tag_relations')
        .select('event_id, tag:event_tags(id, name, slug)')
        .in('event_id', eventIds)

      // Group tags by event_id
      const tagsByEvent = tagData?.reduce((acc: any, item: any) => {
        if (!acc[item.event_id]) acc[item.event_id] = []
        acc[item.event_id].push(item.tag)
        return acc
      }, {}) || {}

      // Attach tags to events
      events.forEach((event: any) => {
        event.tags = tagsByEvent[event.id] || []
      })
    }

    // Fetch speakers for all events (if requested)
    if (includeSpeakers && events.length > 0) {
      const eventIds = events.map(e => e.id)
      const { data: speakerData } = await supabase
        .from('event_speakers')
        .select('event_id, display_order, speaker:speakers(id, name, title, organization, photo_url, country)')
        .in('event_id', eventIds)
        .order('display_order', { ascending: true })

      // Group speakers by event_id
      const speakersByEvent = speakerData?.reduce((acc: any, item: any) => {
        if (!acc[item.event_id]) acc[item.event_id] = []
        acc[item.event_id].push(item.speaker)
        return acc
      }, {}) || {}

      // Attach speakers to events
      events.forEach((event: any) => {
        event.speakers = speakersByEvent[event.id] || []
      })
    }

    const response: ApiSuccessResponse<Event[]> = {
      success: true,
      data: events as Event[],
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
 * POST /api/admin/events
 * Create a new event
 *
 * Request Body:
 * {
 *   "slug": "indabax-kenya-2025",
 *   "title": "IndabaX Kenya 2025",
 *   "description": "Annual AI conference...",
 *   "start_date": "2025-11-15",
 *   "end_date": "2025-11-17" (optional),
 *   "location": "Nairobi, Kenya",
 *   "venue": "KICC",
 *   "featured_image": "https://..." (optional),
 *   "status": "draft" | "published" (default: draft),
 *   "event_type": "upcoming" | "past" (default: upcoming),
 *   "is_featured": true/false (default: false),
 *   "venue_details": { "address": "...", "map_url": "...", "hotels": [...] } (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createEventSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data (these go into junction tables, not events table)
    const { tag_ids, speaker_ids, sponsor_ids, team_member_ids, ...eventData } = validation.data

    // Auto-generate slug from title if not provided
    let slug = eventData.slug
    if (!slug) {
      // Generate slug from title
      slug = eventData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 255) // Limit to max length

      // Check if slug exists and make it unique
      let uniqueSlug = slug
      let counter = 2
      let slugExists = true

      while (slugExists) {
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('slug', uniqueSlug)
          .single()

        if (!existingEvent) {
          slugExists = false
          slug = uniqueSlug
        } else {
          uniqueSlug = `${slug}-${counter}`
          counter++
        }
      }
    }

    // Normalize banner_url to featured_image
    const featuredImage = (eventData as any).banner_url || eventData.featured_image || ''

    // Prepare insert data
    const insertData: any = {
      ...eventData,
      slug,
      featured_image: featuredImage,
    }

    // Remove the alias fields if present
    delete insertData.banner_url

    // Insert event
    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Event insert error:', error)

      // Check for duplicate slug
      if (error.code === '23505' && error.message.includes('slug')) {
        return handleValidationError('An event with this slug already exists.')
      }

      return handleDatabaseError(error)
    }

    // Insert event-tag relationships (if provided)
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        event_id: data.id,
        tag_id: tagId,
      }))

      const { error: tagError } = await supabase
        .from('event_tag_relations')
        .insert(tagRelations)

      if (tagError) {
        console.error('Tag relations insert error:', tagError)
        // Non-critical - event still created
      }
    }

    // Insert event-speaker relationships (if provided)
    if (speaker_ids && speaker_ids.length > 0) {
      const speakerRelations = speaker_ids.map((speakerId, index) => ({
        event_id: data.id,
        speaker_id: speakerId,
        display_order: index, // Preserve array order
      }))

      const { error: speakerError } = await supabase
        .from('event_speakers')
        .insert(speakerRelations)

      if (speakerError) {
        console.error('Speaker relations insert error:', speakerError)
        // Non-critical - event still created
      }
    }

    // Insert event-sponsor relationships (if provided)
    if (sponsor_ids && sponsor_ids.length > 0) {
      const sponsorRelations = sponsor_ids.map((sponsorId, index) => ({
        event_id: data.id,
        sponsor_id: sponsorId,
        display_order: index, // Preserve array order
      }))

      const { error: sponsorError } = await supabase
        .from('event_sponsors')
        .insert(sponsorRelations)

      if (sponsorError) {
        console.error('Sponsor relations insert error:', sponsorError)
        // Non-critical - event still created
      }
    }

    // Insert event-team_member relationships (if provided)
    if (team_member_ids && team_member_ids.length > 0) {
      const teamRelations = team_member_ids.map((memberId, index) => ({
        event_id: data.id,
        team_member_id: memberId,
        display_order: index, // Preserve array order
      }))

      const { error: teamError } = await supabase
        .from('event_team_members')
        .insert(teamRelations)

      if (teamError) {
        console.error('Team member relations insert error:', teamError)
        // Non-critical - event still created
      }
    }

    const response: ApiSuccessResponse<Event> = {
      success: true,
      data: data as Event,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
