export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - RESET PASSWORD API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/auth/reset-password - Validate reset token
// POST /api/auth/reset-password - Reset password with token
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordChangedEmail } from '@/lib/email'
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

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

/**
 * GET /api/auth/reset-password?token=xxx
 * Validate reset token
 *
 * Returns:
 * - 200 OK: Token is valid
 * - 400 Bad Request: Token missing or invalid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Token is required' }
        },
        { status: 400 }
      )
    }

    // Find and validate token
    const { data: resetToken, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, email, expires_at, used_at')
      .eq('token', token)
      .single()

    if (error || !resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid or expired reset link' }
        },
        { status: 400 }
      )
    }

    // Check if already used
    if (resetToken.used_at) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has already been used' }
        },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has expired. Please request a new one.' }
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email: resetToken.email
      }
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred. Please try again.' }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password using token
 *
 * Request Body:
 * {
 *   "token": "reset-token",
 *   "password": "NewPassword123!"
 * }
 *
 * Returns:
 * - 200 OK: Password reset successful
 * - 400 Bad Request: Invalid input or token
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

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

    const { token, password } = validation.data

    // Find and validate token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, user_id, email, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid or expired reset link' }
        },
        { status: 400 }
      )
    }

    // Check if already used
    if (resetToken.used_at) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has already been used' }
        },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'This reset link has expired. Please request a new one.' }
        },
        { status: 400 }
      )
    }

    // Update user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      { password }
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

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    // Clear must_change_password flag if user is an admin
    await supabaseAdmin
      .from('admin_roles')
      .update({ must_change_password: false })
      .eq('user_id', resetToken.user_id)

    // Get user's name for email
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', resetToken.user_id)
      .single()

    // Send confirmation email
    await sendPasswordChangedEmail(resetToken.email, profile?.name || '')

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred. Please try again.' }
      },
      { status: 500 }
    )
  }
}
