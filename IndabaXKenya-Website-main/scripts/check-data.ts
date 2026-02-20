/**
 * Quick data check script
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  console.log('🔍 Checking database state...\n');

  // Check applications table
  const { data: apps, error: appsError, count: appsCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact' });

  console.log('Old System:');
  console.log(`  applications table: ${appsCount || 0} records`);

  if (apps && apps.length > 0) {
    console.log('  Sample:', apps[0]);
  }

  // Check new tables
  const { count: usersCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: regsCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true });

  const { count: responsesCount } = await supabase
    .from('form_responses')
    .select('*', { count: 'exact', head: true });

  const { count: answersCount } = await supabase
    .from('form_answers')
    .select('*', { count: 'exact', head: true });

  console.log('\nNew System:');
  console.log(`  user_profiles: ${usersCount || 0} records`);
  console.log(`  registrations: ${regsCount || 0} records`);
  console.log(`  form_responses: ${responsesCount || 0} records`);
  console.log(`  form_answers: ${answersCount || 0} records`);

  // Check events
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  console.log('\nEvents:');
  console.log(`  events table: ${eventsCount || 0} records`);

  console.log('\n✅ Database check complete');
}

checkData().catch(console.error);
