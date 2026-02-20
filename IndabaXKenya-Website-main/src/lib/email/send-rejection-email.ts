// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REJECTION EMAIL SENDER (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Send rejection notification emails to applicants
// Phase 5: Admin Review System
// Updated: January 2026 - Database template support

import { sendEmail } from './sender'
import { renderTemplate, TEMPLATE_NAMES } from './template-service'
import { rejectionEmailTemplate, rejectionEmailTextTemplate, getRejectionSubject } from './templates'

export interface RejectionEmailData {
  to: string
  applicantName: string
  eventTitle: string
  notes?: string
}

/**
 * Send rejection notification email
 * Uses database template with fallback to hardcoded
 *
 * @param data - Email data including recipient and event details
 * @returns Promise<boolean> - True if email sent successfully
 *
 * Used by:
 * - /api/admin/applications/[id]/decision (reject decision)
 * - /api/admin/applications/bulk/reject (bulk rejection)
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<boolean> {
  const { to, applicantName, eventTitle, notes } = data

  // Try database template first
  const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_REJECTED, {
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
  console.warn('Using fallback hardcoded template for: Application Rejected')
  const html = rejectionEmailTemplate({
    applicantName,
    eventTitle,
    notes,
  })

  const text = rejectionEmailTextTemplate({
    applicantName,
    eventTitle,
    notes,
  })

  const subject = getRejectionSubject(eventTitle)

  return sendEmail({
    to,
    subject,
    html,
    text,
    accountType: 'applications',
  })
}
