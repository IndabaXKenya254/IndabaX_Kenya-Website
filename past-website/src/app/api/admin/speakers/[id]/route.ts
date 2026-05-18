export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE SPEAKER API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/speakers/[id] - Get single speaker
// PATCH /api/admin/speakers/[id] - Update speaker
// DELETE /api/admin/speakers/[id] - Delete speaker
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateSpeakerSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Speaker } from '@/types/api'

// Helper to invalidate all speaker-related caches
function invalidateSpeakerCache() {
  revalidatePath('/speakers')
  revalidatePath('/api/speakers')
  revalidatePath('/admin/speakers')
}

/**
 * GET /api/admin/speakers/[id]
 * Get a single speaker by ID (includes expertise by default)
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

    // Fetch speaker
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Speaker fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Speaker')
    }

    const speaker: any = data

    // Fetch expertise for this speaker
    const { data: expertiseData } = await supabase
      .from('speaker_expertise_relations')
      .select('expertise:speaker_expertise(id, name, slug)')
      .eq('speaker_id', id)

    speaker.expertise = expertiseData?.map(e => e.expertise) || []

    // Fetch linked events for this speaker
    const { data: eventData } = await supabase
      .from('event_speakers')
      .select('display_order, event:events(id, title, start_date, location)')
      .eq('speaker_id', id)
      .order('display_order', { ascending: true })

    speaker.events = eventData?.map(e => e.event) || []

    const response: ApiSuccessResponse<Speaker> = {
      success: true,
      data: speaker as Speaker,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/speakers/[id]
 * Update a speaker
 *
 * Request Body (all fields optional):
 * {
 *   "name": "Dr. Jane Doe",
 *   "title": "AI Research Scientist",
 *   "organization": "Google Research",
 *   "country": "Kenya",
 *   "photo_url": "https://...",
 *   "bio_short": "Brief bio...",
 *   "bio_full": "Full biography...",
 *   "linkedin_url": "https://linkedin.com/in/...",
 *   "twitter_url": "https://twitter.com/...",
 *   "website_url": "https://...",
 *   "is_featured": true/false,
 *   "display_order": 0,
 *   "expertise_ids": ["uuid1", "uuid2"]
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
    const validation = updateSpeakerSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data
    const { expertise_ids, event_ids, ...speakerUpdates } = validation.data

    // Update speaker
    const { data, error } = await supabase
      .from('speakers')
      .update(speakerUpdates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Speaker update error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Speaker')
    }

    // Update expertise relationships (if provided)
    if (expertise_ids !== undefined) {
      // Delete existing expertise relationships
      await supabase
        .from('speaker_expertise_relations')
        .delete()
        .eq('speaker_id', id)

      // Insert new expertise relationships
      if (expertise_ids.length > 0) {
        const expertiseRelations = expertise_ids.map(expertiseId => ({
          speaker_id: id,
          expertise_id: expertiseId,
        }))

        const { error: expertiseError } = await supabase
          .from('speaker_expertise_relations')
          .insert(expertiseRelations)

        if (expertiseError) {
          console.error('Expertise relations update error:', expertiseError)
        }
      }
    }

    // Update event relationships (if provided)
    if (event_ids !== undefined) {
      // Delete existing event relationships
      await supabase
        .from('event_speakers')
        .delete()
        .eq('speaker_id', id)

      // Insert new event relationships
      if (event_ids.length > 0) {
        const eventRelations = event_ids.map((eventId, index) => ({
          event_id: eventId,
          speaker_id: id,
          display_order: index,
        }))

        const { error: eventError } = await supabase
          .from('event_speakers')
          .insert(eventRelations)

        if (eventError) {
          console.error('Event relations update error:', eventError)
        }
      }
    }

    // Invalidate speaker caches after successful update
    invalidateSpeakerCache()

    const response: ApiSuccessResponse<Speaker> = {
      success: true,
      data: data as Speaker,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/speakers/[id]
 * Delete a speaker
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

    const { error } = await supabase
      .from('speakers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Speaker delete error:', error)
      return handleDatabaseError(error)
    }

    // Invalidate speaker caches after successful delete
    invalidateSpeakerCache()

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Success" },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
