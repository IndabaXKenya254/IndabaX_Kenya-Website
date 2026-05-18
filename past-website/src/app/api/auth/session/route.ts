export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SESSION CHECK API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/auth/session - Check current session status
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

interface SessionResponse {
  authenticated: boolean
  user: {
    id: string
    email: string
  } | null
  role: string | null
  mustChangePassword?: boolean
  emailVerified?: boolean
}

/**
 * GET /api/auth/session
 * Check if user is authenticated and get their role
 *
 * Returns:
 * - 200 OK: Session status (may be unauthenticated)
 * - 500 Internal Error: Server error
 *
 * Response when authenticated:
 * {
 *   "success": true,
 *   "data": {
 *     "authenticated": true,
 *     "user": { "id": "...", "email": "..." },
 *     "role": "admin" | "super_admin"
 *   }
 * }
 *
 * Response when not authenticated:
 * {
 *   "success": true,
 *   "data": {
 *     "authenticated": false,
 *     "user": null,
 *     "role": null
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Not authenticated
      const response: ApiSuccessResponse<SessionResponse> = {
        success: true,
        data: {
          authenticated: false,
          user: null,
          role: null,
        },
      }
      return NextResponse.json(response, { status: 200 })
    }

    // Get user role from user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is a reviewer (role elevation)
    // If user exists in reviewers table, upgrade their role to 'reviewer'
    const { data: reviewerAssignment } = await supabase
      .from('reviewers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    // Determine final role: admin > reviewer > applicant
    let finalRole = profile?.role || 'applicant'
    if (reviewerAssignment && finalRole === 'applicant') {
      finalRole = 'reviewer'
    }

    // Check if admin must change password
    let mustChangePassword = false

    // Check email verification for ALL users using our custom verification tokens table
    // NOTE: We don't use Supabase's email_confirmed_at because mailer_autoconfirm is enabled,
    // which auto-confirms emails immediately. Instead, we track verification ourselves.
    // Email is verified ONLY if there's a token with verified_at set in email_verification_tokens
    const { data: verificationToken } = await supabase
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // User is verified if they have a token with verified_at set
    const emailVerified = verificationToken?.verified_at !== null && verificationToken?.verified_at !== undefined

    if (finalRole === 'admin') {
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('must_change_password')
        .eq('user_id', user.id)
        .single()

      mustChangePassword = adminRole?.must_change_password || false
    }

    // Authenticated
    const response: ApiSuccessResponse<SessionResponse> = {
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email!,
        },
        role: finalRole,
        mustChangePassword,
        emailVerified,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
