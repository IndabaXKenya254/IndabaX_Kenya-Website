// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
// Zod schemas for validating admin API operations
// Created: Day 4 Phase 2 - Content Management

import { z } from 'zod'

// ============================================================================
// POST SCHEMAS
// ============================================================================

/**
 * Create post schema
 */
export const createPostSchema = z.object({
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(), // Auto-generated from title if not provided
  title: z.string().min(1, 'Title is required').max(255).trim(),
  excerpt: z.string().max(500).trim().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').trim(),
  featured_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  featured_image_url: z.string().url('Invalid image URL').optional().or(z.literal('')), // Alias for featured_image
  category: z.enum(['news', 'announcement', 'article', 'blog', 'event']).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  published_at: z.string().datetime().optional().or(z.literal('')),
  // Featured flag and author display fields
  is_featured: z.boolean().default(false),
  author_name: z.string().max(255).trim().optional(),
  author_image: z.string().url('Invalid author image URL').optional().or(z.literal('')),
  // Relationships
  tag_ids: z.array(z.string().uuid()).optional(),
  // Sauti Yetu (external link) fields
  post_type: z.enum(['normal', 'sauti_yetu']).default('normal'),
  external_url: z.string().url('Invalid external URL').optional().or(z.literal('')),
  og_image: z.string().url('Invalid OG image URL').optional().or(z.literal('')),
  source_name: z.string().max(255).trim().optional(),
})

/**
 * Update post schema (all fields optional)
 */
