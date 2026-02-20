export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER MANAGEMENT API (Single User)
// ═══════════════════════════════════════════════════════════════════════
// GET /api/users/[id] - Get single user
// PATCH /api/users/[id] - Update user (role, status, ban)
// DELETE /api/users/[id] - Delete user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'

// Create admin client with service role for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Verify admin access
 */
async function verifyAdmin(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 }
  }

  return { user, profile }
}

/**
 * GET /api/users/[id]
 * Get single user details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const auth = await verifyAdmin(supabase)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get auth data
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)
    const authData = authUser?.user as { banned_until?: string; last_sign_in_at?: string; email_confirmed_at?: string } | undefined

    // Check email_verification_tokens as source of truth for email_verified
    const { data: verificationToken } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const tokenVerified = verificationToken?.verified_at !== null && verificationToken?.verified_at !== undefined

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        email_verified: tokenVerified || profile.email_verified, // true if either source says verified
        banned_until: authData?.banned_until || null,
        last_sign_in_at: authData?.last_sign_in_at || null,
        email_confirmed_at: authData?.email_confirmed_at || null,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/users/[id]
 * Update user - role, is_active, ban/unban
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const auth = await verifyAdmin(supabase)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Prevent self-modification of role
    if (auth.user.id === id) {
      const body = await request.json()
      if (body.role !== undefined) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
      }
    }

    const body = await request.json()
    const { action, role, is_active, ban_duration } = body

    // Handle different actions
    if (action === 'ban') {
      // Ban user - set banned_until
      const banUntil = ban_duration === 'permanent'
        ? new Date('2099-12-31').toISOString()
        : new Date(Date.now() + parseInt(ban_duration) * 24 * 60 * 60 * 1000).toISOString()

      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: ban_duration === 'permanent' ? '87600h' : `${parseInt(ban_duration) * 24}h`,
      })

      if (banError) {
        console.error('Error banning user:', banError)
        return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
      }

      // Also set is_active to false in profile
      await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id)

      return NextResponse.json({ success: true, message: 'User banned successfully' })
    }

    if (action === 'unban') {
      // Unban user
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: 'none',
      })

      if (unbanError) {
        console.error('Error unbanning user:', unbanError)
        return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
      }

      // Set is_active to true in profile
      await supabase
        .from('user_profiles')
        .update({ is_active: true })
        .eq('id', id)

      return NextResponse.json({ success: true, message: 'User unbanned successfully' })
    }

    // Update profile fields
    const updates: Record<string, unknown> = {}
    if (role !== undefined) updates.role = role
    if (is_active !== undefined) updates.is_active = is_active

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }

      // Also update role in auth metadata if role changed
      if (role !== undefined) {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: { role },
        })
      }
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/users/[id]
 * Delete user (soft delete via auth.users.deleted_at or hard delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const auth = await verifyAdmin(supabase)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Prevent self-deletion
    if (auth.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check query param for hard delete
    const searchParams = request.nextUrl.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - removes from auth.users (cascades to user_profiles if FK set)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)

      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
    } else {
      // Soft delete - mark as inactive and ban permanently
      await supabase
        .from('user_profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: '87600h', // ~10 years
      })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'User permanently deleted' : 'User deactivated successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
