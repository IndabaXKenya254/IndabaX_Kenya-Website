export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER APPLICATIONS API (PHASE 6) - FIXED
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reviewer/applications - Get applications for reviewer with event restrictions

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Map JSONB permissions to boolean format
// ═══════════════════════════════════════════════════════════════════════════

interface JsonbPermissions {
  canViewApplications?: boolean
  canApprove?: boolean
  canReject?: boolean
  canViewPII?: boolean
  canViewSurveyResponses?: boolean
  canViewPaperSubmissions?: boolean
}

interface MappedPermissions {
  can_view: boolean
  can_review: boolean
  can_approve: boolean
  can_reject: boolean
  can_view_pii: boolean  // Issue #6 FIX: Add PII permission
}

function mapPermissions(jsonbPerms: JsonbPermissions): MappedPermissions {
  return {
    can_view: jsonbPerms.canViewApplications ?? false,
    can_review: jsonbPerms.canViewApplications ?? false, // Must be able to view to review
    can_approve: jsonbPerms.canApprove ?? false,
    can_reject: jsonbPerms.canReject ?? false,
    can_view_pii: jsonbPerms.canViewPII ?? false,  // Issue #6 FIX: Map PII permission
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Require reviewer role and get assignments
// ═══════════════════════════════════════════════════════════════════════════

async function requireReviewer(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: true,
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
  }

  // Check if user is reviewer or admin
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check for role elevation (applicant -> reviewer)
  let finalRole = profile?.role || 'applicant'
  if (finalRole === 'applicant') {
    const { data: reviewerAssignment } = await adminSupabase
      .from('reviewers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (reviewerAssignment) {
      finalRole = 'reviewer'
    }
  }

  if (!finalRole || !['reviewer', 'admin'].includes(finalRole)) {
    return {
      error: true,
      response: NextResponse.json(
        { success: false, error: 'Not authorized. Reviewer or Admin role required.' },
        { status: 403 }
      )
    }
  }

  return { error: false, user, role: finalRole }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Get applications for reviewer with event restrictions and permissions
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const authCheck = await requireReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createAdminClient()

    // Issue #23 FIX: Update reviewer last_active_at
    if (authCheck.role === 'reviewer' && authCheck.user) {
      await supabase
        .from('reviewers')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', authCheck.user.id)
        .eq('is_active', true)
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const eventId = searchParams.get('event_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // ═══════════════════════════════════════════════════════════════════════
    // Get reviewer assignments and permissions (from JSONB column)
    // ═══════════════════════════════════════════════════════════════════════

    let allowedEventIds: string[] = []
    let reviewerPermissions: Record<string, MappedPermissions> = {}

    if (authCheck.role === 'reviewer') {
      if (!authCheck.user) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }

      const { data: assignments, error: assignmentError } = await supabase
        .from('reviewers')
        .select(`
          event_id,
          permissions,
          events!inner (
            id,
            title
          )
        `)
        .eq('user_id', authCheck.user.id)
        .eq('is_active', true) // Issue #17: Only active assignments

      if (assignmentError) {
        console.error('Failed to fetch reviewer assignments:', assignmentError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch reviewer permissions' },
          { status: 500 }
        )
      }

      if (!assignments || assignments.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'You are not assigned to review any events yet'
        })
      }

      // Extract event IDs and map permissions
      allowedEventIds = assignments.map((a: any) => a.event_id)

      // Build permissions map (event_id -> mapped permissions)
      assignments.forEach((assignment: any) => {
        const jsonbPerms = assignment.permissions as JsonbPermissions
        reviewerPermissions[assignment.event_id] = mapPermissions(jsonbPerms)
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Build applications query with event restrictions
    // FIXED: Use applications_with_locks view instead of form_responses table
    // ═══════════════════════════════════════════════════════════════════════

    let query = supabase
      .from('applications_with_locks')
      .select(`
        id,
        respondent_name,
        respondent_email,
        status,
        status_v2,
        response_type,
        completion_percentage,
        created_at,
        completed_at,
        reviewed_by,
        reviewed_at,
        is_locked,
        locked_by_user_id,
        lock_expires_at,
        locked_by_name,
        locked_by_email,
        event_id,
        events!inner (
          id,
          title,
          slug
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by reviewer's assigned events (for non-admins)
    if (authCheck.role === 'reviewer' && allowedEventIds.length > 0) {
      query = query.in('event_id', allowedEventIds)
    }

    // Issue #33 FIX: Exclude survey responses from main list (they're sub-items of applications)
    query = query.neq('response_type', 'detailed_survey')

    // Issue #21 FIX: Prevent self-review - exclude reviewer's own applications
    if (authCheck.role === 'reviewer' && authCheck.user) {
      query = query.neq('user_id', authCheck.user.id)
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status_v2', ['interested', 'pending'])
      } else {
        query = query.eq('status_v2', status)
      }
    }

    // Filter by specific event
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Applications query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Transform data to include permissions (lock info already included from view)
    // Issue #6 FIX: Mask PII when reviewer lacks canViewPII permission
    // ═══════════════════════════════════════════════════════════════════════

    const transformedApplications = (applications || []).map((app: any) => {
      // Get permissions for this application's event
      const eventPerms = authCheck.role === 'reviewer'
        ? (reviewerPermissions[app.event_id] || {
            can_view: false,
            can_review: false,
            can_approve: false,
            can_reject: false,
            can_view_pii: false,
          })
        : {
            can_view: true,
            can_review: true,
            can_approve: true,
            can_reject: true,
            can_view_pii: true,  // Admins can always view PII
          }

      // Issue #6 FIX: Mask PII if reviewer doesn't have canViewPII permission
      let maskedName = app.respondent_name
      let maskedEmail = app.respondent_email
      let piiMasked = false

      if (authCheck.role === 'reviewer' && !eventPerms.can_view_pii) {
        piiMasked = true
        // Mask name: Show first letter + asterisks
        if (app.respondent_name) {
          maskedName = app.respondent_name.charAt(0) + '***'
        }
        // Mask email: Show as ***@***.***
        if (app.respondent_email) {
          maskedEmail = '***@***.***'
        }
      }

      return {
        ...app,
        respondent_name: maskedName,
        respondent_email: maskedEmail,
        pii_masked: piiMasked,
        // Lock fields come directly from applications_with_locks view
        is_locked: app.is_locked || false,
        locked_by_name: app.locked_by_name || null,
        locked_by_email: app.locked_by_email || null,
        lock_expires_at: app.lock_expires_at,
        // Include reviewer permissions for this event
        reviewer_permissions: eventPerms,
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedApplications,
      total: count || 0,
      reviewer_permissions: reviewerPermissions, // Include permissions map in response
    })
  } catch (error) {
    console.error('Reviewer applications error:', error)
    return handleError(error)
  }
}
