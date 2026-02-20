export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN CONTACT SUBMISSION DETAIL API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/contact-submissions/[id] - Get single submission
// PATCH /api/admin/contact-submissions/[id] - Update submission status
// DELETE /api/admin/contact-submissions/[id] - Delete submission
// Created: Contact form management feature

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse, ContactSubmission } from '@/types/api'

/**
 * GET /api/admin/contact-submissions/[id]
 * Get a single contact submission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Contact submission fetch error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<ContactSubmission> = {
      success: true,
      data: data as ContactSubmission,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/contact-submissions/[id]
 * Update contact submission status and notes
 *
 * Request Body:
 * {
 *   "status": "new" | "read" | "resolved",
 *   "admin_notes": "Optional notes from admin"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate status if provided
    if (body.status && !['new', 'read', 'resolved'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status value',
          },
        },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) {
      updateData.status = body.status

      // Set resolved_at if status is being changed to resolved
      if (body.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = authCheck.data.user.id
      }
    }

    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes
    }

    // Update submission
    const { data, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Contact submission update error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<ContactSubmission> = {
      success: true,
      data: data as ContactSubmission,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/contact-submissions/[id]
 * Delete a contact submission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Contact submission delete error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<{ id: string }> = {
      success: true,
      data: { id: params.id },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
