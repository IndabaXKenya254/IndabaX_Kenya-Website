export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET GENERATION API (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tickets/generate - Generate a ticket for an accepted application

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import QRCode from 'qrcode'
import { randomUUID } from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Generate unique ticket number
// ═══════════════════════════════════════════════════════════════════════════

function generateTicketNumber(): string {
  const prefix = 'IDX'
  const year = new Date().getFullYear().toString().slice(-2)
  const random = randomUUID().slice(0, 6).toUpperCase()
  return `${prefix}${year}-${random}`
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Generate ticket for application
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/tickets/generate
 * Generate a ticket for an accepted application
 *
 * Body:
 * - registration_id: UUID of the form_response (accepted application)
 * - ticket_type: 'general' | 'student' | 'speaker' | 'vip' (optional)
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { registration_id, ticket_type = 'general' } = body

    if (!registration_id) {
      return NextResponse.json(
        { success: false, error: 'registration_id is required' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Get application details
    // ═══════════════════════════════════════════════════════════════════

    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        user_id,
        respondent_name,
        respondent_email,
        status,
        responses,
        events (
          id,
          title,
          start_date,
          end_date,
          location
        )
      `)
      .eq('id', registration_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is approved
    if (application.status !== 'approved' && application.status_v2 !== 'approved' && application.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Application must be approved to generate ticket' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Check if ticket already exists
    // ═══════════════════════════════════════════════════════════════════

    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number')
      .eq('registration_id', registration_id)
      .single()

    if (existingTicket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ticket already exists for this registration',
          ticket_number: existingTicket.ticket_number
        },
        { status: 409 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Generate ticket number and QR code
    // ═══════════════════════════════════════════════════════════════════

    const ticketNumber = generateTicketNumber()

    // QR code contains ticket ID and verification data
    const qrData = JSON.stringify({
      type: 'INDABAX_TICKET',
      ticket: ticketNumber,
      event: application.event_id,
      timestamp: Date.now()
    })

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#006700',
        light: '#FFFFFF'
      }
    })

    // ═══════════════════════════════════════════════════════════════════
    // 4. Get organization from responses if available
    // ═══════════════════════════════════════════════════════════════════

    let organization = null
    if (application.responses) {
      const responses = application.responses as Record<string, any>
      // Look for organization in various possible field names
      organization = responses.organization ||
                    responses.company ||
                    responses.institution ||
                    responses.affiliation ||
                    null
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4b. Issue #24 FIX: Get correct user_id by looking up attendee email
    // ═══════════════════════════════════════════════════════════════════

    let correctUserId = application.user_id

    // Look up the user profile by attendee email to get the correct user_id
    if (application.respondent_email) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('email', application.respondent_email)
        .single()

      if (userProfile?.id) {
        correctUserId = userProfile.id
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Create ticket record
    // ═══════════════════════════════════════════════════════════════════

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        registration_id: registration_id,
        event_id: application.event_id,
        user_id: correctUserId,  // Issue #24: Use correct user_id from profile lookup
        ticket_number: ticketNumber,
        qr_code_data: qrData,
        ticket_type: ticket_type,
        attendee_name: application.respondent_name,
        attendee_email: application.respondent_email,
        attendee_organization: organization,
        status: 'active',
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Ticket creation error:', ticketError)
      return NextResponse.json(
        { success: false, error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Return ticket data
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: 'Ticket generated successfully',
      data: {
        ticket_id: ticket.id,
        ticket_number: ticketNumber,
        qr_code_data_url: qrCodeDataUrl,
        attendee: {
          name: application.respondent_name,
          email: application.respondent_email,
          organization: organization
        },
        event: application.events,
        ticket_type: ticket_type
      }
    })
  } catch (error) {
    console.error('Ticket generation error:', error)
    return handleError(error)
  }
}
