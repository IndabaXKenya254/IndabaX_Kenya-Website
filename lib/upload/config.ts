// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - UPLOAD CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════
// Configuration for file uploads to Supabase Storage
// Created: Day 4 Phase 3 - File Upload System

/**
 * Storage bucket names
 */
export type BucketName =
  | 'event-images'
  | 'speaker-photos'
  | 'team-photos'
  | 'gallery-photos'
  | 'sponsor-logos'
  | 'post-images'
  | 'venue-images'
  | 'avatars'
  | 'documents'
  | 'papers'

/**
 * Bucket configuration
 */
export interface BucketConfig {
  name: BucketName
  maxSize: number // bytes
  allowedTypes: string[]
  isPublic: boolean
}

/**
 * Maximum file sizes per bucket (in bytes)
 */
export const MAX_FILE_SIZES: Record<BucketName, number> = {
  'event-images': 5 * 1024 * 1024,      // 5 MB
  'speaker-photos': 5 * 1024 * 1024,    // 5 MB
  'team-photos': 5 * 1024 * 1024,       // 5 MB
  'gallery-photos': 10 * 1024 * 1024,   // 10 MB
  'sponsor-logos': 2 * 1024 * 1024,     // 2 MB
  'post-images': 5 * 1024 * 1024,       // 5 MB
  'venue-images': 5 * 1024 * 1024,      // 5 MB
  'avatars': 2 * 1024 * 1024,           // 2 MB
  'documents': 10 * 1024 * 1024,        // 10 MB
  'papers': 10 * 1024 * 1024,           // 10 MB - PDF papers for call for papers
}

/**
 * Allowed MIME types per bucket
 */
export const ALLOWED_MIME_TYPES: Record<BucketName, string[]> = {
  'event-images': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'speaker-photos': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'team-photos': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'gallery-photos': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'sponsor-logos': [
    'image/svg+xml',
    'image/png',
    'image/webp',
  ],
  'post-images': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'venue-images': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'avatars': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  'documents': [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/plain',
  ],
  'papers': [
    'application/pdf',
  ],
}

/**
 * Bucket configurations
 */
export const BUCKET_CONFIGS: Record<BucketName, BucketConfig> = {
  'event-images': {
    name: 'event-images',
    maxSize: MAX_FILE_SIZES['event-images'],
    allowedTypes: ALLOWED_MIME_TYPES['event-images'],
    isPublic: true,
  },
  'speaker-photos': {
    name: 'speaker-photos',
    maxSize: MAX_FILE_SIZES['speaker-photos'],
    allowedTypes: ALLOWED_MIME_TYPES['speaker-photos'],
    isPublic: true,
  },
  'team-photos': {
    name: 'team-photos',
    maxSize: MAX_FILE_SIZES['team-photos'],
    allowedTypes: ALLOWED_MIME_TYPES['team-photos'],
    isPublic: true,
  },
  'gallery-photos': {
    name: 'gallery-photos',
    maxSize: MAX_FILE_SIZES['gallery-photos'],
    allowedTypes: ALLOWED_MIME_TYPES['gallery-photos'],
    isPublic: true,
  },
  'sponsor-logos': {
    name: 'sponsor-logos',
    maxSize: MAX_FILE_SIZES['sponsor-logos'],
    allowedTypes: ALLOWED_MIME_TYPES['sponsor-logos'],
    isPublic: true,
  },
  'post-images': {
    name: 'post-images',
    maxSize: MAX_FILE_SIZES['post-images'],
    allowedTypes: ALLOWED_MIME_TYPES['post-images'],
    isPublic: true,
  },
  'venue-images': {
    name: 'venue-images',
    maxSize: MAX_FILE_SIZES['venue-images'],
    allowedTypes: ALLOWED_MIME_TYPES['venue-images'],
    isPublic: true,
  },
  'avatars': {
    name: 'avatars',
    maxSize: MAX_FILE_SIZES['avatars'],
    allowedTypes: ALLOWED_MIME_TYPES['avatars'],
    isPublic: false,
  },
  'documents': {
    name: 'documents',
    maxSize: MAX_FILE_SIZES['documents'],
    allowedTypes: ALLOWED_MIME_TYPES['documents'],
    isPublic: false,
  },
  'papers': {
    name: 'papers',
    maxSize: MAX_FILE_SIZES['papers'],
    allowedTypes: ALLOWED_MIME_TYPES['papers'],
    isPublic: false, // Private - only owner and admin can access
  },
}

/**
 * Get bucket configuration
 */
export function getBucketConfig(bucketName: string): BucketConfig | null {
  return BUCKET_CONFIGS[bucketName as BucketName] || null
}

/**
 * Check if bucket is valid
 */
export function isValidBucket(bucketName: string): bucketName is BucketName {
  return bucketName in BUCKET_CONFIGS
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
