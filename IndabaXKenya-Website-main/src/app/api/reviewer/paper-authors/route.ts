// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER PAPER AUTHORS API
// ═══════════════════════════════════════════════════════════════════════
// Fetch author info for papers assigned to the reviewer (open review only)
// Uses admin client to bypass RLS for secure author lookup

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { authorIds, eventId } = body

    if (!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'authorIds array is required' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Verify the event has open review mode
    const { data: event, error: eventError } = await adminSupabase
      .from('events')
      .select('paper_review_mode')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.paper_review_mode !== 'open') {
      // Don't return author info for blind reviews
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Author info hidden for blind review'
      })
    }

    // Verify the user is a reviewer for papers by these authors in this event
    const { data: assignments, error: assignmentError } = await adminSupabase
      .from('paper_reviewer_assignments')
      .select(`
        paper_id,
        papers!inner (
          user_id
        )
      `)
      .eq('reviewer_id', user.id)
      .eq('event_id', eventId)

    if (assignmentError) {
      throw assignmentError
    }

    // Get the author IDs that the reviewer is actually assigned to review
    const allowedAuthorIds = new Set(
      (assignments || []).map((a: any) => a.papers?.user_id).filter(Boolean)
    )

    // Filter to only return authors the reviewer is allowed to see
    const filteredAuthorIds = authorIds.filter(id => allowedAuthorIds.has(id))

    if (filteredAuthorIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Fetch author profiles
    const { data: authors, error: authorsError } = await adminSupabase
      .from('user_profiles')
      .select('id, name, email')
      .in('id', filteredAuthorIds)

    if (authorsError) {
      throw authorsError
    }

    return NextResponse.json({
      success: true,
      data: authors || []
    })
  } catch (error) {
    console.error('Error fetching paper authors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch authors' },
      { status: 500 }
    )
  }
}
