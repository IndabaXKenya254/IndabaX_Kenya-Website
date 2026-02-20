export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteUrl } from '@/lib/config'
import { sendAdminInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

// Create admin client with service role for admin operations
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

/**
 * Generate a secure temporary password
 * Format: 3 random words + 2 digits + special char (e.g., "Apple-Tiger-Moon-42!")
 */
function generateTemporaryPassword(): string {
  const words = [
    'Apple', 'Brave', 'Cloud', 'Delta', 'Eagle', 'Flame', 'Green', 'Haven',
    'India', 'Jazz', 'Kite', 'Lemon', 'Moon', 'Noble', 'Ocean', 'Pearl',
    'Quest', 'River', 'Storm', 'Tiger', 'Unity', 'Vivid', 'Wave', 'Xenon',
    'Yield', 'Zephyr', 'Amber', 'Blaze', 'Coral', 'Drift', 'Echo', 'Frost'
  ]
  const specials = ['!', '@', '#', '$', '%', '&', '*']

  const word1 = words[crypto.randomInt(words.length)]
  const word2 = words[crypto.randomInt(words.length)]
  const word3 = words[crypto.randomInt(words.length)]
  const digits = crypto.randomInt(10, 99)
  const special = specials[crypto.randomInt(specials.length)]

  return `${word1}-${word2}-${word3}-${digits}${special}`
}

/**
 * GET /api/admin/admins - List all admin users
 */
export async function GET() {
  try {
    // Fetch admin_roles with user data
    const { data, error } = await supabaseAdmin
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch user emails for each admin
    const adminsWithEmails = await Promise.all(
      (data || []).map(async (admin) => {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
            admin.user_id
          )
          return {
            ...admin,
            email: userData?.user?.email || 'Unknown'
          }
        } catch {
          return {
            ...admin,
            email: 'Unknown'
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: adminsWithEmails
    })
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Failed to fetch admin users' }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/admins - Invite a new admin user
 * Creates user with temporary password and sends invitation email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Email and role are required' }
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Check if already an admin
      const { data: existingAdmin } = await supabaseAdmin
        .from('admin_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (existingAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'This email is already registered as an admin' }
          },
          { status: 400 }
        )
      }
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()

    // Create or update user with temporary password
    let userId: string

    if (existingUser) {
      // Update existing user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: temporaryPassword,
          email_confirm: true
        }
      )
      if (updateError) throw updateError
      userId = existingUser.id

      // Create/update email_verification_tokens entry (pre-verified for invited admins)
      await supabaseAdmin
        .from('email_verification_tokens')
        .upsert({
          user_id: userId,
          email,
          token: crypto.randomBytes(32).toString('hex'),
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id,email' })

      // Update user_profiles to set role to admin
      await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: userId,
          email,
          role: 'admin',
          email_verified: true
        }, { onConflict: 'id' })
    } else {
      // Create new user with temporary password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email for invited admins
        user_metadata: { role, invited_as_admin: true }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      userId = authData.user.id

      // Create user_profile entry for admin
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: userId,
          email,
          name: email.split('@')[0], // Temporary name from email
          role: 'admin',
          email_verified: true,
          is_new_user: true
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Non-fatal - continue with admin creation
      }

      // Create email_verification_tokens entry (pre-verified for invited admins)
      const { error: verificationError } = await supabaseAdmin
        .from('email_verification_tokens')
        .upsert({
          user_id: userId,
          email,
          token: crypto.randomBytes(32).toString('hex'),
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id,email' })

      if (verificationError) {
        console.error('Error creating verification record:', verificationError)
        // Non-fatal - continue with admin creation
      }
    }

    // Create admin_roles entry with must_change_password = true
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .insert({
        user_id: userId,
        role,
        must_change_password: true
      })

    if (roleError) throw roleError

    // Send invitation email with temporary password
    const loginUrl = `${getSiteUrl()}/admin/login`
    const emailSent = await sendAdminInvitationEmail(email, role, temporaryPassword, loginUrl)

    if (!emailSent) {
      console.error('Failed to send invitation email, but admin was created')
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userId,
        email,
        role,
        emailSent
      },
      message: emailSent
        ? 'Admin invited successfully. Invitation email sent.'
        : 'Admin created but failed to send email. Please share credentials manually.'
    })
  } catch (error: any) {
    console.error('Error inviting admin:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Failed to invite admin user' }
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/admins - Delete an admin user
 * Removes admin role and optionally deletes the entire user account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const deleteUser = searchParams.get('deleteUser') === 'true'

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'User ID is required' }
        },
        { status: 400 }
      )
    }

    // Get user email before deletion for cleanup
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email

    // Delete from admin_roles
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .delete()
      .eq('user_id', userId)

    if (roleError) {
      console.error('Error deleting admin role:', roleError)
    }

    if (deleteUser) {
      // Delete from email_verification_tokens
      if (userEmail) {
        await supabaseAdmin
          .from('email_verification_tokens')
          .delete()
          .eq('user_id', userId)
      }

      // Delete from password_reset_tokens
      if (userEmail) {
        await supabaseAdmin
          .from('password_reset_tokens')
          .delete()
          .eq('user_id', userId)
      }

      // Delete from user_profiles
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      // Delete the auth user completely
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error deleting auth user:', authError)
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Failed to delete user account: ' + authError.message }
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin and user account deleted successfully'
      })
    } else {
      // Just remove admin role, keep user account
      // Update user_profiles role back to applicant
      await supabaseAdmin
        .from('user_profiles')
        .update({ role: 'applicant' })
        .eq('id', userId)

      return NextResponse.json({
        success: true,
        message: 'Admin role removed successfully. User account preserved.'
      })
    }
  } catch (error: any) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Failed to delete admin' }
      },
      { status: 500 }
    )
  }
}
