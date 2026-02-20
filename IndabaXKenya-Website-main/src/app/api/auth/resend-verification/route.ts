export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - RESEND VERIFICATION EMAIL API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/resend-verification - Resend email verification link

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'
import { getEmailVerificationLink } from '@/lib/config'

// Validation schema
const resendSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
})

/**
 * POST /api/auth/resend-verification
 * Resend verification email to user
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = resendSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const { email } = validation.data
    const supabase = createAdminClient()

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SERVER_ERROR', message: 'Failed to process request' },
        },
        { status: 500 }
      )
    }

    const user = users.users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          success: true,
          data: { message: 'If an account exists with this email, a verification link has been sent.' },
        },
        { status: 200 }
      )
    }

    // Check if already verified using our custom verification tokens table
    // NOTE: We don't use Supabase's email_confirmed_at because mailer_autoconfirm is enabled,
    // which auto-confirms emails immediately. Instead, we track verification ourselves.
    const { data: existingToken } = await supabase
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const isVerified = existingToken?.verified_at !== null && existingToken?.verified_at !== undefined

    if (isVerified) {
      return NextResponse.json(
        {
          success: true,
          data: { message: 'Your email is already verified. You can login now.', alreadyVerified: true },
        },
        { status: 200 }
      )
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const userName = profile?.name || user.user_metadata?.name || 'User'

    // Delete any existing tokens for this user/email
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('email', email)

    // Generate new verification token
    const verificationToken = generateVerificationToken()

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Store new token
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        token: verificationToken,
        email: email,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'TOKEN_ERROR', message: 'Failed to generate verification token' },
        },
        { status: 500 }
      )
    }

    // Send verification email
    const verificationUrl = getEmailVerificationLink(verificationToken)
    const emailResult = await sendVerificationEmail(email, userName, verificationUrl)

    if (!emailResult) {
      console.error('Email sending failed')
      return NextResponse.json(
        {
          success: false,
          error: { code: 'EMAIL_ERROR', message: 'Failed to send verification email. Please try again.' },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Verification email sent! Please check your inbox.',
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
