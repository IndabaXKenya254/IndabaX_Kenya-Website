// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - API TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
// Shared TypeScript types for all API responses
// Created: Day 2 - Public API Endpoints

// ============================================================================
// STANDARD API RESPONSE TYPES
// ============================================================================

/**
 * Standard success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  count?: number // For list endpoints
  message?: string // Optional success message
}

/**
 * Standard error response wrapper
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard error codes
 */
export type ErrorCode =
  | 'DATABASE_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'DUPLICATE_ENTRY'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

// ============================================================================
// DATABASE MODEL TYPES (matching Supabase schema)
// ============================================================================

/**
 * Event model (from events table)
 */
export interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  theme: string | null // Event theme or tagline
  format: string | null // Event format (physical, virtual, hybrid)
  edition: string | null // Event edition (e.g., "1st", "2nd", "2024")
  excerpt: string | null // Short summary for event cards
  start_date: string // ISO date string
  end_date: string | null
  location: string | null
  venue: string | null
  venue_id: string | null // Foreign key to venues table
  featured_image: string | null
  status: 'draft' | 'published' | 'upcoming' | 'ongoing' | 'past' | 'archived' | 'cancelled'
  event_type: 'upcoming' | 'past' | 'workshop' | 'conference' | 'meetup' | 'webinar'
  event_category: 'indabax' | 'noai' | 'general' | null // Event category
  event_year: number | null // Year of the event
  is_featured: boolean
  venue_details: VenueDetails | null
  max_attendees: number | null // Maximum number of attendees
  registration_url: string | null // External registration URL
  registration_enabled: boolean // Whether registration is open for this event
  registration_deadline: string | null // ISO datetime string for registration deadline
  application_form_url: string | null // Google Form URL
  includes_saturday: boolean // Whether event runs on Saturdays (quick config)
  includes_sunday: boolean // Whether event runs on Sundays (quick config)
  event_dates: string[] | null // Exact dates when event runs (precise config, overrides weekend flags if set)
  initial_template_id: string | null // Form template for initial interest
  detailed_template_id: string | null // Form template for detailed survey
  partners: string | null // Event partners/sponsors
  gallery_link: string | null // Google Drive link for photo gallery
  external_link: string | null // External article/awards link
  external_link_label: string | null // Label for external link button
  created_at: string // ISO datetime string
  updated_at: string // ISO datetime string
}

/**
 * Venue details JSONB structure
 */
export interface VenueDetails {
  address?: string
  map_url?: string
  hotels?: string[]
}

/**
 * Speaker model (from speakers table)
 */
export interface Speaker {
  id: string
  name: string
  title: string | null
  organization: string | null
  photo_url: string | null
  bio_short: string | null
  bio_full: string | null
  linkedin_url: string | null
  twitter_url: string | null
  website_url: string | null
  is_featured: boolean
  display_order: number
  country: string | null
  speaker_year: number | null // Year speaker participated (e.g., 2025, 2024)
  force_previous: boolean // When true, shows as "previous" regardless of year
  created_at: string
  updated_at: string
}

/**
 * Email recipient model (from email_recipients table)
 * Used for CC/BCC management on system emails
 */
export interface EmailRecipient {
  id: string
  email: string
  name: string | null
  recipient_type: 'cc' | 'bcc'
  email_category: 'all' | 'applications' | 'registrations' | 'notifications' | 'support'
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * Post model (from posts table)
 */
export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author_id: string | null
  status: 'draft' | 'published'
  category: 'news' | 'announcement' | 'article' | null
  published_at: string | null
  created_at: string
  updated_at: string
}

/**
 * FAQ model (from faqs table)
 */
export interface FAQ {
  id: string
  question: string
  answer: string
  category: 'general' | 'registration' | 'event' | 'accommodation' | 'sponsorship' | 'speaking' | 'technical' | 'venue' | 'travel' | 'program' | 'networking' | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Sponsor model (from sponsors table)
 */
export interface Sponsor {
  id: string
  name: string
  logo_url: string
  website_url: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'organizer' | 'partner' | 'community' | 'supporter' | 'media' | 'academic' | 'institutional'
  display_order: number
  is_active: boolean
  sponsor_year: number | null // Year sponsor participated (e.g., 2025, 2024)
  force_previous: boolean // When true, shows as "previous" regardless of year
  created_at: string
}

/**
 * Photo model (from photos table)
 */
export interface Photo {
  id: string
  image_url: string  // Main photo URL (or video URL for videos)
  thumbnail_url: string | null
  caption: string | null  // Photo/video caption
  year: number  // Stored as INT in database
  event_id: string | null
  event_name: string | null
  photographer: string | null
  display_order: number
  uploaded_by: string | null
  created_at: string
  media_type?: 'image' | 'video'  // Type of media (default: image)
  category?: string  // Photo category (e.g., NOAI, General, Keynotes)
}

// Backwards compatibility alias
export type Faq = FAQ

/**
 * Schedule item model (from schedule_items table)
 */
export interface ScheduleItem {
  id: string
  event_id: string | null
  day_number: number
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  title: string
  description: string | null
  session_type: 'keynote' | 'talk' | 'workshop' | 'panel' | 'break' | 'networking' | 'registration' | 'track' | 'tutorial' | 'poster' | 'hackathon' | 'social' | 'special' | 'closing' | null
  location: string | null
  speaker_ids: string[] | null
  created_at: string
}

/**
 * Settings model (from settings table)
 */
export interface Setting {
  id: string
  key: string
  value: Record<string, unknown> // JSONB
  description: string | null
  updated_at: string
  updated_by: string | null
}

/**
 * Subscriber model (from subscribers table)
 */
export interface Subscriber {
  id: string
  email: string
  status: 'active' | 'unsubscribed'
  subscribed_at: string
  unsubscribed_at: string | null
}

/**
 * Team Member model (from team_members table)
 */
export interface TeamMember {
  id: string
  name: string
  role: string
  photo_url: string | null
  bio: string | null
  linkedin_url: string | null
  twitter_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

/**
 * Pricing Tier model (from pricing_tiers table)
 */
export interface PricingTier {
  id: string
  title: string
  price: string
  currency: string
  period: string
  description: string | null
  featured: boolean
  badge: string | null
  features: string[]
  requirements: string[]
  button_text: string
  button_link: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Stat model (from stats table)
 */
export interface Stat {
  id: string
  label: string
  value: number
  suffix: string
  icon: string
  color: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Application model (from applications table)
 */
export interface Application {
  id: string
  event_id: string | null
  application_type: 'registration' | 'call_for_papers'