export const updatePostSchema = z.object({
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  title: z.string().min(1).max(255).trim().optional(),
  excerpt: z.string().max(500).trim().optional(),
  content: z.string().min(10).trim().optional(),
  featured_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  featured_image_url: z.string().url('Invalid image URL').optional().or(z.literal('')), // Alias for featured_image
  category: z.enum(['news', 'announcement', 'article', 'blog', 'event']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  published_at: z.string().datetime().optional().or(z.literal('')),
  // Featured flag and author display fields
  is_featured: z.boolean().optional(),
  author_name: z.string().max(255).trim().optional(),
  author_image: z.string().url('Invalid author image URL').optional().or(z.literal('')),
  // Relationships
  tag_ids: z.array(z.string().uuid()).optional(),
  // Sauti Yetu (external link) fields
  post_type: z.enum(['normal', 'sauti_yetu']).optional(),
  external_url: z.string().url('Invalid external URL').optional().or(z.literal('')),
  og_image: z.string().url('Invalid OG image URL').optional().or(z.literal('')),
  source_name: z.string().max(255).trim().optional(),
})

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

/**
 * Venue details schema (JSONB field)
 */
const venueDetailsSchema = z.object({
  address: z.string().optional(),
  map_url: z.string().url().optional(),
  hotels: z.array(z.string()).optional(),
}).optional()

/**
 * Create event schema
 */
export const createEventSchema = z.object({
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(), // Auto-generated from title if not provided
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: z.string().trim().optional(),
  excerpt: z.string().max(500).trim().optional(), // NEW: Short summary for cards
  start_date: z.string().date('Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().date().optional().or(z.literal('')),
  location: z.string().max(255).trim().optional(),
  venue: z.string().max(255).trim().optional(),
  featured_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  banner_url: z.string().url('Invalid banner URL').optional().or(z.literal('')), // Alias for featured_image
  status: z.enum(['draft', 'published', 'upcoming', 'ongoing', 'past', 'archived', 'cancelled']).default('draft'),
  event_type: z.enum(['upcoming', 'past', 'workshop', 'conference', 'meetup', 'webinar']).default('upcoming'),
  registration_url: z.string().url('Invalid registration URL').optional().or(z.literal('')).nullable(),
  max_attendees: z.number().int().positive().optional().nullable()
    .transform(val => val === null ? undefined : val), // Convert null to undefined
  is_featured: z.boolean().default(false),
  venue_details: venueDetailsSchema,
  venue_id: z.string().uuid().optional().nullable(), // Link to venues table
  // NEW: Weekend configuration
  includes_saturday: z.boolean().default(true),
  includes_sunday: z.boolean().default(true),
  // NEW: Precise date selection (array of YYYY-MM-DD strings)
  event_dates: z.array(z.string().date('Invalid date format (YYYY-MM-DD)')).optional().nullable(),
  // NEW: Relationships (handled separately in API)
  tag_ids: z.array(z.string().uuid()).optional(),
  speaker_ids: z.array(z.string().uuid()).optional(),
  sponsor_ids: z.array(z.string().uuid()).optional(),
  team_member_ids: z.array(z.string().uuid()).optional(),
  // PHASE 4: Template assignment for registration flow
  initial_template_id: z.string().uuid().optional().nullable(),
  detailed_template_id: z.string().uuid().optional().nullable(),
  interest_template_id: z.string().uuid().optional().nullable(),
  registration_enabled: z.boolean().default(true),
  registration_deadline: z.string().date().optional().nullable(),
  // Event category
  event_category: z.enum(['general', 'indabax', 'noai']).optional(),
  // Additional fields
  theme: z.string().max(255).trim().optional().nullable(),
  format: z.enum(['physical', 'hybrid', 'online']).optional(),
  edition: z.string().max(255).trim().optional().nullable(),
  partners: z.array(z.string()).optional().nullable(),
  // Links
  application_form_url: z.string().url('Invalid application form URL').optional().or(z.literal('')).nullable(),
  gallery_link: z.string().url('Invalid gallery link').optional().or(z.literal('')).nullable(),
  external_link: z.string().url('Invalid external link').optional().or(z.literal('')).nullable(),
  external_link_label: z.string().max(100).trim().optional().nullable(),
})

/**
 * Update event schema (all fields optional)
 */
export const updateEventSchema = z.object({
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().trim().optional(),
  excerpt: z.string().max(500).trim().optional(), // NEW
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional().or(z.literal('')),
  location: z.string().max(255).trim().optional(),
  venue: z.string().max(255).trim().optional(),
  featured_image: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'upcoming', 'ongoing', 'past', 'archived', 'cancelled']).optional(),
  event_type: z.enum(['upcoming', 'past', 'workshop', 'conference', 'meetup', 'webinar']).optional(),
  registration_url: z.string().url('Invalid registration URL').optional().or(z.literal('')).nullable(),
  max_attendees: z.number().int().positive().optional().nullable()
    .transform(val => val === null ? undefined : val),
  is_featured: z.boolean().optional(),
  venue_details: venueDetailsSchema,
  venue_id: z.string().uuid().optional().nullable(), // Link to venues table
  // NEW: Weekend configuration
  includes_saturday: z.boolean().optional(),
  includes_sunday: z.boolean().optional(),
  // NEW: Precise date selection (array of YYYY-MM-DD strings)
  event_dates: z.array(z.string().date('Invalid date format (YYYY-MM-DD)')).optional().nullable(),
  // NEW: Relationships
  tag_ids: z.array(z.string().uuid()).optional(),
  speaker_ids: z.array(z.string().uuid()).optional(),
  sponsor_ids: z.array(z.string().uuid()).optional(),
  team_member_ids: z.array(z.string().uuid()).optional(),
  // PHASE 4: Template assignment for registration flow
  initial_template_id: z.string().uuid().optional().nullable(),
  detailed_template_id: z.string().uuid().optional().nullable(),
  interest_template_id: z.string().uuid().optional().nullable(),
  registration_enabled: z.boolean().optional(),
  registration_deadline: z.string().date().optional().nullable(),
  // Event category
  event_category: z.enum(['general', 'indabax', 'noai']).optional(),
  // Additional fields
  theme: z.string().max(255).trim().optional().nullable(),
  format: z.enum(['physical', 'hybrid', 'online']).optional(),
  edition: z.string().max(255).trim().optional().nullable(),
  partners: z.array(z.string()).optional().nullable(),
  // Links
  application_form_url: z.string().url('Invalid application form URL').optional().or(z.literal('')).nullable(),
  gallery_link: z.string().url('Invalid gallery link').optional().or(z.literal('')).nullable(),
  external_link: z.string().url('Invalid external link').optional().or(z.literal('')).nullable(),
  external_link_label: z.string().max(100).trim().optional().nullable(),
})

// ============================================================================
// SPEAKER SCHEMAS
// ============================================================================

