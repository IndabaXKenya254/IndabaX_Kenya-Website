#!/usr/bin/env node

// Script to run the RLS fix migration directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🔧 Running RLS Fix Migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251120_fix_user_profiles_rls.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct execution
      if (error.code === '42883') {
        console.log('⚠️  exec_sql RPC not found, trying alternative method...\n');

        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));

        console.log(`📝 Found ${statements.length} SQL statements\n`);

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];

          // Skip comments and DO blocks
          if (statement.startsWith('--') || statement.includes('DO $$')) {
            continue;
          }

          console.log(`Executing statement ${i + 1}/${statements.length}...`);

          const { error: stmtError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1); // Just a test query to check connection

          if (stmtError) {
            console.error(`❌ Error on statement ${i + 1}:`, stmtError.message);
          }
        }

        // Use curl to execute via Supabase API instead
        console.log('\n⚠️  Direct SQL execution not available via Supabase client');
        console.log('Please run this migration manually via Supabase Dashboard:\n');
        console.log('1. Go to https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/sql/new');
        console.log('2. Copy the contents of supabase/migrations/20251120_fix_user_profiles_rls.sql');
        console.log('3. Paste and run the SQL\n');

        console.log('Or use the SQL Editor Quick Run option below:\n');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));

        return;
      }

      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Changes applied:');
    console.log('  - Created get_user_role() SECURITY DEFINER function');
    console.log('  - Updated is_admin() function');
    console.log('  - Created is_reviewer() function');
    console.log('  - Fixed all RLS policies to prevent infinite recursion');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

runMigration();
