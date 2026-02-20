export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BULK SHORTLIST API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Shortlist multiple applications at once

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { sendShortlistEmail } from '@/lib/email/send-shortlist-email'
import { randomUUID } from 'crypto'
import { getSurveyLink } from '@/lib/config'

interface BulkShortlistRequest {
  application_ids: string[]
  survey_template_id?: string  // Required if events don't have detailed_template_id
  deadline_days?: number       // Default 7 days
}

interface BulkResult {
  total: number
  success: number
  failed: number
  results: Array<{
    application_id: string
    success: boolean
    survey_response_id?: string
    error?: string
  }>
}

/**
 * POST /api/admin/applications/bulk/shortlist
 * Shortlist multiple applications at once
 *
 * Body:
 * {
 *   application_ids: ["uuid1", "uuid2", "uuid3"],
 *   survey_template_id: "uuid",  // Required if events don't have detailed_template_id
 *   deadline_days: 7             // Optional, default 7
 * }
 *
 * Process:
 * - Validates all application IDs
 * - Checks survey template availability
 * - Creates survey form_response records
 * - Sends emails with survey links
 * - Returns detailed results
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: BulkShortlistRequest = await request.json()

    if (!body.application_ids || !Array.isArray(body.application_ids)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: application_ids must be an array' },
        { status: 400 }
      )
    }

    if (body.application_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No applications selected' },
        { status: 400 }
      )
    }

    if (body.application_ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 applications can be shortlisted at once' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Fetch all applications with event details
    // ═══════════════════════════════════════════════════════════════════

    const { data: applications, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        user_id,
        template_id,
        respondent_name,
        respondent_email,
        status_v2,
        events (
          id,
          title,
          slug,
          start_date,
          detailed_template_id
        )
      `)
      .in('id', body.application_ids)

    if (fetchError) {
      console.error('Failed to fetch applications:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No applications found' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Determine survey template to use
    // ═══════════════════════════════════════════════════════════════════

    // Check if any application's event is missing a survey template
    const eventsNeedingTemplate = applications.filter(app => {
      const event = app.events as any
      return !event?.detailed_template_id && !body.survey_template_id
    })

    if (eventsNeedingTemplate.length > 0) {
      // Issue #29b FIX: Fetch ALL available templates (not just survey-typed)
      // so admin can select from any template including custom ones
      const { data: availableTemplates } = await supabase
        .from('form_templates')
        .select('id, name, description, usage_type')
        .order('usage_type')
        .order('name')

      // Get unique events needing template
      const eventMap = new Map<string, { id: string; title: string }>()
      eventsNeedingTemplate.forEach(app => {
        const event = app.events as any
        if (event?.id) {
          eventMap.set(event.id, { id: event.id, title: event.title })
        }
      })
      const uniqueEvents = Array.from(eventMap.values())

      return NextResponse.json(
        {
          success: false,
          error: 'Survey template required for shortlisting',
          code: 'SURVEY_TEMPLATE_REQUIRED',
          message: 'Please select a survey template to send to shortlisted applicants.',
          available_templates: availableTemplates || [],
          events_needing_template: uniqueEvents,
          applications_affected: eventsNeedingTemplate.length
        },
        { status: 400 }
      )
    }

    // Verify provided template exists (if provided)
    if (body.survey_template_id) {
      const { data: template, error: templateError } = await supabase
        .from('form_templates')
        .select('id, name')
        .eq('id', body.survey_template_id)
        .single()

      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: 'Selected survey template not found' },
          { status: 400 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Process each application
    // ═══════════════════════════════════════════════════════════════════

    const results: BulkResult = {
      total: applications.length,
      success: 0,
      failed: 0,
      results: []
    }

    const now = new Date().toISOString()
    const deadlineDays = body.deadline_days || 7

    // Process in batches of 10 to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)

      // Process batch in parallel
      await Promise.all(
        batch.map(async (application) => {
          try {
            // Skip if already shortlisted
            if (application.status_v2 === 'shortlisted' || application.status_v2 === 'survey_sent') {
              results.results.push({
                application_id: application.id,
                success: false,
                error: 'Already shortlisted'
              })
              results.failed++
              return
            }

            const event = application.events as any

            // Determine template: provided in request > event's default
            const surveyTemplateId = body.survey_template_id || event?.detailed_template_id

            // Generate survey access token and deadline
            const accessToken = randomUUID()
            const deadline = new Date()
            deadline.setDate(deadline.getDate() + deadlineDays)
            const surveyLink = getSurveyLink(accessToken)

            // ═══════════════════════════════════════════════════════════
            // Create NEW form_response for survey
            // ═══════════════════════════════════════════════════════════

            const { data: surveyResponse, error: surveyError } = await supabase
              .from('form_responses')
              .insert({
                template_id: surveyTemplateId,
                event_id: application.event_id,
                user_id: application.user_id,
                respondent_email: application.respondent_email,
                respondent_name: application.respondent_name,
                response_type: 'detailed_survey',
                responses: {},
                is_complete: false,
                completion_percentage: 0,
                access_token: accessToken,
                deadline_at: deadline.toISOString(),
                survey_deadline_days: deadlineDays,
                status: 'not_started',
                status_v2: 'survey_sent',
                created_at: now
              })
              .select('id')
              .single()

            if (surveyError) {
              throw new Error(`Failed to create survey: ${surveyError.message}`)
            }

            // ═══════════════════════════════════════════════════════════
            // Update original application status to shortlisted
            // ═══════════════════════════════════════════════════════════

            const { error: updateError } = await supabase
              .from('form_responses')
              .update({
                status_v2: 'shortlisted',
                shortlisted_by: user.id,
                shortlisted_at: now
              })
              .eq('id', application.id)

            if (updateError) {
              console.error(`Failed to update application ${application.id}:`, updateError)
              // Don't fail - survey was created
            }

            // ═══════════════════════════════════════════════════════════
            // Send shortlist email with survey link
            // ═══════════════════════════════════════════════════════════

            try {
              const emailSent = await sendShortlistEmail({
                to: application.respondent_email,
                applicantName: application.respondent_name || 'Applicant',
                eventTitle: event?.title || 'Event',
                surveyLink: surveyLink,
                deadline: deadline.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                deadlineTime: deadline.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              })

              if (emailSent) {
                // Update application to survey_sent
                await supabase
                  .from('form_responses')
                  .update({
                    status_v2: 'survey_sent'
                  })
                  .eq('id', application.id)
              }

              results.results.push({
                application_id: application.id,
                survey_response_id: surveyResponse.id,
                success: true
              })
              results.success++

            } catch (emailError) {
              console.error(`Failed to send email to ${application.respondent_email}:`, emailError)
              // Still count as success - survey was created, just email failed
              results.results.push({
                application_id: application.id,
                survey_response_id: surveyResponse.id,
                success: true,
                error: 'Shortlisted but email failed'
              })
              results.success++
            }

          } catch (error) {
            console.error(`Failed to shortlist application ${application.id}:`, error)
            results.results.push({
              application_id: application.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            results.failed++
          }
        })
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Return results
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: `Shortlisted ${results.success} of ${results.total} applications`,
      data: results
    })
  } catch (error) {
    console.error('Bulk shortlist error:', error)
    return handleError(error)
  }
}
