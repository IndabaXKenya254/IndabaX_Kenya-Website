// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════
// Protects admin routes by verifying authentication and admin role
// Created: Day 4 - Admin Panel Backend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ApiErrorResponse } from '@/types/api'

/**
 * Admin middleware - verifies user is authenticated and has admin role
 *
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authCheck = await requireAdmin(request)
 *   if (authCheck.error) return authCheck.response
 *
 *   const { user, role } = authCheck.data
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { error: false; data: { user: any; role: string; email: string } }
  | { error: true; response: NextResponse<ApiErrorResponse> }
> {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        error: true,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please log in.',
            },
          },
          { status: 401 }
        ),
      }
    }

    // Check if user is an admin
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError) {
      console.error('Error checking admin role:', roleError)
      return {
        error: true,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Error verifying admin status',
            },
          },
          { status: 500 }
        ),
      }
    }

    if (!adminRole) {
      return {
        error: true,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied. Admin privileges required.',
            },
          },
          { status: 403 }
        ),
      }
    }

    // Success - user is authenticated and is an admin
    return {
      error: false,
      data: {
        user,
        role: adminRole.role,
        email: user.email!,
      },
    }
  } catch (error) {
    console.error('Admin middleware error:', error)
    return {
      error: true,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication check failed',
          },
        },
        { status: 500 }
      ),
    }
  }
}

/**
 * Check if user is super admin (for privileged operations)
 */
export async function requireSuperAdmin(request: NextRequest): Promise<
  | { error: false; data: { user: any; email: string } }
  | { error: true; response: NextResponse<ApiErrorResponse> }
> {
  const authCheck = await requireAdmin(request)

  if (authCheck.error) {
    return authCheck
  }

  const { role, user, email } = authCheck.data

  if (role !== 'super_admin') {
    return {
      error: true,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Super admin privileges required.',
          },
        },
        { status: 403 }
      ),
    }
  }

  return {
    error: false,
    data: { user, email },
  }
}
