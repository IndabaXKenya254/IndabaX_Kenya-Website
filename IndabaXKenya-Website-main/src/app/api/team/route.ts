export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEAM MEMBERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/team - List active team members
// GET /api/team?event_id=xxx - List team members for a specific event
// Created: Public API for team members

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse, TeamMember } from '@/types/api'

/**
 * GET /api/team
 * GET /api/team?event_id=xxx
 * Returns active team members ordered by display_order
 *
 * Query Parameters:
 * - event_id (optional): Filter by event (returns team members linked to that event)
 *
 * Note: RLS policy allows public to view active team members only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    let data: any[] = []
    let error: any = null

    if (eventId) {
      // Get team members for a specific event via junction table
      const result = await supabase
        .from('event_team_members')
        .select(`
          id,
          event_role,
          display_order,
          team_members (
            id,
            name,
            role,
            photo_url,
            bio,
            linkedin_url,
            twitter_url,
            display_order,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

      if (result.error) {
        error = result.error
      } else {
        // Flatten the response and filter active members
        data = (result.data || [])
          .filter((item: any) => item.team_members?.is_active)
          .map((item: any) => ({
            ...item.team_members,
            event_role: item.event_role,
            event_display_order: item.display_order,
          }))
      }
    } else {
      // Query all active team members
      const result = await supabase
        .from('team_members')
        .select('id, name, role, photo_url, bio, linkedin_url, twitter_url, display_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      data = result.data || []
      error = result.error
    }

    if (error) {
      console.error('Team members query error:', error)
      return handleDatabaseError(error)
    }

    // Success response
    const response: ApiSuccessResponse<TeamMember[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Balanced caching for admin updates:
        // - s-maxage=60: CDN caches for 1 minute
        // - stale-while-revalidate=120: Serve stale for 2 minutes max
        // - max-age=30: Browser caches for 30 seconds
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
