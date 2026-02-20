export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN LOGOUT API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/logout - Admin logout
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * POST /api/auth/logout
 * Sign out the current admin user
 *
 * Returns:
 * - 200 OK: Successfully logged out
 * - 500 Internal Error: Server error
 *
 * Note: No authentication required - can logout even if session is invalid
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Sign out the current user (clears session cookies)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      // Don't fail if signout errors - session might already be invalid
    }

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Success" },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
