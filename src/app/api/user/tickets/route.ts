export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER TICKETS API
// ═══════════════════════════════════════════════════════════════════════
// Fetch tickets for the currently logged-in user

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

/**
 * GET /api/user/tickets
 * Fetches all tickets for the currently authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user's email from user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const email = profile?.email || user.email

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      )
    }

    // Use admin client for events join to bypass RLS (allows viewing events with any status)
    const adminSupabase = createAdminClient()

    // Fetch the user's form responses to get registration IDs
    const { data: formResponses } = await supabase
      .from('form_responses')
      .select('id')
      .eq('respondent_email', email)

    const registrationIds = formResponses?.map(r => r.id) || []

    // Fetch tickets linked to registrations (from applications)
    let ticketsFromRegistrations: any[] = []
    if (registrationIds.length > 0) {
      const { data: regTickets } = await adminSupabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          qr_code_data,
          pdf_url,
          is_valid,
          status,
          generated_at,
          downloaded_at,
          download_count,
          checked_in_at,
          event_id,
          registration_id,
          paper_id,
          user_id,
          attendee_name,
          attendee_email,
          attendee_organization,
          ticket_type,
          events (
            id,
            slug,
            title,
            description,
            start_date,
            end_date,
            location,
            featured_image
          )
        `)
        .in('registration_id', registrationIds)

      ticketsFromRegistrations = regTickets || []
    }

    // Fetch tickets linked directly to user_id (from paper submissions)
    const { data: ticketsFromUserId } = await adminSupabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        qr_code_data,
        pdf_url,
        is_valid,
        status,
        generated_at,
        downloaded_at,
        download_count,
        checked_in_at,
        event_id,
        registration_id,
        paper_id,
        user_id,
        attendee_name,
        attendee_email,
        attendee_organization,
        ticket_type,
        events (
          id,
          slug,
          title,
          description,
          start_date,
          end_date,
          location,
          featured_image
        )
      `)
      .eq('user_id', user.id)

    // Combine and deduplicate tickets by ID
    const allTickets = [...ticketsFromRegistrations, ...(ticketsFromUserId || [])]
    const uniqueTickets = allTickets.reduce((acc: any[], ticket) => {
      if (!acc.find(t => t.id === ticket.id)) {
        acc.push(ticket)
      }
      return acc
    }, [])

    // Sort by generated_at descending
    const tickets = uniqueTickets.sort((a, b) =>
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
    )

    return NextResponse.json({
      success: true,
      data: tickets
    })
  } catch (error) {
    console.error('User tickets API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
