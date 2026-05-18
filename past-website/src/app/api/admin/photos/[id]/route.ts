export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE PHOTO API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/photos/[id] - Get single photo
// PATCH /api/admin/photos/[id] - Update photo
// DELETE /api/admin/photos/[id] - Delete photo
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updatePhotoSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Photo } from '@/types/api'

// Helper to invalidate all gallery-related caches
function invalidateGalleryCache() {
  revalidatePath('/gallery')
  revalidatePath('/noai/gallery')
  revalidatePath('/api/gallery')
  revalidatePath('/admin/gallery')
}

/**
 * GET /api/admin/photos/[id]
 * Get a single photo by ID
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
      .from('photos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Photo fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Photo')
    }

    const response: ApiSuccessResponse<Photo> = {
      success: true,
      data: data as Photo,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/photos/[id]
 * Update a photo
 *
 * Request Body (all fields optional):
 * {
 *   "url": "https://...",
 *   "title": "Photo title",
 *   "description": "Photo description",
 *   "year": 2024,
 *   "event_id": "uuid",
 *   "is_featured": true/false,
 *   "display_order": 0
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
    const validation = updatePhotoSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Update photo
    const { data, error } = await supabase
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Photo update error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Photo')
    }

    // Invalidate gallery caches after successful update
    invalidateGalleryCache()

    const response: ApiSuccessResponse<Photo> = {
      success: true,
      data: data as Photo,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/photos/[id]
 * Delete a photo
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
      .from('photos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Photo delete error:', error)
      return handleDatabaseError(error)
    }

    // Invalidate gallery caches after successful delete
    invalidateGalleryCache()

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Success" },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
