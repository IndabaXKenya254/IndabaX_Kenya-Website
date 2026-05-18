export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPONSORS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/sponsors - List sponsors with optional tier filter
// Created: Day 2 - Public API Endpoints

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateQuery, sponsorsQuerySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Sponsor } from '@/types/api'

/**
 * GET /api/sponsors?tier=platinum&active_only=true&event_id=xxx
 * Returns sponsors ordered by tier and display_order
 *
 * Query Parameters:
 * - tier (optional): Filter by tier (platinum | gold | silver | bronze)
 * - active_only (optional): Show only active sponsors (default: true)
 * - event_id (optional): Filter by event (returns sponsors linked to that event)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validation = validateQuery(sponsorsQuerySchema, searchParams)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { tier, active_only } = validation.data
    const eventId = searchParams.get('event_id')

    let data: any[] = []
    let error: any = null

    if (eventId) {
      // Get sponsors for a specific event via junction table
      // Use explicit foreign key hint for the relationship
      const result = await supabase
        .from('event_sponsors')
        .select(`
          id,
          sponsorship_level,
          display_order,
          sponsor:sponsors!sponsor_id (
            id,
            name,
            logo_url,
            website_url,
            tier,
            display_order,
            is_active,
            sponsor_year,
            force_previous,
            created_at
          )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

      if (result.error) {
        console.error('Event sponsors query error:', result.error)
        error = result.error
      } else {
        // Flatten the response and apply filters
        data = (result.data || [])
          .filter(item => item.sponsor !== null) // Filter out null sponsors
          .map(item => ({
            ...item.sponsor,
            event_sponsorship_level: item.sponsorship_level,
            event_display_order: item.display_order,
          }))
          .filter((s: any) => {
            // Apply active filter
            if (active_only !== false && !s.is_active) return false
            // Apply tier filter
            if (tier && s.tier !== tier) return false
            return true
          })
      }
    } else {
      // Build standard query - select only needed fields for performance
      let query = supabase.from('sponsors').select('id, name, logo_url, website_url, tier, display_order, is_active, sponsor_year, force_previous, created_at')

      // Apply active filter (default: true)
      if (active_only !== false) {
        query = query.eq('is_active', true) // RLS policy handles this too
      }

      // Apply tier filter if provided
      if (tier) {
        query = query.eq('tier', tier)
      }

      // Order by tier hierarchy, then display_order
      // Custom ordering: platinum > gold > silver > bronze
      query = query.order('tier', {
        ascending: true, // Will be: bronze, gold, platinum, silver (alphabetical)
      })
      query = query.order('display_order', { ascending: true })

      const result = await query
      data = result.data || []
      error = result.error
    }

    if (error) {
      console.error('Sponsors query error:', error)
      return handleDatabaseError(error)
    }

    // Re-order by tier hierarchy (platinum first)
    const tierOrder = { platinum: 1, gold: 2, silver: 3, bronze: 4 }
    const sortedData = (data || []).sort((a, b) => {
      const aTier = tierOrder[a.tier as keyof typeof tierOrder] || 999
      const bTier = tierOrder[b.tier as keyof typeof tierOrder] || 999
      if (aTier !== bTier) return aTier - bTier
      return a.display_order - b.display_order
    })

    // Success response
    const response: ApiSuccessResponse<Sponsor[]> = {
      success: true,
      data: sortedData,
      count: sortedData.length,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
