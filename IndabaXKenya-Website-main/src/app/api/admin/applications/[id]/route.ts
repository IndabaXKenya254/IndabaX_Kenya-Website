export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE APPLICATION API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/applications/[id] - Get single application
// PATCH /api/admin/applications/[id] - Update application status/notes
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'
import type { ApiSuccessResponse, Application } from '@/types/api'
import { z } from 'zod'

const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  admin_notes: z.string().max(5000).optional(), // Maps to review_notes in DB
})

/**
 * GET /api/admin/applications/[id]
 * Get a single application by ID
 *
 * Returns:
 * - 200 OK: Application data
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

    // Issue #23 FIX: Include event title in the query
    const { data, error } = await supabase
      .from('form_responses')
      .select('*, events(id, title)')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Application fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Application')
    }

    // For reviewers, verify event assignment and permissions
    if (role === 'reviewer') {
      const adminSupabase = createAdminClient()

      const { data: assignment, error: assignmentError } = await adminSupabase
        .from('reviewers')
        .select('event_id, permissions')
        .eq('user_id', user.id)
        .eq('event_id', data.event_id)
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

      const permissions = assignment.permissions as any
      const canView = permissions?.canViewApplications ?? false

      if (!canView) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view this application' },
          { status: 403 }
        )
      }
    }

    const response: ApiSuccessResponse<Application> = {
      success: true,
      data: data as Application,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/applications/[id]
 * Update application status and/or admin notes
 *
 * Request Body:
 * {
 *   "status": "approved" | "rejected" | "pending" (optional),
 *   "admin_notes": "Approved - great proposal!" (optional)
 * }
 *
 * Returns:
 * - 200 OK: Updated application
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 404 Not Found: Application not found
 * - 500 Internal Error: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin or reviewer authentication
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { id } = params
    const { user, role } = authCheck.data

    // Validate request body
    const body = await request.json()
    const validation = updateApplicationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Get application to check event_id
    const { data: application, error: appError } = await supabase
      .from('form_responses')
      .select('id, event_id')
      .eq('id', id)
      .maybeSingle()

    if (appError || !application) {
      return handleNotFound('Application')
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
          { success: false, error: 'You do not have permission to update this application' },
          { status: 403 }
        )
      }

      const permissions = assignment.permissions as any
      const canView = permissions?.canViewApplications ?? false

      if (!canView) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to update this application' },
          { status: 403 }
        )
      }
    }

    // Build update object
    const updateData: any = {}

    if (updates.status) {
      // Note: Only update status_v2, the old 'status' column uses a different enum
      // (completed, in_progress, not_started) which doesn't match our workflow
      updateData.status_v2 = updates.status
      updateData.reviewed_at = new Date().toISOString()
      updateData.reviewed_by = user.id
    }

    if (updates.admin_notes !== undefined) {
      updateData.review_notes = updates.admin_notes // Map admin_notes to review_notes column
    }

    // Update application
    const { data, error } = await supabase
      .from('form_responses')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Application update error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Application')
    }

    const response: ApiSuccessResponse<Application> = {
      success: true,
      data: data as Application,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
