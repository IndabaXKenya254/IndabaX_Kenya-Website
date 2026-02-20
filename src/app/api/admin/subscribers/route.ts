export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SUBSCRIBERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/subscribers - List all newsletter subscribers
// POST /api/admin/subscribers - Create new subscriber
// Created: Admin UI Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import type { ApiSuccessResponse } from '@/types/api'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  created_at: string
}

/**
 * GET /api/admin/subscribers
 * List all newsletter subscribers for admin
 *
 * Query Parameters:
 * - limit: number (default: 100, max: 500)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('subscribers')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Subscribers list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Subscriber[]> = {
      success: true,
      data: (data || []) as Subscriber[],
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
 * POST /api/admin/subscribers
 * Create a new subscriber (admin only)
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()

    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

    // Insert subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email: body.email.toLowerCase().trim(),
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Subscriber insert error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Subscriber> = {
      success: true,
      data: data as Subscriber,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
