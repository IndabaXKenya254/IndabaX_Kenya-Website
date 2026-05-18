// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SHORTLIST EMAIL SENDER (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Send shortlist notification emails with survey links
// Phase 5: Admin Review System
// Updated: January 2026 - Database template support

import { sendEmail } from './sender'
import { renderTemplate, TEMPLATE_NAMES } from './template-service'
import { shortlistEmailTemplate, shortlistEmailTextTemplate, getShortlistSubject } from './templates'

export interface ShortlistEmailData {
  to: string
  applicantName: string
  eventTitle: string
  surveyLink: string
  deadline: string
  deadlineTime: string
}

/**
 * Send shortlist notification email with survey link
 * Uses database template with fallback to hardcoded
 *
 * @param data - Email data including recipient, survey link, and deadline
 * @returns Promise<boolean> - True if email sent successfully
 *
 * Used by:
 * - /api/admin/applications/[id]/shortlist (single shortlist)
 * - /api/admin/applications/bulk/shortlist (bulk shortlist)
 */
export async function sendShortlistEmail(data: ShortlistEmailData): Promise<boolean> {
  const { to, applicantName, eventTitle, surveyLink, deadline, deadlineTime } = data

  // Try database template first
  const rendered = await renderTemplate(TEMPLATE_NAMES.SURVEY_INVITATION, {
    name: applicantName,
    applicant_name: applicantName,
    email: to,
    event_title: eventTitle,
    survey_link: surveyLink,
    deadline,
    deadline_time: deadlineTime,
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
  console.warn('Using fallback hardcoded template for: Survey Invitation')
  const html = shortlistEmailTemplate({
    applicantName,
    eventTitle,
    surveyLink,
    deadline,
    deadlineTime,
  })

  const text = shortlistEmailTextTemplate({
    applicantName,
    eventTitle,
    surveyLink,
    deadline,
    deadlineTime,
  })

  const subject = getShortlistSubject(eventTitle)

  return sendEmail({
    to,
    subject,
    html,
    text,
    accountType: 'applications',
  })
}
