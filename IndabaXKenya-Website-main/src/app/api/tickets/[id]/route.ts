export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET DETAIL API (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/tickets/[id] - Get ticket details
// GET /api/tickets/[id]?download=true - Download ticket PDF

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import QRCode from 'qrcode'

// ═══════════════════════════════════════════════════════════════════════════
// GET - Get ticket details or download PDF
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ticketId = params.id
    const { searchParams } = request.nextUrl
    const download = searchParams.get('download') === 'true'

    // ═══════════════════════════════════════════════════════════════════
    // 1. Get ticket with event details
    // ═══════════════════════════════════════════════════════════════════

    const adminSupabase = createAdminClient()

    const { data: ticket, error: ticketError } = await adminSupabase
      .from('tickets')
      .select(`
        *,
        events (
          id,
          title,
          slug,
          start_date,
          end_date,
          location,
          venue
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Check authorization
    // ═══════════════════════════════════════════════════════════════════

    // User must be the ticket owner or an admin
    if (user) {
      const isOwner = ticket.user_id === user.id

      // Check if admin
      const { data: profile } = await adminSupabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to view this ticket' },
          { status: 403 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Generate QR code data URL
    // ═══════════════════════════════════════════════════════════════════

    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qr_code_data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#006700',
        light: '#FFFFFF'
      }
    })

    // ═══════════════════════════════════════════════════════════════════
    // 4. Update download count if downloading
    // ═══════════════════════════════════════════════════════════════════

    if (download) {
      await adminSupabase
        .from('tickets')
        .update({
          download_count: (ticket.download_count || 0) + 1,
          downloaded_at: new Date().toISOString()
        })
        .eq('id', ticketId)
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Format event date
    // ═══════════════════════════════════════════════════════════════════

    const event = ticket.events as any
    let eventDate = 'TBA'
    let eventTime = ''

    if (event?.start_date) {
      const startDate = new Date(event.start_date)
      eventDate = startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      eventTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })

      if (event.end_date) {
        const endDate = new Date(event.end_date)
        if (startDate.toDateString() !== endDate.toDateString()) {
          eventDate = `${startDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          })} - ${endDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}`
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Return ticket data
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        ticketType: ticket.ticket_type,
        status: ticket.status,
        qrCodeDataUrl: qrCodeDataUrl,
        attendee: {
          name: ticket.attendee_name,
          email: ticket.attendee_email,
          organization: ticket.attendee_organization
        },
        event: {
          id: event?.id,
          title: event?.title,
          date: eventDate,
          time: eventTime,
          location: event?.location,
          venue: event?.venue
        },
        generatedAt: ticket.generated_at,
        checkedInAt: ticket.checked_in_at,
        downloadCount: ticket.download_count
      }
    })
  } catch (error) {
    console.error('Ticket fetch error:', error)
    return handleError(error)
  }
}
