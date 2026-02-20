export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SETTINGS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/settings/[key] - Get single setting by key
// Created: Day 2 - Public API Endpoints

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  handleError,
  handleDatabaseError,
  handleNotFound,
  handleValidationError,
} from '@/lib/api-errors'
import { validateParam, settingsKeySchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Setting } from '@/types/api'

/**
 * GET /api/settings/popup
 * GET /api/settings/site_info
 * Returns a single setting by key
 *
 * Path Parameters:
 * - key (required): Setting key (popup | site_info)
 *
 * Note: RLS policy allows public to read 'popup' and 'site_info' only
 */
export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const supabase = createServerClient()

    // Validate path parameter
    const validation = validateParam(settingsKeySchema, params.key)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const key = validation.data

    // Query settings table by key
    // RLS policy: Public can only view 'popup' and 'site_info' settings
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single() // Expect exactly one result (key is unique)

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        // PGRST116 = no rows returned
        return handleNotFound(`Setting '${key}' not found or not publicly accessible`)
      }

      console.error('Settings query error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound(`Setting '${key}' not found`)
    }

    // Success response
    const response: ApiSuccessResponse<Setting> = {
      success: true,
      data,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // No caching for settings - admin toggles should reflect immediately
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
