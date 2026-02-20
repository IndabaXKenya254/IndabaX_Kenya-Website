export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN STAT DETAIL API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/stats/[id] - Get single stat
// PATCH /api/admin/stats/[id] - Update stat
// DELETE /api/admin/stats/[id] - Delete stat

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import type { Stat } from '@/app/api/stats/route'

/**
 * GET /api/admin/stats/[id]
 * Get a single stat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFound('Stat')
      }
      console.error('Stat fetch error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Stat> = {
      success: true,
      data: data as Stat,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/stats/[id]
 * Update a stat
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}

    if (body.label !== undefined) updateData.label = body.label
    if (body.value !== undefined) updateData.value = parseInt(body.value)
    if (body.suffix !== undefined) updateData.suffix = body.suffix
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update stat
    const { data, error } = await supabase
      .from('stats')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFound('Stat')
      }
      console.error('Stat update error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Stat> = {
      success: true,
      data: data as Stat,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/stats/[id]
 * Delete a stat
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('stats')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Stat deletion error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<null> = {
      success: true,
      data: null,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
