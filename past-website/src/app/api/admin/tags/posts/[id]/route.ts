export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE POST TAG API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/tags/posts/[id] - Get single post tag
// PATCH /api/admin/tags/posts/[id] - Update post tag
// DELETE /api/admin/tags/posts/[id] - Delete post tag
// Created: Phase 6 - Tag Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateTagSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/tags/posts/[id]
 * Get a single post tag by ID
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
      .from('post_tags')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Post tag fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Post tag')
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
 * PATCH /api/admin/tags/posts/[id]
 * Update a post tag
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
    const validation = updateTagSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Update tag
    const { data, error } = await supabase
      .from('post_tags')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Post tag update error:', error)

      // Check for duplicate name or slug
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return handleValidationError('A post tag with this name already exists.')
        } else if (error.message.includes('slug')) {
          return handleValidationError('A post tag with this slug already exists.')
        }
      }

      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Post tag')
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
 * DELETE /api/admin/tags/posts/[id]
 * Delete a post tag
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
      .from('post_tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Post tag delete error:', error)
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
