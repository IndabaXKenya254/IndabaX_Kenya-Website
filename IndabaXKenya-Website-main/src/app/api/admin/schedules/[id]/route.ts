export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SCHEDULE ITEM API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/schedules/[id] - Get specific schedule item
// PUT /api/admin/schedules/[id] - Update schedule item
// DELETE /api/admin/schedules/[id] - Delete schedule item

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/schedules/[id]
 * Get a specific schedule item by ID
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
      .from('schedule_items')
      .select('*, event:events(id, title), speakers:schedule_speakers(speaker:speakers(id, name))')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Schedule item get error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
        },
        { status: 404 }
      )
    }

    // Transform the data
    const transformedData = {
      ...data,
      event: data.event,
      speaker_ids: data.speakers?.map((s: any) => s.speaker?.id).filter(Boolean) || [],
      speakers: data.speakers?.map((s: any) => s.speaker).filter(Boolean) || []
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: transformedData,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/schedules/[id]
 * Update a schedule item
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

    // Parse request body
    const body = await request.json()
    const { speaker_ids, ...scheduleData } = body

    // Update schedule item
    const { data: updatedItem, error: updateError } = await supabase
      .from('schedule_items')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Schedule item update error:', updateError)
      return handleDatabaseError(updateError)
    }

    // Update speaker associations if provided
    if (speaker_ids !== undefined) {
      // Delete existing associations
      await supabase
        .from('schedule_speakers')
        .delete()
        .eq('schedule_item_id', id)

      // Insert new associations
      if (Array.isArray(speaker_ids) && speaker_ids.length > 0) {
        const speakerAssociations = speaker_ids.map(speakerId => ({
          schedule_item_id: id,
          speaker_id: speakerId
        }))

        const { error: speakersError } = await supabase
          .from('schedule_speakers')
          .insert(speakerAssociations)

        if (speakersError) {
          console.error('Schedule speakers update error:', speakersError)
        }
      }
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: updatedItem,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/schedules/[id]
 * Delete a schedule item
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

    // Delete speaker associations first (cascade should handle this, but being explicit)
    await supabase
      .from('schedule_speakers')
      .delete()
      .eq('schedule_item_id', id)

    // Delete schedule item
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Schedule item delete error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<{ id: string }> = {
      success: true,
      data: { id },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
