export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION HANDLER
// ═══════════════════════════════════════════════════════════════════════
// GET /api/auth/verify-email?token=xxx - Verify email with token
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 [VERIFY] Email verification request received')

    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    console.log(`🔐 [VERIFY] Token: ${token ? token.substring(0, 10) + '...' : 'MISSING'}`)

    if (!token) {
      console.log('❌ [VERIFY] No token provided')
      return NextResponse.redirect(
        new URL('/verify-email?error=missing_token', request.url)
      )
    }

    const supabase = createAdminClient()

    // Find the verification token
    console.log(`🔍 [VERIFY] Looking up token in database...`)
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      console.log('❌ [VERIFY] Token not found or error:', tokenError)
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid_token', request.url)
      )
    }

    console.log(`✅ [VERIFY] Token found for user: ${tokenData.user_id}, email: ${tokenData.email}`)

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    console.log(`⏰ [VERIFY] Checking expiry - Now: ${now.toISOString()}, Expires: ${expiresAt.toISOString()}`)

    if (expiresAt < now) {
      console.log('❌ [VERIFY] Token has expired')
      return NextResponse.redirect(
        new URL('/verify-email?error=expired_token', request.url)
      )
    }

    console.log('✅ [VERIFY] Token is not expired')

    // Check if already verified
    console.log(`🔍 [VERIFY] Checking if already verified - verified_at: ${tokenData.verified_at}`)
    if (tokenData.verified_at) {
      console.log('⚠️  [VERIFY] Token already verified, redirecting to already_verified status')
      return NextResponse.redirect(
        new URL('/verify-email?status=already_verified', request.url)
      )
    }

    console.log('✅ [VERIFY] Token not yet verified, proceeding with verification...')

    // ═══════════════════════════════════════════════════════════════════════
    // CASCADING VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    // Step 1: Mark custom token as verified
    // Step 2: Update Supabase auth.users.email_confirmed_at (cascade effect)

    const verifiedAt = new Date().toISOString()
    console.log(`📝 [VERIFY] Setting verified_at to: ${verifiedAt}`)

    // Step 1: Update custom verification token
    console.log(`💾 [VERIFY] Updating database - Setting verified_at for token...`)
    const { data: updateData, error: updateError } = await supabase
      .from('email_verification_tokens')
      .update({ verified_at: verifiedAt })
      .eq('token', token)
      .select()

    if (updateError) {
      console.error('❌ [VERIFY] Token update error:', updateError)
      return NextResponse.redirect(
        new URL('/verify-email?error=verification_failed', request.url)
      )
    }

    console.log(`✅ [VERIFY] Database updated successfully:`, updateData)
    console.log(`✅ [VERIFY] verified_at has been set to: ${verifiedAt}`)

    // Step 2: CASCADE to Supabase's built-in verification
    // Update email_confirmed_at in auth.users table to keep systems in sync
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      {
        email_confirm: true,
      }
    )

    if (authUpdateError) {
      console.error('Supabase auth verification cascade error:', authUpdateError)
      // Continue anyway - custom verification succeeded, Supabase cascade is secondary
    } else {
      console.log('✅ Cascading verification successful - both custom and Supabase verified')
    }

    // Step 3: Update user_profiles.email_verified to keep admin UI in sync
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', tokenData.user_id)

    if (profileUpdateError) {
      console.error('⚠️ [VERIFY] user_profiles.email_verified update error:', profileUpdateError)
      // Continue anyway - token verification is the source of truth
    } else {
      console.log('✅ [VERIFY] user_profiles.email_verified set to true')
    }

    // Get user profile for welcome email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('id', tokenData.user_id)
      .single()

    // Send welcome email
    if (profile) {
      await sendWelcomeEmail(profile.email, profile.name)
    }

    // Success - redirect to verification success page
    return NextResponse.redirect(
      new URL('/verify-email?status=success', request.url)
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(
      new URL('/verify-email?error=server_error', request.url)
    )
  }
}
