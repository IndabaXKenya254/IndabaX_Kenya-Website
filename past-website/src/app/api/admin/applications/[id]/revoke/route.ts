export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVOKE APPROVAL API
// ═══════════════════════════════════════════════════════════════════════
// Revoke approval and optionally send notification email

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import { sendEmailWithResult, replaceVariables } from '@/lib/email'
import { createPremiumEmail } from '@/lib/email-template-premium'
import { getSiteUrl, getWebsiteLinks, EMAIL_CONFIG } from '@/lib/config'

// Template ID for revoke/status update notification
const REVOKE_TEMPLATE_ID = 'f1a2b3c4-d5e6-7890-abcd-222222222222'

interface RevokeRequest {
  sendNotification?: boolean
  notes?: string
}

/**
 * POST /api/admin/applications/[id]/revoke
 * Revoke approval and move application back to pending
 *
 * Body:
 * {
 *   sendNotification?: boolean,  // Whether to send email (default: true)
 *   notes?: string               // Optional admin notes
 * }
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

    // Parse request body
    let body: RevokeRequest = { sendNotification: true }
    try {
      body = await request.json()
    } catch {
      // Use defaults if no body provided
    }

    const sendNotification = body.sendNotification !== false // Default to true

    // ═══════════════════════════════════════════════════════════════════
    // 1. Get application details
    // ═══════════════════════════════════════════════════════════════════

    const { data: application, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        status_v2,
        events (
          id,
          title,
          slug
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
          { success: false, error: 'You do not have permission to revoke approvals for this event' },
          { status: 403 }
        )
      }

      const permissions = assignment.permissions as any
      const canRevoke = permissions?.canRevoke ?? false

      if (!canRevoke) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to revoke approvals' },
          { status: 403 }
        )
      }
    }

    // Check if application is approved
    if (application.status_v2 !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Application is not approved. Cannot revoke.' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Invalidate any existing tickets (SECURITY CRITICAL)
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date().toISOString()
    let ticketInvalidated = false

    // Check if ticket exists for this application
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number')
      .eq('registration_id', params.id)

    if (existingTickets && existingTickets.length > 0) {
      // Invalidate all tickets for this application
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          is_valid: false,
          status: 'revoked',
          invalidated_at: now,
          invalidated_by: user.id,
          invalidation_reason: `Approval revoked by admin${body.notes ? `: ${body.notes}` : ''}`
        })
        .eq('registration_id', params.id)

      if (ticketError) {
        console.error('Failed to invalidate tickets:', ticketError)
        // Continue anyway - ticket invalidation failure shouldn't block revocation
      } else {
        ticketInvalidated = true
        console.log(`✅ Invalidated ${existingTickets.length} ticket(s) for application ${params.id}`)
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Update status to pending
    // ═══════════════════════════════════════════════════════════════════

    const { error: updateError } = await supabase
      .from('form_responses')
      .update({
        status_v2: 'pending',
        // Note: 'status' column uses enum (completed, in_progress, not_started) - don't change it
        review_notes: body.notes || null,
        reviewed_at: now,
        reviewed_by: user.id
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Failed to update status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update application status' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Send notification email (if requested)
    // ═══════════════════════════════════════════════════════════════════

    let emailSent = false

    if (sendNotification) {
      // Get email template
      const { data: template } = await supabase
        .from('email_templates')
        .select('id, name, subject, body, variables')
        .eq('id', REVOKE_TEMPLATE_ID)
        .single()

      if (template) {
        const baseUrl = getSiteUrl()
        const websiteLinks = getWebsiteLinks()
        const event = application.events as any

        const variables = {
          name: application.respondent_name || 'Applicant',
          email: application.respondent_email,
          event_title: event?.title || 'IndabaX Kenya Event'
        }

        const finalSubject = replaceVariables(template.subject, variables)
        const finalBody = replaceVariables(template.body, variables)

        // Wrap with premium email template
        const professionalEmailBody = createPremiumEmail(finalBody, {
          theme: 'modern',
          title: finalSubject,
          preheader: 'Your application status has been updated',
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

        emailSent = emailResult.success

        // Log email
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
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Log activity
    // ═══════════════════════════════════════════════════════════════════

    await supabase
      .from('application_activity_logs')
      .insert({
        application_id: params.id,
        action: 'revoke_approval',
        actor_id: user.id,
        details: {
          previous_status: 'approved',
          new_status: 'pending',
          email_sent: emailSent,
          ticket_invalidated: ticketInvalidated,
          notes: body.notes
        },
        created_at: now
      })

    // ═══════════════════════════════════════════════════════════════════
    // 6. Return result
    // ═══════════════════════════════════════════════════════════════════

    let message = 'Approval revoked.'
    if (ticketInvalidated) {
      message += ' Ticket(s) invalidated.'
    }
    if (emailSent) {
      message += ' Notification email sent.'
    } else if (sendNotification) {
      message += ' Email notification failed.'
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        status: 'pending',
        emailSent,
        ticketInvalidated
      }
    })
  } catch (error) {
    console.error('Revoke approval error:', error)
    return handleError(error)
  }
}
