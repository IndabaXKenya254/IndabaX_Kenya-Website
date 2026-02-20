// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER-FRIENDLY FIELD LABELS
// ═══════════════════════════════════════════════════════════════════════
// Maps database column names to human-readable labels for error messages
// Created: Admin UX Improvement - Better Validation Errors
// ═══════════════════════════════════════════════════════════════════════

/**
 * Mapping of database field names to user-friendly labels
 * Organized by entity type for clarity
 */
export const fieldLabels: Record<string, string> = {
  // ============================================================================
  // COMMON FIELDS
  // ============================================================================
  id: 'ID',
  title: 'Title',
  name: 'Name',
  description: 'Description',
  slug: 'URL Slug',
  status: 'Status',
  created_at: 'Created Date',
  updated_at: 'Updated Date',
  is_active: 'Active Status',
  is_featured: 'Featured',
  display_order: 'Display Order',

  // ============================================================================
  // EVENT FIELDS
  // ============================================================================
  start_date: 'Start Date',
  end_date: 'End Date',
  location: 'Location',
  venue: 'Venue',
  venue_id: 'Venue',
  featured_image: 'Banner Image',
  banner_url: 'Banner Image URL',
  event_type: 'Event Type',
  event_category: 'Event Category',
  registration_url: 'Registration URL',
  application_form_url: 'Application Form URL',
  max_attendees: 'Maximum Attendees',
  includes_saturday: 'Include Saturdays',
  includes_sunday: 'Include Sundays',
  event_dates: 'Event Dates',
  venue_details: 'Venue Details',

  // Event Templates
  initial_template_id: 'Application Form Template',
  detailed_template_id: 'Detailed Survey Template',
  interest_template_id: 'Interest Form Template',
  registration_enabled: 'Registration Enabled',
  registration_deadline: 'Registration Deadline',

  // Event Additional Fields
  theme: 'Event Theme',
  format: 'Event Format',
  edition: 'Event Edition',
  partners: 'Partners',
  gallery_link: 'Photo Gallery Link',
  external_link: 'External Link',
  external_link_label: 'External Link Label',

  // ============================================================================
  // POST FIELDS
  // ============================================================================
  content: 'Content',
  excerpt: 'Excerpt',
  featured_image_url: 'Featured Image',
  category: 'Category',
  published_at: 'Published Date',
  author_name: 'Author Name',
  author_image: 'Author Image',
  post_type: 'Post Type',
  external_url: 'External URL',
  og_image: 'Social Share Image',
  source_name: 'Source Name',

  // ============================================================================
  // SPEAKER FIELDS
  // ============================================================================
  organization: 'Organization',
  photo_url: 'Photo',
  bio_short: 'Short Bio',
  bio_full: 'Full Biography',
  linkedin_url: 'LinkedIn URL',
  twitter_url: 'Twitter URL',
  website_url: 'Website URL',
  country: 'Country',
  speaker_year: 'Speaker Year',
  force_previous: 'Show in Previous Speakers',
  expertise_ids: 'Areas of Expertise',

  // ============================================================================
  // SPONSOR FIELDS
  // ============================================================================
  logo_url: 'Logo',
  tier: 'Sponsorship Tier',
  sponsor_year: 'Sponsor Year',

  // ============================================================================
  // FAQ FIELDS
  // ============================================================================
  question: 'Question',
  answer: 'Answer',

  // ============================================================================
  // PHOTO/GALLERY FIELDS
  // ============================================================================
  url: 'Photo URL',
  image_url: 'Image URL',
  thumbnail_url: 'Thumbnail URL',
  caption: 'Caption',
  year: 'Year',
  media_type: 'Media Type',
  photo_date: 'Photo Date',
  event_id: 'Event',
  event_name: 'Event Name',
  photographer: 'Photographer',

  // ============================================================================
  // TAG/EXPERTISE FIELDS
  // ============================================================================
  tag_ids: 'Tags',
  speaker_ids: 'Speakers',
  sponsor_ids: 'Sponsors',
  team_member_ids: 'Team Members',
  event_ids: 'Events',

  // ============================================================================
  // USER/AUTH FIELDS
  // ============================================================================
  email: 'Email Address',
  password: 'Password',
  confirm_password: 'Confirm Password',
  first_name: 'First Name',
  last_name: 'Last Name',
  full_name: 'Full Name',
  phone: 'Phone Number',
  role: 'Role',

  // ============================================================================
  // APPLICATION FIELDS
  // ============================================================================
  user_id: 'User',
  template_id: 'Form Template',
  form_data: 'Form Data',
  submitted_at: 'Submitted Date',
  review_status: 'Review Status',
  reviewer_notes: 'Reviewer Notes',

  // ============================================================================
  // FORM BUILDER FIELDS
  // ============================================================================
  question_type: 'Question Type',
  question_text: 'Question Text',
  required: 'Required',
  options: 'Options',
  validation_rules: 'Validation Rules',
  placeholder: 'Placeholder Text',
  help_text: 'Help Text',
  min_length: 'Minimum Length',
  max_length: 'Maximum Length',

  // ============================================================================
  // EMAIL TEMPLATE FIELDS
  // ============================================================================
  subject: 'Subject',
  body: 'Email Body',
  template_type: 'Template Type',
  variables: 'Template Variables',

  // ============================================================================
  // SETTINGS FIELDS
  // ============================================================================
  key: 'Setting Key',
  value: 'Setting Value',
}

