export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE SPEAKER EXPERTISE API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/expertise/[id] - Get single expertise area
// PATCH /api/admin/expertise/[id] - Update expertise area
// DELETE /api/admin/expertise/[id] - Delete expertise area
// Created: Phase 6 - Tag Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateExpertiseSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/expertise/[id]
 * Get a single speaker expertise area by ID
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
      .from('speaker_expertise')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Speaker expertise fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Speaker expertise')
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/expertise/[id]
 * Update a speaker expertise area
 *
 * Request Body (all fields optional):
 * {
 *   "name": "Updated Name",
 *   "slug": "updated-slug"
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
    const validation = updateExpertiseSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Update expertise
    const { data, error } = await supabase
      .from('speaker_expertise')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Speaker expertise update error:', error)

      // Check for duplicate name or slug
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return handleValidationError('An expertise area with this name already exists.')
        } else if (error.message.includes('slug')) {
          return handleValidationError('An expertise area with this slug already exists.')
        }
      }

      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Speaker expertise')
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/expertise/[id]
 * Delete a speaker expertise area
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
      .from('speaker_expertise')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Speaker expertise delete error:', error)
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
