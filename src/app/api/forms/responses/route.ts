export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM RESPONSES API
// ═══════════════════════════════════════════════════════════════════════
// Handle form response submission and auto-save
// Phase 4: Registration Flow

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'
import { sendRegistrationConfirmation } from '@/lib/email/sender'
import { getEventLink, getSiteUrl } from '@/lib/config'

// ═══════════════════════════════════════════════════════════════════════
// HELPER: Smart fallback for extracting respondent name
// ═══════════════════════════════════════════════════════════════════════

interface FormQuestion {
  id: string
  title?: string
  is_required?: boolean
}

/**
 * Extract the most reliable name for the applicant with smart fallback
 * Priority (AS PER CLIENT REQUIREMENT - NO PROFILE NAME):
 * 1. respondent_name (explicitly provided during form submission)
 * 2. Combine First Name + Last Name from form questions (using question labels)
 * 3. Extract from responses JSON (common field names: name, full_name, fullName, full name)
 * 4. Email address (final fallback) - NO PROFILE NAME FALLBACK
 */
function getRespondentName(
  respondent_name: string | null | undefined,
  responses: Record<string, unknown>,
  email: string,
  questions?: FormQuestion[]
): string {
  // Priority 1: Explicit respondent_name (passed from form submission)
  if (respondent_name && respondent_name.trim()) {
    return respondent_name.trim()
  }

  // Priority 2: Try to combine First Name + Last Name from form questions
  if (questions && questions.length > 0) {
    // Flexible patterns to match various label formats
    // Examples: "First Name", "FirstName", "first name", "Given Name"
    const firstNamePatterns = /first\s*name|given\s*name|forename/i
    // Examples: "Last Name", "LastName", "Surname", "LastName/Surname", "Family Name"
    const lastNamePatterns = /last\s*name|surname|family\s*name|second\s*name/i

    let firstName = ''
    let lastName = ''

    for (const question of questions) {
      const title = question.title || ''
      const value = responses[question.id]

      if (typeof value === 'string' && value.trim()) {
        if (firstNamePatterns.test(title)) {
          firstName = value.trim()
        } else if (lastNamePatterns.test(title)) {
          lastName = value.trim()
        }
      }
    }

    // Combine first name and last name
    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      if (fullName) {
        console.log('📝 Combined name from form fields:', { firstName, lastName, fullName })
        return fullName
      }
    }
  }

  // Priority 3: Check for UUID keys first (actual form question answers)
  // These are more reliable than the pre-filled 'name'/'email' keys
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  for (const [key, value] of Object.entries(responses)) {
    // Only check UUID keys (actual form question IDs)
    if (uuidRegex.test(key) && typeof value === 'string' && value.trim()) {
      const extractedName = value.trim()
      // Check if this looks like a name (2-100 chars, contains letters)
      if (extractedName.length >= 2 && extractedName.length <= 100 && /[a-zA-Z]/.test(extractedName)) {
        // This is heuristic - we can't know for sure if it's a name without the question title
        // But we'll return the first reasonable-looking string answer from UUID keys
        // The form submission handler should pass the correct respondent_name
      }
    }
  }

  // Priority 4: Extract from responses JSON (non-UUID keys)
  // Skip 'name' and 'email' as these are pre-filled from profile, not form answers
  const commonNameFields = [
    'full_name', 'fullName', 'full name',
    'Full Name', 'FullName',
    'applicant_name', 'applicantName', 'participant_name', 'participantName'
    // NOTE: 'name' and 'Name' are excluded - they are pre-filled from profile
  ]

  for (const field of commonNameFields) {
    // Check direct match in responses
    if (responses[field] && typeof responses[field] === 'string') {
      const extractedName = (responses[field] as string).trim()
      if (extractedName) {
        return extractedName
      }
    }
  }

  // Priority 5: Check 'name' field only as last resort before email
  // This may contain profile name but it's better than using email
  if (responses['name'] && typeof responses['name'] === 'string') {
    const nameValue = (responses['name'] as string).trim()
    if (nameValue && nameValue !== email) {
      return nameValue
    }
  }

  // Priority 6: Final fallback - email address
  // NOTE: We do NOT use profile name as per client requirement
  // Emails MUST use name provided during application, NOT profile name
  return email
}

// Validation schema for creating/updating form response
const formResponseSchema = z.object({
  template_id: z.string().uuid(),
  event_id: z.string().uuid(),
  response_type: z.enum(['initial_interest', 'detailed_survey', 'application', 'paper_submission', 'custom']).default('application'),
  respondent_email: z.string().email('Invalid email address'),
  respondent_name: z.string().optional().nullable(),
  responses: z.record(z.string(), z.unknown()).optional().default({}),
  is_complete: z.boolean().optional().default(false),
  resume_token: z.string().optional().nullable(),
})

