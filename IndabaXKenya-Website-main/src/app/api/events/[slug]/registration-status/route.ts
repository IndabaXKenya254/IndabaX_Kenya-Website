export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT REGISTRATION STATUS API (OPTIMIZED)
// ═══════════════════════════════════════════════════════════════════════
// GET /api/events/[slug]/registration-status
// Returns event details + user's registration status in ONE call
// Optimized: Single database query instead of multiple API calls
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

interface RegistrationStatusResponse {
  event: {
    id: string
    slug: string
    title: string
    description: string | null
    start_date: string | null
    end_date: string | null
    location: string | null
    venue: string | null
    featured_image: string | null
    registration_enabled: boolean
    registration_deadline: string | null
    initial_template_id: string | null
  } | null
  registration: {
    id: string
    status: string
    status_v2: string | null
    reviewed_by: string | null
    shortlisted_by: string | null
    approved_by: string | null
    rejected_by: string | null
    responses: Record<string, any>
    resume_token: string | null
  } | null
  canRegister: boolean
  canModify: boolean
  reason: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServerClient()

    // Get authenticated user (optional - guest can view event)
    const { data: { user } } = await supabase.auth.getUser()

    // SINGLE QUERY: Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        slug,
        title,
        description,
        start_date,
        end_date,
        location,
        venue,
        featured_image,
        registration_enabled,
        registration_deadline,
        initial_template_id
      `)
      .eq('slug', slug)
      .single()

    if (eventError || !event) {
      return NextResponse.json({
        success: true,
        data: {
          event: null,
          registration: null,
          canRegister: false,
          canModify: false,
          reason: 'Event not found',
        } as RegistrationStatusResponse,
      })
    }

    // Initialize response
    const response: RegistrationStatusResponse = {
      event,
      registration: null,
      canRegister: true,
      canModify: false,
      reason: null,
    }

    // Check registration conditions
    if (!event.registration_enabled) {
      response.canRegister = false
      response.reason = 'Registration is not enabled for this event'
    } else if (!event.initial_template_id) {
      response.canRegister = false
      response.reason = 'Registration form is not yet configured'
    } else if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      response.canRegister = false
      response.reason = 'Registration deadline has passed'
    }

    // If user is authenticated, check their registration status
    if (user) {
      // SINGLE QUERY: Get user's registration for this event
      const { data: registration } = await supabase
        .from('form_responses')
        .select(`
          id,
          status,
          status_v2,
          reviewed_by,
          shortlisted_by,
          approved_by,
          rejected_by,
          responses,
          resume_token
        `)
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (registration) {
        response.registration = registration

        if (registration.status === 'completed') {
          response.canRegister = false
          response.reason = 'You have already registered for this event'

          // Check if modification is allowed
          const deadlinePassed = event.registration_deadline &&
                                 new Date(event.registration_deadline) < new Date()
          const adminProcessedStatuses = ['shortlisted', 'survey_sent', 'survey_completed', 'approved', 'rejected', 'attended']
          const hasAdminReviewed = registration.reviewed_by ||
                                   registration.shortlisted_by ||
                                   registration.approved_by ||
                                   registration.rejected_by ||
                                   (registration.status_v2 && adminProcessedStatuses.includes(registration.status_v2))

          if (!deadlinePassed && !hasAdminReviewed) {
            response.canModify = true
            response.reason = 'You can modify your registration before the deadline'
          } else if (deadlinePassed) {
            response.reason = 'Modification deadline has passed'
          } else if (hasAdminReviewed) {
            response.reason = 'Your application has been reviewed - modifications not allowed'
          }
        } else if (registration.status === 'in_progress') {
          // User has started but not completed
          response.canRegister = true
          response.reason = 'You have a registration in progress'
        }
      }
    }

    const apiResponse: ApiSuccessResponse<RegistrationStatusResponse> = {
      success: true,
      data: response,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    return handleError(error)
  }
}
