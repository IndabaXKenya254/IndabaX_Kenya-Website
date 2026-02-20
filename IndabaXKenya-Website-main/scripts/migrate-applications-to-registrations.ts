/**
 * Data Migration Script: applications → registrations
 *
 * Purpose: Migrate existing application data from the old `applications` table
 * to the new registration system with proper structure.
 *
 * Run: tsx scripts/migrate-applications-to-registrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Check .env.local for:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OldApplication {
  id: string;
  name: string;
  email: string;
  event_id?: string;
  status: string;
  background?: string;
  short_answers?: any;
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  [key: string]: any;
}

interface MigrationStats {
  totalApplications: number;
  usersCreated: number;
  registrationsCreated: number;
  responsesCreated: number;
  answersCreated: number;
  errors: number;
  skipped: number;
}

const stats: MigrationStats = {
  totalApplications: 0,
  usersCreated: 0,
  registrationsCreated: 0,
  responsesCreated: 0,
  answersCreated: 0,
  errors: 0,
  skipped: 0,
};

/**
 * Check if old applications table exists
 */
async function checkOldTable(): Promise<boolean> {
  console.log('🔍 Checking for old applications table...');

  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Applications table not found or error:', error.message);
    return false;
  }

  console.log('✓ Applications table exists');
  return true;
}

/**
 * Get or create user profile from email
 */
async function getOrCreateUser(email: string, name: string): Promise<string | null> {
  // Check if user profile already exists
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Check if auth user exists
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error(`   ⚠️  Could not check auth users: ${authError.message}`);
  }

  const authUser = authUsers?.users?.find(u => u.email === email);

  if (authUser) {
    // Create profile for existing auth user
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.id,
        email: email,
        name: name,
        email_verified: authUser.email_confirmed_at ? true : false,
        role: 'applicant',
      })
      .select('id')
      .single();

    if (profileError) {
      console.error(`   ❌ Error creating profile: ${profileError.message}`);
      return null;
    }

    stats.usersCreated++;
    return newProfile.id;
  }

  // No auth user - create placeholder profile with random UUID
  // Note: These users won't be able to log in until they register
  const { data: newProfile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      email: email,
      name: name,
      email_verified: false,
      role: 'applicant',
      is_new_user: true,
    })
    .select('id')
    .single();

  if (profileError) {
    console.error(`   ❌ Error creating placeholder profile: ${profileError.message}`);
    return null;
  }

  stats.usersCreated++;
  console.log(`   ℹ️  Created placeholder profile (user must register to access)`);
  return newProfile.id;
}

/**
 * Map old status to new registration status
 */
function mapStatus(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'accepted': 'approved',
    'approved': 'approved',
    'rejected': 'rejected',
    'submitted': 'interested',
    'reviewed': 'pending',
  };

  return statusMap[oldStatus.toLowerCase()] || 'interested';
}

/**
 * Create form response and answers from old application data
 */
async function createFormResponse(
  userId: string,
  eventId: string,
  application: OldApplication
): Promise<string | null> {
  // Create a basic form response (we don't have templates yet, so this is minimal)
  const { data: response, error: responseError } = await supabase
    .from('form_responses')
    .insert({
      user_id: userId,
      event_id: eventId,
      template_id: null, // Will be linked to template later when templates are created
      status: 'completed',
      started_at: application.submitted_at,
      completed_at: application.submitted_at,
      last_saved_at: application.submitted_at,
    })
    .select('id')
    .single();

  if (responseError) {
    console.error(`   ❌ Error creating form response: ${responseError.message}`);
    return null;
  }

  stats.responsesCreated++;

  // Create answers from background and short_answers
  const answers = [];

  // Background answer (if exists)
  if (application.background) {
    answers.push({
      response_id: response.id,
      question_id: null, // No question linked yet
      text_answer: application.background,
    });
  }

  // Short answers (if exists and is JSON)
  if (application.short_answers) {
    try {
      const shortAnswers = typeof application.short_answers === 'string'
        ? JSON.parse(application.short_answers)
        : application.short_answers;

      if (Array.isArray(shortAnswers)) {
        shortAnswers.forEach((qa: any) => {
          answers.push({
            response_id: response.id,
            question_id: null,
            text_answer: typeof qa === 'string' ? qa : JSON.stringify(qa),
          });
        });
      }
    } catch (e) {
      console.error(`   ⚠️  Could not parse short_answers: ${e}`);
    }
  }

  // Insert answers if any
  if (answers.length > 0) {
    const { error: answersError } = await supabase
      .from('form_answers')
      .insert(answers);

    if (answersError) {
      console.error(`   ⚠️  Error creating answers: ${answersError.message}`);
    } else {
      stats.answersCreated += answers.length;
    }
  }

  return response.id;
}

