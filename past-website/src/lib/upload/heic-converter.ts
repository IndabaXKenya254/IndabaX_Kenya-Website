// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - HEIC TO JPEG CONVERTER
// ═══════════════════════════════════════════════════════════════════════
// Convert Apple HEIC/HEIF images to JPEG format
// Created: 2025-12-15

import convert from 'heic-convert'

export interface ConversionResult {
  success: boolean
  buffer?: Buffer
  error?: string
}

/**
 * Convert HEIC/HEIF image to JPEG
 * @param inputBuffer - Buffer containing HEIC/HEIF image data
 * @param quality - JPEG quality (0-100), default 90
 * @returns Promise<ConversionResult>
 */
export async function convertHeicToJpeg(
  inputBuffer: Buffer,
  quality: number = 90
): Promise<ConversionResult> {
  try {
    console.log('Converting HEIC to JPEG...')

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: quality / 100, // heic-convert expects 0-1 range
    })

    console.log(`HEIC conversion successful: ${outputBuffer.length} bytes`)

    return {
      success: true,
      buffer: Buffer.from(outputBuffer),
    }
  } catch (error) {
    console.error('HEIC conversion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert HEIC image',
    }
  }
}

/**
 * Check if file is HEIC/HEIF format
 * Checks both MIME type and file extension (browsers may not report correct MIME type)
 */
export function isHeicFile(mimeType: string, filename?: string): boolean {
  const isByMimeType = mimeType === 'image/heic' || mimeType === 'image/heif'

  if (filename) {
    const ext = filename.toLowerCase()
    const isByExtension = ext.endsWith('.heic') || ext.endsWith('.heif')
    return isByMimeType || isByExtension
  }

  return isByMimeType
}

/**
 * Check if file is video format
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}
