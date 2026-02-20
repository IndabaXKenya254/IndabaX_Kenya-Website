export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER STATS API
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reviewer/stats - Get reviewer dashboard statistics

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

    // Issue #23 FIX: Update reviewer last_active_at
    await adminSupabase
      .from('reviewers')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // ═══════════════════════════════════════════════════════════════════════
    // Paper Review Stats
    // ═══════════════════════════════════════════════════════════════════════

    const { data: paperStats, error: paperError } = await adminSupabase
      .from('paper_reviewer_assignments')
      .select('review_status, review_score')
      .eq('reviewer_id', user.id)

    let paperReviewStats = {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      average_score: 0
    }

    if (paperStats && !paperError) {
      paperReviewStats.total = paperStats.length
      paperReviewStats.pending = paperStats.filter((p: any) => p.review_status === 'pending').length
      paperReviewStats.in_progress = paperStats.filter((p: any) => p.review_status === 'in_progress').length
      paperReviewStats.completed = paperStats.filter((p: any) => p.review_status === 'completed').length

      const scoresWithValues = paperStats.filter((p: any) => p.review_score !== null)
      if (scoresWithValues.length > 0) {
        const totalScore = scoresWithValues.reduce((sum: number, p: any) => sum + (p.review_score || 0), 0)
        paperReviewStats.average_score = Math.round((totalScore / scoresWithValues.length) * 10) / 10
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Application Review Stats (based on reviewer assignments)
    // ═══════════════════════════════════════════════════════════════════════

    // Get events the reviewer is assigned to
    const { data: reviewerAssignments, error: assignmentError } = await adminSupabase
      .from('reviewers')
      .select('event_id, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true) // Issue #17: Only active assignments

    let applicationStats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
      events_assigned: 0
    }

    if (reviewerAssignments && reviewerAssignments.length > 0 && !assignmentError) {
      applicationStats.events_assigned = reviewerAssignments.length

      // Get event IDs where reviewer can view applications
      const eventIdsWithViewPermission = reviewerAssignments
        .filter((a: any) => a.permissions?.canViewApplications === true)
        .map((a: any) => a.event_id)

      if (eventIdsWithViewPermission.length > 0) {
        // Get application counts for assigned events
        const { data: applications, error: appError } = await adminSupabase
          .from('form_responses')
          .select('status_v2')
          .in('event_id', eventIdsWithViewPermission)

        if (applications && !appError) {
          applicationStats.total = applications.length
          applicationStats.pending = applications.filter((a: any) =>
            ['interested', 'pending', 'shortlisted', 'survey_sent', 'survey_complete'].includes(a.status_v2)
          ).length
          applicationStats.reviewed = applications.filter((a: any) =>
            ['approved', 'rejected', 'waitlisted'].includes(a.status_v2)
          ).length
          applicationStats.approved = applications.filter((a: any) => a.status_v2 === 'approved').length
          applicationStats.rejected = applications.filter((a: any) => a.status_v2 === 'rejected').length
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Recent Activity
    // ═══════════════════════════════════════════════════════════════════════

    // Get recent paper reviews
    const { data: recentPaperReviews } = await adminSupabase
      .from('paper_reviewer_assignments')
      .select(`
        id,
        review_status,
        reviewed_at,
        papers (
          id,
          title
        )
      `)
      .eq('reviewer_id', user.id)
      .not('reviewed_at', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        papers: paperReviewStats,
        applications: applicationStats,
        recent_activity: {
          paper_reviews: recentPaperReviews || []
        }
      }
    })
  } catch (error) {
    console.error('Error fetching reviewer stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviewer statistics' },
      { status: 500 }
    )
  }
}
