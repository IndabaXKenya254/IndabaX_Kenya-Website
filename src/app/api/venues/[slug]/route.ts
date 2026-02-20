export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - VENUE DETAILS PUBLIC API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/venues/[slug] - Get single venue by slug
// Created: Public API for venue details

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import type { Venue } from '../route'

/**
 * GET /api/venues/[slug]
 * Returns single active venue by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerClient()
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue slug is required',
        },
        { status: 400 }
      )
    }

    // Query venue by slug
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Venue query error:', error)
      return handleDatabaseError(error)
    }

    if (!venue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue not found',
        },
        { status: 404 }
      )
    }

    // Parse PostgreSQL arrays to HTML lists
    const parseArrayToHTML = (arrayString: string | null): string | null => {
      if (!arrayString) return null

      // Check if it's a PostgreSQL array format (starts with { and ends with })
      if (arrayString.startsWith('{') && arrayString.endsWith('}')) {
        // Remove { and }
        let content = arrayString.slice(1, -1)

        // Parse items - handle quoted strings with commas inside
        const items: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < content.length; i++) {
          const char = content[i]

          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            if (current.trim()) {
              items.push(current.trim())
            }
            current = ''
          } else {
            current += char
          }
        }

        // Don't forget the last item
        if (current.trim()) {
          items.push(current.trim())
        }

        // Convert to HTML list
        if (items.length > 0) {
          return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>'
        }
      }

      // Return as-is if already HTML or not a PostgreSQL array
      return arrayString
    }

    // Format the venue data
    const formattedVenue = {
      ...venue,
      facilities: parseArrayToHTML(venue.facilities),
      nearby_amenities: parseArrayToHTML(venue.nearby_amenities),
      getting_there: parseArrayToHTML(venue.getting_there),
    }

    // Success response
    const response: ApiSuccessResponse<Venue> = {
      success: true,
      data: formattedVenue,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
