export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI SETTINGS API - Page-wide Settings Management
// ═══════════════════════════════════════════════════════════════════════
// GET   /api/noai/settings - Get settings (public)
// PATCH /api/noai/settings - Update settings (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

/**
 * GET /api/noai/settings
 * Returns NOAI page settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('noai_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .single()

    if (error) {
      console.error('Settings query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data: data || {},
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/noai/settings
 * Update NOAI page settings (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      ioai_website_url,
      application_deadline,
      show_application_cta,
      application_status_text,
      featured_year
    } = body

    const updateData: any = {}
    if (ioai_website_url !== undefined) updateData.ioai_website_url = ioai_website_url
    if (application_deadline !== undefined) updateData.application_deadline = application_deadline
    if (show_application_cta !== undefined) updateData.show_application_cta = show_application_cta
    if (application_status_text !== undefined) updateData.application_status_text = application_status_text
    if (featured_year !== undefined) updateData.featured_year = parseInt(featured_year)

    if (Object.keys(updateData).length === 0) {
      return handleValidationError('No update fields provided')
    }

    const { data, error } = await supabase
      .from('noai_settings')
      .update(updateData)
      .eq('id', SETTINGS_ID)
      .select()
      .single()

    if (error) {
      console.error('Settings update error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<any> = {
      success: true,
      data,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
