export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REVIEWER NOTES API
// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/reviewer/applications/[id]/notes - Save reviewer notes/recommendation

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

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
// PATCH - Save reviewer notes/recommendation
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(
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

    const body = await request.json()
    const { notes } = body

    if (notes === undefined) {
      return NextResponse.json(
        { success: false, error: 'Notes field is required' },
        { status: 400 }
      )
    }

    // Get the application to check permissions
    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select('id, event_id, user_id')
      .eq('id', params.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Issue #21 FIX: Prevent self-review
    if (authCheck.role === 'reviewer' && authCheck.user && application.user_id === authCheck.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot review your own application' },
        { status: 403 }
      )
    }

    // Check if reviewer is assigned to this application's event
    if (authCheck.role === 'reviewer') {
      const { data: assignment, error: assignmentError } = await supabase
        .from('reviewers')
        .select('event_id, permissions')
        .eq('user_id', authCheck.user!.id)
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
          { success: false, error: 'You do not have permission to review this application' },
          { status: 403 }
        )
      }

      // Issue #24 FIX: Check specific canComment permission (not just canViewApplications)
      const permissions = assignment.permissions as any
      const canComment = permissions?.canComment ?? false

      if (!canComment) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to add notes to this application. Contact an admin to enable the "Add Comments" permission.' },
          { status: 403 }
        )
      }
    }

    // Update the notes
    const { data: updatedApp, error: updateError } = await supabase
      .from('form_responses')
      .update({
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: authCheck.user!.id
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating notes:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedApp,
      message: 'Notes saved successfully'
    })
  } catch (error) {
    console.error('Reviewer notes save error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
