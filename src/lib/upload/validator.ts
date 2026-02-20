// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FILE UPLOAD VALIDATOR
// ═══════════════════════════════════════════════════════════════════════
// File validation logic for uploads
// Created: Day 4 Phase 3 - File Upload System

import { getBucketConfig, formatFileSize, type BucketName } from './config'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate file for upload
 */
export function validateFile(
  file: File,
  bucketName: BucketName
): ValidationResult {
  const config = getBucketConfig(bucketName)

  if (!config) {
    return {
      valid: false,
      error: `Invalid bucket: ${bucketName}`,
    }
  }

  // Check file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    }
  }

  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(config.maxSize)})`,
    }
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    }
  }

  // Check MIME type
  // Special handling for HEIC files - browsers may not report correct MIME type
  const fileExt = getFileExtension(file.name).toLowerCase()
  const isHeicByExtension = fileExt === '.heic' || fileExt === '.heif'

  // For gallery photos, allow HEIC files by extension even if MIME type is wrong
  if (bucketName === 'gallery-photos' && isHeicByExtension) {
    // HEIC file detected by extension - allow it
  } else if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
    }
  }

  // Check filename
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'File must have a valid filename',
    }
  }

  // Check for dangerous file extensions (even if MIME type is ok)
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html', '.htm']

  if (dangerousExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `File extension "${fileExt}" is not allowed for security reasons`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize filename
 * Removes special characters and spaces
 */
export function sanitizeFilename(filename: string): string {
  // Get extension
  const ext = getFileExtension(filename)

  // Get name without extension
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'))

  // Sanitize name: lowercase, replace spaces and special chars with hyphens
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) // Max 100 chars

  return `${sanitized}${ext}`
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(originalFilename)

  return `${timestamp}-${sanitized}`
}

/**
 * Get file extension including dot
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot)
}

/**
 * Generate storage path for file
 * Pattern: {year}/{month}/{unique-filename}
 */
export function generateStoragePath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uniqueFilename = generateUniqueFilename(filename)

  return `${year}/${month}/${uniqueFilename}`
}

/**
 * Validate bucket name
 */
export function isValidBucketName(bucketName: string): bucketName is BucketName {
  const validBuckets = [
    'event-images',
    'speaker-photos',
    'gallery-photos',
    'sponsor-logos',
    'post-images',
    'avatars',
    'documents',
  ]

  return validBuckets.includes(bucketName)
}
