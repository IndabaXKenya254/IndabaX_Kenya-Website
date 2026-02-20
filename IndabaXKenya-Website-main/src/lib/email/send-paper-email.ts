// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER NOTIFICATION EMAIL SENDER
// ═══════════════════════════════════════════════════════════════════════
// Send email notifications when papers are approved or rejected
// Phase 9: Paper Submission & Review
// Created: January 2026

import { sendEmail } from './sender'
import { renderTemplate, TEMPLATE_NAMES } from './template-service'

export interface PaperApprovedEmailData {
  to: string
  authorName: string
  paperTitle: string
  eventTitle: string
  eventDate?: string | null
  eventLocation?: string | null
  ticketNumber: string
  ticketLink: string
  rating?: number | null
  reviewNotes?: string | null
}

export interface PaperRejectedEmailData {
  to: string
  authorName: string
  paperTitle: string
  eventTitle: string
  eventUrl: string
  reviewNotes?: string | null
}

/**
 * Send paper approval email with speaker ticket info
 * Uses database template "Paper Approved - Speaker Invitation"
 *
 * @param data - Email data including author details, paper info, and ticket
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendPaperApprovedEmail(data: PaperApprovedEmailData): Promise<boolean> {
  const {
    to,
    authorName,
    paperTitle,
    eventTitle,
    eventDate,
    eventLocation,
    ticketNumber,
    ticketLink,
    rating,
    reviewNotes,
  } = data

  try {
    // Try database template first
    const rendered = await renderTemplate(TEMPLATE_NAMES.PAPER_APPROVED, {
      author_name: authorName,
      author_email: to,
      paper_title: paperTitle,
      event_title: eventTitle,
      event_date: eventDate || 'TBA',
      event_location: eventLocation || 'TBA',
      ticket_number: ticketNumber,
      ticket_link: ticketLink,
      rating: rating ? String(rating) : '',
      review_notes: reviewNotes || '',
    })

    if (rendered) {
      console.log(`📧 Sending paper approval email to: ${to}`)
      return sendEmail({
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        accountType: 'applications',
        category: 'notifications',
      })
    }

    // Fallback: No template found
    console.error('Paper approval email template not found in database')
    return false
  } catch (error) {
    console.error('Error sending paper approval email:', error)
    return false
  }
}

/**
 * Send paper rejection email with feedback
 * Uses database template "Paper Rejected - Feedback"
 *
 * @param data - Email data including author details and feedback
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendPaperRejectedEmail(data: PaperRejectedEmailData): Promise<boolean> {
  const {
    to,
    authorName,
    paperTitle,
    eventTitle,
    eventUrl,
    reviewNotes,
  } = data

  try {
    // Try database template first
    const rendered = await renderTemplate(TEMPLATE_NAMES.PAPER_REJECTED, {
      author_name: authorName,
      author_email: to,
      paper_title: paperTitle,
      event_title: eventTitle,
      event_url: eventUrl,
      review_notes: reviewNotes || '',
    })

    if (rendered) {
      console.log(`📧 Sending paper rejection email to: ${to}`)
      return sendEmail({
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        accountType: 'applications',
        category: 'notifications',
      })
    }

    // Fallback: No template found
    console.error('Paper rejection email template not found in database')
    return false
  } catch (error) {
    console.error('Error sending paper rejection email:', error)
    return false
  }
}
