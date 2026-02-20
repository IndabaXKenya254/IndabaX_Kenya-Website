// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - API VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
// Zod schemas for validating API query parameters and request bodies
// Created: Day 2 - Public API Endpoints

import { z } from 'zod'

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Events list query parameters
 */
export const eventsQuerySchema = z.object({
  type: z.enum(['upcoming', 'past']).optional(),
  limit: z.coerce.number().min(1).max(100).default(100).optional(),
  event_category: z.enum(['indabax', 'noai', 'general']).optional(),
  event_year: z.coerce.number().min(2000).max(2100).optional(),
})

/**
 * Posts list query parameters
 */
export const postsQuerySchema = z.object({
  category: z.enum(['news', 'announcement', 'article']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
})

/**
 * Gallery query parameters
 */
export const galleryQuerySchema = z.object({
  year: z.coerce.number().min(2000).max(2100).optional(),
  event_id: z.string().uuid().optional(),
  category: z.string().max(50).optional(),
  exclude_category: z.string().max(50).optional(),
  limit: z.coerce.number().min(1).max(200).default(100).optional(),
})

/**
 * FAQs query parameters
 */
export const faqsQuerySchema = z.object({
  category: z.enum(['general', 'registration', 'event', 'accommodation', 'sponsorship', 'speaking', 'technical', 'venue', 'travel', 'program', 'networking']).optional(),
  classification: z.enum(['website', 'noai']).optional(),
})

/**
 * Sponsors query parameters
 */
export const sponsorsQuerySchema = z.object({
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze', 'organizer', 'partner', 'community', 'supporter', 'media', 'academic', 'institutional']).optional(),
  active_only: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
})

// ============================================================================
// REQUEST BODY SCHEMAS
// ============================================================================

/**
 * Newsletter subscription request
 */
export const subscribeRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
})

/**
 * Event registration request
 */
export const registrationRequestSchema = z.object({
  // Event reference (optional)
  event_id: z.string().uuid('Invalid event ID').optional(),

  // Personal information (required)
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().max(50).trim().optional(),
  organization: z.string().max(255).trim().optional(),
  country: z.string().max(100).trim().optional(),

  // Registration details (required)
  ticket_type: z.enum(['general', 'student', 'speaker'], {
    message: 'Invalid ticket type',
  }),
  dietary_requirements: z.string().max(1000).trim().optional(),
  tshirt_size: z.string().max(10).trim().optional(),
  accessibility_needs: z.string().max(1000).trim().optional(),
})

/**
 * Call for papers submission request
 */
export const callForPapersRequestSchema = z.object({
  // Event reference (optional)
  event_id: z.string().uuid('Invalid event ID').optional(),

  // Personal information (required)
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().max(50).trim().optional(),
  organization: z.string().max(255).trim().optional(),
  country: z.string().max(100).trim().optional(),

  // Presentation details (required)
  presentation_type: z.enum(['talk', 'workshop', 'poster'], {
    message: 'Invalid presentation type',
  }),
  presentation_title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255)
    .trim(),
  abstract: z
    .string()
    .min(50, 'Abstract must be at least 50 characters')
    .max(5000, 'Abstract too long (max 5000 characters)')
    .trim(),
  keywords: z.string().max(500).trim().optional(),
  track: z.string().max(100).trim().optional(),

  // Author bio
  bio: z
    .string()
    .max(2000, 'Bio too long (max 2000 characters)')
    .trim()
    .optional(),
  linkedin_url: z
    .string()
    .url('Invalid LinkedIn URL')
    .startsWith('https://linkedin.com/', 'Must be a LinkedIn URL')
    .or(z.string().startsWith('https://www.linkedin.com/', 'Must be a LinkedIn URL'))
    .optional()
    .or(z.literal('')), // Allow empty string

  // File attachment (URL to uploaded file)
  file_url: z.string().url('Invalid file URL').optional().or(z.literal('')),
})

/**
 * Contact form submission request
 */
export const contactRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  subject: z.string().max(255).trim().optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message too long (max 5000 characters)')
    .trim(),
})

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

/**
 * Event slug parameter
 */
export const eventSlugSchema = z.string().min(1).max(255)

/**
 * Post slug parameter
 */
export const postSlugSchema = z.string().min(1).max(255)

/**
 * Settings key parameter
 */
export const settingsKeySchema = z.string().min(1).max(100)

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate query parameters from URL search params
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Convert URLSearchParams to plain object
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const result = schema.safeParse(params)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Validate JSON request body
 */
export async function validateBody<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in request body' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Validate path parameter
 */
export function validateParam<T>(
  schema: z.ZodSchema<T>,
  value: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(value)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}
