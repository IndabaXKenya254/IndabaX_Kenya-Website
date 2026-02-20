export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL LOGS API (PHASE 7 - DAY 3)
// ═══════════════════════════════════════════════════════════════════════
// Fetch email logs

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/admin/emails/logs?page=1&limit=10
 * Get email logs with server-side pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get pagination params from URL
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Check if user is admin (optimized - single query)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parallel execution: Check admin role, fetch logs, and get total count
    const [profileResult, logsResult, countResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single(),
      supabase
        .from('email_logs')
        .select(`
          id,
          recipient_email,
          recipient_name,
          subject,
          status,
          sent_at,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
    ])

    // Check admin access
    if (!profileResult.data || profileResult.data.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Check for errors in logs query
    if (logsResult.error) {
      console.error('Failed to fetch email logs:', logsResult.error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email logs' },
        { status: 500 }
      )
    }

    // Get total count
    const totalCount = countResult.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Return with cache headers for 30 seconds
    return NextResponse.json(
      {
        success: true,
        data: logsResult.data || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30'
        }
      }
    )
  } catch (error) {
    console.error('Email logs fetch error:', error)
    return handleError(error)
  }
}
