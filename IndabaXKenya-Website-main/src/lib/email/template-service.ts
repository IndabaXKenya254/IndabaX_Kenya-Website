// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL TEMPLATE SERVICE
// ═══════════════════════════════════════════════════════════════════════
// Fetches email templates from database and applies variable substitution
// Created: January 2026
// Updated: January 2026 - Added in-memory caching for performance
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

// Create admin client for fetching templates
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ═══════════════════════════════════════════════════════════════════════
// IN-MEMORY CACHE FOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════

interface CachedTemplate {
  template: EmailTemplate
  cachedAt: number
}

// Cache storage - templates indexed by name
const templateCache = new Map<string, CachedTemplate>()

// Cache storage - templates indexed by ID
const templateCacheById = new Map<string, CachedTemplate>()

// Cache TTL in milliseconds (default: 5 minutes)
const CACHE_TTL_MS = parseInt(process.env.EMAIL_TEMPLATE_CACHE_TTL || '300000')

// Track if all templates have been preloaded
let allTemplatesPreloaded = false
let preloadedAt = 0

/**
 * Check if a cached item is still valid
 */
function isCacheValid(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL_MS
}

/**
 * Get template from cache by name
 */
function getFromCache(name: string): EmailTemplate | null {
  const cached = templateCache.get(name)
  if (cached && isCacheValid(cached.cachedAt)) {
    return cached.template
  }
  // Remove stale entry
  if (cached) {
    templateCache.delete(name)
  }
  return null
}

/**
 * Get template from cache by ID
 */
function getFromCacheById(id: string): EmailTemplate | null {
  const cached = templateCacheById.get(id)
  if (cached && isCacheValid(cached.cachedAt)) {
    return cached.template
  }
  // Remove stale entry
  if (cached) {
    templateCacheById.delete(id)
  }
  return null
}

/**
 * Add template to cache (indexed by both name and ID)
 */
function addToCache(template: EmailTemplate): void {
  const now = Date.now()
  templateCache.set(template.name, { template, cachedAt: now })
  templateCacheById.set(template.id, { template, cachedAt: now })
}

/**
 * Clear entire cache (call after template updates in admin)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
  templateCacheById.clear()
  allTemplatesPreloaded = false
  preloadedAt = 0
  console.log('📧 Email template cache cleared')
}

/**
 * Clear specific template from cache by name
 */
export function invalidateTemplate(name: string): void {
  const cached = templateCache.get(name)
  if (cached) {
    templateCacheById.delete(cached.template.id)
    templateCache.delete(name)
    console.log(`📧 Template "${name}" invalidated from cache`)
  }
}

/**
 * Clear specific template from cache by ID
 */
export function invalidateTemplateById(id: string): void {
  const cached = templateCacheById.get(id)
  if (cached) {
    templateCache.delete(cached.template.name)
    templateCacheById.delete(id)
    console.log(`📧 Template ID "${id}" invalidated from cache`)
  }
}

/**
 * Preload all templates into cache (call at server startup)
 * Returns number of templates loaded
 */
export async function preloadTemplates(): Promise<number> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')

    if (error) {
      console.error('Error preloading templates:', error)
      return 0
    }

    const templates = (data || []) as EmailTemplate[]
    const now = Date.now()

    for (const template of templates) {
      templateCache.set(template.name, { template, cachedAt: now })
      templateCacheById.set(template.id, { template, cachedAt: now })
    }

    allTemplatesPreloaded = true
    preloadedAt = now

    console.log(`📧 Preloaded ${templates.length} email templates into cache`)
    return templates.length
  } catch (error) {
    console.error('Error preloading templates:', error)
    return 0
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  templateCount: number
  isPreloaded: boolean
  preloadedAt: Date | null
  ttlMs: number
} {
  return {
    templateCount: templateCache.size,
    isPreloaded: allTemplatesPreloaded && isCacheValid(preloadedAt),
    preloadedAt: preloadedAt ? new Date(preloadedAt) : null,
    ttlMs: CACHE_TTL_MS
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: string | null
  category: string | null
  variables: string[]
  is_system: boolean
  is_reusable: boolean
  description: string | null
}

export interface RenderedTemplate {
  subject: string
  html: string
  text: string
}

// ═══════════════════════════════════════════════════════════════════════
// VARIABLE SUBSTITUTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Replace template variables like {{name}}, {{email}}, {{event_title}}
 * Also handles conditional blocks like {{#if notes}}...{{/if}}
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template

  // Handle conditional blocks {{#if variable}}content{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName]
    if (value && value !== '' && value !== null && value !== undefined) {
      // If variable has value, include content (and process any variables in it)
      return content
    }
    return '' // Remove block if variable is empty
  })

  // Replace simple variables {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, String(value ?? ''))
  }

  // Clean up any remaining unmatched variables
  result = result.replace(/\{\{[^}]+\}\}/g, '')

  return result
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  return html
    // Remove style and script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert links to text with URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    // Convert headers to uppercase with underline
    .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, '\n$1\n' + '='.repeat(50) + '\n')
    // Convert list items
    .replace(/<li[^>]*>/gi, '\n• ')
    // Convert paragraphs and divs to newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE FETCHING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch a template by name from the database (with caching)
 */
