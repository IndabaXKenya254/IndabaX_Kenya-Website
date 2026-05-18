export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - HOMEPAGE IMAGE UPLOAD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/upload/homepage-image - Upload homepage images
// Created: Dec 29, 2025

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { uploadFile } from '@/lib/upload/uploader'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

/**
 * POST /api/admin/upload/homepage-image
 * Upload homepage images (hero background, about section images)
 *
 * Max Size: 5 MB
 * Allowed Types: image/png, image/webp, image/jpeg
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const imageType = formData.get('type') as string | null // 'hero_bg', 'about1', 'about2'

    if (!file) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file provided',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File too large. Maximum size is 5MB.',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const result = await uploadFile(file, 'event-images')

    if (!result.success) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
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
    console.error('Homepage image upload error:', error)
    return handleError(error)
  }
}