/**
 * Get a user-friendly label for a field name
 * Falls back to converting snake_case to Title Case if not found
 *
 * @param fieldName - The database field name (e.g., 'initial_template_id')
 * @returns User-friendly label (e.g., 'Application Form Template')
 */
export function getFieldLabel(fieldName: string): string {
  // Check if we have a predefined label
  if (fieldLabels[fieldName]) {
    return fieldLabels[fieldName]
  }

  // Fallback: Convert snake_case to Title Case
  // e.g., 'some_field_name' -> 'Some Field Name'
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Parse Zod validation errors and return user-friendly messages
 *
 * @param errorString - The raw error string from Zod/API
 * @returns Array of user-friendly error messages
 */
export function parseValidationErrors(errorString: string): string[] {
  const errors: string[] = []

  // Pattern 1: "field_name: Error message"
  // e.g., "initial_template_id: Invalid UUID"
  const fieldErrorPattern = /^([a-z_]+): (.+)$/gmi
  let match

  while ((match = fieldErrorPattern.exec(errorString)) !== null) {
    const [, fieldName, message] = match
    const friendlyLabel = getFieldLabel(fieldName)

    // Format error with friendly field name
    if (message.toLowerCase().includes('invalid uuid')) {
      errors.push(`${friendlyLabel}: Please select a valid option from the dropdown`)
    } else if (message.toLowerCase().includes('required')) {
      errors.push(`${friendlyLabel} is required`)
    } else if (message.toLowerCase().includes('invalid')) {
      errors.push(`${friendlyLabel}: Please enter a valid value`)
    } else {
      errors.push(`${friendlyLabel}: ${message}`)
    }
  }

  // If no field patterns matched, try to extract any useful information
  if (errors.length === 0) {
    // Check for common error patterns
    if (errorString.toLowerCase().includes('required')) {
      errors.push('Please fill in all required fields')
    } else if (errorString.toLowerCase().includes('invalid')) {
      errors.push('Some fields contain invalid values')
    } else {
      // Return the original error as-is but cleaned up
      errors.push(errorString)
    }
  }

  return errors
}

/**
 * Format Zod validation errors from the structured format
 * Handles the format: { path: ['field_name'], message: 'Error' }[]
 *
 * @param zodErrors - Array of Zod error objects
 * @returns Array of user-friendly error messages
 */
export function formatZodErrors(zodErrors: Array<{ path: (string | number)[]; message: string }>): string[] {
  return zodErrors.map(error => {
    const fieldPath = error.path.join('.')
    const friendlyLabel = getFieldLabel(fieldPath)

    // Special handling for common error types
    let message = error.message

    if (message.toLowerCase().includes('invalid uuid')) {
      message = 'Please select a valid option from the dropdown'
    } else if (message === 'Required') {
      return `${friendlyLabel} is required`
    } else if (message.toLowerCase().includes('invalid')) {
      message = 'Please enter a valid value'
    }

    return `${friendlyLabel}: ${message}`
  })
}
