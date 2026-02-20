export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CHANGE PASSWORD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/change-password - Change password for authenticated user
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import { sendPasswordChangedEmail, sendVerificationEmail, generateVerificationToken } from '@/lib/email'
import { getSiteUrl } from '@/lib/config'
import { z } from 'zod'

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 *
 * Request Body:
 * {
 *   "currentPassword": "OldPassword123!",
 *   "newPassword": "NewPassword123!"
 * }
 *
 * Returns:
 * - 200 OK: Password changed successfully
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Current password incorrect
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'You must be logged in to change your password' }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: { message: firstError.message }
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Current password is incorrect' }
        },
        { status: 403 }
      )
    }

    // Check that new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'New password must be different from current password' }
        },
        { status: 400 }
      )
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Failed to update password. Please try again.' }
        },
        { status: 500 }
      )
    }

    // Check if this was an invited admin (must_change_password was true)
    const { data: adminRole } = await supabaseAdmin
      .from('admin_roles')
      .select('must_change_password')
      .eq('user_id', user.id)
      .single()

    const wasInvitedAdmin = adminRole?.must_change_password === true

    // Clear must_change_password flag if user is an admin
    if (adminRole) {
      await supabaseAdmin
        .from('admin_roles')
        .update({ must_change_password: false })
        .eq('user_id', user.id)
    }

    // Get user's name for email
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    // If this was an invited admin, send verification email
    if (wasInvitedAdmin) {
      // Generate verification token
      const token = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Save verification token
      await supabaseAdmin
        .from('email_verification_tokens')
        .upsert({
          user_id: user.id,
          email: user.email!,
          token,
          expires_at: expiresAt.toISOString(),
          verified_at: null // Clear any existing verification
        }, { onConflict: 'user_id,email' })

      // Send verification email
      const verificationUrl = `${getSiteUrl()}/verify-email?token=${token}`
      await sendVerificationEmail(user.email!, profile?.name || '', verificationUrl)

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully. Please check your email to verify your account.',
        requiresVerification: true
      })
    }

    // Send confirmation email for regular password changes
    await sendPasswordChangedEmail(user.email!, profile?.name || '')

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred. Please try again.' }
      },
      { status: 500 }
    )
  }
}
