export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SPONSORS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/sponsors - List all sponsors
// POST /api/admin/sponsors - Create new sponsor
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createSponsorSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Sponsor } from '@/types/api'

/**
 * GET /api/admin/sponsors
 * List all sponsors for admin
 *
 * Query Parameters:
 * - tier: 'platinum' | 'gold' | 'silver' | 'bronze' (optional)
 * - is_active: 'true' | 'false' (optional)
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
    const tier = searchParams.get('tier')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('sponsors')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (tier && ['platinum', 'gold', 'silver', 'bronze', 'organizer', 'partner', 'community', 'supporter', 'media', 'academic', 'institutional'].includes(tier)) {
      query = query.eq('tier', tier)
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('name', `%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Sponsors list error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Sponsor[]> = {
      success: true,
      data: (data || []) as Sponsor[],
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
 * POST /api/admin/sponsors
 * Create a new sponsor
 *
 * Request Body:
 * {
 *   "name": "Google",
 *   "logo_url": "https://...",
 *   "website_url": "https://google.com" (optional),
 *   "tier": "platinum" | "gold" | "silver" | "bronze",
 *   "display_order": 0 (default: 0),
 *   "is_active": true (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createSponsorSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract event_ids from validated data (handled separately)
    const { event_ids, ...sponsorData } = validation.data

    // Insert sponsor
    const { data, error } = await supabase
      .from('sponsors')
      .insert(sponsorData)
      .select()
      .single()

    if (error) {
      console.error('Sponsor insert error:', error)
      return handleDatabaseError(error)
    }

    // Handle event linking if event_ids provided
    if (event_ids && event_ids.length > 0) {
      const eventRelations = event_ids.map((eventId, index) => ({
        event_id: eventId,
        sponsor_id: data.id,
        display_order: index,
      }))

      const { error: eventError } = await supabase
        .from('event_sponsors')
        .insert(eventRelations)

      if (eventError) {
        console.error('Event linking error (non-critical):', eventError)
        // Non-critical error - sponsor was created, just event linking failed
      }
    }

    const response: ApiSuccessResponse<Sponsor> = {
      success: true,
      data: data as Sponsor,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
