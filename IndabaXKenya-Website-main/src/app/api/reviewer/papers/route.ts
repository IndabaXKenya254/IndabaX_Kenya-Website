// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER PAPERS API
// ═══════════════════════════════════════════════════════════════════════
// Get papers assigned to the current reviewer (with blind review support)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const adminSupabase = createAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')

    // Get assignments for this reviewer
    let query = adminSupabase
      .from('paper_reviewer_assignments')
      .select(`
        id,
        paper_id,
        event_id,
        review_status,
        assigned_at,
        reviewed_at,
        papers (
          id,
          title,
          abstract,
          keywords,
          paper_url,
          status,
          submitted_at,
          user_id
        ),
        events (
          id,
          title,
          paper_review_mode
        )
      `)
      .eq('reviewer_id', user.id)
      .order('assigned_at', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (status) {
      query = query.eq('review_status', status)
    }

    const { data: assignments, error } = await query

    if (error) throw error

    // Get any existing reviews by this reviewer
    const paperIds = (assignments || []).map((a: any) => a.paper_id)
    const { data: reviews } = await adminSupabase
      .from('paper_reviews')
      .select('*')
      .eq('reviewer_id', user.id)
      .in('paper_id', paperIds)

    const reviewMap = new Map((reviews || []).map((r: any) => [r.paper_id, r]))

    // Process assignments - hide author info based on review mode
    const processedAssignments = (assignments || []).map((assignment: any) => {
      const event = assignment.events as any
      const paper = assignment.papers as any
      const isBlindReview = event?.paper_review_mode !== 'open'

      // Get existing review if any
      const existingReview = reviewMap.get(assignment.paper_id)

      return {
        ...assignment,
        papers: {
          ...paper,
          // Hide author info in blind review mode
          user_id: isBlindReview ? null : paper?.user_id,
          author_hidden: isBlindReview
        },
        existing_review: existingReview || null
      }
    })

    return NextResponse.json({
      success: true,
      data: processedAssignments
    })
  } catch (error) {
    console.error('Error fetching reviewer papers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assigned papers' },
      { status: 500 }
    )
  }
}
