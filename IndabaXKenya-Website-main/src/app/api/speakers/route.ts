// Enable ISR caching - revalidate every 60 seconds
export const revalidate = 60

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SPEAKERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/speakers - List all speakers ordered by display_order
// GET /api/speakers?event_id=xxx - List speakers for a specific event
// Created: Day 2 - Public API Endpoints
// Phase 5 Optimization (November 29, 2025): Enhanced caching + Edge Runtime

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse, Speaker } from '@/types/api'

// Enable Edge Runtime for faster global response times
export const runtime = 'edge';

/**
 * GET /api/speakers
 * GET /api/speakers?event_id=xxx
 * Returns all speakers ordered by display_order (featured first)
 * Optionally filter by event_id
 * Optimized caching: 1 minute CDN cache, 2 minute stale-while-revalidate
 *
 * Query Parameters:
 * - event_id (optional): Filter by event (returns speakers linked to that event)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    let data: any[] = []
    let error: any = null

    if (eventId) {
      // Get speakers for a specific event via junction table
      const result = await supabase
        .from('event_speakers')
        .select(`
          id,
          role,
          display_order,
          speakers (
            id,
            name,
            title,
            organization,
            photo_url,
            bio_short,
            bio_full,
            linkedin_url,
            twitter_url,
            website_url,
            is_featured,
            display_order,
            country,
            speaker_year,
            force_previous,
            created_at,
            updated_at
          )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

      if (result.error) {
        error = result.error
      } else {
        // Flatten the response
        data = (result.data || [])
          .filter((item: any) => item.speakers !== null)
          .map((item: any) => ({
            ...item.speakers,
            event_role: item.role,
            event_display_order: item.display_order,
          }))
      }
    } else {
      // Query all speakers - select only needed fields for performance
      // RLS policy: Public can view all speakers (no auth required)
      const result = await supabase
        .from('speakers')
        .select('id, name, title, organization, photo_url, bio_short, bio_full, linkedin_url, twitter_url, website_url, is_featured, display_order, country, speaker_year, force_previous, created_at, updated_at')
        .order('is_featured', { ascending: false }) // Featured speakers first
        .order('display_order', { ascending: true }) // Then by display order
        .order('name', { ascending: true }) // Then alphabetically

      data = result.data || []
      error = result.error
    }

    if (error) {
      console.error('Speakers query error:', error)
      return handleDatabaseError(error)
    }

    // Success response
    const response: ApiSuccessResponse<Speaker[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Balanced Caching for admin updates:
        // - s-maxage=60: CDN caches for 1 minute (allows quick updates)
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
