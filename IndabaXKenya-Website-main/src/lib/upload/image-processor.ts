// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - IMAGE PROCESSOR
// ═══════════════════════════════════════════════════════════════════════
// Image compression and thumbnail generation using Sharp
// Created: Day 5 - Image Processing

import sharp from 'sharp'

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ThumbnailOptions {
  width: number
  height: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ProcessedImage {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

/**
 * Compress an image
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'jpeg',
  } = options

  let pipeline = sharp(inputBuffer)

  // Get original metadata
  const metadata = await pipeline.metadata()

  // Resize if needed
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  // Convert and compress based on format
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true })
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality, progressive: true })
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality })
  }

  const buffer = await pipeline.toBuffer()
  const info = await sharp(buffer).metadata()

  return {
    buffer,
    format: format,
    width: info.width || 0,
    height: info.height || 0,
    size: buffer.length,
  }
}

/**
 * Generate a thumbnail
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  options: ThumbnailOptions = { width: 300, height: 300 }
): Promise<ProcessedImage> {
  const {
    width = 300,
    height = 300,
    quality = 80,
    format = 'jpeg',
  } = options

  let pipeline = sharp(inputBuffer).resize(width, height, {
    fit: 'cover',
    position: 'center',
  })

  // Apply format
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true })
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality })
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality })
  }

  const buffer = await pipeline.toBuffer()
  const info = await sharp(buffer).metadata()

  return {
    buffer,
    format: format,
    width: info.width || 0,
    height: info.height || 0,
    size: buffer.length,
  }
}

/**
 * Process image: compress original and generate thumbnail
 */
export async function processImageWithThumbnail(
  inputBuffer: Buffer,
  options: {
    compress?: ImageProcessingOptions
    thumbnail?: ThumbnailOptions
  } = {}
): Promise<{
  original: ProcessedImage
  thumbnail: ProcessedImage
}> {
  const [original, thumbnail] = await Promise.all([
    compressImage(inputBuffer, options.compress),
    generateThumbnail(inputBuffer, options.thumbnail),
  ])

  return { original, thumbnail }
}

/**
 * Get image dimensions without processing
 */
export async function getImageDimensions(
  inputBuffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(inputBuffer).metadata()
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  }
}

/**
 * Detect image format
 */
export async function detectImageFormat(
  inputBuffer: Buffer
): Promise<string | undefined> {
  const metadata = await sharp(inputBuffer).metadata()
  return metadata.format
}
