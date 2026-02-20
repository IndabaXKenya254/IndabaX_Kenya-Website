// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPER ASSIGNMENTS API
// ═══════════════════════════════════════════════════════════════════════
// Issue #38: Assign applications to reviewers
// Features:
//   - List assignments
//   - Create manual assignments
//   - Random bulk assignments
//   - Prevent duplicate assignments
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List assignments for an event or reviewer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const reviewerId = searchParams.get('reviewer_id')

    let query = supabaseAdmin
      .from('paper_assignments')
      .select(`
        *,
        reviewer:reviewers(
          id,
          user_id,
          user:user_profiles(id, email, full_name)
        ),
        application:form_responses(
          id,
          status,
          submitted_at,
          responses,
          user:user_profiles(id, email, full_name)
        )
      `)
      .order('assigned_at', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching paper assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST - Create assignments (manual or random)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,           // 'manual' or 'random'
      reviewer_id,
      application_ids,  // Array of application IDs for manual
      event_id,
      count,           // Number of random assignments
      assigned_by
    } = body

    if (!reviewer_id || !event_id) {
      return NextResponse.json(
        { success: false, error: 'reviewer_id and event_id are required' },
        { status: 400 }
      )
    }

    if (action === 'random') {
      // Random assignment using database function
      const { data, error } = await supabaseAdmin.rpc('assign_random_applications', {
        p_reviewer_id: reviewer_id,
        p_event_id: event_id,
        p_count: count || 10,
        p_assigned_by: assigned_by
      })

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${data} applications randomly`,
        assigned_count: data
      })
    } else {
      // Manual assignment
      if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'application_ids array is required for manual assignment' },
          { status: 400 }
        )
      }

      // Check for existing assignments to prevent duplicates
      const { data: existing } = await supabaseAdmin
        .from('paper_assignments')
        .select('application_id')
        .eq('reviewer_id', reviewer_id)
        .in('application_id', application_ids)

      const existingIds = new Set((existing || []).map(e => e.application_id))
      const newApplicationIds = application_ids.filter(id => !existingIds.has(id))

      if (newApplicationIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All selected applications are already assigned to this reviewer',
          assigned_count: 0,
          skipped_count: application_ids.length
        })
      }

      // Create assignments
      const assignments = newApplicationIds.map(appId => ({
        reviewer_id,
        application_id: appId,
        event_id,
        assigned_by
      }))

      const { data, error } = await supabaseAdmin
        .from('paper_assignments')
        .insert(assignments)
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${data.length} applications`,
        assigned_count: data.length,
        skipped_count: application_ids.length - newApplicationIds.length,
        data
      })
    }
  } catch (error: any) {
    console.error('Error creating paper assignments:', error)

    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Some applications are already assigned to this reviewer' },
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
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('paper_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully'
    })
  } catch (error) {
    console.error('Error deleting paper assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
