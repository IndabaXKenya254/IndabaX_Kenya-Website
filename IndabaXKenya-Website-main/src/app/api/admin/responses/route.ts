export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN RESPONSES API
// ═══════════════════════════════════════════════════════════════════════
// Admin endpoint to view all form responses

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/admin/responses
 * Get all form responses (admin only)
 *
 * Query Parameters:
 * - event_id: Filter by event (optional)
 * - status: Filter by status (draft, in_progress, completed)
 * - search: Search by respondent name or email
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Check if user is admin
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
            message: 'Admin access required',
          },
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const event_id = searchParams.get('event_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('form_responses')
      .select(`
        id,
        template_id,
        event_id,
        user_id,
        response_type,
        respondent_email,
        respondent_name,
        status,
        is_complete,
        completion_percentage,
        started_at,
        completed_at,
        last_saved_at,
        created_at,
        event:events!inner(
          id,
          slug,
          title,
          start_date,
          end_date,
          location
        ),
        template:form_templates(
          id,
          name
        )
      `, { count: 'exact' })

    // Apply filters
    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`respondent_name.ilike.%${search}%,respondent_email.ilike.%${search}%`)
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: responses, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Responses fetch error:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch responses',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: responses || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleError(error)
  }
}
