export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER UPLOAD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/papers/upload - Upload PDF paper for submission
// Requires authentication (any logged-in user)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { getBucketConfig } from '../../../../../lib/upload/config'

/**
 * POST /api/papers/upload
 * Upload a PDF paper file
 *
 * FormData:
 * - file: PDF file (max 10MB)
 *
 * Returns:
 * - 201: Upload successful with URL
 * - 400: Invalid file type or size
 * - 401: Not authenticated
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // Get bucket config
    const bucketConfig = getBucketConfig('papers')
    if (!bucketConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Papers bucket not configured' } },
        { status: 500 }
      )
    }

    // Validate file type
    if (!bucketConfig.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Only PDF files are allowed' } },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > bucketConfig.maxSize) {
      const maxSizeMB = Math.round(bucketConfig.maxSize / (1024 * 1024))
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `File size exceeds ${maxSizeMB}MB limit` } },
        { status: 400 }
      )
    }

    // Generate storage path: papers/{year}/{month}/{userId}-{timestamp}-{filename}.pdf
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const timestamp = now.getTime()
    const sanitizedFilename = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)

    const storagePath = `${year}/${month}/${user.id}-${timestamp}-${sanitizedFilename}`

    // Use admin client for storage (bypasses RLS for private bucket)
    const adminClient = createAdminClient()

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('papers')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '60',
        upsert: false,
      })

    if (uploadError) {
      console.error('Paper upload error:', uploadError)

      if (uploadError.message?.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_FILE', message: 'A file with this name already exists' } },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: uploadError.message || 'Failed to upload file' } },
        { status: 500 }
      )
    }

    if (!uploadData || !uploadData.path) {
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'Upload succeeded but no path returned' } },
        { status: 500 }
      )
    }

    // Generate signed URL for private bucket (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('papers')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365) // 1 year

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      // Still return the path - we can generate URL later
    }

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrlData?.signedUrl || null,
        path: uploadData.path,
        filename: file.name,
        size: file.size,
        type: file.type,
        bucket: 'papers',
      },
      message: 'Paper uploaded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Paper upload API error:', error)
    return handleError(error)
  }
}
