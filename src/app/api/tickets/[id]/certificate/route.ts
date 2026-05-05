export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CERTIFICATE OF ATTENDANCE API
// ═══════════════════════════════════════════════════════════════════════════
// Issue #36 FIX: Auto-issued certificates after check-in
// GET /api/tickets/[id]/certificate - Download certificate PDF

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { generateCertificatePDF } from '@/lib/pdf/certificate-generator'
import { nanoid } from 'nanoid'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const ticketId = params.id

    // Fetch ticket + event details
    const { data: ticket, error: ticketError } = await adminSupabase
      .from('tickets')
      .select(`
        id, ticket_number, attendee_name, attendee_email, status, checked_in_at,
        events (
          id, title, start_date, end_date, location, venue
        ),
        user_profiles!user_id (id)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    // Only the ticket owner or admins can download the certificate
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = (ticket as any).user_profiles?.id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Only checked-in attendees get a certificate
    if ((ticket as any).status !== 'checked_in') {
      return NextResponse.json(
        { success: false, error: 'Certificate is only available after check-in' },
        { status: 400 }
      )
    }

    const event = (ticket as any).events
    const attendeeName = (ticket as any).attendee_name || 'Attendee'
    const eventTitle = event?.title || 'IndabaX Kenya Event'

    const eventDate = event?.start_date
      ? new Date(event.start_date).toLocaleDateString('en-KE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Africa/Nairobi',
        })
      : 'TBD'

    const eventLocation = [event?.venue, event?.location].filter(Boolean).join(', ') || 'Nairobi, Kenya'

    const issuedAt = (ticket as any).checked_in_at
      ? new Date((ticket as any).checked_in_at).toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Africa/Nairobi',
        })
      : new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })

    const certificateNumber = `CERT-${(ticket as any).ticket_number}-${nanoid(6).toUpperCase()}`

    const pdfBuffer = await generateCertificatePDF({
      attendeeName,
      eventTitle,
      eventDate,
      eventLocation,
      certificateNumber,
      issuedAt,
    })

    const filename = `certificate-${(ticket as any).ticket_number}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return handleError(error)
  }
}
