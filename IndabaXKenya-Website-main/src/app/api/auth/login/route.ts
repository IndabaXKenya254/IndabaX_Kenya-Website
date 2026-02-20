export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN LOGIN API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/login - Admin authentication
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'
import { getEmailVerificationLink } from '@/lib/config'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

interface LoginResponse {
  user: {
    id: string
    email: string
  }
  role: 'applicant' | 'speaker' | 'reviewer' | 'admin'
  redirectTo: string
  mustChangePassword?: boolean
  emailVerified?: boolean
}

/**
 * POST /api/auth/login
 * Authenticate user (all roles: applicant, speaker, reviewer, admin)
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "user_password"
 * }
 *
 * Returns:
 * - 200 OK: Successfully authenticated with role-based redirect URL
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Email not verified
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const { email, password } = validation.data

    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    // ═══════════════════════════════════════════════════════════════════════
    // ROLE-BASED ACCESS & REDIRECTION (Phase 2: Role System)
    // ═══════════════════════════════════════════════════════════════════════
    // Get user profile with role from user_profiles table
    const { data: profile, error: roleError } = await supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', authData.user.id)
      .single()

    // ═══════════════════════════════════════════════════════════════════════
    // ROLE ELEVATION: Check if user is a reviewer (Phase 6: Reviewer System)
    // ═══════════════════════════════════════════════════════════════════════
    // If user exists in reviewers table, upgrade their role to 'reviewer'
    const { data: reviewerAssignment } = await supabase
      .from('reviewers')
      .select('id')
      .eq('user_id', authData.user.id)
      .limit(1)
      .maybeSingle()

    // Determine final role: admin > reviewer > applicant
    let finalRole = profile?.role || 'applicant'
    if (reviewerAssignment && finalRole === 'applicant') {
      finalRole = 'reviewer'
    }

    // Check if admin must change password (invited admins)
    let mustChangePassword = false
    if (finalRole === 'admin') {
      const { data: adminRole } = await adminSupabase
        .from('admin_roles')
        .select('must_change_password')
        .eq('user_id', authData.user.id)
        .single()

      mustChangePassword = adminRole?.must_change_password || false
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EMAIL VERIFICATION CHECK (Phase 2: Authentication Extension)
    // ═══════════════════════════════════════════════════════════════════════
    // Check email verification using our custom verification tokens table
    // NOTE: We don't use Supabase's email_confirmed_at because mailer_autoconfirm is enabled,
    // which auto-confirms emails immediately. Instead, we track verification ourselves.
    const { data: verificationToken } = await adminSupabase
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // User is verified if they have a token with verified_at set
    const emailVerified = verificationToken?.verified_at !== null && verificationToken?.verified_at !== undefined

    // Skip verification check for invited admins who must change password
    // They'll verify AFTER changing their password
    if (!mustChangePassword && !emailVerified) {
      // Sign out the user immediately
      await supabase.auth.signOut()

      // ═══════════════════════════════════════════════════════════════════════
      // AUTO-RESEND VERIFICATION EMAIL
      // ═══════════════════════════════════════════════════════════════════════
      // Automatically resend the verification email so the user can verify
      let verificationSent = false
      try {
        // Get user profile for name
        const { data: userProfile } = await adminSupabase
          .from('user_profiles')
          .select('name')
          .eq('id', authData.user.id)
          .single()

        const userName = userProfile?.name || authData.user.user_metadata?.name || 'User'

        // Delete any existing tokens for this user/email
        await adminSupabase
          .from('email_verification_tokens')
          .delete()
          .eq('user_id', authData.user.id)
          .eq('email', email)

        // Generate new verification token
        const newToken = generateVerificationToken()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)

        // Store new token
        const { error: tokenError } = await adminSupabase
          .from('email_verification_tokens')
          .insert({
            user_id: authData.user.id,
            token: newToken,
            email: email,
            expires_at: expiresAt.toISOString(),
          })

        if (!tokenError) {
          // Send verification email
          const verificationUrl = getEmailVerificationLink(newToken)
          const emailResult = await sendVerificationEmail(email, userName, verificationUrl)
          verificationSent = !!emailResult
        }
      } catch (resendError) {
        console.error('Failed to auto-resend verification email:', resendError)
      }

      const message = verificationSent
        ? 'Your email is not yet verified. We\'ve sent a new verification link to your inbox. Please check your email and verify before logging in.'
        : 'Please verify your email address before logging in. Check your inbox for the verification link.'

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message,
            verificationResent: verificationSent,
          },
        },
        { status: 403 }
      )
    }

    if (roleError) {
      console.error('Error fetching user profile:', roleError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred while fetching user profile',
          },
        },
        { status: 500 }
      )
    }

    if (!profile || !profile.role) {
      // User authenticated but no profile exists
      await supabase.auth.signOut()

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'User profile not found. Please contact support.',
          },
        },
        { status: 403 }
      )
    }

    // Role-based redirect mapping
    const redirectMap: Record<string, string> = {
      'applicant': '/dashboard',
      'speaker': '/dashboard',
      'reviewer': '/reviewer/dashboard',
      'admin': '/admin/dashboard'
    }

    // If must change password, redirect to profile page
    let redirectTo = redirectMap[finalRole] || '/dashboard'
    if (mustChangePassword && finalRole === 'admin') {
      redirectTo = '/admin/profile'
    }

    // Success - return user info, role, and redirect URL
    const response: ApiSuccessResponse<LoginResponse> = {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
        },
        role: finalRole as 'applicant' | 'speaker' | 'reviewer' | 'admin',
        redirectTo,
        mustChangePassword,
        emailVerified, // CRITICAL: Return email verification status
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
