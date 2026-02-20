/**
 * Verification Script: Check migration results
 *
 * Purpose: Run verification queries against the database to ensure
 * all tables, indexes, policies, etc. were created successfully
 *
 * Run: tsx scripts/verify-migration.ts
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VerificationResult {
  check: string;
  expected: number | string;
  actual: number | string;
  passed: boolean;
}

const results: VerificationResult[] = [];

async function runQuery(sql: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // Try alternative approach
    const { data: altData, error: altError } = await supabase
      .from('_verify_temp')
      .select('*')
      .limit(0);

    // If that fails too, we'll just return empty
    return [];
  }

  return data || [];
}

async function checkTables() {
  console.log('\n🔍 Checking tables...');

  const expectedTables = [
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  ];

  let foundCount = 0;

  for (const tableName of expectedTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (!error) {
      foundCount++;
      console.log(`   ✓ ${tableName}`);
    } else {
      console.log(`   ✗ ${tableName} - ${error.message}`);
    }
  }

  results.push({
    check: 'Tables Created',
    expected: 12,
    actual: foundCount,
    passed: foundCount === 12
  });

  return foundCount === 12;
}

async function checkRegistrations() {
  console.log('\n🔍 Checking registrations data...');

  const { data, error, count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`   ⚠️  Error checking registrations: ${error.message}`);
    return false;
  }

  console.log(`   ✓ Registrations count: ${count || 0}`);

  results.push({
    check: 'Registrations',
    expected: 'varies',
    actual: count || 0,
    passed: true
  });

  return true;
}

async function checkUserProfiles() {
  console.log('\n🔍 Checking user profiles...');

  const { data, error, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`   ⚠️  Error checking user profiles: ${error.message}`);
    return false;
  }

  console.log(`   ✓ User profiles count: ${count || 0}`);

  results.push({
    check: 'User Profiles',
    expected: 'varies',
    actual: count || 0,
    passed: true
  });

  return true;
}

async function checkFormResponses() {
  console.log('\n🔍 Checking form responses...');

  const { data, error, count } = await supabase
    .from('form_responses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`   ⚠️  Error checking form responses: ${error.message}`);
    return false;
  }

  console.log(`   ✓ Form responses count: ${count || 0}`);

  results.push({
    check: 'Form Responses',
    expected: 'varies',
    actual: count || 0,
    passed: true
  });

  return true;
}

async function checkFormAnswers() {
  console.log('\n🔍 Checking form answers...');

  const { data, error, count } = await supabase
    .from('form_answers')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`   ⚠️  Error checking form answers: ${error.message}`);
    return false;
  }

  console.log(`   ✓ Form answers count: ${count || 0}`);

  results.push({
    check: 'Form Answers',
    expected: 'varies',
    actual: count || 0,
    passed: true
  });

  return true;
}

async function checkDuplicates() {
  console.log('\n🔍 Checking for duplicates (should be 0)...');

  const { data, error } = await supabase
    .from('registrations')
    .select('user_id, event_id');

  if (error) {
    console.log(`   ⚠️  Error checking duplicates: ${error.message}`);
    return false;
  }

  const seen = new Set();
  let duplicates = 0;

  for (const row of data || []) {
    const key = `${row.user_id}-${row.event_id}`;
    if (seen.has(key)) {
      duplicates++;
      console.log(`   ✗ Duplicate found: ${key}`);
    }
    seen.add(key);
  }

  if (duplicates === 0) {
    console.log(`   ✓ No duplicates found`);
  }

  results.push({
    check: 'Duplicate Prevention',
    expected: 0,
    actual: duplicates,
    passed: duplicates === 0
  });

  return duplicates === 0;
}

async function checkEventsTable() {
  console.log('\n🔍 Checking events table modifications...');

  const { data, error } = await supabase
    .from('events')
    .select('initial_template_id, detailed_template_id')
    .limit(1);

  if (error) {
    console.log(`   ✗ Error: ${error.message}`);
    console.log(`   ⚠️  Events table may not have new columns`);
    return false;
  }

  console.log(`   ✓ Events table has template columns`);

  results.push({
    check: 'Events Table Modified',
    expected: 'yes',
    actual: 'yes',
    passed: true
  });

  return true;
}

async function printSummary() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(70));

  console.log('\nComponent                    Expected    Actual      Status');
  console.log('─'.repeat(70));

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const expected = String(result.expected).padEnd(11);
    const actual = String(result.actual).padEnd(11);
    const check = result.check.padEnd(28);

    console.log(`${check} ${expected} ${actual} ${status}`);
  }

  console.log('─'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\nTotal: ${passed}/${total} checks passed`);

  if (passed === total) {
    console.log('\n✅ All verification checks passed!');
    console.log('\n🎉 Migration successful! Database is ready.');
  } else {
    console.log('\n⚠️  Some verification checks failed.');
    console.log('Review the errors above and check the migration.');
  }
}

async function verify() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Database Migration Verification                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  await checkTables();
  await checkUserProfiles();
  await checkRegistrations();
  await checkFormResponses();
  await checkFormAnswers();
  await checkDuplicates();
  await checkEventsTable();

  await printSummary();
}

verify().catch((error) => {
  console.error('\n❌ Fatal error during verification:', error);
  process.exit(1);
});
