// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN APPLICATIONS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/applications - List all applications with filters
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse, Application } from '@/types/api'

/**
 * GET /api/admin/applications
 * List all applications with optional filters
 *
 * Query Parameters:
 * - type: 'registration' | 'call_for_papers' (optional)
 * - status: 'pending' | 'accepted' | 'rejected' (optional)
 * - event_id: uuid (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 *
 * Returns:
 * - 200 OK: List of applications
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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const eventId = searchParams.get('event_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type && (type === 'registration' || type === 'call_for_papers')) {
      query = query.eq('application_type', type)
    }

    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query = query.eq('status', status)
    }

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Applications list error:', error)
      return handleDatabaseError(error)
    }

    // Return results with pagination info
    const response: ApiSuccessResponse<Application[]> = {
      success: true,
      data: (data || []) as Application[],
      count: count || 0,
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }
    headers.set('X-Limit', limit.toString())
    headers.set('X-Offset', offset.toString())

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}
