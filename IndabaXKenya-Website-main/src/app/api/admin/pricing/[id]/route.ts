export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN PRICING TIER DETAIL API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/pricing/[id] - Get single pricing tier
// PATCH /api/admin/pricing/[id] - Update pricing tier
// DELETE /api/admin/pricing/[id] - Delete pricing tier

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import type { PricingTier } from '@/app/api/pricing/route'

/**
 * GET /api/admin/pricing/[id]
 * Get a single pricing tier
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
      .from('pricing_tiers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFound('Pricing tier')
      }
      console.error('Pricing tier fetch error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<PricingTier> = {
      success: true,
      data: data as PricingTier,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/pricing/[id]
 * Update a pricing tier
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

    if (body.title !== undefined) updateData.title = body.title
    if (body.price !== undefined) updateData.price = body.price
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.period !== undefined) updateData.period = body.period
    if (body.description !== undefined) updateData.description = body.description
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.badge !== undefined) updateData.badge = body.badge
    if (body.features !== undefined) updateData.features = body.features
    if (body.requirements !== undefined) updateData.requirements = body.requirements
    if (body.button_text !== undefined) updateData.button_text = body.button_text
    if (body.button_link !== undefined) updateData.button_link = body.button_link
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update pricing tier
    const { data, error } = await supabase
      .from('pricing_tiers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return handleNotFound('Pricing tier')
      }
      console.error('Pricing tier update error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<PricingTier> = {
      success: true,
      data: data as PricingTier,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/pricing/[id]
 * Delete a pricing tier
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
      .from('pricing_tiers')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Pricing tier deletion error:', error)
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
