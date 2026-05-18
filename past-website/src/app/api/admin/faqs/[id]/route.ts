export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE FAQ API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/faqs/[id] - Get single FAQ
// PATCH /api/admin/faqs/[id] - Update FAQ
// DELETE /api/admin/faqs/[id] - Delete FAQ
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateFaqSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Faq } from '@/types/api'

/**
 * GET /api/admin/faqs/[id]
 * Get a single FAQ by ID
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
      .from('faqs')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('FAQ fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('FAQ')
    }

    const response: ApiSuccessResponse<Faq> = {
      success: true,
      data: data as Faq,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/faqs/[id]
 * Update a FAQ
 *
 * Request Body (all fields optional):
 * {
 *   "question": "How do I register?",
 *   "answer": "You can register by...",
 *   "category": "registration" | "venue" | "schedule" | "speakers" | "general",
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
    const validation = updateFaqSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Update FAQ
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('FAQ update error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('FAQ')
    }

    const response: ApiSuccessResponse<Faq> = {
      success: true,
      data: data as Faq,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/faqs/[id]
 * Delete a FAQ
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
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('FAQ delete error:', error)
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
