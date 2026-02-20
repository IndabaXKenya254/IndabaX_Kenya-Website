export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN EVENT TAGS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/tags/events - List all event tags
// POST /api/admin/tags/events - Create new event tag
// Created: Phase 6 - Tag Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createTagSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/tags/events
 * List all event tags
 *
 * Query Parameters:
 * - limit: number (default: 100, max: 200)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('event_tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`)
    }

    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Event tags list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any[]> = {
      success: true,
      data: data || [],
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
 * POST /api/admin/tags/events
 * Create a new event tag
 *
 * Request Body:
 * {
 *   "name": "AI",
 *   "slug": "ai"
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createTagSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const tagData = validation.data

    // Insert tag
    const { data, error } = await supabase
      .from('event_tags')
      .insert(tagData)
      .select()
      .single()

    if (error) {
      console.error('Event tag insert error:', error)

      // Check for duplicate name or slug
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return handleValidationError('An event tag with this name already exists.')
        } else if (error.message.includes('slug')) {
          return handleValidationError('An event tag with this slug already exists.')
        }
      }

      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
