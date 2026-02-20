export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN STATS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/stats - List all stats
// POST /api/admin/stats - Create new stat

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'
import type { Stat } from '@/app/api/stats/route'

/**
 * GET /api/admin/stats
 * List all stats (including inactive)
 *
 * Query Parameters:
 * - is_active: 'true' | 'false' (optional)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const isActive = searchParams.get('is_active')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('stats')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Stats list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Stat[]> = {
      success: true,
      data: (data || []) as Stat[],
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

/**
 * POST /api/admin/stats
 * Create a new stat
 *
 * Request Body:
 * {
 *   "label": "Attendees",
 *   "value": 500,
 *   "suffix": "+" (optional, default: ""),
 *   "icon": "icofont-users-alt-4" (default: "icofont-chart-bar-graph"),
 *   "color": "#BE511F" (default: "#006700"),
 *   "display_order": 0 (default: 0),
 *   "is_active": true/false (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Basic validation
    if (!body.label || body.value === undefined) {
      return handleValidationError('Missing required fields: label and value are required')
    }

    // Prepare data
    const statData = {
      label: body.label,
      value: parseInt(body.value),
      suffix: body.suffix || '',
      icon: body.icon || 'icofont-chart-bar-graph',
      color: body.color || '#006700',
      display_order: body.display_order || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
    }

    // Insert stat
    const { data, error } = await supabase
      .from('stats')
      .insert([statData])
      .select()
      .single()

    if (error) {
      console.error('Stat creation error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Stat> = {
      success: true,
      data: data as Stat,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
