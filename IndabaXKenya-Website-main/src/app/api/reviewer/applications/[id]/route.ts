export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER APPLICATION DETAIL API (PHASE 6)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reviewer/applications/[id] - Get single application for review with permissions

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
  canShortlist?: boolean
  canSendReminders?: boolean
  canRevoke?: boolean
  canSendEmails?: boolean
  canWaitlist?: boolean
}

interface MappedPermissions {
  can_view: boolean
  can_review: boolean
  can_approve: boolean
  can_reject: boolean
  can_view_pii: boolean
  can_view_survey_responses: boolean
  can_view_paper_submissions: boolean
  can_shortlist: boolean
  can_send_reminders: boolean
  can_revoke: boolean
  can_send_emails: boolean
  can_waitlist: boolean
}

// Issue #24 FIX: Map ALL JSONB permissions to boolean format (was only mapping 4 of 11)
function mapPermissions(jsonbPerms: JsonbPermissions): MappedPermissions {
  return {
    can_view: jsonbPerms.canViewApplications ?? false,
    can_review: jsonbPerms.canViewApplications ?? false, // Must be able to view to review
    can_approve: jsonbPerms.canApprove ?? false,
    can_reject: jsonbPerms.canReject ?? false,
    can_view_pii: jsonbPerms.canViewPII ?? true, // Default true for backwards compat
    can_view_survey_responses: jsonbPerms.canViewSurveyResponses ?? true,
    can_view_paper_submissions: jsonbPerms.canViewPaperSubmissions ?? true,
    can_shortlist: jsonbPerms.canShortlist ?? false,
    can_send_reminders: jsonbPerms.canSendReminders ?? false,
    can_revoke: jsonbPerms.canRevoke ?? false,
    can_send_emails: jsonbPerms.canSendEmails ?? false,
    can_waitlist: jsonbPerms.canWaitlist ?? false,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Require reviewer role with role elevation
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
// GET - Get single application with permission checks
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get application
    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select(`
        id,
        template_id,
        event_id,
        user_id,
        respondent_name,
        respondent_email,
        status,
        status_v2,
        response_type,
        responses,
        created_at,
        completed_at,
        reviewed_by,
        reviewed_at,
        review_notes,
        shortlisted_by,
        shortlisted_at,
        events (
          id,
          title
        )
      `)
      .eq('id', params.id)
      .single()

    if (appError) {
      console.error('Error fetching application:', appError)
      return NextResponse.json(
        { success: false, error: `Application not found: ${appError.message}` },
        { status: 404 }
      )
    }

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found (no data returned)' },
        { status: 404 }
      )
    }

    // Issue #21 FIX: Prevent self-review - reviewer cannot view their own application
    if (authCheck.role === 'reviewer' && authCheck.user && application.user_id === authCheck.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot review your own application' },
        { status: 403 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Permission check for reviewers (admins can view all)
    // ═══════════════════════════════════════════════════════════════════════

    let reviewerPermissions: MappedPermissions = {
      can_view: true,
      can_review: true,
      can_approve: true,
      can_reject: true,
      can_view_pii: true,
      can_view_survey_responses: true,
      can_view_paper_submissions: true,
      can_shortlist: true,
      can_send_reminders: true,
      can_revoke: true,
      can_send_emails: true,
      can_waitlist: true,
    }

    if (authCheck.role === 'reviewer') {
      // Check if reviewer is assigned to this application's event
      if (!authCheck.user) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }

      const { data: assignment, error: assignmentError } = await supabase
        .from('reviewers')
        .select('event_id, permissions')
        .eq('user_id', authCheck.user.id)
        .eq('event_id', application.event_id)
        .eq('is_active', true) // Issue #17: Only active assignments
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

      // Map JSONB permissions to boolean format
      const jsonbPerms = assignment.permissions as JsonbPermissions
      reviewerPermissions = mapPermissions(jsonbPerms)

      // Enforce can_view permission
      if (!reviewerPermissions.can_view) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view this application' },
          { status: 403 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Issue #6 FIX: Mask PII when reviewer lacks canViewPII permission
    // ═══════════════════════════════════════════════════════════════════════
    let piiMasked = false
    if (!reviewerPermissions.can_view_pii) {
      piiMasked = true
      // Mask name to first initial + "***"
      if (application.respondent_name) {
        (application as any).respondent_name = application.respondent_name.charAt(0) + '***'
      }
      // Mask email
      if (application.respondent_email) {
        (application as any).respondent_email = '***@***.***'
      }
      // Mask PII fields inside responses JSONB (phone, email-type answers)
      if (application.responses && typeof application.responses === 'object') {
        const masked = { ...(application.responses as Record<string, any>) }
        for (const [key, value] of Object.entries(masked)) {
          if (typeof value === 'string') {
            // Mask values that look like emails
            if (value.includes('@') && value.includes('.')) {
              masked[key] = '***@***.***'
            }
            // Mask values that look like phone numbers (digits with optional + and spaces)
            else if (/^\+?[\d\s()-]{7,}$/.test(value.trim())) {
              masked[key] = '***-***-****'
            }
          }
        }
        ;(application as any).responses = masked
      }
    }

    // Get questions for this template
    let questions: any[] = []
    if (application.template_id) {
      const { data: questionData } = await supabase
        .from('form_questions')
        .select('id, title, description, type, is_required, order_index, config')
        .eq('template_id', application.template_id)
        .order('order_index', { ascending: true })

      questions = questionData || []
    }

    // Return application with permission info and questions
    return NextResponse.json({
      success: true,
      data: {
        ...application,
        questions: questions,
        reviewer_permissions: reviewerPermissions,
        pii_masked: piiMasked,
      }
    })
  } catch (error) {
    console.error('Reviewer application detail error:', error)
    return handleError(error)
  }
}
