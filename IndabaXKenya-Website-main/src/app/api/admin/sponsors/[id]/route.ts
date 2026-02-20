export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE SPONSOR API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/sponsors/[id] - Get single sponsor
// PATCH /api/admin/sponsors/[id] - Update sponsor
// DELETE /api/admin/sponsors/[id] - Delete sponsor
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateSponsorSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Sponsor } from '@/types/api'

/**
 * GET /api/admin/sponsors/[id]
 * Get a single sponsor by ID
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

    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Sponsor fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Sponsor')
    }

    // Fetch linked events
    const { data: eventData } = await supabase
      .from('event_sponsors')
      .select('display_order, event:events(id, title, start_date, location)')
      .eq('sponsor_id', id)
      .order('display_order', { ascending: true })

    const sponsorWithEvents = {
      ...data,
      events: eventData?.map(e => e.event) || [],
    }

    const response: ApiSuccessResponse<Sponsor> = {
      success: true,
      data: sponsorWithEvents as Sponsor,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/sponsors/[id]
 * Update a sponsor
 *
 * Request Body (all fields optional):
 * {
 *   "name": "Google",
 *   "logo_url": "https://...",
 *   "website_url": "https://google.com",
 *   "tier": "platinum" | "gold" | "silver" | "bronze",
 *   "display_order": 0,
 *   "is_active": true
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
    const validation = updateSponsorSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract event_ids from validated data (handled separately)
    const { event_ids, ...updates } = validation.data

    // Update sponsor
    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Sponsor update error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Sponsor')
    }

    // Handle event linking if event_ids provided
    if (event_ids !== undefined) {
      // Delete existing event links
      await supabase
        .from('event_sponsors')
        .delete()
        .eq('sponsor_id', id)

      // Insert new event links
      if (event_ids.length > 0) {
        const eventRelations = event_ids.map((eventId, index) => ({
          event_id: eventId,
          sponsor_id: id,
          display_order: index,
        }))

        const { error: eventError } = await supabase
          .from('event_sponsors')
          .insert(eventRelations)

        if (eventError) {
          console.error('Event linking error (non-critical):', eventError)
        }
      }
    }

    const response: ApiSuccessResponse<Sponsor> = {
      success: true,
      data: data as Sponsor,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/sponsors/[id]
 * Delete a sponsor
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
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Sponsor delete error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Success" },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
