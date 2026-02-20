export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER REGISTRATIONS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/user/registrations - Get current user's event registrations
// Phase 2: Authentication Extension

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/user/registrations
 * Get current authenticated user's event registrations
 *
 * Query Parameters:
 * - status: Filter by registration status (optional)
 *
 * Returns:
 * - 200 OK: List of registrations with event details
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    // Get authenticated user (REQUIRED)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Check if requesting different user's email (admin only)
    const requestedEmail = searchParams.get('email')
    let respondentEmail = user.email

    if (requestedEmail && requestedEmail !== user.email) {
      // Verify user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only view your own registrations',
            },
          },
          { status: 403 }
        )
      }

      // Admin can view any user's registrations
      respondentEmail = requestedEmail
    }

    // Query form_responses table (Phase 4)
    // First try to find by user_id (most reliable for authenticated users)
    let responses = null
    let fetchError = null

    // Try user_id first if we have the user
    const { data: byUserId, error: userIdError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        response_type,
        status,
        status_v2,
        reviewed_by,
        shortlisted_by,
        approved_by,
        rejected_by,
        completed_at,
        created_at,
        event:events!inner(
          id,
          slug,
          title,
          description,
          start_date,
          end_date,
          location,
          featured_image,
          registration_enabled,
          registration_deadline
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (byUserId && byUserId.length > 0) {
      responses = byUserId
    } else {
      // Fallback to email for legacy responses
      const { data: byEmail, error: emailError } = await supabase
        .from('form_responses')
        .select(`
          id,
          event_id,
          response_type,
          status,
          status_v2,
          reviewed_by,
          shortlisted_by,
          approved_by,
          rejected_by,
          completed_at,
          created_at,
          event:events!inner(
            id,
            slug,
            title,
            description,
            start_date,
            end_date,
            location,
            featured_image,
            registration_enabled,
            registration_deadline
          )
        `)
        .eq('respondent_email', respondentEmail)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      responses = byEmail
      fetchError = emailError
    }

    if (fetchError) {
      console.error('Registrations fetch error:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch registrations',
            details: fetchError.message
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<typeof responses> = {
      success: true,
      data: responses || [],
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
