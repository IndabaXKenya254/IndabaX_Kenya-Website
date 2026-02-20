export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SEND EMAIL API (PHASE 7 - DAY 4)
// ═══════════════════════════════════════════════════════════════════════
// Send emails using templates with variable replacement via SMTP

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { sendEmailWithResult, replaceVariables } from '@/lib/email'
import { createPremiumEmail } from '@/lib/email-template-premium'
import { getSiteUrl, getWebsiteLinks, EMAIL_CONFIG } from '@/lib/config'
import { randomUUID } from 'crypto'

interface Recipient {
  email: string
  name: string
  variables?: Record<string, string>
}

interface SendEmailRequest {
  recipientType: 'individual' | 'event' | 'csv' | 'manual'
  recipients: Recipient[]
  eventId?: string | null
  applicationStatuses?: string[]
  templateId?: string | null
  formTemplateId?: string | null
  subject: string
  body: string
  ccEmails?: string[]
  bccEmails?: string[]
}

/**
 * POST /api/admin/emails/send
 * Send email to recipients
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: SendEmailRequest = await request.json()
    const { recipientType, recipients, eventId, applicationStatuses, templateId, formTemplateId, subject, body: emailBody, ccEmails, bccEmails } = body

    // Validation
    if (!subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    // Get event data if eventId is provided (for all recipient types)
    let eventData: { title: string; start_date: string | null; location: string | null; registration_deadline: string | null } | null = null
    if (eventId) {
      const { data: event } = await supabase
        .from('events')
        .select('title, start_date, location, registration_deadline')
        .eq('id', eventId)
        .single()
      eventData = event
    }

    // Get survey form template ID (validate it exists)
    let surveyFormId: string | null = null
    if (formTemplateId) {
      const { data: surveyForm } = await supabase
        .from('form_templates')
        .select('id')
        .eq('id', formTemplateId)
        .single()
      surveyFormId = surveyForm?.id || null
    }

    // Base URL for links (using centralized config)
    const baseUrl = getSiteUrl()
    const websiteLinks = getWebsiteLinks()

    // Get recipients based on type
    let finalRecipients: Recipient[] = []

    if (recipientType === 'event' && eventId) {
      // Get all form responses (applications) for the event
      let query = supabase
        .from('form_responses')
        .select(`
          id,
          respondent_email,
          respondent_name,
          access_token,
          status_v2,
          events!form_responses_event_id_fkey (
            id,
            title,
            start_date,
            location
          )
        `)
        .eq('event_id', eventId)
        .not('respondent_email', 'is', null)

      // Apply status filter if provided
      if (applicationStatuses && applicationStatuses.length > 0) {
        query = query.in('status_v2', applicationStatuses)
      }

      const { data: formResponses, error: regError } = await query

      if (regError) {
        console.error('Failed to fetch event applications:', regError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch recipients' },
          { status: 500 }
        )
      }

      // Get tickets for all these applications
      const applicationIds = (formResponses || []).map((r: any) => r.id)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, registration_id, ticket_number')
        .in('registration_id', applicationIds)

      const ticketsByAppId = new Map((tickets || []).map((t: any) => [t.registration_id, { id: t.id, ticket_number: t.ticket_number }]))

      // Calculate deadline
      const deadline = eventData?.registration_deadline
        ? new Date(eventData.registration_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : (eventData?.start_date
          ? new Date(eventData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '')

      finalRecipients = (formResponses || []).map((response: any) => {
        // Generate survey link using access_token (set during shortlisting)
        // Format: /survey/{access_token} - the access_token is the unique identifier
        const surveyLink = response.access_token
          ? `${baseUrl}/survey/${response.access_token}`
          : ''

        // Generate ticket link if ticket exists
        const ticketData = ticketsByAppId.get(response.id)
        const ticketLink = ticketData?.id ? `${baseUrl}/dashboard/tickets/${ticketData.id}` : ''
        const ticketNumber = ticketData?.ticket_number || ''

        return {
          email: response.respondent_email,
          name: response.respondent_name || response.respondent_email.split('@')[0],
          variables: {
            name: response.respondent_name || response.respondent_email.split('@')[0],
            email: response.respondent_email,
            event_title: response.events?.title || '',
            event_date: response.events?.start_date ? new Date(response.events.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            event_location: response.events?.location || '',
            survey_link: surveyLink,
            ticket_link: ticketLink,
            ticket_number: ticketNumber,
            deadline: deadline,
            dashboard_link: `${baseUrl}/dashboard`,
            dashboard_url: `${baseUrl}/dashboard`, // Alias for template compatibility
            application_id: response.id,
            response_id: response.id, // Alias for template compatibility
            notes: '' // Empty by default, can be overridden by sender
          }
        }
      })
    } else {
      // For individual/manual/csv recipients, populate variables
      // Calculate deadline
      const deadline = eventData?.registration_deadline
        ? new Date(eventData.registration_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : (eventData?.start_date
          ? new Date(eventData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '')

      finalRecipients = recipients.map(recipient => {
        // Generate survey link using form template ID if available
        const surveyLink = surveyFormId
          ? `${baseUrl}/survey/${surveyFormId}?email=${encodeURIComponent(recipient.email)}`
          : ''

        return {
          ...recipient,
          variables: {
            name: recipient.name || recipient.email.split('@')[0],
            email: recipient.email,
            event_title: eventData?.title || '',
            event_date: eventData?.start_date ? new Date(eventData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            event_location: eventData?.location || '',
            survey_link: surveyLink,
            ticket_link: '', // No ticket link for non-event recipients
            deadline: deadline,
            dashboard_link: `${baseUrl}/dashboard`,
            dashboard_url: `${baseUrl}/dashboard`, // Alias for template compatibility
            response_id: '', // Alias for template compatibility
            notes: '', // Empty by default, can be overridden by recipient.variables
            ...recipient.variables
          }
        }
      })
    }

    if (finalRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients found' },
        { status: 400 }
      )
    }

    // Send emails via SMTP and log results
    const now = new Date().toISOString()
    const results = {
      sent: 0,
      failed: 0,
      recipients: [] as string[],
      errors: [] as { email: string; error: string }[]
    }

    for (const recipient of finalRecipients) {
      const recipientVariables = recipient.variables || {
        name: recipient.name,
        email: recipient.email
      }

      const finalSubject = replaceVariables(subject, recipientVariables)
      const finalBody = replaceVariables(emailBody, recipientVariables)

      // Check if the email body already contains full HTML structure
      // If so, use it directly without wrapping (prevents nested HTML issues)
      const hasFullHtml = finalBody.trim().toLowerCase().startsWith('<!doctype') ||
                          finalBody.trim().toLowerCase().includes('<html')

      let professionalEmailBody: string
      if (hasFullHtml) {
        // Template already has full HTML styling, use as-is
        professionalEmailBody = finalBody
      } else {
        // Wrap plain content with PREMIUM professional styling
        professionalEmailBody = createPremiumEmail(finalBody, {
          theme: 'modern', // Options: 'modern', 'gradient', 'minimal'
          title: finalSubject,
          preheader: finalSubject.substring(0, 100),
          brandName: 'IndabaX Kenya',
          accentColor: '#3b82f6',
          headerTitle: '', // Can add a header title if needed
          footerLinks: [
            { label: 'Website', url: websiteLinks.home },
            { label: 'Contact', url: websiteLinks.contact }
          ]
        })
      }

      // Send actual email via SMTP
      const emailResult = await sendEmailWithResult({
        to: recipient.email,
        subject: finalSubject,
        html: professionalEmailBody,
        accountType: 'applications',
        cc: ccEmails,
        bcc: bccEmails
      })

      // Determine status based on result
      const status = emailResult.success ? 'sent' : 'failed'

      // Insert email log with actual status
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          template_id: templateId || null,
          from_email: EMAIL_CONFIG.applications.email,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          cc_emails: ccEmails || [],
          bcc_emails: bccEmails || [],
          subject: finalSubject,
          body: finalBody,
          variables_used: recipientVariables,
          status: status,
          sent_by: user.id,
          event_id: eventId || null,
          sent_at: emailResult.success ? now : null,
          created_at: now,
          error_message: emailResult.error || null
        })

      if (logError) {
        console.error('Failed to insert email log:', logError)
      }

      // Track results
      if (emailResult.success) {
        results.sent++
        results.recipients.push(recipient.email)
      } else {
        results.failed++
        results.errors.push({
          email: recipient.email,
          error: emailResult.error || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      message: results.failed === 0
        ? `Successfully sent ${results.sent} email(s)`
        : `Sent ${results.sent} email(s), failed ${results.failed}`,
      data: {
        sent: results.sent,
        failed: results.failed,
        recipients: results.recipients,
        errors: results.errors.length > 0 ? results.errors : undefined
      }
    })
  } catch (error) {
    console.error('Send email error:', error)
    return handleError(error)
  }
}
