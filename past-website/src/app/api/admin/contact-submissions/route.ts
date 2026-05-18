export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN CONTACT SUBMISSIONS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/contact-submissions - List all contact submissions
// Created: Contact form management feature

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse, ContactSubmission } from '@/types/api'

/**
 * GET /api/admin/contact-submissions
 * List all contact form submissions for admin
 *
 * Query Parameters:
 * - status: 'new' | 'read' | 'resolved' (optional filter)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && ['new', 'read', 'resolved'].includes(status)) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Contact submissions list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<ContactSubmission[]> = {
      success: true,
      data: (data || []) as ContactSubmission[],
      count: count || 0,
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}
