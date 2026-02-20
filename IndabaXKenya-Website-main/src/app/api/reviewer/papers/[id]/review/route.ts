// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER PAPER REVIEW API
// ═══════════════════════════════════════════════════════════════════════
// Submit/update review feedback for an assigned paper
// NOTE: Reviewers can only add comments/recommendations, NOT approve/reject

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get review for a specific paper
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: paperId } = await params
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

    // Check if reviewer is assigned to this paper
    const { data: assignment } = await adminSupabase
      .from('paper_reviewer_assignments')
      .select('id, review_status')
      .eq('paper_id', paperId)
      .eq('reviewer_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to review this paper' },
        { status: 403 }
      )
    }

    // Get existing review
    const { data: review } = await adminSupabase
      .from('paper_reviews')
      .select('*')
      .eq('paper_id', paperId)
      .eq('reviewer_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: review || null,
      assignment
    })
  } catch (error) {
    console.error('Error fetching paper review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

// POST/PUT - Submit or update review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: paperId } = await params
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

    // Issue #23 FIX: Update reviewer last_active_at
    await adminSupabase
      .from('reviewers')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const body = await request.json()
    const {
      rating,
      comments,
      strengths,
      weaknesses,
      recommendation,  // 'accept', 'revise', 'reject' - RECOMMENDATION only, not decision
      confidence
    } = body

    // Check if reviewer is assigned to this paper
    const { data: assignment } = await adminSupabase
      .from('paper_reviewer_assignments')
      .select('id')
      .eq('paper_id', paperId)
      .eq('reviewer_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to review this paper' },
        { status: 403 }
      )
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate confidence
    if (confidence && (confidence < 1 || confidence > 5)) {
      return NextResponse.json(
        { success: false, error: 'Confidence must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate recommendation
    if (recommendation && !['accept', 'revise', 'reject'].includes(recommendation)) {
      return NextResponse.json(
        { success: false, error: 'Recommendation must be accept, revise, or reject' },
        { status: 400 }
      )
    }

    // Upsert review (insert or update)
    const { data: review, error: reviewError } = await adminSupabase
      .from('paper_reviews')
      .upsert({
        paper_id: paperId,
        reviewer_id: user.id,
        assignment_id: assignment.id,
        rating,
        comments,
        strengths,
        weaknesses,
        recommendation,
        confidence,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'paper_id,reviewer_id'
      })
      .select()
      .single()

    if (reviewError) throw reviewError

    // Update assignment status
    const newStatus = rating && recommendation ? 'completed' : 'in_progress'
    await adminSupabase
      .from('paper_reviewer_assignments')
      .update({
        review_status: newStatus,
        reviewed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', assignment.id)

    return NextResponse.json({
      success: true,
      message: 'Review saved successfully',
      data: review
    })
  } catch (error: any) {
    console.error('Error saving paper review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save review' },
      { status: 500 }
    )
  }
}
