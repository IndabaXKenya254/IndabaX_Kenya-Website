export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORGOT PASSWORD API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password - Request password reset email
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteUrl } from '@/lib/config'
import { sendPasswordResetEmail, generateVerificationToken } from '@/lib/email'
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
})

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 *
 * Request Body:
 * { "email": "user@example.com" }
 *
 * Returns:
 * - 200 OK: Email sent (always returns success for security)
 * - 400 Bad Request: Invalid input
 * - 429 Too Many Requests: Rate limited
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Please provide a valid email address' }
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Check rate limiting (max 3 requests per email per hour)
    const { data: recentTokens, error: countError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id')
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (countError) {
      console.error('Error checking rate limit:', countError)
    }

    if (recentTokens && recentTokens.length >= 3) {
      // Don't reveal rate limiting to prevent enumeration
      // Still return success for security
      console.log(`Rate limited password reset for: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    // Find user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email?.toLowerCase() === email)

    if (!user) {
      // Don't reveal if user exists - still return success
      console.log(`Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    // Get user's name from profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    // Generate reset token
    const token = generateVerificationToken()

    // Store token in database
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email,
        token,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      })

    if (insertError) {
      console.error('Error storing reset token:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Failed to process request. Please try again.' }
        },
        { status: 500 }
      )
    }

    // Send reset email
    const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`
    const emailSent = await sendPasswordResetEmail(
      email,
      profile?.name || '',
      resetUrl
    )

    if (!emailSent) {
      console.error(`Failed to send password reset email to: ${email}`)
      // Still return success for security
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'An error occurred. Please try again later.' }
      },
      { status: 500 }
    )
  }
}
