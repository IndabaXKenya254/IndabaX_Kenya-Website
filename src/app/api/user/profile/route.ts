export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER PROFILE API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/user/profile - Get current user profile
// PATCH /api/user/profile - Update current user profile
// Phase 2: Authentication Extension

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'
import { z } from 'zod'

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .trim()
    .optional(),
  organization: z.string()
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
})

/**
 * GET /api/user/profile
 * Get current authenticated user's profile
 *
 * Returns:
 * - 200 OK: User profile data
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'User profile not found',
          },
        },
        { status: 404 }
      )
    }

    const response: ApiSuccessResponse<typeof profile> = {
      success: true,
      data: profile,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/user/profile
 * Update current authenticated user's profile
 *
 * Request Body:
 * {
 *   "name": "John Doe" (optional),
 *   "organization": "University of Nairobi" (optional),
 *   "phone": "+254712345678" (optional)
 * }
 *
 * Returns:
 * - 200 OK: Profile updated successfully
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Error: Server error
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const updates = validation.data

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update profile',
          },
        },
        { status: 500 }
      )
    }

    const response: ApiSuccessResponse<typeof updatedProfile> = {
      success: true,
      data: updatedProfile,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}
