export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - POST IMAGE UPLOAD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/upload/post-image - Upload post/blog featured image
// Created: Day 4 Phase 3 - File Upload System

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { uploadFile } from '@/lib/upload/uploader'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

/**
 * POST /api/admin/upload/post-image
 * Upload a post featured image
 *
 * Max Size: 5 MB
 * Allowed Types: image/jpeg, image/png, image/webp
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const result = await uploadFile(file, 'post-images')

    if (!result.success) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error || 'Failed to upload file',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const response: ApiSuccessResponse<typeof result.data> = {
      success: true,
      data: result.data!,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Post image upload error:', error)
    return handleError(error)
  }
}
