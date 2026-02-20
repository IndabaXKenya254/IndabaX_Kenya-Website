export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SEND SURVEY REMINDER API
// ═══════════════════════════════════════════════════════════════════════
// Send survey reminder to shortlisted applicants using template

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import { randomUUID } from 'crypto'
import { sendEmailWithResult, replaceVariables } from '@/lib/email'
import { createPremiumEmail } from '@/lib/email-template-premium'
import { getSiteUrl, getWebsiteLinks, EMAIL_CONFIG } from '@/lib/config'

// Template ID for survey reminder
const SURVEY_REMINDER_TEMPLATE_ID = 'f1a2b3c4-d5e6-7890-abcd-111111111111'

/**
 * POST /api/admin/applications/[id]/send-reminder
 * Send survey reminder to a shortlisted applicant
 *
 * The [id] is the ORIGINAL application ID, not the survey response ID.
 * This API finds the associated survey response (created during shortlisting)
 * and uses its access_token for the survey link.
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

    // ═══════════════════════════════════════════════════════════════════
    // 1. Get application details (including access_token for old-style shortlisting)
    // ═══════════════════════════════════════════════════════════════════

    const { data: application, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        status_v2,
        access_token,
        deadline_at,
        events (
          id,
          title,
          slug,
          start_date
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
          { success: false, error: 'You do not have permission to send reminders for this event' },
          { status: 403 }
        )
      }

      const permissions = assignment.permissions as any
      const canSendReminders = permissions?.canSendReminders ?? false

      if (!canSendReminders) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to send survey reminders' },
          { status: 403 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Validate status - only allow for shortlisted/survey_sent
    // ═══════════════════════════════════════════════════════════════════

    const validStatuses = ['shortlisted', 'survey_sent']
    if (!validStatuses.includes(application.status_v2 || '')) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot send survey reminder. Application status is "${application.status_v2}". Only shortlisted or survey_sent applications can receive reminders.`
        },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Find the access_token for the survey
    // ═══════════════════════════════════════════════════════════════════

    // Priority for access_token:
    // 1. Application's own access_token (old-style shortlisting)
    // 2. Survey response record (new-style shortlisting)
    // 3. Generate new token if neither exists

    let accessToken = application.access_token
    let deadline = application.deadline_at

    // If application doesn't have token, check for new-style survey response
    if (!accessToken) {
      const { data: surveyResponse } = await supabase
        .from('form_responses')
        .select('id, access_token, deadline_at')
        .eq('respondent_email', application.respondent_email)
        .eq('event_id', application.event_id)
        .eq('response_type', 'detailed_survey')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (surveyResponse?.access_token) {
        accessToken = surveyResponse.access_token
        deadline = surveyResponse.deadline_at
      }
    }

    // If still no token, generate one
    if (!accessToken) {
      accessToken = randomUUID()
      const newDeadline = new Date()
      newDeadline.setDate(newDeadline.getDate() + 7)
      deadline = newDeadline.toISOString()

      const { error: updateError } = await supabase
        .from('form_responses')
        .update({
          access_token: accessToken,
          deadline_at: deadline,
          survey_deadline_days: 7
        })
        .eq('id', params.id)

      if (updateError) {
        console.error('Failed to generate access token:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to generate survey access token' },
          { status: 500 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Get email template
    // ═══════════════════════════════════════════════════════════════════

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id, name, subject, body, variables')
      .eq('id', SURVEY_REMINDER_TEMPLATE_ID)
      .single()

    if (templateError || !template) {
      console.error('Survey reminder template not found:', templateError)
      return NextResponse.json(
        { success: false, error: 'Email template not found. Please create a survey reminder template.' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Prepare variables and send email
    // ═══════════════════════════════════════════════════════════════════

    const baseUrl = getSiteUrl()
    const websiteLinks = getWebsiteLinks()
    const event = application.events as any

    // Format deadline
    let deadlineFormatted = 'as soon as possible'
    if (deadline) {
      deadlineFormatted = new Date(deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const variables = {
      name: application.respondent_name || 'Applicant',
      email: application.respondent_email,
      event_title: event?.title || 'IndabaX Kenya Event',
      survey_link: `${baseUrl}/survey/${accessToken}`,
      deadline: deadlineFormatted
    }

    const finalSubject = replaceVariables(template.subject, variables)
    const finalBody = replaceVariables(template.body, variables)

    // Wrap with premium email template
    const professionalEmailBody = createPremiumEmail(finalBody, {
      theme: 'modern',
      title: finalSubject,
      preheader: 'Complete your survey to secure your spot',
      brandName: 'IndabaX Kenya',
      accentColor: '#3b82f6',
      footerLinks: [
        { label: 'Website', url: websiteLinks.home },
        { label: 'Contact', url: websiteLinks.contact }
      ]
    })

    // Send email
    const emailResult = await sendEmailWithResult({
      to: application.respondent_email,
      subject: finalSubject,
      html: professionalEmailBody,
      accountType: 'applications'
    })

    // ═══════════════════════════════════════════════════════════════════
    // 6. Log email
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date().toISOString()

    await supabase
      .from('email_logs')
      .insert({
        template_id: template.id,
        from_email: EMAIL_CONFIG.applications.email,
        recipient_email: application.respondent_email,
        recipient_name: application.respondent_name,
        subject: finalSubject,
        body: finalBody,
        variables_used: variables,
        status: emailResult.success ? 'sent' : 'failed',
        sent_by: user.id,
        event_id: application.event_id,
        sent_at: emailResult.success ? now : null,
        error_message: emailResult.error || null,
        created_at: now
      })

    // ═══════════════════════════════════════════════════════════════════
    // 7. Return result
    // ═══════════════════════════════════════════════════════════════════

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to send reminder: ${emailResult.error}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Survey reminder sent successfully',
      data: {
        recipient: application.respondent_email,
        survey_link: `${baseUrl}/survey/${accessToken}`,
        deadline: deadlineFormatted
      }
    })
  } catch (error) {
    console.error('Send reminder error:', error)
    return handleError(error)
  }
}
