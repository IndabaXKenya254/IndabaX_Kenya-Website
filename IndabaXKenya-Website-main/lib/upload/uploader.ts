// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FILE UPLOADER
// ═══════════════════════════════════════════════════════════════════════
// Upload files to Supabase Storage
// Created: Day 4 Phase 3 - File Upload System

import { createServerClient } from '@/lib/supabase'
import { validateFile, generateStoragePath, getFileExtension } from './validator'
import { getBucketConfig, type BucketName } from './config'
import { processImageWithThumbnail } from './image-processor'

export interface UploadResult {
  success: boolean
  data?: {
    url: string
    thumbnailUrl?: string
    path: string
    thumbnailPath?: string
    filename: string
    size: number
    type: string
    bucket: string
  }
  error?: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucketName: BucketName
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, bucketName)

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  // Get bucket config
  const config = getBucketConfig(bucketName)
  if (!config) {
    return {
      success: false,
      error: `Invalid bucket: ${bucketName}`,
    }
  }

  try {
    const supabase = createServerClient()

    // Generate storage path
    const storagePath = generateStoragePath(file.name)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For gallery photos, process images (compress + thumbnail)
    const isGalleryPhoto = bucketName === 'gallery-photos'
    let thumbnailUrl: string | undefined
    let thumbnailPath: string | undefined

    if (isGalleryPhoto && file.type.startsWith('image/')) {
      console.log('Processing gallery image: compressing and generating thumbnail...')

      try {
        // Process image: compress original and create thumbnail
        const processed = await processImageWithThumbnail(buffer, {
          compress: {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            format: 'jpeg',
          },
          thumbnail: {
            width: 400,
            height: 400,
            quality: 80,
            format: 'jpeg',
          },
        })

        // Upload compressed original
        const { data: originalData, error: originalError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, processed.original.buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          })

        if (originalError) {
          console.error('Original upload error:', originalError)
          if (originalError.message?.includes('already exists')) {
            return {
              success: false,
              error: 'A file with this name already exists. Please try again.',
            }
          }
          return {
            success: false,
            error: originalError.message || 'Failed to upload file',
          }
        }

        if (!originalData || !originalData.path) {
          return {
            success: false,
            error: 'Upload succeeded but no file path was returned',
          }
        }

        // Upload thumbnail
        const thumbnailStoragePath = storagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.jpg')
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from(bucketName)
          .upload(thumbnailStoragePath, processed.thumbnail.buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          })

        if (thumbError) {
          console.warn('Thumbnail upload failed (non-critical):', thumbError)
        } else if (thumbData && thumbData.path) {
          thumbnailPath = thumbData.path
          const { data: thumbUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(thumbData.path)
          if (thumbUrlData?.publicUrl) {
            thumbnailUrl = thumbUrlData.publicUrl
          }
        }

        // Get public URL for original
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(originalData.path)

        if (!publicUrlData || !publicUrlData.publicUrl) {
          return {
            success: false,
            error: 'Failed to generate public URL for uploaded file',
          }
        }

        const filename = originalData.path.split('/').pop() || file.name

        console.log('Gallery image processed:', {
          original: { size: processed.original.size, url: publicUrlData.publicUrl },
          thumbnail: { size: processed.thumbnail.size, url: thumbnailUrl },
        })

        return {
          success: true,
          data: {
            url: publicUrlData.publicUrl,
            thumbnailUrl,
            path: originalData.path,
            thumbnailPath,
            filename,
            size: processed.original.size,
            type: 'image/jpeg',
            bucket: bucketName,
          },
        }
      } catch (processError) {
        console.error('Image processing failed, uploading original:', processError)
        // Fall through to upload original without processing
      }
    }

    // For non-gallery photos or if processing failed, upload original
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)

      if (error.message?.includes('already exists')) {
        return {
          success: false,
          error: 'A file with this name already exists. Please try again.',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to upload file',
      }
    }

    if (!data || !data.path) {
      console.error('Upload succeeded but no path returned:', data)
      return {
        success: false,
        error: 'Upload succeeded but no file path was returned',
      }
    }

    // Get public URL
    const uploadedPath = data.path
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadedPath)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to generate public URL:', { bucketName, uploadedPath, publicUrlData })
      return {
        success: false,
        error: 'Failed to generate public URL for uploaded file',
      }
    }

    const publicUrl = publicUrlData.publicUrl
    const filename = uploadedPath.split('/').pop() || file.name

    return {
      success: true,
      data: {
        url: publicUrl,
        path: uploadedPath,
        filename: filename,
        size: file.size,
        type: file.type,
        bucket: bucketName,
      },
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    }
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucketName: BucketName,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete file',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    }
  }
}

/**
 * Get public URL for a file (without uploading)
 */
export function getPublicUrl(bucketName: BucketName, filePath: string): string {
  const supabase = createServerClient()

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Check if file exists in storage
 */
export async function fileExists(
  bucketName: BucketName,
  filePath: string
): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        limit: 1000,
        search: filePath.split('/').pop(),
      })

    if (error) return false

    return data && data.length > 0
  } catch (error) {
    return false
  }
}
