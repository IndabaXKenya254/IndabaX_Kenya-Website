export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUES PUBLIC API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/venues - List active venues
// Created: Public API for venues

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

export interface Venue {
  id: string
  name: string
  slug: string
  address?: string | null
  city?: string | null
  country: string
  description?: string | null
  facilities?: string | null
  getting_there?: string | null
  nearby_amenities?: string | null
  capacity?: number | null
  image_url?: string | null
  map_embed_url?: string | null
  map_latitude?: number | null
  map_longitude?: number | null
  website_url?: string | null
  phone?: string | null
  email?: string | null
  display_order: number
}

/**
 * GET /api/venues
 * Returns active venues ordered by display_order
 *
 * Note: RLS policy allows public to view active venues only
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    // Query active venues
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Venues query error:', error)
      return handleDatabaseError(error)
    }

    // Success response
    const response: ApiSuccessResponse<Venue[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        // Venue data changes infrequently - cache for 10 minutes
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
