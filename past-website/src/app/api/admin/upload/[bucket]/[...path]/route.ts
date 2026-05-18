export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FILE DELETE API
// ═══════════════════════════════════════════════════════════════════════
// DELETE /api/admin/upload/[bucket]/[...path] - Delete uploaded file
// Created: Day 4 Phase 3 - File Upload System

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin'
import { deleteFile } from '@/lib/upload/uploader'
import { isValidBucketName } from '@/lib/upload/validator'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse, ApiErrorResponse, ErrorCode } from '@/types/api'
import type { BucketName } from '@/lib/upload/config'

/**
 * DELETE /api/admin/upload/[bucket]/[...path]
 * Delete a file from storage
 *
 * Examples:
 * DELETE /api/admin/upload/event-images/2025/10/1729701234567-banner.jpg
 * DELETE /api/admin/upload/speaker-photos/2025/10/1729701234567-speaker.png
 *
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "File deleted successfully"
 *   }
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } }
) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const { bucket, path } = params

    // Validate bucket name
    if (!isValidBucketName(bucket)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR' as ErrorCode,
          message: `Invalid bucket: ${bucket}`,
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Reconstruct file path
    const filePath = path.join('/')

    if (!filePath) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR' as ErrorCode,
          message: 'File path is required',
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Delete file
    const result = await deleteFile(bucket as BucketName, filePath)

    if (!result.success) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR' as ErrorCode,
          message: result.error || 'Failed to delete file',
        },
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    const response: ApiSuccessResponse<{ message: string; bucket: string; path: string }> = {
      success: true,
      data: {
        message: 'File deleted successfully',
        bucket,
        path: filePath,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('File delete error:', error)
    return handleError(error)
  }
}
