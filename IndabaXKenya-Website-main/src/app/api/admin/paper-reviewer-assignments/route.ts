// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER REVIEWER ASSIGNMENTS API
// ═══════════════════════════════════════════════════════════════════════
// Assign papers to reviewers for blind review
// Features:
//   - List paper assignments
//   - Create manual assignments (one reviewer per paper)
//   - Random bulk assignments (10 or 20 papers)
//   - Prevent duplicate assignments (UNIQUE on paper_id)
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - List paper assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const reviewerId = searchParams.get('reviewer_id')
    const status = searchParams.get('status')

    // First, fetch assignments with papers and events
    let query = supabase
      .from('paper_reviewer_assignments')
      .select(`
        *,
        papers (
          id,
          title,
          abstract,
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
      .order('assigned_at', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId)
    }

    if (status) {
      query = query.eq('review_status', status)
    }

    const { data, error } = await query

    if (error) throw error

    // Fetch reviewer info from user_profiles
    const reviewerIds = Array.from(new Set((data || []).map((a: any) => a.reviewer_id).filter(Boolean)))
    let reviewerMap = new Map()

    if (reviewerIds.length > 0) {
      const { data: reviewers } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', reviewerIds)

      reviewerMap = new Map((reviewers || []).map((r: any) => [r.id, r]))
    }

    // Merge reviewer info into assignments
    const assignmentsWithReviewers = (data || []).map((assignment: any) => ({
      ...assignment,
      reviewer: reviewerMap.get(assignment.reviewer_id) || null
    }))

    return NextResponse.json({
      success: true,
      data: assignmentsWithReviewers
    })
  } catch (error) {
    console.error('Error fetching paper reviewer assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST - Create assignments (manual or random)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const {
      action,        // 'manual' or 'random'
      reviewer_id,
      paper_ids,     // Array of paper IDs for manual assignment
      event_id,
      count,         // Number of random assignments (10 or 20)
      assigned_by
    } = body

    if (!reviewer_id || !event_id) {
      return NextResponse.json(
        { success: false, error: 'reviewer_id and event_id are required' },
        { status: 400 }
      )
    }

    if (action === 'random') {
      // Use database function for random assignment
      const { data, error } = await supabase.rpc('assign_random_papers', {
        p_reviewer_id: reviewer_id,
        p_event_id: event_id,
        p_count: count || 10
      })

      if (error) throw error

      const result = data?.[0] || { assigned_count: 0, paper_ids: [] }

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${result.assigned_count} papers randomly`,
        assigned_count: result.assigned_count,
        paper_ids: result.paper_ids
      })
    } else {
      // Manual assignment
      if (!paper_ids || !Array.isArray(paper_ids) || paper_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'paper_ids array is required for manual assignment' },
          { status: 400 }
        )
      }

      // Check for existing assignments (papers can only have ONE reviewer)
      const { data: existing } = await supabase
        .from('paper_reviewer_assignments')
        .select('paper_id')
        .in('paper_id', paper_ids)

      const assignedPaperIds = new Set((existing || []).map((e: { paper_id: string }) => e.paper_id))
      const availablePaperIds = paper_ids.filter(id => !assignedPaperIds.has(id))

      if (availablePaperIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'All selected papers are already assigned to reviewers',
          skipped_count: paper_ids.length
        }, { status: 400 })
      }

      // Create assignments
      const assignments = availablePaperIds.map(paperId => ({
        paper_id: paperId,
        reviewer_id,
        event_id,
        assigned_by
      }))

      const { data, error } = await supabase
        .from('paper_reviewer_assignments')
        .insert(assignments)
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${data.length} papers`,
        assigned_count: data.length,
        skipped_count: paper_ids.length - availablePaperIds.length,
        data
      })
    }
  } catch (error: any) {
    console.error('Error creating paper reviewer assignments:', error)

    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'This paper is already assigned to a reviewer' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create assignments' },
      { status: 500 }
    )
  }
}

// DELETE - Remove an assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('paper_reviewer_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully'
    })
  } catch (error) {
    console.error('Error deleting paper reviewer assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