export const createSpeakerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  title: z.string().max(255).trim().optional(),
  organization: z.string().max(255).trim().optional(),
  photo_url: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  bio_short: z.string().max(500).trim().optional(),
  bio_full: z.string().trim().optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  country: z.string().max(100).trim().optional(), // Speaker country
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
  // Year is REQUIRED
  speaker_year: z.coerce.number({ message: 'Year is required' }).int().min(2020, 'Year must be 2020 or later').max(2030, 'Year must be 2030 or earlier'),
  force_previous: z.boolean().default(false),
  // Relationships
  expertise_ids: z.array(z.string().uuid()).optional(),
  event_ids: z.array(z.string().uuid()).optional(), // Link to events
})

export const updateSpeakerSchema = createSpeakerSchema.partial()

// ============================================================================
// SPONSOR SCHEMAS
// ============================================================================

export const createSponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  logo_url: z.string().url('Invalid logo URL'),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze', 'organizer', 'partner', 'community', 'supporter', 'media', 'academic', 'institutional']).optional(), // Tier is now OPTIONAL
  description: z.string().max(1000).trim().optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  // Year is REQUIRED
  sponsor_year: z.coerce.number({ message: 'Year is required' }).int().min(2020, 'Year must be 2020 or later').max(2030, 'Year must be 2030 or earlier'),
  force_previous: z.boolean().default(false),
  // Relationships
  event_ids: z.array(z.string().uuid()).optional(), // Link to events
})

export const updateSponsorSchema = createSponsorSchema.partial()

// ============================================================================
// FAQ SCHEMAS
// ============================================================================

export const createFaqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500).trim(),
  answer: z.string().min(10, 'Answer must be at least 10 characters').trim(),
  category: z.enum(['general', 'registration', 'event', 'accommodation', 'sponsorship', 'speaking', 'technical', 'venue', 'travel', 'program', 'networking']).optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

export const updateFaqSchema = createFaqSchema.partial()

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

export const updateSettingSchema = z.object({
  value: z.any(), // JSONB - any valid JSON value (string, number, boolean, object, array, null)
  description: z.string().max(500).trim().optional(),
})

// ============================================================================
// GALLERY PHOTO SCHEMAS
// ============================================================================

export const createPhotoSchema = z.object({
  // Accept both 'url' (old) and 'image_url' (new)
  url: z.string().url('Invalid photo URL').optional(),
  image_url: z.string().url('Invalid photo URL').optional(),

  // Thumbnail URL (generated by server)
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional(),

  // Accept both 'title' (old) and 'caption' (new)
  title: z.string().max(255).trim().optional(),
  caption: z.string().max(1000).trim().optional(),

  description: z.string().max(1000).trim().optional(),

  // Accept year as string (new format matching gallery.json) or number (old format)
  year: z.union([
    z.string().regex(/^\d{4}$/, 'Year must be 4 digits (e.g., "2024")'),
    z.number().int().min(2000).max(2100),
  ]),

  // New field: category
  category: z.string().max(100).trim().optional(),

  // Media type (image or video)
  media_type: z.enum(['image', 'video']).optional(),

  // NEW: Photo date field
  photo_date: z.string().date('Invalid date format (YYYY-MM-DD)').optional().or(z.literal('')),

  event_id: z.string().uuid().optional().or(z.literal('')),
  event_name: z.string().max(255).trim().optional(),
  photographer: z.string().max(255).trim().optional(),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
}).refine(
  (data) => data.url || data.image_url,
  { message: 'Either url or image_url is required', path: ['url'] }
)

export const updatePhotoSchema = createPhotoSchema.partial()

// ============================================================================
// TAG SCHEMAS (Event Tags, Post Tags, Speaker Expertise)
// ============================================================================

/**
 * Create tag schema (for event tags and post tags)
 */
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100).trim(),
  slug: z.string().min(1, 'Slug is required').max(100).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

export const updateTagSchema = createTagSchema.partial()

/**
 * Create expertise schema (for speaker expertise areas)
 */
export const createExpertiseSchema = z.object({
  name: z.string().min(1, 'Expertise name is required').max(100).trim(),
  slug: z.string().min(1, 'Slug is required').max(100).trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

export const updateExpertiseSchema = createExpertiseSchema.partial()
