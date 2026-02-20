export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION TIMELINE API (PHASE 5 - DAY 7)
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/applications/[id]/timeline - Get activity log

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'

/**
 * GET /api/admin/applications/[id]/timeline
 * Fetch activity log for an application
 *
 * Returns:
 * - 200 OK: Activity log entries
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 404 Not Found: Application not found
 * - 500 Internal Error: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin or reviewer authentication
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user, role } = authCheck.data
    const { id } = params

    // Verify application exists and get event_id
    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select('id, event_id')
      .eq('id', id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // For reviewers, verify event assignment and permissions
    if (role === 'reviewer') {
      const adminSupabase = createAdminClient()

      const { data: assignment, error: assignmentError } = await adminSupabase
        .from('reviewers')
        .select('event_id, permissions')
        .eq('user_id', user.id)
        .eq('event_id', application.event_id)
        .maybeSingle()

      if (assignmentError) {
        console.error('Failed to check reviewer assignment:', assignmentError)
        return NextResponse.json(
          { success: false, error: 'Failed to verify reviewer permissions' },
          { status: 500 }
        )
      }

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view this application' },
          { status: 403 }
        )
      }

      // Check if reviewer can view applications
      const permissions = assignment.permissions as any
      const canView = permissions?.canViewApplications ?? false

      if (!canView) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view application timeline' },
          { status: 403 }
        )
      }
    }

    // Fetch activity log
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false })

    if (activitiesError) {
      console.error('Activity log fetch error:', activitiesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activity log' },
        { status: 500 }
      )
    }

    // Transform to timeline format
    const timeline = (activities || []).map((activity: any) => ({
      id: activity.id,
      type: activity.activity_type,
      timestamp: activity.created_at,
      user_email: activity.user_email,
      details: activity.details,
      status: activity.metadata?.new_status || activity.metadata?.status,
    }))

    return NextResponse.json({
      success: true,
      data: timeline
    })
  } catch (error) {
    console.error('Timeline fetch error:', error)
    return handleError(error)
  }
}
