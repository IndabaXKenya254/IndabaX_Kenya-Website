export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SPEAKER EXPERTISE API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/expertise - List all speaker expertise areas
// POST /api/admin/expertise - Create new expertise area
// Created: Phase 6 - Tag Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createExpertiseSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/admin/expertise
 * List all speaker expertise areas
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
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('speaker_expertise')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('name', `%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Speaker expertise list error:', error)
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
 * POST /api/admin/expertise
 * Create a new speaker expertise area
 *
 * Request Body:
 * {
 *   "name": "NLP",
 *   "slug": "nlp"
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createExpertiseSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const expertiseData = validation.data

    // Insert expertise
    const { data, error } = await supabase
      .from('speaker_expertise')
      .insert(expertiseData)
      .select()
      .single()

    if (error) {
      console.error('Speaker expertise insert error:', error)

      // Check for duplicate name or slug
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return handleValidationError('An expertise area with this name already exists.')
        } else if (error.message.includes('slug')) {
          return handleValidationError('An expertise area with this slug already exists.')
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
