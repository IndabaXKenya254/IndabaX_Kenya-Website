export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER REGISTRATION API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/register - Create new user account
// Phase 2: Authentication Extension

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'
import { getEmailVerificationLink } from '@/lib/config'

// Validation schema for registration
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  organization: z.string()
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
})

interface RegisterResponse {
  user: {
    id: string
    email: string
  }
  message: string
}

/**
 * POST /api/auth/register
 * Create new user account with email verification
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe",
 *   "organization": "University of Nairobi" (optional),
 *   "phone": "+254712345678" (optional)
 * }
 *
 * Returns:
 * - 201 Created: User created successfully, verification email sent
 * - 400 Bad Request: Invalid input or email already exists
 * - 500 Internal Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Use regular server client for signUp (NOT admin client)
    // This will automatically send verification email
    const supabase = createServerClient()

    // Parse and validate request body
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const { email, password, name, organization, phone } = validation.data

    // Create Supabase Auth user using signUp()
    // mailer_autoconfirm is enabled, so user can login immediately
    // We handle email verification ourselves
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable Supabase's automatic email
        data: {
          name,
          organization,
          phone,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)

      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email address is already registered',
            },
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: authError.message || 'Failed to create account',
          },
        },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: 'Failed to create user account',
          },
        },
        { status: 500 }
      )
    }

    // NOTE: User profile is automatically created by database trigger
    // See: supabase/migrations/20250120_create_profile_trigger.sql
    // The trigger extracts metadata (name, organization, phone) from user_metadata

    // Generate verification token and store in database
    const verificationToken = generateVerificationToken()
    const adminSupabase = createAdminClient()

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .insert({
        user_id: authData.user.id,
        token: verificationToken,
        email: email,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      // Continue anyway - user can still login, just won't get verification email
    }

    // Send custom verification email
    const verificationUrl = getEmailVerificationLink(verificationToken)
    const emailResult = await sendVerificationEmail(email, name, verificationUrl)

    if (!emailResult) {
      console.error('Email sending failed')
      // Continue anyway - user is registered and can login
    }

    // Success response
    const response: ApiSuccessResponse<RegisterResponse> = {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
        },
        message: 'Registration successful! Please check your email to verify your account.',
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
