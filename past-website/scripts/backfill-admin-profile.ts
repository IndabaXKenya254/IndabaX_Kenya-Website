/**
 * Backfill User Profile for Existing Admin User
 *
 * This script creates a user_profiles record for the existing admin user
 * (admin@indabaxkenya.org) who was created before the email verification
 * requirement was added.
 *
 * Run with: npx tsx scripts/backfill-admin-profile.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function backfillAdminProfile() {
  console.log('🔍 Starting admin profile backfill...\n');

  try {
    // 1. Get the existing admin user from auth.users
    const adminEmail = 'admin@indabaxkenya.org';
    const adminUserId = '66078613-da1c-47b7-ae8f-d9395da181ef';

    console.log(`📧 Looking for admin user: ${adminEmail}`);
    console.log(`🆔 User ID: ${adminUserId}\n`);

    // 2. Check if auth.users record exists
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(adminUserId);

    if (authError || !authUser) {
      console.error('❌ Admin user not found in auth.users:', authError?.message);
      process.exit(1);
    }

    console.log('✅ Admin user found in auth.users');
    console.log(`   Email: ${authUser.user.email}`);
    console.log(`   Confirmed at: ${authUser.user.confirmed_at}`);
    console.log(`   Created at: ${authUser.user.created_at}\n`);

    // 3. Check if user_profiles record already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();

    if (existingProfile) {
      console.log('⚠️  User profile already exists!');
      console.log('   Current profile:');
      console.log(`   - Email: ${existingProfile.email}`);
      console.log(`   - Email Verified: ${existingProfile.email_verified}`);
      console.log(`   - Role: ${existingProfile.role}`);
      console.log(`   - Name: ${existingProfile.name}\n`);

      // Update the existing profile to ensure it's verified and has admin role
      console.log('🔄 Updating existing profile...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email_verified: true,
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUserId);

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Profile updated successfully!');
      console.log('   - Email verified: true');
      console.log('   - Role: admin\n');
      // Continue to token creation (don't return early)
    } else {
      // 4. Create new user_profiles record
      console.log('📝 Creating new user profile...\n');

    const newProfile = {
      id: adminUserId,
      email: authUser.user.email!,
      email_verified: true, // Mark as verified
      name: authUser.user.user_metadata?.name || 'Admin User',
      organization: authUser.user.user_metadata?.organization || null,
      phone: authUser.user.user_metadata?.phone || null,
      role: 'admin', // Set as admin
      is_new_user: false, // Not a new user
      is_active: true,
      created_at: authUser.user.created_at,
      updated_at: new Date().toISOString(),
      last_login_at: authUser.user.last_sign_in_at
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create profile:', insertError.message);
      process.exit(1);
    }

    console.log('✅ User profile created successfully!');
    console.log('\n📊 Profile Details:');
    console.log(`   ID: ${insertedProfile.id}`);
    console.log(`   Email: ${insertedProfile.email}`);
    console.log(`   Email Verified: ${insertedProfile.email_verified}`);
    console.log(`   Role: ${insertedProfile.role}`);
    console.log(`   Name: ${insertedProfile.name}`);
    console.log(`   Organization: ${insertedProfile.organization || 'N/A'}`);
    console.log(`   Phone: ${insertedProfile.phone || 'N/A'}`);
    console.log(`   Is New User: ${insertedProfile.is_new_user}`);
    console.log(`   Created At: ${insertedProfile.created_at}`);
    console.log(`   Last Login: ${insertedProfile.last_login_at || 'N/A'}\n`);
    }

    // 5. Create a verified email verification token
    console.log('\n📧 Creating verified email verification token...\n');

    const { data: existingToken } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('user_id', adminUserId)
      .eq('email', adminEmail)
      .single();

    if (existingToken) {
      console.log('⚠️  Verification token already exists');
      if (!existingToken.verified_at) {
        console.log('🔄 Marking token as verified...');
        const { error: updateTokenError } = await supabase
          .from('email_verification_tokens')
          .update({ verified_at: new Date().toISOString() })
          .eq('user_id', adminUserId)
          .eq('email', adminEmail);

        if (updateTokenError) {
          console.error('❌ Failed to verify token:', updateTokenError.message);
        } else {
          console.log('✅ Token marked as verified');
        }
      } else {
        console.log('✅ Token is already verified');
      }
    } else {
      // Create new verified token
      const verificationToken = {
        user_id: adminUserId,
        token: `admin-verified-${Date.now()}`, // Unique token (doesn't matter since it's pre-verified)
        email: adminEmail,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        verified_at: new Date().toISOString(), // Already verified
        created_at: new Date().toISOString()
      };

      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert(verificationToken);

      if (tokenError) {
        console.error('❌ Failed to create verification token:', tokenError.message);
        console.error('   The admin user may still not be able to login.');
        console.error('   Error details:', tokenError);
      } else {
        console.log('✅ Verification token created and marked as verified');
      }
    }

    console.log('\n🎉 Admin backfill complete!');
    console.log('🔓 The admin user can now login without email verification.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillAdminProfile()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
