export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SHORTLIST API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Shortlist an application and send survey link

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import { randomUUID } from 'crypto'
import { sendShortlistEmail } from '@/lib/email/send-shortlist-email'
import { getSurveyLink } from '@/lib/config'

interface ShortlistRequest {
  survey_template_id?: string  // Optional - use if event doesn't have detailed_template_id
  deadline_days?: number       // Optional - default 7 days
}

/**
 * POST /api/admin/applications/[id]/shortlist
 * Shortlist an application and send survey link
 *
 * Request Body (optional):
 * {
 *   survey_template_id: "uuid",  // Required if event has no detailed_template_id
 *   deadline_days: 7             // Default 7
 * }
 *
 * Actions:
 * 1. Check if event has detailed_template_id (survey template)
 * 2. If not, require survey_template_id in request or return available templates
 * 3. Update status to 'shortlisted'
 * 4. Create NEW form_response for survey with the survey template
 * 5. Send shortlist email with survey link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user, role } = authCheck.data

    // Parse request body (optional)
    let body: ShortlistRequest = {}
    try {
      body = await request.json()
    } catch {
      // No body provided, use defaults
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Get application details with event's survey template
    // ═══════════════════════════════════════════════════════════════════

    const { data: application, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        user_id,
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
      .eq('id', params.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // PERMISSION CHECK: For reviewers, verify event assignment and permissions
    // ═══════════════════════════════════════════════════════════════════

    if (role === 'reviewer') {
      const adminSupabase = createAdminClient()

      const { data: assignment, error: assignmentError } = await adminSupabase
        .from('reviewers')
        .select('event_id, permissions')
        .eq('user_id', user.id)
        .eq('event_id', application.event_id)
        .maybeSingle()

      if (assignmentError) {
        console.error('Failed to check reviewer assignment:', assignmentError)
        return NextResponse.json(
          { success: false, error: 'Failed to verify reviewer permissions' },
          { status: 500 }
        )
      }

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to shortlist applications for this event' },
          { status: 403 }
        )
      }

      const permissions = assignment.permissions as any
      const canShortlist = permissions?.canShortlist ?? false

      if (!canShortlist) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to shortlist applications' },
          { status: 403 }
        )
      }
    }

    // Check if already shortlisted
    if (application.status_v2 === 'shortlisted' || application.status_v2 === 'survey_sent') {
      return NextResponse.json(
        { success: false, error: 'Application already shortlisted' },
        { status: 400 }
      )
    }

    const event = application.events as any

    // ═══════════════════════════════════════════════════════════════════
    // 2. Determine survey template to use
    // ═══════════════════════════════════════════════════════════════════

    // Priority: 1) Request body, 2) Event's detailed_template_id
    let surveyTemplateId = body.survey_template_id || event?.detailed_template_id

    if (!surveyTemplateId) {
      // Issue #29b FIX: Fetch ALL available templates (not just survey-typed)
      // so admin can select from any template including custom ones
      const { data: availableTemplates } = await supabase
        .from('form_templates')
        .select('id, name, description, usage_type')
        .order('usage_type')
        .order('name')

      return NextResponse.json(
        {
          success: false,
          error: 'No survey template attached to this event',
          code: 'SURVEY_TEMPLATE_REQUIRED',
          message: 'Please select a survey template to send to shortlisted applicants.',
          available_templates: availableTemplates || [],
          event_id: application.event_id,
          event_title: event?.title
        },
        { status: 400 }
      )
    }

    // Verify template exists
    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('id, name')
      .eq('id', surveyTemplateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: 'Selected survey template not found' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Generate survey access token and calculate deadline
    // ═══════════════════════════════════════════════════════════════════

    const accessToken = randomUUID()
    const surveyDeadlineDays = body.deadline_days || 7
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + surveyDeadlineDays)
    const now = new Date().toISOString()

    // Survey link (using centralized config)
    const surveyLink = getSurveyLink(accessToken)

    // ═══════════════════════════════════════════════════════════════════
    // 4. Create NEW form_response record for the survey
    // ═══════════════════════════════════════════════════════════════════

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
        survey_deadline_days: surveyDeadlineDays,
        status: 'not_started',
        status_v2: 'survey_sent',
        created_at: now
      })
      .select('id')
      .single()

    if (surveyError) {
      console.error('Failed to create survey response:', surveyError)
      return NextResponse.json(
        { success: false, error: 'Failed to create survey record' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Update original application status to shortlisted
    // ═══════════════════════════════════════════════════════════════════

    const { error: updateError } = await supabase
      .from('form_responses')
      .update({
        status_v2: 'shortlisted',
        shortlisted_by: user.id,
        shortlisted_at: now
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Failed to update application:', updateError)
      // Don't fail - survey was created, just log the error
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Send shortlist email
    // ═══════════════════════════════════════════════════════════════════

    let emailSent = false
    try {
      const applicantName = application.respondent_name || 'Applicant'
      const applicantEmail = application.respondent_email
      const eventTitle = event?.title || 'Event'

      // Format deadline for email
      const deadlineDate = deadline.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const deadlineTime = deadline.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })

      // Send shortlist email with survey link
      emailSent = await sendShortlistEmail({
        to: applicantEmail,
        applicantName,
        eventTitle,
        surveyLink,
        deadline: deadlineDate,
        deadlineTime,
      })

      // Update application status to survey_sent if email sent successfully
      if (emailSent) {
        await supabase
          .from('form_responses')
          .update({
            status_v2: 'survey_sent'
          })
          .eq('id', params.id)
      } else {
        console.error('Failed to send shortlist email to:', applicantEmail)
      }

    } catch (emailError) {
      console.error('Failed to send shortlist email:', emailError)
      // Don't fail the entire operation if email fails
      // Status remains 'shortlisted' instead of 'survey_sent'
      emailSent = false
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. Return success
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: `Application shortlisted successfully.${emailSent ? ' Survey email sent.' : ' Email not sent.'}`,
      data: {
        application_id: params.id,
        survey_response_id: surveyResponse.id,
        status: emailSent ? 'survey_sent' : 'shortlisted',
        survey_link: surveyLink,
        deadline: deadline.toISOString(),
        template_name: template.name,
        emailSent
      }
    })
  } catch (error) {
    console.error('Shortlist error:', error)
    return handleError(error)
  }
}
