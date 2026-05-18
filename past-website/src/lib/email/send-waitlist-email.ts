// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - WAITLIST EMAIL SENDER
// ═══════════════════════════════════════════════════════════════════════
// Send waitlist notification emails to applicants
// Phase 5: Admin Review System
// Updated: January 2026 - Database template support

import { sendEmail } from './sender'
import { renderTemplate, TEMPLATE_NAMES } from './template-service'
import { waitlistEmailTemplate, waitlistEmailTextTemplate, getWaitlistSubject } from './templates'

export interface WaitlistEmailData {
  to: string
  applicantName: string
  eventTitle: string
  notes?: string
}

/**
 * Send waitlist notification email
 * Uses database template with fallback to hardcoded
 *
 * @param data - Email data including recipient and event details
 * @returns Promise<boolean> - True if email sent successfully
 *
 * Used by:
 * - /api/admin/applications/[id]/decision (waitlist decision)
 * - /api/admin/applications/bulk/waitlist (bulk waitlisting)
 */
export async function sendWaitlistEmail(data: WaitlistEmailData): Promise<boolean> {
  const { to, applicantName, eventTitle, notes } = data

  // Try database template first
  const rendered = await renderTemplate(TEMPLATE_NAMES.WAITLIST, {
    name: applicantName,
    applicant_name: applicantName,
    email: to,
    event_title: eventTitle,
    notes,
  })

  if (rendered) {
    return sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'applications',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Waitlist Notification')
  const html = waitlistEmailTemplate({
    applicantName,
    eventTitle,
    notes,
  })

  const text = waitlistEmailTextTemplate({
    applicantName,
    eventTitle,
    notes,
  })

  const subject = getWaitlistSubject(eventTitle)

  return sendEmail({
    to,
    subject,
    html,
    text,
    accountType: 'applications',
  })
}
