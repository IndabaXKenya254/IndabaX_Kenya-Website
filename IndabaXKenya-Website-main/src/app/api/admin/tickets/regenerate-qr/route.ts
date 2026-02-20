export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REGENERATE QR CODES FOR EXISTING TICKETS
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/tickets/regenerate-qr - Regenerate QR codes with new format

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { generateQRCodeData } from '@/lib/tickets'

/**
 * POST /api/admin/tickets/regenerate-qr
 * Regenerate QR codes for all existing tickets with new format
 *
 * Query params:
 * - event_id: (optional) Only regenerate tickets for specific event
 * - ticket_id: (optional) Only regenerate a specific ticket
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const adminSupabase = createAdminClient()
    const { searchParams } = request.nextUrl

    const eventId = searchParams.get('event_id')
    const ticketId = searchParams.get('ticket_id')

    // Build query
    let query = adminSupabase
      .from('tickets')
      .select('id, ticket_number, event_id, user_id, attendee_name, attendee_email, qr_code_data')

    if (ticketId) {
      query = query.eq('id', ticketId)
    } else if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: tickets, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching tickets:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tickets found to regenerate',
        data: {
          total: 0,
          updated: 0,
          failed: 0
        }
      })
    }

    // Regenerate QR codes
    let updated = 0
    let failed = 0
    const errors: Array<{ ticketNumber: string; error: string }> = []

    for (const ticket of tickets) {
      try {
        // Check if QR code already has the new format
        let needsUpdate = false
        try {
          const parsed = JSON.parse(ticket.qr_code_data)
          if (!parsed.type || parsed.type !== 'INDABAX_TICKET') {
            needsUpdate = true
          }
        } catch {
          // Invalid JSON, definitely needs update
          needsUpdate = true
        }

        if (!needsUpdate) {
          console.log(`Ticket ${ticket.ticket_number} already has new format, skipping`)
          updated++ // Count as updated since it already has correct format
          continue
        }

        // Generate new QR code data with correct format
        const newQRData = generateQRCodeData({
          ticketNumber: ticket.ticket_number,
          eventId: ticket.event_id,
          userId: ticket.user_id || '',
          attendeeName: ticket.attendee_name || 'Guest',
          attendeeEmail: ticket.attendee_email || '',
        })

        // Update ticket
        const { error: updateError } = await adminSupabase
          .from('tickets')
          .update({
            qr_code_data: newQRData,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id)

        if (updateError) {
          console.error(`Error updating ticket ${ticket.ticket_number}:`, updateError)
          failed++
          errors.push({
            ticketNumber: ticket.ticket_number,
            error: updateError.message
          })
        } else {
          console.log(`Successfully updated ticket ${ticket.ticket_number}`)
          updated++
        }
      } catch (error) {
        console.error(`Error processing ticket ${ticket.ticket_number}:`, error)
        failed++
        errors.push({
          ticketNumber: ticket.ticket_number,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Regenerated ${updated} QR codes${failed > 0 ? `, ${failed} failed` : ''}`,
      data: {
        total: tickets.length,
        updated,
        failed,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('QR regeneration error:', error)
    return handleError(error)
  }
}

/**
 * GET /api/admin/tickets/regenerate-qr
 * Check how many tickets need QR code regeneration
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const adminSupabase = createAdminClient()
    const { searchParams } = request.nextUrl

    const eventId = searchParams.get('event_id')

    // Build query
    let query = adminSupabase
      .from('tickets')
      .select('id, ticket_number, qr_code_data', { count: 'exact' })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: tickets, error: fetchError, count } = await query

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    // Check how many need updating
    let needsUpdate = 0
    let alreadyUpdated = 0

    for (const ticket of tickets || []) {
      try {
        const parsed = JSON.parse(ticket.qr_code_data)
        if (!parsed.type || parsed.type !== 'INDABAX_TICKET') {
          needsUpdate++
        } else {
          alreadyUpdated++
        }
      } catch {
        needsUpdate++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: count || 0,
        needsUpdate,
        alreadyUpdated
      }
    })
  } catch (error) {
    console.error('Check error:', error)
    return handleError(error)
  }
}
