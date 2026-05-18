export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CALL FOR PAPERS API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/applications/call-for-papers - Submit presentation proposal
// Created: Day 3 - Form Submission Endpoints
// Updated: Phase 7 Day 5 - Added confirmation email

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError, handleDatabaseError } from '@/lib/api-errors'
import { validateBody, callForPapersRequestSchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Application } from '@/types/api'
import { sendApplicationReceivedEmail } from '@/lib/email'

/**
 * POST /api/applications/call-for-papers
 * Submit a new call for papers application (talk, workshop, or poster)
 *
 * Request Body:
 * {
 *   "event_id": "uuid-string" (optional),
 *   "name": "Dr. Jane Doe",
 *   "email": "jane@example.com",
 *   "phone": "+254712345678" (optional),
 *   "organization": "University Name" (optional),
 *   "country": "Kenya" (optional),
 *   "presentation_type": "talk" | "workshop" | "poster",
 *   "presentation_title": "My Research on AI",
 *   "abstract": "Detailed abstract of at least 50 characters...",
 *   "keywords": "AI, ML, Deep Learning" (optional),
 *   "track": "Machine Learning" (optional),
 *   "bio": "Dr. Jane Doe is a researcher..." (optional),
 *   "linkedin_url": "https://linkedin.com/in/janedoe" (optional),
 *   "file_url": "https://storage.example.com/paper.pdf" (optional)
 * }
 *
 * Returns:
 * - 201 Created: Successfully submitted proposal
 * - 400 Bad Request: Invalid input data
 * - 500 Internal Error: Database error
 *
 * Note: RLS policy allows public to insert call for papers applications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication - users must be logged in to submit proposals
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to submit a proposal',
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
            message: 'You must verify your email address before submitting proposals. Please check your inbox for the verification link.',
          },
        },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateBody(callForPapersRequestSchema, request)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const formData = validation.data

    // Insert into applications table
    const { data: newApplication, error: insertError } = await supabase
      .from('applications')
      .insert({
        application_type: 'call_for_papers',
        event_id: formData.event_id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        organization: formData.organization || null,
        country: formData.country || null,
        presentation_type: formData.presentation_type,
        presentation_title: formData.presentation_title,
        abstract: formData.abstract,
        keywords: formData.keywords || null,
        track: formData.track || null,
        bio: formData.bio || null,
        linkedin_url: formData.linkedin_url || null,
        file_url: formData.file_url || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Call for papers insert error:', insertError)

      // Check for duplicate entry error
      if (insertError.code === '23505') {
        const errorMessage = insertError.message || ''

        if (errorMessage.includes('applications_email_event_type_unique')) {
          return handleValidationError(
            'You have already submitted a proposal for this event with this email address.'
          )
        }

        if (errorMessage.includes('applications_phone_event_type_unique')) {
          return handleValidationError(
            'You have already submitted a proposal for this event with this phone number.'
          )
        }

        // Generic duplicate error
        return handleValidationError(
          'You have already submitted a proposal for this event.'
        )
      }

      return handleDatabaseError(insertError)
    }

    // Fetch event details if event_id is provided
    let eventName: string | undefined
    if (formData.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('title')
        .eq('id', formData.event_id)
        .single()

      if (event) {
        eventName = event.title
      }
    }

    // Send confirmation email
    const presentationType = {
      'talk': 'Talk',
      'workshop': 'Workshop',
      'poster': 'Poster'
    }[formData.presentation_type] || formData.presentation_type

    const emailResult = await sendApplicationReceivedEmail(
      formData.email,
      formData.name,
      eventName || 'IndabaX Kenya Event',
      newApplication.id
    )

    if (!emailResult) {
      console.error('Failed to send confirmation email')
      // Continue anyway - application was successfully submitted
    }

    // Success - created new call for papers application
    const response: ApiSuccessResponse<Application> = {
      success: true,
      data: newApplication as Application,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