  // Personal info
  name: string
  email: string
  phone: string | null
  organization: string | null
  country: string | null

  // Registration specific
  ticket_type: 'general' | 'student' | 'speaker' | null
  dietary_requirements: string | null
  tshirt_size: string | null
  accessibility_needs: string | null

  // Call for papers specific
  presentation_type: 'talk' | 'workshop' | 'poster' | null
  presentation_title: string | null
  abstract: string | null
  keywords: string | null
  track: string | null
  bio: string | null
  linkedin_url: string | null
  file_url: string | null

  // Status
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null

  // Timestamps
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

/**
 * Contact submission model (from contact_submissions table)
 */
export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: 'new' | 'read' | 'resolved'
  admin_notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolved_by: string | null
}

// ============================================================================
// JOINED/ENRICHED TYPES (for complex endpoints)
// ============================================================================

/**
 * Event with speakers, sponsors, team members, and schedule (for GET /api/events/[slug])
 */
export interface EventDetail extends Event {
  event_speakers: EventSpeaker[]
  event_sponsors?: EventSponsor[]
  event_team_members?: EventTeamMember[]
  schedule_items: ScheduleItem[]
}

/**
 * Event speaker relationship
 */
export interface EventSpeaker {
  id: string
  role: 'keynote' | 'speaker' | 'panelist' | 'moderator' | null
  display_order: number
  speaker: Speaker
}

/**
 * Event sponsor relationship
 */
export interface EventSponsor {
  id: string
  sponsorship_level: string | null
  display_order: number
  sponsor: Sponsor
}

/**
 * Event team member relationship
 */
export interface EventTeamMember {
  id: string
  event_role: string | null
  display_order: number
  team_member: TeamMember
}

/**
 * Post with author info (for GET /api/posts/[slug])
 */
export interface PostDetail extends Post {
  author?: {
    id: string
    email: string
  }
  author_name?: string | null
  author_image?: string | null
}

// ============================================================================
// REQUEST BODY TYPES
// ============================================================================

/**
 * Newsletter subscription request body
 */
export interface SubscribeRequest {
  email: string
}

/**
 * Event registration request body
 */
export interface RegistrationRequest {
  // Event reference
  event_id?: string // Optional - can register without specific event

  // Personal information (required)
  name: string
  email: string
  phone?: string
  organization?: string
  country?: string

  // Registration details
  ticket_type: 'general' | 'student' | 'speaker'
  dietary_requirements?: string
  tshirt_size?: string
  accessibility_needs?: string
}

/**
 * Call for papers submission request body
 */
export interface CallForPapersRequest {
  // Event reference
  event_id?: string // Optional - can submit without specific event

  // Personal information (required)
  name: string
  email: string
  phone?: string
  organization?: string
  country?: string

  // Presentation details (required)
  presentation_type: 'talk' | 'workshop' | 'poster'
  presentation_title: string
  abstract: string
  keywords?: string
  track?: string

  // Author bio
  bio?: string
  linkedin_url?: string

  // File attachment (uploaded separately, URL provided here)
  file_url?: string
}

/**
 * Contact form submission request body
 */
export interface ContactRequest {
  name: string
  email: string
  subject?: string
  message: string
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Events list query parameters
 */
export interface EventsQuery {
  type?: 'upcoming' | 'past'
  limit?: number
}

/**
 * Posts list query parameters
 */
export interface PostsQuery {
  category?: 'news' | 'announcement' | 'article'
  limit?: number
  offset?: number
}

/**
 * Gallery query parameters
 */
export interface GalleryQuery {
  year?: number
  event_id?: string
  limit?: number
}

/**
 * FAQs query parameters
 */
export interface FAQsQuery {
  category?: 'general' | 'registration' | 'event' | 'accommodation' | 'sponsorship' | 'speaking' | 'technical' | 'venue' | 'travel' | 'program' | 'networking'
}

/**
 * Sponsors query parameters
 */
export interface SponsorsQuery {
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze' | 'organizer' | 'partner' | 'community' | 'supporter' | 'media' | 'academic' | 'institutional'
  active_only?: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  offset: number
  limit: number
  has_more: boolean
}

/**
 * List response with pagination
 */
export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationMeta
}
