export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN APPLICATIONS API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/applications - List all registrations with lock status

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * GET /api/admin/applications
 * List all registrations (applications) with lock status
 *
 * Query Parameters:
 * - status: 'interested' | 'pending' | 'shortlisted' | 'survey_sent' | 'survey_completed' | 'approved' | 'rejected' | 'attended' (optional)
 * - event_id: uuid (optional)
 * - search: string - search by name or email (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 *
 * Returns:
 * - 200 OK: List of registrations with lock status
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not an admin
 * - 500 Internal Error: Server error
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const status = searchParams.get('status')
    const eventId = searchParams.get('event_id')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query using the applications_with_locks view (now based on registrations)
    let query = supabase
      .from('applications_with_locks')
      .select(`
        id,
        respondent_name,
        respondent_email,
        status_v2,
        completion_percentage,
        created_at,
        completed_at,
        is_locked,
        locked_by_name,
        locked_by_email,
        lock_expires_at,
        event_id,
        template_id,
        reviewed_by,
        reviewed_at,
        shortlisted_by,
        shortlisted_at,
        deadline_at,
        access_token
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter (supports single or comma-separated multiple statuses)
    if (status) {
      const validStatuses = [
        'interested',
        'pending',
        'shortlisted',
        'survey_sent',
        'survey_completed',
        'approved',
        'rejected',
        'attended'
      ]

      // Check if multiple statuses are provided (comma-separated)
      const statusList = status.split(',').map(s => s.trim()).filter(s => validStatuses.includes(s))

      if (statusList.length === 1) {
        // Single status - use eq
        query = query.eq('status_v2', statusList[0])
      } else if (statusList.length > 1) {
        // Multiple statuses - use in
        query = query.in('status_v2', statusList)
      }
    }

    // Apply event filter
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    // Issue #33 FIX: Exclude detailed_survey responses from main applications list
    // Survey responses are linked to the original application and should not appear as duplicates
    const responseType = searchParams.get('response_type')
    if (responseType) {
      query = query.eq('response_type', responseType)
    } else {
      query = query.neq('response_type', 'detailed_survey')
    }

    // Apply search filter (name or email)
    if (search) {
      query = query.or(`respondent_name.ilike.%${search}%,respondent_email.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Applications list error:', error)
      return handleDatabaseError(error)
    }

    // Fetch related event details for each application
    const eventIds = data ? Array.from(new Set(data.map(app => app.event_id).filter(Boolean))) : []
    const { data: events } = await supabase
      .from('events')
      .select('id, title, slug, start_date')
      .in('id', eventIds)

    // Map events to applications
    const applicationsWithEvents = data?.map(app => ({
      ...app,
      event: events?.find(e => e.id === app.event_id) || null
    })) || []

    // Return results with pagination info
    const response = {
      success: true,
      data: applicationsWithEvents,
      count: count || 0,
      pagination: {
        total: count || 0,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }
    headers.set('X-Limit', limit.toString())
    headers.set('X-Offset', offset.toString())

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    console.error('Applications API error:', error)
    return handleError(error)
  }
}