/**
 * POST /api/forms/responses
 * Create or update a form response (auto-save or submit)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication - users must be logged in to register
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to register for events',
          },
        },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'You must verify your email address before registering for events. Please check your inbox for the verification link.',
          },
        },
        { status: 403 }
      )
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error('JSON parse error:', e)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      )
    }

    console.log('Form response submission:', JSON.stringify(body, null, 2))

    // Validate request body
    const validation = formResponseSchema.safeParse(body)

    if (!validation.success) {
      console.error('Validation error:', JSON.stringify(validation.error, null, 2))
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${firstError.path.join('.')}: ${firstError.message}`,
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const {
      template_id,
      event_id,
      response_type,
      respondent_email,
      respondent_name,
      responses,
      is_complete,
      resume_token,
    } = validation.data

    // Check if event exists and registration is enabled
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug, start_date, end_date, location, venue, registration_enabled, registration_deadline')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Event not found',
          },
        },
        { status: 404 }
      )
    }

    if (!event.registration_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_CLOSED',
            message: 'Registration is not enabled for this event',
          },
        },
        { status: 400 }
      )
    }

    // Check if registration deadline has passed
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline)
      if (deadline < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REGISTRATION_CLOSED',
              message: 'Registration deadline has passed',
            },
          },
          { status: 400 }
        )
      }
    }

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('id, name')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found',
          },
        },
        { status: 404 }
      )
    }

    // Calculate completion percentage
    // Also fetch title for name extraction (First Name, Last Name fields)
    const { data: questions } = await supabase
      .from('form_questions')
      .select('id, is_required, title, description, type, order_index, config')
      .eq('template_id', template_id)
      .order('order_index', { ascending: true })

    const requiredQuestions = questions?.filter(q => q.is_required) || []

    // Issue #43 FIX: Validate grid questions - all rows must have answers
    if (is_complete) {
      const missingFields: string[] = []

      requiredQuestions.forEach(q => {
        const response = responses[q.id]

        // Basic empty check
        if (response === undefined || response === null || response === '') {
          missingFields.push(q.title)
          return
        }
        if (Array.isArray(response) && response.length === 0) {
          missingFields.push(q.title)
          return
        }

        // Grid validation: check all rows have answers
        if (q.type === 'multiple_choice_grid' || q.type === 'checkbox_grid') {
          const gridConfig = q.config || {}
          const gridRows = gridConfig.rows || []
          const gridResponse = (response || {}) as Record<string, any>

          if (gridRows.length > 0) {
            const unansweredRows = gridRows.filter((row: string) => {
              const answer = gridResponse[row]
              if (answer === undefined || answer === null || answer === '') return true
              if (Array.isArray(answer) && answer.length === 0) return true
              return false
            })

            if (unansweredRows.length > 0) {
              missingFields.push(`${q.title} (${unansweredRows.length} rows unanswered)`)
            }
          }
        }
      })

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Please complete all required fields',
              details: missingFields,
            },
          },
          { status: 400 }
        )
      }
    }

    const answeredRequired = requiredQuestions.filter(q => {
      const response = responses[q.id]
      if (response === undefined || response === null || response === '') return false
      if (Array.isArray(response) && response.length === 0) return false
      // Issue #43: For grids, check if all rows are answered
      if (q.type === 'multiple_choice_grid' || q.type === 'checkbox_grid') {
        const gridConfig = q.config || {}
        const gridRows = gridConfig.rows || []
        const gridResponse = (response || {}) as Record<string, any>
        if (gridRows.length > 0) {
          const allAnswered = gridRows.every((row: string) => {
            const answer = gridResponse[row]
            if (answer === undefined || answer === null || answer === '') return false
            if (Array.isArray(answer) && answer.length === 0) return false
            return true
          })
          return allAnswered
        }
      }
      return true
    })

    const completion_percentage = requiredQuestions.length > 0
      ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
      : 100

    // Get user agent and IP
    const user_agent = request.headers.get('user-agent') || undefined
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined

    // Check if user already has a response for this event
    // First try to find by user_id (for authenticated users)
    let existingResponse = null

    const { data: userResponse } = await supabase
      .from('form_responses')
      .select('id, status, status_v2, resume_token, respondent_name, user_id, reviewed_by, shortlisted_by, approved_by, rejected_by')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .eq('response_type', response_type)
      .maybeSingle()

    if (userResponse) {
      existingResponse = userResponse
    } else {
      // Fallback: check by email (for legacy responses without user_id)
      const { data: emailResponse } = await supabase
        .from('form_responses')
        .select('id, status, status_v2, resume_token, respondent_name, user_id, reviewed_by, shortlisted_by, approved_by, rejected_by')
        .eq('event_id', event_id)
        .eq('respondent_email', respondent_email)
        .eq('response_type', response_type)
        .maybeSingle()

      existingResponse = emailResponse
    }

    let responseData

    if (existingResponse) {
      // Check if admin has already reviewed/processed this application
      // Admin-touched statuses that prevent modification
      const adminProcessedStatuses = ['shortlisted', 'survey_sent', 'survey_completed', 'approved', 'rejected', 'attended']
      const hasAdminReviewed = existingResponse.reviewed_by ||
                               existingResponse.shortlisted_by ||
                               existingResponse.approved_by ||
                               existingResponse.rejected_by ||
                               (existingResponse.status_v2 && adminProcessedStatuses.includes(existingResponse.status_v2))

      if (hasAdminReviewed && existingResponse.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_REVIEWED',
              message: 'Your application has already been reviewed by the admin team. Modifications are no longer allowed.',
            },
          },
          { status: 400 }
        )
      }

      // Check if response is completed and deadline has passed
      const deadlinePassed = event.registration_deadline && new Date(event.registration_deadline) < new Date()

      if (existingResponse.status === 'completed') {
        // If deadline has passed, no modifications allowed
        if (deadlinePassed) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'MODIFICATION_CLOSED',
                message: 'The modification deadline has passed. You cannot update your application after the deadline.',
              },
            },
            { status: 400 }
          )
        }

        // Allow modification before deadline - notify user their submission will be updated
        console.log('User modifying completed response before deadline:', {
          responseId: existingResponse.id,
          userEmail: user.email,
          deadline: event.registration_deadline,
        })
      }

      console.log('Updating existing response:', {
        existingResponseId: existingResponse.id,
        existingStatus: existingResponse.status,
        existingUserId: existingResponse.user_id,
        newStatus: is_complete ? 'completed' : 'in_progress',
        userId: user.id,
        userEmail: user.email,
        respondentEmail: respondent_email,
      })

      // Extract name from form responses (NO PROFILE NAME FALLBACK)
      // Priority: respondent_name → First+Last Name from form → responses JSON → existing name → email
      const finalName = getRespondentName(
        respondent_name,
        responses,
        respondent_email,
        questions || []
      )

      // Build update data - also set user_id if missing (for legacy responses)
      const updateData: any = {
        responses,
        is_complete,
        completion_percentage,
        last_saved_at: new Date().toISOString(),
        status: is_complete ? 'completed' : 'in_progress',
        completed_at: is_complete ? new Date().toISOString() : null,
        respondent_name: finalName || existingResponse.respondent_name, // Use extracted name, NOT profile
      }

      // Store template snapshot on completion for stable display (Issue #44)
      // Issue #26 FIX: Options are in config.options, not a top-level options column
      if (is_complete && questions && questions.length > 0) {
        updateData.template_snapshot = questions.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description || null,
          type: q.type,
          is_required: q.is_required || false,
          order_index: q.order_index,
          config: q.config || {},
          options: (q as any).config?.options || null,
        }))
      }

      // If response has no user_id, set it to current user
      if (!existingResponse.user_id) {
        updateData.user_id = user.id
      }

      const { data, error } = await supabase
        .from('form_responses')
        .update(updateData)
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating response:', error)
        console.error('Update failed for response:', {
          id: existingResponse.id,
          status: existingResponse.status,
          attemptedStatus: is_complete ? 'completed' : 'in_progress',
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        })

        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message?.includes('policy')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PERMISSION_DENIED',
                message: 'You do not have permission to update this response. Please try logging in again or contact support.',
              },
            },
            { status: 403 }
          )
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to save response. Please try again.',
              details: error.message,
            },
          },
          { status: 500 }
        )
      }

      responseData = data
    } else {
      // Create new response
      // Generate resume token using the database function
      const { data: tokenResult } = await supabase.rpc('generate_resume_token')
      const newResumeToken = tokenResult || resume_token

      // Extract name from form responses (NO PROFILE NAME FALLBACK)
      // Use smart name extraction with fallback
      // Priority: respondent_name → First+Last Name from form → responses JSON → email
      const finalName = getRespondentName(
        respondent_name,
        responses,
        respondent_email,
        questions || []
      )

      // Build template snapshot for stable display (Issue #44)
      // Issue #26 FIX: Options are in config.options, not a top-level options column
      const templateSnapshot = (is_complete && questions && questions.length > 0)
        ? questions.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description || null,
            type: q.type,
            is_required: q.is_required || false,
            order_index: q.order_index,
            config: q.config || {},
            options: (q as any).config?.options || null,
          }))
        : null

      const { data, error } = await supabase
        .from('form_responses')
        .insert({
          template_id,
          event_id,
          response_type,
          respondent_email,
          respondent_name: finalName, // Use extracted name, NOT profile name
          responses,
          is_complete,
          completion_percentage,
          status: is_complete ? 'completed' : 'in_progress',
          started_at: new Date().toISOString(),
          completed_at: is_complete ? new Date().toISOString() : null,
          last_saved_at: new Date().toISOString(),
          resume_token: newResumeToken,
          user_agent,
          ip_address,
          user_id: user.id, // Set authenticated user's ID
          template_snapshot: templateSnapshot,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating response:', error)
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to save response',
            },
          },
          { status: 500 }
        )
      }

      responseData = data
    }

    // Send confirmation email if form is completed
    if (is_complete && responseData) {
      try {
        // Format date for email
        const eventDate = event.start_date
          ? new Date(event.start_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'TBA'

        const submittedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        // Determine event location (prefer location, fallback to venue)
        const eventLocation = event.location || event.venue || 'TBA'

        // Create event URL using slug
        const eventUrl = event.slug
          ? getEventLink(event.slug)
          : `${getSiteUrl()}/events`

        // Use the name already stored in the database (from form submission)
        // This ensures consistency - emails use the SAME name that was saved
        const finalName = responseData.respondent_name || respondent_email

        // Send email (non-blocking - don't wait for it)
        // Email is logged to email_logs table for tracking
        console.log('📧 [FormResponse] About to send registration confirmation email to:', respondent_email)
        console.log('📧 [FormResponse] Email data:', {
          recipientName: finalName,
          eventTitle: event.title,
          eventDate,
          eventLocation,
          eventUrl,
          responseId: responseData.id,
          submittedAt: submittedDate,
          eventId: event.id,
        })

        sendRegistrationConfirmation(respondent_email, {
          recipientName: finalName,
          eventTitle: event.title,
          eventDate,
          eventLocation,
          eventUrl,
          responseId: responseData.id,
          submittedAt: submittedDate,
          eventId: event.id, // For email logging
        }).then((result) => {
          console.log('📧 [FormResponse] Email result:', result)
        }).catch((error) => {
          // Log error but don't fail the request
          console.error('❌ [FormResponse] Failed to send confirmation email:', error)
          console.error('❌ [FormResponse] Error details:', error instanceof Error ? error.stack : 'No stack')
        })

        console.log('📧 [FormResponse] Confirmation email queued for:', respondent_email, 'with name:', finalName)
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Error queuing confirmation email:', emailError)
      }
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: responseData,
      message: is_complete
        ? 'Form submitted successfully. A confirmation email will be sent shortly.'
        : 'Progress saved successfully',
    }

    return NextResponse.json(response, { status: is_complete ? 201 : 200 })
  } catch (error) {
    console.error('Form response API error:', error)
    return handleError(error)
  }
}

/**
 * GET /api/forms/responses?event_id=xxx&email=xxx&response_type=xxx
 * Get user's form response for an event
 *
 * For authenticated users checking their own registration:
 * - Pass check_own=true to use the authenticated user's email
 * - This properly respects RLS policies
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const event_id = searchParams.get('event_id')
    const email = searchParams.get('email')
    const response_type = searchParams.get('response_type') // Optional - if not provided, returns any
    const resume_token = searchParams.get('resume_token')
    const check_own = searchParams.get('check_own') === 'true'

    if (!event_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'event_id is required',
          },
        },
        { status: 400 }
      )
    }

    // For check_own mode, use authenticated user's credentials
    let searchEmail = email
    let searchUserId: string | null = null

    if (check_own || (!email && !resume_token)) {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'You must be logged in to check your registration status',
            },
          },
          { status: 401 }
        )
      }

      searchEmail = user.email || null
      searchUserId = user.id
    }

    if (!searchEmail && !resume_token && !searchUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'email, resume_token, or check_own=true is required',
          },
        },
        { status: 400 }
      )
    }

    // Try to find by user_id first (most reliable for authenticated users)
    let data = null
    let error = null

    if (searchUserId) {
      let query = supabase
        .from('form_responses')
        .select('*')
        .eq('event_id', event_id)
        .eq('user_id', searchUserId)

      // Only filter by response_type if specified
      if (response_type) {
        query = query.eq('response_type', response_type)
      }

      const result = await query.maybeSingle()
      data = result.data
      error = result.error
    }

    // If not found by user_id, try by resume_token or email
    if (!data && !error) {
      let query = supabase
        .from('form_responses')
        .select('*')
        .eq('event_id', event_id)

      // Only filter by response_type if specified
      if (response_type) {
        query = query.eq('response_type', response_type)
      }

      if (resume_token) {
        query = query.eq('resume_token', resume_token)
      } else if (searchEmail) {
        query = query.eq('respondent_email', searchEmail)
      }

      const result = await query.maybeSingle()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching response:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch response',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || null,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
