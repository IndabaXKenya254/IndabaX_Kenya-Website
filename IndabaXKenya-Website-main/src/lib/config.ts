// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CENTRALIZED CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════
// Single source of truth for URLs, domains, and configuration
// All link generation should use these utilities
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get the base site URL from environment
 * Falls back to localhost in development
 */
export function getSiteUrl(): string {
  // Check various env variable names for compatibility
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  // Remove trailing slash if present
  return url.replace(/\/$/, '')
}

/**
 * Generate a survey link for a given access token
 */
export function getSurveyLink(accessToken: string): string {
  return `${getSiteUrl()}/survey/${accessToken}`
}

/**
 * Generate a ticket link for a given ticket ID
 */
export function getTicketLink(ticketId: string): string {
  return `${getSiteUrl()}/tickets/${ticketId}`
}

/**
 * Generate a ticket link by email (for email templates)
 */
export function getTicketLinkByEmail(email: string): string {
  return `${getSiteUrl()}/tickets?email=${encodeURIComponent(email)}`
}

/**
 * Generate an event link
 */
export function getEventLink(slug: string): string {
  return `${getSiteUrl()}/events/${slug}`
}

/**
 * Generate email verification link
 */
export function getEmailVerificationLink(token: string): string {
  return `${getSiteUrl()}/api/auth/verify-email?token=${token}`
}

/**
 * Get website URLs for email footers
 */
export function getWebsiteLinks() {
  const baseUrl = getSiteUrl()
  return {
    home: baseUrl,
    contact: `${baseUrl}/contact`,
    events: `${baseUrl}/events`,
    about: `${baseUrl}/about`,
  }
}

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  // From addresses
  applications: {
    email: 'applications@deeplearningindabaxkenya.com',
    name: 'IndabaX Kenya - Applications',
  },
  accounts: {
    email: 'accounts@deeplearningindabaxkenya.com',
    name: 'IndabaX Kenya - Accounts',
  },
  // Support contact
  support: 'applications@deeplearningindabaxkenya.com',
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
