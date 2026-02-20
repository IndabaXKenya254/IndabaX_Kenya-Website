export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT REGISTRATION API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/applications/registration - Submit event registration
// Created: Day 3 - Form Submission Endpoints
// Updated: Phase 7 Day 5 - Added confirmation email

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError, handleDatabaseError } from '@/lib/api-errors'
import { validateBody, registrationRequestSchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Application } from '@/types/api'
import { sendApplicationReceivedEmail } from '@/lib/email'

/**
 * POST /api/applications/registration
 * Submit a new event registration application
 *
 * Request Body:
 * {
 *   "event_id": "uuid-string" (optional),
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "+254712345678" (optional),
 *   "organization": "University Name" (optional),
 *   "country": "Kenya" (optional),
 *   "ticket_type": "general" | "student" | "speaker",
 *   "dietary_requirements": "Vegetarian" (optional),
 *   "tshirt_size": "M" (optional),
 *   "accessibility_needs": "Wheelchair access" (optional)
 * }
 *
 * Returns:
 * - 201 Created: Successfully submitted registration
 * - 400 Bad Request: Invalid input data
 * - 500 Internal Error: Database error
 *
 * Note: RLS policy allows public to insert registration applications
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

    // Validate request body
    const validation = await validateBody(registrationRequestSchema, request)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const formData = validation.data

    // Insert into applications table
    const { data: newApplication, error: insertError } = await supabase
      .from('applications')
      .insert({
        application_type: 'registration',
        event_id: formData.event_id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        organization: formData.organization || null,
        country: formData.country || null,
        ticket_type: formData.ticket_type,
        dietary_requirements: formData.dietary_requirements || null,
        tshirt_size: formData.tshirt_size || null,
        accessibility_needs: formData.accessibility_needs || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Registration insert error:', insertError)

      // Check for duplicate entry error
      if (insertError.code === '23505') {
        const errorMessage = insertError.message || ''

        if (errorMessage.includes('applications_email_event_type_unique')) {
          return handleValidationError(
            'You have already registered for this event with this email address.'
          )
        }

        if (errorMessage.includes('applications_phone_event_type_unique')) {
          return handleValidationError(
            'You have already registered for this event with this phone number.'
          )
        }

        // Generic duplicate error
        return handleValidationError(
          'You have already submitted a registration for this event.'
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

    // Success - created new registration
    const response: ApiSuccessResponse<Application> = {
      success: true,
      data: newApplication as Application,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
