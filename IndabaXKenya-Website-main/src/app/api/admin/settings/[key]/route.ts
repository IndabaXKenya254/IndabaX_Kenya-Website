export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE SETTING API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/settings/[key] - Get single setting
// PATCH /api/admin/settings/[key] - Update setting
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleNotFound, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { updateSettingSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Setting } from '@/types/api'

/**
 * GET /api/admin/settings/[key]
 * Get a single setting by key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { key } = params

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      console.error('Setting fetch error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Setting')
    }

    const response: ApiSuccessResponse<Setting> = {
      success: true,
      data: data as Setting,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/settings/[key]
 * Update a setting
 *
 * Request Body:
 * {
 *   "value": { ...any JSON object... },
 *   "description": "Optional description" (optional)
 * }
 *
 * Example for registration popup:
 * {
 *   "value": {
 *     "enabled": true,
 *     "title": "Register for IndabaX Kenya 2025",
 *     "message": "Early bird registration ends soon!"
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { key } = params

    // Validate request body
    const body = await request.json()
    const validation = updateSettingSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Upsert setting (insert if not exists, update if exists)
    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          key: key,
          ...updates,
          updated_by: authCheck.data.user.id,
        },
        {
          onConflict: 'key', // Use the unique constraint on 'key'
          ignoreDuplicates: false, // Always update if exists
        }
      )
      .select()
      .maybeSingle()

    if (error) {
      console.error('Setting upsert error:', error)
      return handleDatabaseError(error)
    }

    if (!data) {
      return handleNotFound('Setting')
    }

    const response: ApiSuccessResponse<Setting> = {
      success: true,
      data: data as Setting,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
