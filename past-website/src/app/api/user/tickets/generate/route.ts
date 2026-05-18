export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER TICKET GENERATION API
// ═══════════════════════════════════════════════════════════════════════
// Allow users to generate tickets for their approved applications

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createTicket } from '@/lib/tickets'

/**
 * POST /api/user/tickets/generate
 * Generate a ticket for an approved application
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { application_id } = body

    if (!application_id) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Fetch user's email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const userEmail = profile?.email || user.email

    // Fetch the application and verify it belongs to the user and is approved
    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        responses,
        status_v2,
        events (
          id,
          title,
          start_date,
          location
        )
      `)
      .eq('id', application_id)
      .eq('respondent_email', userEmail)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is approved
    if (application.status_v2 !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Application must be approved to generate a ticket' },
        { status: 400 }
      )
    }

    // Check if ticket already exists
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number')
      .eq('registration_id', application_id)
      .single()

    if (existingTicket) {
      return NextResponse.json({
        success: true,
        message: 'Ticket already exists',
        data: existingTicket
      })
    }

    // Extract attendee name from respondent_name or form responses
    let attendeeName = application.respondent_name
    if (!attendeeName && application.responses) {
      const responses = application.responses as Record<string, any>
      // Try common name field keys
      attendeeName = responses.name || responses.full_name || responses.fullName ||
                     responses['Full Name'] || responses['Name'] ||
                     // Search for any field containing 'name'
                     Object.entries(responses).find(([key, val]) =>
                       key.toLowerCase().includes('name') && typeof val === 'string' && val.trim()
                     )?.[1] as string
    }
    // Fallback to email username if still no name
    if (!attendeeName) {
      const email = application.respondent_email || userEmail || ''
      attendeeName = email.split('@')[0] || 'Guest'
    }

    // Generate the ticket
    const event = application.events as any
    const ticketResult = await createTicket({
      eventId: application.event_id,
      userId: user.id,
      registrationId: application.id,
      attendeeName: attendeeName,
      attendeeEmail: application.respondent_email || userEmail || '',
      eventTitle: event?.title || 'Event',
      eventDate: event?.start_date || null,
      eventLocation: event?.location || null,
    })

    if (!ticketResult.success) {
      return NextResponse.json(
        { success: false, error: ticketResult.error || 'Failed to generate ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket generated successfully',
      data: ticketResult.ticket
    })
  } catch (error) {
    console.error('Ticket generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
