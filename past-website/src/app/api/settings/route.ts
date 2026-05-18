// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PUBLIC SETTINGS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/settings - Get all public settings
// Returns settings as key-value pairs for easy frontend consumption

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

/**
 * GET /api/settings
 * Returns all settings as a flat key-value object for easy consumption
 *
 * Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "site_name": "IndabaX Kenya 2026",
 *     "site_description": "...",
 *     "contact_email": "info@indaba.org",
 *     "social_twitter": "https://twitter.com/indabaxkenya",
 *     ...
 *   }
 * }
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    // Fetch all settings
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .order('key')

    if (error) {
      console.error('Settings fetch error:', error)
      return handleDatabaseError(error)
    }

    // Transform array of {key, value} into flat object
    const settingsMap: Record<string, any> = {}

    for (const setting of data || []) {
      try {
        // Parse JSON value if it looks like JSON
        // JSONB values are returned as strings, need to parse
        if (typeof setting.value === 'string') {
          const trimmed = setting.value.trim()
          // Only try to parse if it looks like valid JSON
          // Valid JSON primitives: objects {}, arrays [], quoted strings "", true, false, null, numbers
          // Numbers in JSON cannot start with + or have leading zeros (except "0" itself)
          const isValidJsonNumber = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)

          if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"') ||
              trimmed === 'true' || trimmed === 'false' || trimmed === 'null' ||
              isValidJsonNumber) {
            settingsMap[setting.key] = JSON.parse(setting.value)
          } else {
            // Plain string value, use as-is (phone numbers, addresses, etc.)
            settingsMap[setting.key] = setting.value
          }
        } else {
          settingsMap[setting.key] = setting.value
        }
      } catch (parseError) {
        // If parse fails, use raw value
        console.warn(`Failed to parse setting "${setting.key}":`, parseError)
        settingsMap[setting.key] = setting.value
      }
    }

    const response: ApiSuccessResponse<Record<string, any>> = {
      success: true,
      data: settingsMap,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
