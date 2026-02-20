export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - GET CHECKED-IN ATTENDEES
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/checkin/attendees?event_id=xxx - Get list of checked-in attendees

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

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

    // Fetch all checked-in tickets for this event
    const { data: tickets, error } = await adminSupabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        attendee_name,
        attendee_email,
        ticket_type,
        checked_in_at,
        checked_in_by,
        status,
        user_profiles!user_id (
          id,
          name,
          email,
          organization
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'checked_in')
      .order('checked_in_at', { ascending: false })

    if (error) {
      console.error('Error fetching checked-in attendees:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendees' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tickets || []
    })
  } catch (error) {
    console.error('Attendees fetch error:', error)
    return handleError(error)
  }
}
