export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION DECISION API (PHASE 5 - DAY 6)
// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/applications/[id]/decision - Approve or reject application

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import { sendApprovalEmail } from '@/lib/email/send-approval-email'
import { sendRejectionEmail } from '@/lib/email/send-rejection-email'
import { sendWaitlistEmail } from '@/lib/email/send-waitlist-email'
import { getEventLink, getSiteUrl } from '@/lib/config'
import { createTicket } from '@/lib/tickets'
import { generateTicketPDF, generateTicketFilename } from '@/lib/pdf/ticket-generator'
import { createAdminClient } from '@/lib/supabase'

/**
 * POST /api/admin/applications/[id]/decision
 * Approve or reject an application and send email notification
 *
 * Request Body:
 * {
 *   "decision": "approved" | "rejected",
 *   "notes": "Optional feedback for the applicant"
 * }
 *
 * Returns:
 * - 200 OK: Decision recorded and email sent
 * - 400 Bad Request: Invalid decision
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 404 Not Found: Application not found
 * - 500 Internal Error: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin or reviewer authentication
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user, role } = authCheck.data
    const { id } = params

    // Parse request body
    const body = await request.json()
    const { decision, notes } = body

    // Validate decision - must be 'approved', 'rejected', or 'waitlisted'
    if (!decision || !['approved', 'rejected', 'waitlisted'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision. Must be "approved", "rejected", or "waitlisted"' },
        { status: 400 }
      )
    }

    // Fetch the application (from form_responses table)
    const { data: application, error: fetchError } = await supabase
      .from('form_responses')
      .select('*, events(title, start_date, location, slug)')
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

      // Check if reviewer is assigned to this application's event
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
          { success: false, error: 'You do not have permission to review applications for this event' },
          { status: 403 }
        )
      }

      // Check specific permissions from JSONB column
      const permissions = assignment.permissions as any
      const canApprove = permissions?.canApprove ?? false
      const canReject = permissions?.canReject ?? false

      // Validate permission for the specific decision
      if (decision === 'approved' && !canApprove) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to approve applications' },
          { status: 403 }
        )
      }

      if ((decision === 'rejected' || decision === 'waitlisted') && !canReject) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to reject or waitlist applications' },
          { status: 403 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Issue #16 FIX: Check event capacity before approving
    // ═══════════════════════════════════════════════════════════════════

    if (decision === 'approved') {
      const adminSupabase = createAdminClient()

      // Get event with max_attendees
      const { data: eventData, error: eventError } = await adminSupabase
        .from('events')
        .select('id, title, max_attendees')
        .eq('id', application.event_id)
        .single()

      if (eventError) {
        console.error('Failed to fetch event for capacity check:', eventError)
      } else if (eventData?.max_attendees && eventData.max_attendees > 0) {
        // Count currently approved applications for this event
        const { count: approvedCount, error: countError } = await adminSupabase
          .from('form_responses')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', application.event_id)
          .eq('status_v2', 'approved')

        if (countError) {
          console.error('Failed to count approved applications:', countError)
        } else if (approvedCount !== null && approvedCount >= eventData.max_attendees) {
          return NextResponse.json({
            success: false,
            error: `Cannot approve: Event "${eventData.title}" has reached maximum capacity of ${eventData.max_attendees} attendees. Current approved: ${approvedCount}. Consider waitlisting this applicant instead.`
          }, { status: 400 })
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECURITY: Invalidate tickets if rejecting/waitlisting previously approved application
    // ═══════════════════════════════════════════════════════════════════

    let ticketInvalidated = false
    const wasApproved = application.status_v2 === 'approved'

    if (wasApproved && (decision === 'rejected' || decision === 'waitlisted')) {
      // Check if ticket exists for this application
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('id, ticket_number')
        .eq('registration_id', id)

      if (existingTickets && existingTickets.length > 0) {
        // Invalidate all tickets for this application
        const now = new Date().toISOString()
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            is_valid: false,
            status: decision === 'rejected' ? 'rejected' : 'waitlisted',
            invalidated_at: now,
            invalidated_by: user.id,
            invalidation_reason: `Application ${decision}${notes ? `: ${notes}` : ''}`
          })
          .eq('registration_id', id)

        if (ticketError) {
          console.error('Failed to invalidate tickets:', ticketError)
          // Continue anyway - ticket invalidation failure shouldn't block decision
        } else {
          ticketInvalidated = true
          console.log(`✅ Invalidated ${existingTickets.length} ticket(s) for ${decision} application ${id}`)
        }
      }
    }

    // Update application status
    const updateData: Record<string, any> = {
      status_v2: decision, // Use status_v2 for review workflow
      decision_notes: notes || application.decision_notes,
      decision_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      decision_by: user.id,
    }

    // Add decision-specific fields
    if (decision === 'approved') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    } else if (decision === 'rejected') {
      updateData.rejected_by = user.id
      updateData.rejected_at = new Date().toISOString()
      // Also set rejection_reason for dashboard compatibility
      if (notes) {
        updateData.rejection_reason = notes
      }
    } else if (decision === 'waitlisted') {
      updateData.waitlisted_by = user.id
      updateData.waitlisted_at = new Date().toISOString()
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('form_responses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Application update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Prepare email data
    const applicantName = application.respondent_name || 'Applicant'
    const applicantEmail = application.respondent_email
    const eventTitle: string = application.events?.title || 'IndabaX Kenya Event'

    // Send email notification for approved, rejected, and waitlisted applications
    let emailSent = false
    let ticketGenerated = false
    try {
      if (decision === 'approved') {
        // Format event details for approval email
        const eventDate = application.events?.start_date
          ? new Date(application.events.start_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'To be announced'

        const eventLocation = application.events?.location || 'To be announced'

        const eventUrl = application.events?.slug
          ? getEventLink(application.events.slug)
          : `${getSiteUrl()}/events`

        // Generate ticket automatically on approval
        let ticketLink: string | undefined
        let ticketNumber: string | undefined
        let ticketPDFBuffer: Buffer | undefined

        try {
          const ticketResult = await createTicket({
            eventId: application.event_id,
            userId: application.user_id || null,
            registrationId: application.id,
            attendeeName: applicantName,
            attendeeEmail: applicantEmail,
            eventTitle,
            eventDate: application.events?.start_date || null,
            eventLocation: application.events?.location || null,
            ticketType: 'general',
          })

          if (ticketResult.success && ticketResult.ticket) {
            ticketGenerated = true
            ticketNumber = ticketResult.ticket.ticket_number
            ticketLink = `${getSiteUrl()}/dashboard/tickets/${ticketResult.ticket.id}`
            console.log('✅ Ticket generated successfully:', ticketNumber)

            // Generate PDF and upload to storage
            try {
              const pdfBuffer = await generateTicketPDF({
                ticketNumber: ticketResult.ticket.ticket_number,
                qrCodeData: ticketResult.ticket.qr_code_data,
                attendeeName: applicantName,
                attendeeEmail: applicantEmail,
                eventTitle,
                eventDate,
                eventTime: application.events?.start_date
                  ? new Date(application.events.start_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : undefined,
                eventLocation,
                eventVenue: application.events?.venue || undefined,
                ticketType: 'General',
              })

              // Upload PDF to Supabase Storage
              const adminSupabase = createAdminClient()
              const filename = generateTicketFilename(ticketResult.ticket.ticket_number, eventTitle)
              const storagePath = `tickets/${ticketResult.ticket.id}/${filename}`

              const { data: uploadData, error: uploadError } = await adminSupabase.storage
                .from('tickets')
                .upload(storagePath, pdfBuffer, {
                  contentType: 'application/pdf',
                  upsert: true
                })

              if (uploadError) {
                console.error('⚠️ Failed to upload PDF to storage:', uploadError)
              } else {
                console.log('✅ PDF uploaded to storage:', storagePath)

                // Update ticket with pdf_url
                const { data: { publicUrl } } = adminSupabase.storage
                  .from('tickets')
                  .getPublicUrl(storagePath)

                await adminSupabase
                  .from('tickets')
                  .update({ pdf_url: publicUrl })
                  .eq('id', ticketResult.ticket.id)

                // Download PDF from storage for email attachment
                const { data: downloadData, error: downloadError } = await adminSupabase.storage
                  .from('tickets')
                  .download(storagePath)

                if (downloadError) {
                  console.error('⚠️ Failed to download PDF from storage:', downloadError)
                } else if (downloadData) {
                  // Convert Blob to Buffer for email attachment
                  ticketPDFBuffer = Buffer.from(await downloadData.arrayBuffer())
                  console.log('✅ PDF downloaded from storage for email attachment')
                }
              }
            } catch (pdfError) {
              console.error('⚠️ PDF generation/storage error:', pdfError)
            }
          } else {
            console.error('⚠️ Failed to generate ticket:', ticketResult.error)
          }
        } catch (ticketError) {
          console.error('⚠️ Ticket generation error:', ticketError)
        }

        // Send approval email with ticket link and PDF attachment
        emailSent = await sendApprovalEmail({
          to: applicantEmail,
          applicantName,
          eventTitle,
          eventDate,
          eventLocation,
          eventUrl,
          ticketLink, // Pass ticket link to email
          ticketAttachment: ticketPDFBuffer && ticketNumber
            ? {
                filename: generateTicketFilename(ticketNumber, eventTitle),
                content: ticketPDFBuffer,
                contentType: 'application/pdf',
              }
            : undefined,
        })

        if (!emailSent) {
          console.error('Failed to send approval email to:', applicantEmail)
        }
      } else if (decision === 'rejected') {
        // Send rejection email
        emailSent = await sendRejectionEmail({
          to: applicantEmail,
          applicantName,
          eventTitle,
          notes: notes || undefined,
        })

        if (!emailSent) {
          console.error('Failed to send rejection email to:', applicantEmail)
        }
      } else if (decision === 'waitlisted') {
        // Send waitlist email
        emailSent = await sendWaitlistEmail({
          to: applicantEmail,
          applicantName,
          eventTitle,
          notes: notes || undefined,
        })

        if (!emailSent) {
          console.error('Failed to send waitlist email to:', applicantEmail)
        }
      }
    } catch (emailError) {
      console.error(`Error sending ${decision} email:`, emailError)
      // Don't fail the entire operation if email fails
      emailSent = false
    }

    const emailTypeText = decision === 'approved' ? 'Approval' : decision === 'rejected' ? 'Rejection' : 'Waitlist'

    let message = `Application ${decision}.`
    if (decision === 'approved') {
      if (ticketGenerated) {
        message += ' Ticket generated.'
      }
      if (emailSent) {
        message += ` ${emailTypeText} email sent with ticket link.`
      } else {
        message += ' Email notification failed.'
      }
    } else {
      if (ticketInvalidated) {
        message += ' Previous ticket(s) invalidated.'
      }
      message += emailSent ? ` ${emailTypeText} email sent.` : ' Email notification failed.'
    }

    return NextResponse.json({
      success: true,
      data: updatedApp,
      emailSent,
      ticketGenerated: decision === 'approved' ? ticketGenerated : undefined,
      ticketInvalidated: (decision === 'rejected' || decision === 'waitlisted') ? ticketInvalidated : undefined,
      message
    })
  } catch (error) {
    console.error('Application decision error:', error)
    return handleError(error)
  }
}
