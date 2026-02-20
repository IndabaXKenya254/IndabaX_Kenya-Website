export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SEND CUSTOM EMAIL API (PHASE 5B)
// ═══════════════════════════════════════════════════════════════════════
// Send custom email to individual applicant

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import { sendEmailWithResult, replaceVariables } from '@/lib/email'
import { EMAIL_CONFIG, getSiteUrl } from '@/lib/config'

interface SendCustomEmailRequest {
  template_id?: string
  subject: string
  body: string
  cc_emails?: string[]
  bcc_emails?: string[]
}

/**
 * POST /api/admin/applications/[id]/send-email
 * Send custom email to an individual applicant
 *
 * Body:
 * {
 *   template_id?: "uuid",      // Optional: Use template as base
 *   subject: "string",          // Email subject (required)
 *   body: "html string",        // Email body HTML (required)
 *   cc_emails?: ["email@..."],  // Optional CC recipients
 *   bcc_emails?: ["email@..."]  // Optional BCC recipients
 * }
 *
 * Process:
 * - Fetches application details
 * - Replaces variables in subject and body
 * - Sends email via SMTP
 * - Logs email to database
 * - Returns detailed result
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
    const { id } = params

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: SendCustomEmailRequest = await request.json()

    if (!body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Fetch application details
    // ═══════════════════════════════════════════════════════════════════

    const { data: application, error: fetchError} = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        status_v2,
        access_token,
        events (
          id,
          title,
          slug,
          start_date,
          end_date,
          location,
          registration_deadline
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      console.error('Application fetch error:', fetchError)
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
          { success: false, error: 'You do not have permission to send emails for this event' },
          { status: 403 }
        )
      }

      const permissions = assignment.permissions as any
      const canSendEmails = permissions?.canSendEmails ?? false

      if (!canSendEmails) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to send custom emails' },
          { status: 403 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Fetch related data (ticket, survey form)
    // ═══════════════════════════════════════════════════════════════════

    // Check if user has a ticket for this application
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, ticket_number')
      .eq('registration_id', id)
      .single()

    // ═══════════════════════════════════════════════════════════════════
    // 4. Prepare email with variable replacement
    // ═══════════════════════════════════════════════════════════════════

    const event = application.events as any
    const baseUrl = getSiteUrl()

    // Generate survey link using access_token (set during shortlisting)
    // Format: /survey/{access_token} - the access_token is the unique identifier
    let surveyLink = ''
    if (application.access_token) {
      surveyLink = `${baseUrl}/survey/${application.access_token}`
    }

    // Generate ticket link if ticket exists
    let ticketLink = ''
    if (ticket) {
      ticketLink = `${baseUrl}/dashboard/tickets/${ticket.id}`
    }

    // Calculate deadline
    let deadline = ''
    if (event?.registration_deadline) {
      deadline = new Date(event.registration_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else if (event?.start_date) {
      deadline = new Date(event.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const variables = {
      name: application.respondent_name || 'Applicant',
      email: application.respondent_email || '',
      event_title: event?.title || 'IndabaX Kenya Event',
      event_date: event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      event_location: event?.location || '',
      status: application.status_v2,
      survey_link: surveyLink,
      ticket_link: ticketLink,
      ticket_number: ticket?.ticket_number || '',
      deadline: deadline,
      dashboard_link: `${baseUrl}/dashboard`,
      application_id: id
    }

    const finalSubject = replaceVariables(body.subject, variables)
    const finalBody = replaceVariables(body.body, variables)

    // ═══════════════════════════════════════════════════════════════════
    // 5. Send email via SMTP
    // ═══════════════════════════════════════════════════════════════════

    const emailResult = await sendEmailWithResult({
      to: application.respondent_email,
      subject: finalSubject,
      html: finalBody,
      cc: body.cc_emails,
      bcc: body.bcc_emails,
      accountType: 'applications'
    })

    // ═══════════════════════════════════════════════════════════════════
    // 6. Log email to database
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date().toISOString()

    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        template_id: body.template_id || null,
        from_email: EMAIL_CONFIG.applications.email,
        recipient_email: application.respondent_email,
        recipient_name: application.respondent_name,
        cc_emails: body.cc_emails || [],
        bcc_emails: body.bcc_emails || [],
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
      .select('id')
      .single()

    if (logError) {
      console.error('Failed to log email:', logError)
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. Return result
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success
        ? 'Email sent successfully'
        : `Failed to send email: ${emailResult.error}`,
      data: {
        email_log_id: emailLog?.id,
        recipient: application.respondent_email,
        message_id: emailResult.success ? 'sent' : undefined,
        error: emailResult.error
      }
    })
  } catch (error) {
    console.error('Send custom email error:', error)
    return handleError(error)
  }
}
