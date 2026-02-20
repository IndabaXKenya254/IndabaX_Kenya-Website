export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BULK TICKET EXPORT API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/tickets/export - Generate bulk PDF tickets as ZIP
// Phase 8: Ticketing System

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * POST /api/tickets/export
 * Export multiple tickets as individual PDFs (returns JSON with ticket data)
 * The actual PDF generation happens client-side
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { event_id, ticket_ids, status_filter } = body

    // Validate input
    if (!event_id && (!ticket_ids || ticket_ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either event_id or ticket_ids is required' } },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        ticket_type,
        status,
        qr_code,
        issued_at,
        registration_id,
        registrations!inner (
          id,
          event_id,
          user_id,
          user_profiles:user_id (
            id,
            full_name,
            email,
            organization
          ),
          events:event_id (
            id,
            title,
            slug,
            start_date,
            end_date,
            start_time,
            end_time,
            location,
            venue
          )
        )
      `)

    if (ticket_ids && ticket_ids.length > 0) {
      query = query.in('id', ticket_ids)
    } else if (event_id) {
      query = query.eq('registrations.event_id', event_id)
    }

    if (status_filter && status_filter !== 'all') {
      query = query.eq('status', status_filter)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Tickets query error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No tickets found matching criteria' } },
        { status: 404 }
      )
    }

    // Format tickets for export
    interface RegistrationData {
      id: string
      event_id: string
      user_id: string
      user_profiles: {
        id: string
        full_name: string
        email: string
        organization?: string
      } | null
      events: {
        id: string
        title: string
        slug: string
        start_date: string
        end_date?: string
        start_time?: string
        end_time?: string
        location: string
        venue?: string
      } | null
    }

    const exportData = tickets.map(ticket => {
      const reg = ticket.registrations as unknown as RegistrationData
      const user = reg?.user_profiles
      const event = reg?.events

      return {
        ticketNumber: ticket.ticket_number,
        ticketType: ticket.ticket_type || 'General',
        status: ticket.status,
        qrCode: ticket.qr_code,
        attendee: {
          name: user?.full_name || 'Unknown',
          email: user?.email || '',
          organization: user?.organization || '',
        },
        event: {
          title: event?.title || 'IndabaX Kenya',
          date: event?.start_date
            ? new Date(event.start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'TBD',
          time: event?.start_time || '',
          location: event?.location || '',
          venue: event?.venue || '',
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
      message: `Found ${exportData.length} tickets for export`
    })
  } catch (error) {
    console.error('Ticket export API error:', error)
    return handleError(error)
  }
}

/**
 * GET /api/tickets/export/stats?event_id=xxx
 * Get ticket export statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Get ticket statistics
    let query = supabase
      .from('tickets')
      .select(`
        id,
        status,
        ticket_type,
        registrations!inner (
          event_id
        )
      `)

    if (eventId) {
      query = query.eq('registrations.event_id', eventId)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Ticket stats query error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    const stats = {
      total: tickets?.length || 0,
      valid: tickets?.filter(t => t.status === 'valid').length || 0,
      used: tickets?.filter(t => t.status === 'used').length || 0,
      cancelled: tickets?.filter(t => t.status === 'cancelled').length || 0,
      byType: {} as Record<string, number>,
    }

    // Count by type
    tickets?.forEach(t => {
      const type = t.ticket_type || 'General'
      stats.byType[type] = (stats.byType[type] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Ticket stats API error:', error)
    return handleError(error)
  }
}
