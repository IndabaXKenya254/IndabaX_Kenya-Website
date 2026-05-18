export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION LOCK API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Endpoints for managing review locks on applications

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdminOrReviewer } from '@/lib/middleware/admin'

// Issue #7 FIX: Clean up expired locks before checking status
async function cleanupExpiredLocks(registrationId: string) {
  try {
    const adminSupabase = createAdminClient()
    await adminSupabase
      .from('review_locks')
      .delete()
      .eq('registration_id', registrationId)
      .lt('expires_at', new Date().toISOString())
  } catch (err) {
    console.error('Lock cleanup error (non-fatal):', err)
  }
}

// Issue #7 FIX: Fallback lock check using direct query when RPC is unavailable
async function fallbackCheckLock(registrationId: string, userId: string) {
  const adminSupabase = createAdminClient()
  // Issue #7 FIX: Use correct column name 'locked_by' (not 'user_id')
  const { data, error } = await adminSupabase
    .from('review_locks')
    .select('id, locked_by, locked_at, expires_at, user_profiles:locked_by(email)')
    .eq('registration_id', registrationId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) {
    return {
      is_locked: false,
      locked_by_user_id: null,
      locked_by_email: null,
      locked_at: null,
      expires_at: null,
      is_owned_by_requester: false,
    }
  }

  return {
    is_locked: true,
    locked_by_user_id: data.locked_by,
    locked_by_email: (data.user_profiles as any)?.email || null,
    locked_at: data.locked_at,
    expires_at: data.expires_at,
    is_owned_by_requester: data.locked_by === userId,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GET - Check lock status
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/applications/[id]/lock
 * Check if application is currently locked
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user } = authCheck.data

    // Issue #7 FIX: Clean up expired locks first
    await cleanupExpiredLocks(params.id)

    // Call database function to check lock status
    const { data, error } = await supabase.rpc('is_application_locked', {
      p_registration_id: params.id
    })

    if (error) {
      console.error('Lock check RPC error, falling back to direct query:', error)
      // Issue #7 FIX: Fallback to direct query if RPC fails
      const lockStatus = await fallbackCheckLock(params.id, user.id)
      return NextResponse.json({ success: true, data: lockStatus })
    }

    // Data is an array with one row or empty
    const lockStatus = data && data.length > 0 ? data[0] : {
      is_locked: false,
      locked_by_user_id: null,
      locked_by_email: null,
      locked_at: null,
      expires_at: null,
      is_owned_by_requester: false
    }

    return NextResponse.json({
      success: true,
      data: lockStatus
    })
  } catch (error) {
    console.error('Lock status check error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// POST - Acquire lock
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/applications/[id]/lock
 * Acquire a review lock on an application
 *
 * Body (optional):
 * - lock_duration_minutes: number (default: 30)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { user } = authCheck.data

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const lockDurationMinutes = body.lock_duration_minutes || 30

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Issue #7 FIX: Clean up expired locks before acquiring
    await cleanupExpiredLocks(params.id)

    // Call database function to acquire lock
    const { data, error } = await supabase.rpc('acquire_review_lock', {
      p_registration_id: params.id,
      p_user_id: user.id,
      p_ip_address: ipAddress.split(',')[0].trim(), // First IP if multiple
      p_lock_duration_minutes: lockDurationMinutes
    })

    if (error) {
      console.error('Lock acquisition RPC error, trying direct insert:', error)
      // Issue #7 FIX: Fallback to direct upsert if RPC fails
      try {
        const adminSupabase = createAdminClient()
        const expiresAt = new Date(Date.now() + lockDurationMinutes * 60 * 1000).toISOString()

        // Check if lock exists and is held by another user
        const existing = await fallbackCheckLock(params.id, user.id)
        if (existing.is_locked && !existing.is_owned_by_requester) {
          return NextResponse.json(
            { success: false, error: `Application is locked by ${existing.locked_by_email || 'another reviewer'}`, locked: true, lock_expires_at: existing.expires_at },
            { status: 409 }
          )
        }

        // Issue #7 FIX: Use correct column name 'locked_by' (not 'user_id')
        const { data: lockData, error: upsertError } = await adminSupabase
          .from('review_locks')
          .upsert({
            registration_id: params.id,
            locked_by: user.id,
            ip_address: ipAddress.split(',')[0].trim(),
            locked_at: new Date().toISOString(),
            expires_at: expiresAt,
          }, { onConflict: 'registration_id' })
          .select('id, expires_at')
          .single()

        if (upsertError) {
          return NextResponse.json(
            { success: false, error: `Lock acquisition failed: ${upsertError.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Lock acquired (fallback)',
          data: { lock_id: lockData?.id, expires_at: lockData?.expires_at || expiresAt }
        })
      } catch (fallbackErr) {
        console.error('Lock fallback also failed:', fallbackErr)
        return NextResponse.json(
          { success: false, error: 'Failed to acquire lock. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Data is an array with one row
    const result = data && data.length > 0 ? data[0] : null

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No result from lock function' },
        { status: 500 }
      )
    }

    if (!result.success) {
      // Lock is held by someone else
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          locked: true,
          lock_expires_at: result.expires_at
        },
        { status: 409 } // Conflict
      )
    }

    // Lock acquired successfully
    console.log('[POST lock] Lock acquired successfully. Result:', {
      lock_id: result.lock_id,
      expires_at: result.expires_at,
      message: result.message
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        lock_id: result.lock_id,
        expires_at: result.expires_at
      }
    })
  } catch (error) {
    console.error('Lock acquisition error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DELETE - Release lock
// ═══════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/admin/applications/[id]/lock
 * Release a review lock on an application
 *
 * Query params (optional):
 * - force: 'true' - Force unlock (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdminOrReviewer(request)
  if (authCheck.error) {
    console.error('DELETE lock - Auth check failed:', authCheck.error)
    return authCheck.response
  }

  try {
    const supabase = createServerClient()
    const { user } = authCheck.data

    // Check if force unlock requested
    const { searchParams } = request.nextUrl
    const force = searchParams.get('force') === 'true'

    // Call database function to release lock
    const { data, error } = await supabase.rpc('release_review_lock', {
      p_registration_id: params.id,
      p_user_id: user.id,
      p_force: force
    })

    if (error) {
      console.error('Lock release error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to release lock' },
        { status: 500 }
      )
    }

    // Data is an array with one row
    const result = data && data.length > 0 ? data[0] : null

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No result from unlock function' },
        { status: 500 }
      )
    }

    if (!result.success) {
      // Unable to release lock (not owned by user)
      return NextResponse.json(
        {
          success: false,
          error: result.message
        },
        { status: 403 } // Forbidden
      )
    }

    // Lock released successfully
    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Lock release error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PATCH - Extend lock
// ═══════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/admin/applications/[id]/lock
 * Extend an existing lock (same as POST but clearer intent)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PATCH lock - Extending lock for application:', params.id)
  // Extending a lock is the same as acquiring it (function handles both)
  return POST(request, { params })
}
