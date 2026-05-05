export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - USER MANAGEMENT API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/users - List all users
// Admin only endpoint for user management

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'

// Create admin client with service role for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * GET /api/users
 * List all users with their profiles
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query for user_profiles
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get auth metadata and real email verification status for each user
    const usersWithAuthData = await Promise.all(
      (users || []).map(async (user) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
        const authData = authUser?.user as { banned_until?: string; last_sign_in_at?: string; email_confirmed_at?: string } | undefined

        // Check email_verification_tokens as source of truth for email_verified
        // (user_profiles.email_verified may be stale if it wasn't updated during verification)
        const { data: verificationToken } = await supabaseAdmin
          .from('email_verification_tokens')
          .select('verified_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const tokenVerified = verificationToken?.verified_at !== null && verificationToken?.verified_at !== undefined
        // Issue #2 FIX: Use Supabase auth email_confirmed_at as primary truth.
        // user_profiles.email_verified can be stale (admin-created users get it set true incorrectly).
        // Only mark verified if the user actually clicked the verification link.
        const authVerified = !!authData?.email_confirmed_at

        return {
          ...user,
          email_verified: tokenVerified || authVerified, // only trust auth system + custom token
          banned_until: authData?.banned_until || null,
          last_sign_in_at: authData?.last_sign_in_at || null,
          email_confirmed_at: authData?.email_confirmed_at || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: usersWithAuthData,
      count: usersWithAuthData.length,
    })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