/**
 * Migrate a single application
 */
async function migrateApplication(application: OldApplication): Promise<boolean> {
  console.log(`\n📝 Migrating: ${application.name} (${application.email})`);

  // Get or create user profile
  const userId = await getOrCreateUser(application.email, application.name);
  if (!userId) {
    console.error('   ❌ Failed to create/get user profile');
    stats.errors++;
    return false;
  }

  // Determine event_id (use first event if not specified)
  let eventId = application.event_id;
  if (!eventId) {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (events && events.length > 0) {
      eventId = events[0].id;
      console.log(`   ℹ️  No event_id found, using latest event: ${eventId}`);
    } else {
      console.error('   ❌ No events found in database');
      stats.errors++;
      return false;
    }
  }

  // Check if registration already exists
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single();

  if (existing) {
    console.log('   ⏭️  Registration already exists, skipping');
    stats.skipped++;
    return true;
  }

  // Create form response
  const formResponseId = await createFormResponse(userId, eventId, application);

  // Map status
  const newStatus = mapStatus(application.status);

  // Create registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({
      user_id: userId,
      event_id: eventId,
      status: newStatus,
      initial_form_response_id: formResponseId,
      review_notes: application.notes,
      reviewed_at: application.reviewed_at,
      registered_at: application.submitted_at,
    })
    .select('id')
    .single();

  if (regError) {
    console.error(`   ❌ Error creating registration: ${regError.message}`);
    stats.errors++;
    return false;
  }

  stats.registrationsCreated++;
  console.log(`   ✓ Registration created: ${registration.id}`);
  return true;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Data Migration: applications → registrations             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check if old table exists
  const tableExists = await checkOldTable();
  if (!tableExists) {
    console.error('\n❌ Migration aborted: applications table not found');
    process.exit(1);
  }

  // Fetch all applications
  console.log('\n📥 Fetching applications from old table...');
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching applications:', error.message);
    process.exit(1);
  }

  if (!applications || applications.length === 0) {
    console.log('✓ No applications to migrate');
    process.exit(0);
  }

  stats.totalApplications = applications.length;
  console.log(`✓ Found ${applications.length} applications to migrate\n`);

  // Confirm migration
  console.log('⚠️  IMPORTANT: This will create new records in:');
  console.log('   - user_profiles (if users don\'t exist)');
  console.log('   - registrations');
  console.log('   - form_responses');
  console.log('   - form_answers');
  console.log('\n   The old applications table will NOT be deleted.\n');

  // In a real scenario, you'd want user confirmation here
  // For automation, we'll proceed

  console.log('🚀 Starting migration...\n');
  console.log('═'.repeat(60));

  // Migrate each application
  for (const application of applications) {
    await migrateApplication(application);
  }

  // Print summary
  console.log('\n═'.repeat(60));
  console.log('\n✅ Migration Complete!\n');
  console.log('📊 Summary:');
  console.log('─'.repeat(60));
  console.log(`   Total applications:      ${stats.totalApplications}`);
  console.log(`   Users created:           ${stats.usersCreated}`);
  console.log(`   Registrations created:   ${stats.registrationsCreated}`);
  console.log(`   Form responses created:  ${stats.responsesCreated}`);
  console.log(`   Form answers created:    ${stats.answersCreated}`);
  console.log(`   Skipped (duplicates):    ${stats.skipped}`);
  console.log(`   Errors:                  ${stats.errors}`);
  console.log('─'.repeat(60));

  if (stats.errors > 0) {
    console.log('\n⚠️  Some migrations failed. Check errors above.');
    process.exit(1);
  } else {
    console.log('\n✓ All applications migrated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in new tables (registrations, form_responses, etc.)');
    console.log('   2. Create form templates via admin panel');
    console.log('   3. Link existing responses to templates (if needed)');
    console.log('   4. Test registration flow with new system');
    console.log('   5. Once verified, archive old applications table');
  }
}

// Run migration
migrate().catch((error) => {
  console.error('\n❌ Fatal error during migration:', error);
  process.exit(1);
});
