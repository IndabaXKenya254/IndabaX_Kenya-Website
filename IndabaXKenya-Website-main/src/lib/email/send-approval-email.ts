// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPROVAL EMAIL SENDER (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Send approval notification emails to accepted applicants
// Phase 5: Admin Review System
// Updated: January 2026 - Database template support

import { sendEmail, EmailAttachment } from './sender'
import { renderTemplate, TEMPLATE_NAMES } from './template-service'
import { approvalEmailTemplate, approvalEmailTextTemplate, getApprovalSubject } from './templates'
import { getSiteUrl } from '@/lib/config'

export interface ApprovalEmailData {
  to: string
  applicantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  ticketLink?: string // Optional ticket download link
  ticketAttachment?: EmailAttachment // Optional PDF attachment
}

/**
 * Send approval notification email
 * Uses database template with fallback to hardcoded
 *
 * @param data - Email data including recipient and event details
 * @returns Promise<boolean> - True if email sent successfully
 *
 * Used by:
 * - /api/admin/applications/[id]/decision (approve decision)
 * - /api/admin/applications/bulk/accept (bulk approval)
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
  const { to, applicantName, eventTitle, eventDate, eventLocation, eventUrl, ticketLink, ticketAttachment } = data
  const dashboardUrl = `${getSiteUrl()}/dashboard`

  // Try database template first
  const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_APPROVED, {
    name: applicantName,
    applicant_name: applicantName,
    email: to,
    event_title: eventTitle,
    event_date: eventDate,
    event_location: eventLocation,
    event_url: eventUrl,
    dashboard_url: dashboardUrl,
    ticket_link: ticketLink || dashboardUrl, // Use ticket link if available, fallback to dashboard
  })

  if (rendered) {
    return sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'applications',
      attachments: ticketAttachment ? [ticketAttachment] : [],
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Application Approved')
  const html = approvalEmailTemplate({
    applicantName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
  })

  const text = approvalEmailTextTemplate({
    applicantName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
  })

  const subject = getApprovalSubject(eventTitle)

  return sendEmail({
    to,
    subject,
    html,
    text,
    accountType: 'applications',
    attachments: ticketAttachment ? [ticketAttachment] : [],
  })
}
