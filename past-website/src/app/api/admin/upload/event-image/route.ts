export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT IMAGE UPLOAD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/upload/event-image - Upload event featured image
// Created: Day 4 Phase 3 - File Upload System

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { uploadFile } from '@/lib/upload/uploader'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

/**
 * POST /api/admin/upload/event-image
 * Upload an event featured image
 *
 * Request: multipart/form-data
 * - file: File (required) - Image file (JPEG, PNG, WebP)
 *
 * Max Size: 5 MB
 * Allowed Types: image/jpeg, image/png, image/webp
 *
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "url": "https://xxx.supabase.co/storage/v1/object/public/event-images/2025/10/123.jpg",
 *     "path": "2025/10/1729701234567-banner.jpg",
 *     "filename": "1729701234567-banner.jpg",
 *     "size": 245678,
 *     "type": "image/jpeg",
 *     "bucket": "event-images"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    // Parse multipart form data
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

    // Upload file
    const result = await uploadFile(file, 'event-images')

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
    console.error('Event image upload error:', error)
    return handleError(error)
  }
}