export async function getTemplateByName(name: string): Promise<EmailTemplate | null> {
  // Check cache first
  const cached = getFromCache(name)
  if (cached) {
    return cached
  }

  // Fetch from database
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      console.error(`Error fetching template "${name}":`, error)
      return null
    }

    const template = data as EmailTemplate

    // Add to cache for future requests
    addToCache(template)

    return template
  } catch (error) {
    console.error(`Error fetching template "${name}":`, error)
    return null
  }
}

/**
 * Fetch a template by category and type from the database
 */
export async function getTemplateByCategory(
  category: string,
  type?: string
): Promise<EmailTemplate | null> {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('category', category)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.limit(1).single()

    if (error) {
      console.error(`Error fetching template for category "${category}":`, error)
      return null
    }

    return data as EmailTemplate
  } catch (error) {
    console.error(`Error fetching template for category "${category}":`, error)
    return null
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<EmailTemplate[]> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }

    return (data || []) as EmailTemplate[]
  } catch (error) {
    console.error('Error fetching templates:', error)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE RENDERING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Render a template with variables
 * Returns subject, HTML body, and plain text version
 */
export async function renderTemplate(
  templateName: string,
  variables: Record<string, string | number | undefined | null>
): Promise<RenderedTemplate | null> {
  const template = await getTemplateByName(templateName)

  if (!template) {
    console.error(`Template "${templateName}" not found in database`)
    return null
  }

  const subject = replaceVariables(template.subject, variables)
  const html = replaceVariables(template.body, variables)
  const text = htmlToText(html)

  return { subject, html, text }
}

/**
 * Render a template by ID (with caching)
 */
export async function renderTemplateById(
  templateId: string,
  variables: Record<string, string | number | undefined | null>
): Promise<RenderedTemplate | null> {
  // Check cache first
  let template = getFromCacheById(templateId)

  if (!template) {
    // Fetch from database
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error || !data) {
        console.error(`Template ID "${templateId}" not found:`, error)
        return null
      }

      template = data as EmailTemplate

      // Add to cache for future requests
      addToCache(template)
    } catch (error) {
      console.error(`Error rendering template ID "${templateId}":`, error)
      return null
    }
  }

  const subject = replaceVariables(template.subject, variables)
  const html = replaceVariables(template.body, variables)
  const text = htmlToText(html)

  return { subject, html, text }
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE NAME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════
// Use these constants when calling renderTemplate() to avoid typos

export const TEMPLATE_NAMES = {
  // Auth templates
  EMAIL_VERIFICATION: 'Email Verification',
  WELCOME: 'Welcome Email',
  PASSWORD_RESET: 'Password Reset',
  PASSWORD_CHANGED: 'Password Changed',

  // Application templates
  APPLICATION_RECEIVED: 'Application Received',
  APPLICATION_APPROVED: 'Application Approved - Welcome to IndabaX Kenya',
  APPLICATION_REJECTED: 'Application Rejected - IndabaX Kenya',
  APPLICATION_UNDER_REVIEW: 'Application Status Update - Under Review',
  SURVEY_INVITATION: 'Survey Invitation - Shortlisted Applicant',
  SURVEY_REMINDER: 'Survey Reminder - Complete Your Application',
  WAITLIST: 'Waitlist Notification',

  // Registration templates
  REGISTRATION_CONFIRMATION: 'Registration Confirmation',

  // Admin templates
  ADMIN_INVITATION: 'Admin Invitation',

  // Paper submission templates
  PAPER_APPROVED: 'Paper Approved - Speaker Invitation',
  PAPER_REJECTED: 'Paper Rejected - Feedback',
} as const

export type TemplateName = typeof TEMPLATE_NAMES[keyof typeof TEMPLATE_NAMES]
