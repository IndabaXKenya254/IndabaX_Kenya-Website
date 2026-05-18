export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// FILE UPLOAD API - Supabase Storage
// ═══════════════════════════════════════════════════════════════════════
// POST /api/upload - Upload file to Supabase Storage

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to ArrayBuffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with date-based path for organization
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const now = new Date()
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
    const fileName = `${datePath}/${timestamp}-${randomString}.${ext}`

    // Upload to Supabase Storage
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      bucket: bucket
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
