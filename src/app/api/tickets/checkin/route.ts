export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET CHECK-IN API (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tickets/checkin - Check in a ticket via QR code scan

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

// ═══════════════════════════════════════════════════════════════════════════
// POST - Check in ticket
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/tickets/checkin
 * Check in a ticket using QR code data or ticket number
 *
 * Body:
 * - qr_data: string (JSON from QR code scan)
 * OR
 * - ticket_number: string (manual entry)
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { qr_data, ticket_number } = body

    if (!qr_data && !ticket_number) {
      return NextResponse.json(
        { success: false, error: 'qr_data or ticket_number is required' },
        { status: 400 }
      )
    }

    let ticketQuery = adminSupabase
      .from('tickets')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          location
        ),
        user_profiles!user_id (
          id,
          name,
          email,
          organization,
          phone
        )
      `)

    // ═══════════════════════════════════════════════════════════════════
    // 1. Find ticket by QR data or ticket number
    // ═══════════════════════════════════════════════════════════════════

    if (qr_data) {
      // Parse QR data to verify it's valid
      try {
        const parsed = JSON.parse(qr_data)

        // Support both new format (with type field) and old format (without)
        // New format: { type: 'INDABAX_TICKET', ticket: '...', ... }
        // Old format: { ticket: '...', event: '...', ... }
        if (parsed.type && parsed.type !== 'INDABAX_TICKET') {
          return NextResponse.json(
            { success: false, error: 'Invalid QR code format' },
            { status: 400 }
          )
        }

        // Validate required fields exist
        if (!parsed.ticket || !parsed.event) {
          return NextResponse.json(
            { success: false, error: 'QR code missing required fields' },
            { status: 400 }
          )
        }

        // Look up by ticket number instead of exact QR match
        // This avoids issues with JSON formatting differences (spaces, order, etc)
        ticketQuery = ticketQuery.eq('ticket_number', parsed.ticket)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid QR code data' },
          { status: 400 }
        )
      }
    } else {
      ticketQuery = ticketQuery.eq('ticket_number', ticket_number)
    }

    const { data: ticket, error: ticketError } = await ticketQuery.single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Check ticket validity and status
    // ═══════════════════════════════════════════════════════════════════

    // CRITICAL: Check is_valid flag first
    if (ticket.is_valid === false) {
      const invalidatedTime = ticket.invalidated_at
        ? new Date(ticket.invalidated_at).toLocaleString()
        : 'Unknown'

      return NextResponse.json({
        success: false,
        error: 'TICKET_INVALIDATED',
        message: `This ticket has been invalidated${ticket.invalidation_reason ? `: ${ticket.invalidation_reason}` : ''}`,
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown',
          invalidated_at: ticket.invalidated_at,
          invalidation_reason: ticket.invalidation_reason
        }
      }, { status: 403 })
    }

    // Check for invalidated statuses
    if (ticket.status === 'revoked') {
      return NextResponse.json({
        success: false,
        error: 'TICKET_REVOKED',
        message: 'This ticket has been revoked by an administrator',
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown',
          invalidation_reason: ticket.invalidation_reason
        }
      }, { status: 403 })
    }

    if (ticket.status === 'rejected') {
      return NextResponse.json({
        success: false,
        error: 'APPLICATION_REJECTED',
        message: 'The application for this ticket was rejected',
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown'
        }
      }, { status: 403 })
    }

    if (ticket.status === 'waitlisted') {
      return NextResponse.json({
        success: false,
        error: 'APPLICATION_WAITLISTED',
        message: 'The application for this ticket is waitlisted',
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown'
        }
      }, { status: 403 })
    }

    if (ticket.status === 'checked_in') {
      const checkedInTime = new Date(ticket.checked_in_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
      return NextResponse.json({
        success: false,
        error: 'ALREADY_CHECKED_IN',
        message: `This ticket was already checked in at ${checkedInTime}`,
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown',
          checked_in_at: ticket.checked_in_at
        }
      }, { status: 409 })
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: 'TICKET_CANCELLED',
        message: 'This ticket has been cancelled',
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown'
        }
      }, { status: 400 })
    }

    if (ticket.status === 'expired') {
      return NextResponse.json({
        success: false,
        error: 'TICKET_EXPIRED',
        message: 'This ticket has expired',
        data: {
          ticket_number: ticket.ticket_number,
          attendee_name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown'
        }
      }, { status: 400 })
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Perform check-in
    // ═══════════════════════════════════════════════════════════════════

    const { error: updateError } = await adminSupabase
      .from('tickets')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id
      })
      .eq('id', ticket.id)

    if (updateError) {
      console.error('Check-in update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to check in ticket' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Issue #28 FIX: Send check-in confirmation email (fire-and-forget)
    // ═══════════════════════════════════════════════════════════════════

    const attendeeEmail = ticket.attendee_email || ticket.user_profiles?.email
    const attendeeName = ticket.attendee_name || ticket.user_profiles?.name || 'Attendee'
    const eventTitle = ticket.events?.title || 'IndabaX Kenya Event'
    const checkedInTime = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
    const eventDate = ticket.events?.start_date
      ? new Date(ticket.events.start_date).toLocaleDateString('en-KE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Africa/Nairobi'
        })
      : undefined
    const eventLocation = ticket.events?.location || undefined

    if (attendeeEmail) {
      // Import and use proper email templates
      Promise.all([
        import('@/lib/email/sender'),
        import('@/lib/email/templates')
      ]).then(([{ sendEmail }, { checkInConfirmationEmailTemplate, checkInConfirmationEmailTextTemplate, getCheckInConfirmationSubject }]) => {
        const html = checkInConfirmationEmailTemplate({
          attendeeName,
          eventTitle,
          ticketNumber: ticket.ticket_number,
          checkedInAt: checkedInTime,
          eventDate,
          eventLocation,
        })
        const text = checkInConfirmationEmailTextTemplate({
          attendeeName,
          eventTitle,
          ticketNumber: ticket.ticket_number,
          checkedInAt: checkedInTime,
          eventDate,
          eventLocation,
        })

        sendEmail({
          to: attendeeEmail,
          subject: getCheckInConfirmationSubject(eventTitle),
          html,
          text,
          accountType: 'applications',
          category: 'notifications',
        }).catch(err => console.error('Check-in email error (non-fatal):', err))
      }).catch(err => console.error('Check-in email import error (non-fatal):', err))
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Return success
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      data: {
        ticket_number: ticket.ticket_number,
        ticket_type: ticket.ticket_type || 'General',
        attendee: {
          name: ticket.attendee_name || ticket.user_profiles?.name || 'Unknown',
          email: ticket.attendee_email || ticket.user_profiles?.email || 'Unknown',
          organization: ticket.user_profiles?.organization || 'N/A'
        },
        event: ticket.events,
        checked_in_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Get check-in stats for an event
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const adminSupabase = createAdminClient()

    const { searchParams } = request.nextUrl
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Get check-in stats
    const { data: tickets, error } = await adminSupabase
      .from('tickets')
      .select('status')
      .eq('event_id', eventId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to get stats' },
        { status: 500 }
      )
    }

    type TicketStatus = { status: string | null }
    const stats = {
      total: tickets.length,
      checked_in: tickets.filter((t: TicketStatus) => t.status === 'checked_in').length,
      active: tickets.filter((t: TicketStatus) => t.status === 'active').length,
      cancelled: tickets.filter((t: TicketStatus) => t.status === 'cancelled').length
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Stats error:', error)
    return handleError(error)
  }
}
