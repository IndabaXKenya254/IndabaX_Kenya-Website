export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BULK ACCEPT API (PHASE 5B)
// ═══════════════════════════════════════════════════════════════════════
// Accept multiple applications at once with email template support

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { sendEmailWithResult, replaceVariables } from '@/lib/email'
import { createTicket } from '@/lib/tickets'
import { EMAIL_CONFIG, getSiteUrl } from '@/lib/config'

interface BulkAcceptRequest {
  application_ids: string[]
  email_template_id?: string  // Optional: Use specific email template
  send_email?: boolean        // Default: true
}

interface BulkResult {
  total: number
  success: number
  failed: number
  emails_sent: number
  emails_failed: number
  tickets_generated: number
  tickets_failed: number
  results: Array<{
    application_id: string
    success: boolean
    email_sent?: boolean
    ticket_generated?: boolean
    ticket_number?: string
    error?: string
  }>
}

interface ApplicationWithEvent {
  id: string
  event_id: string
  template_id: string
  user_id: string | null
  respondent_name: string
  respondent_email: string
  status_v2: string
  events: {
    id: string
    title: string
    slug: string
    start_date: string
    location: string
  } | null
}

/**
 * POST /api/admin/applications/bulk/accept
 * Accept multiple applications at once with optional email notification
 *
 * Body:
 * {
 *   application_ids: ["uuid1", "uuid2", "uuid3"],
 *   email_template_id?: "uuid",  // Optional: Custom email template
 *   send_email?: boolean          // Default: true
 * }
 *
 * Process:
 * - Validates all application IDs
 * - Fetches email template if provided
 * - Processes in batches of 10
 * - Updates status to 'approved' for each
 * - Sends acceptance emails with template
 * - Logs all emails sent
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

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient()

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: BulkAcceptRequest = await request.json()

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
        { success: false, error: 'Maximum 100 applications can be accepted at once' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Fetch email template if provided
    // ═══════════════════════════════════════════════════════════════════

    const sendEmail = body.send_email !== false // Default to true
    let emailTemplate: any = null

    if (sendEmail && body.email_template_id) {
      const { data: template, error: templateError } = await adminClient
        .from('email_templates')
        .select('*')
        .eq('id', body.email_template_id)
        .single()

      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: 'Email template not found' },
          { status: 404 }
        )
      }

      emailTemplate = template
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Fetch all applications
    // ═══════════════════════════════════════════════════════════════════

    const { data: applications, error: fetchError } = await adminClient
      .from('form_responses')
      .select(`
        id,
        event_id,
        template_id,
        user_id,
        respondent_name,
        respondent_email,
        status_v2,
        events (
          id,
          title,
          slug,
          start_date,
          location,
          registration_deadline
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
    // 4. Process each application
    // ═══════════════════════════════════════════════════════════════════

    const results: BulkResult = {
      total: applications.length,
      success: 0,
      failed: 0,
      emails_sent: 0,
      emails_failed: 0,
      tickets_generated: 0,
      tickets_failed: 0,
      results: []
    }

    const now = new Date().toISOString()

    // Process in batches of 10 to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)

      // Process batch in parallel
      await Promise.all(
        batch.map(async (application: ApplicationWithEvent) => {
          try {
            // Skip if already approved
            if (application.status_v2 === 'approved') {
              results.results.push({
                application_id: application.id,
                success: false,
                error: 'Already approved'
              })
              results.failed++
              return
            }

            // Update status using admin client (bypasses RLS)
            const { error: updateError } = await adminClient
              .from('form_responses')
              .update({
                status_v2: 'approved',
                approved_by: user.id,
                approved_at: now
              })
              .eq('id', application.id)

            if (updateError) {
              console.error(`Failed to update application ${application.id}:`, updateError)
              throw new Error(`Failed to update status: ${updateError.message || JSON.stringify(updateError)}`)
            }

            // Generate ticket FIRST so we can include ticket_link in email
            let ticketGenerated = false
            let ticketNumber: string | undefined
            let ticketId: string | undefined

            const event = application.events
            const ticketResult = await createTicket({
              eventId: application.event_id,
              userId: application.user_id || null,
              registrationId: application.id,
              attendeeName: application.respondent_name || 'Guest',
              attendeeEmail: application.respondent_email || '',
              eventTitle: event?.title || 'Event',
              eventDate: event?.start_date || null,
              eventLocation: event?.location || null,
            })

            if (ticketResult.success && ticketResult.ticket) {
              ticketGenerated = true
              ticketNumber = ticketResult.ticket.ticket_number
              ticketId = ticketResult.ticket.id
              results.tickets_generated++
            } else {
              results.tickets_failed++
              console.error(`Failed to generate ticket for ${application.id}:`, ticketResult.error)
            }

            // Send acceptance email if requested (AFTER ticket generation)
            // NON-BLOCKING: Fire-and-forget for better concurrency
            if (sendEmail) {
              const baseUrl = getSiteUrl()

              // Calculate deadline
              const deadline = (event as any)?.registration_deadline
                ? new Date((event as any).registration_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : (event?.start_date
                  ? new Date(event.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '')

              // Get survey form template for this event if exists
              const { data: surveyForm } = await adminClient
                .from('form_templates')
                .select('id')
                .eq('locked_to_event_id', application.event_id)
                .eq('usage_type', 'survey')
                .single()

              const surveyLink = surveyForm?.id
                ? `${baseUrl}/survey/${surveyForm.id}?app=${application.id}`
                : ''

              const ticketLink = ticketId
                ? `${baseUrl}/dashboard/tickets/${ticketId}`
                : ''

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
                survey_link: surveyLink,
                ticket_link: ticketLink,
                deadline: deadline,
                dashboard_link: `${baseUrl}/dashboard`,
                application_id: application.id,
                ticket_number: ticketNumber || ''
              }

              // Use custom template or default acceptance message
              const subject = emailTemplate
                ? replaceVariables(emailTemplate.subject, variables)
                : `Congratulations! Application Accepted - ${variables.event_title}`

              const emailBody = emailTemplate
                ? replaceVariables(emailTemplate.body, variables)
                : `<p>Dear ${variables.name},</p>
                   <p>Congratulations! Your application for ${variables.event_title} has been accepted.</p>
                   ${ticketLink ? `<p>You can view your ticket here: <a href="${ticketLink}">${ticketLink}</a></p>` : ''}
                   <p>We look forward to seeing you at the event!</p>
                   <p>Best regards,<br>IndabaX Kenya Team</p>`

              // Fire-and-forget: Don't await email sending
              // This prevents blocking the response while emails are sent
              sendEmailWithResult({
                to: application.respondent_email,
                subject: subject,
                html: emailBody,
                accountType: 'applications'
              }).then((emailResult) => {
                // Log email result asynchronously
                adminClient
                  .from('email_logs')
                  .insert({
                    template_id: emailTemplate?.id || null,
                    from_email: EMAIL_CONFIG.applications.email,
                    recipient_email: application.respondent_email,
                    recipient_name: application.respondent_name,
                    subject: subject,
                    body: emailBody,
                    variables_used: variables,
                    status: emailResult.success ? 'sent' : 'failed',
                    sent_by: user.id,
                    event_id: application.event_id,
                    sent_at: emailResult.success ? now : null,
                    error_message: emailResult.error || null
                  })
                  .then(() => console.log(`✅ Email logged for ${application.respondent_email}`))
                  .catch((err: Error) => console.error(`❌ Failed to log email for ${application.respondent_email}:`, err))
              }).catch((err: Error) => {
                console.error(`❌ Failed to send email to ${application.respondent_email}:`, err)
              })

              // Count as queued (emails sent asynchronously)
              results.emails_sent++
            }

            results.results.push({
              application_id: application.id,
              success: true,
              email_sent: sendEmail ? true : undefined, // Queued for sending
              ticket_generated: ticketGenerated,
              ticket_number: ticketNumber
            })
            results.success++
          } catch (error) {
            console.error(`Failed to accept application ${application.id}:`, error)
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

    const emailMsg = sendEmail
      ? `Emails: ${results.emails_sent} queued for delivery.`
      : 'No emails sent.'

    const ticketMsg = `Tickets: ${results.tickets_generated} generated, ${results.tickets_failed} failed.`

    const message = `Accepted ${results.success} of ${results.total} applications. ${emailMsg} ${ticketMsg}`

    return NextResponse.json({
      success: true,
      message,
      data: results
    })
  } catch (error) {
    console.error('Bulk accept error:', error)
    return handleError(error)
  }
}
