-- ═══════════════════════════════════════════════════════════════════════
-- POST-DEPLOYMENT VERIFICATION SCRIPT
-- ═══════════════════════════════════════════════════════════════════════
-- Run this script after deploying migrations to verify everything is correct
-- All queries should return expected results
-- ═══════════════════════════════════════════════════════════════════════

\echo '========================================='
\echo 'INDABAX KENYA - DEPLOYMENT VERIFICATION'
\echo '========================================='
\echo ''

-- ============================================================================
-- TEST 1: Verify all tables exist
-- ============================================================================
\echo 'TEST 1: Checking if all tables exist (should be ~20-22)...'
\echo ''

SELECT
  'Tables Count: ' || COUNT(*)::text AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Expected: ~20-22 tables (includes new tag system, expertise, schedule_speakers)

\echo ''
\echo 'Table List:'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- TEST 2: Verify RLS is enabled on all tables
-- ============================================================================
\echo ''
\echo 'TEST 2: Checking RLS is enabled...'
\echo ''

SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All should show "✓ Enabled"

-- ============================================================================
-- TEST 3: Verify form submission policies
-- ============================================================================
\echo ''
\echo 'TEST 3: Checking form submission policies...'
\echo ''

SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'contact_submissions', 'subscribers')
ORDER BY tablename, cmd, policyname;

-- Expected for each table:
-- - Admin policy: roles={authenticated}, cmd=ALL
-- - Public INSERT: roles={anon,authenticated}, cmd=INSERT
-- - Public SELECT: roles={anon,authenticated}, cmd=SELECT

-- ============================================================================
-- TEST 4: Verify unique constraints
-- ============================================================================
\echo ''
\echo 'TEST 4: Checking unique constraints on applications table...'
\echo ''

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'applications'
  AND indexname LIKE '%unique%';

-- Expected: 2 unique indexes
-- - applications_email_event_type_unique
-- - applications_phone_event_type_unique

-- ============================================================================
-- TEST 5: Verify is_admin() function exists
-- ============================================================================
\echo ''
\echo 'TEST 5: Checking is_admin() function...'
\echo ''

SELECT
  proname AS function_name,
  pg_get_function_result(oid) AS return_type,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Expected: Function should exist, return BOOLEAN, and be SECURITY DEFINER

-- ============================================================================
-- TEST 5B: Verify admin_roles RLS policy is non-recursive
-- ============================================================================
\echo ''
\echo 'TEST 5B: Checking admin_roles RLS policy...'
\echo ''

SELECT
  policyname,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_roles';

-- Expected: Only one SELECT policy with simple "user_id = auth.uid()" expression
-- Should NOT have any subqueries that reference admin_roles

-- ============================================================================
-- TEST 6: Check admin_roles table structure
-- ============================================================================
\echo ''
\echo 'TEST 6: Checking admin_roles table...'
\echo ''

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_roles'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 7: Test anonymous user can theoretically insert
-- ============================================================================
\echo ''
\echo 'TEST 7: Simulating anonymous user permissions...'
\echo ''

-- This query checks if anon role can theoretically insert
-- (Actual test should be done via API)
SELECT
  'applications' AS table_name,
  COUNT(*) FILTER (WHERE cmd = 'INSERT' AND 'anon' = ANY(roles)) AS anon_insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND 'anon' = ANY(roles)) AS anon_select_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'applications'
UNION ALL
SELECT
  'contact_submissions',
  COUNT(*) FILTER (WHERE cmd = 'INSERT' AND 'anon' = ANY(roles)),
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND 'anon' = ANY(roles))
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'contact_submissions'
UNION ALL
SELECT
  'subscribers',
  COUNT(*) FILTER (WHERE cmd = 'INSERT' AND 'anon' = ANY(roles)),
  COUNT(*) FILTER (WHERE cmd = 'SELECT' AND 'anon' = ANY(roles))
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscribers';

-- Expected: Each table should have 1 INSERT policy and 1 SELECT policy for anon

-- ============================================================================
-- TEST 8: Verify photos table schema (Migration 06)
-- ============================================================================
\echo ''
\echo 'TEST 8: Checking photos table has year and event_id columns...'
\echo ''

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'photos'
  AND column_name IN ('year', 'event_id', 'metadata')
ORDER BY column_name;

-- Expected: year (integer), event_id (uuid), metadata (jsonb) columns exist

-- ============================================================================
-- TEST 9: Verify tag system tables (Migration 08)
-- ============================================================================
\echo ''
\echo 'TEST 9: Checking tag system tables exist...'
\echo ''

SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_tags', 'post_tags', 'event_event_tags', 'post_post_tags')
ORDER BY table_name;

-- Expected: 4 tables (event_tags, post_tags, event_event_tags, post_post_tags)

-- ============================================================================
-- TEST 10: Verify expertise tables (Migration 09)
-- ============================================================================
\echo ''
\echo 'TEST 10: Checking expertise and relationship tables...'
\echo ''

SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('expertise', 'speaker_expertise', 'event_speakers')
ORDER BY table_name;

-- Expected: 3 tables (expertise, speaker_expertise, event_speakers)

-- ============================================================================
-- TEST 11: Verify schedule_speakers junction table (Migration 11) ⚡
-- ============================================================================
\echo ''
\echo 'TEST 11: Checking schedule_speakers junction table...'
\echo ''

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schedule_speakers'
ORDER BY ordinal_position;

-- Expected: id, schedule_id, speaker_id, created_at columns exist

\echo ''
\echo 'Checking schedule_speakers foreign keys...'

SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.schedule_speakers'::regclass
  AND contype = 'f';

-- Expected: 2 foreign key constraints (to schedule_items and speakers)

-- ============================================================================
-- TEST 12: Verify storage buckets (Migration 05) ⚡
-- ============================================================================
\echo ''
\echo 'TEST 12: Verifying all storage buckets exist...'
\echo ''

SELECT
  name AS bucket_name,
  public AS is_public
FROM storage.buckets
ORDER BY name;

-- Expected: 6 buckets
-- - event-images (public)
-- - gallery-photos (public)
-- - post-images (public)
-- - site-assets (public)
-- - speaker-photos (public)
-- - sponsor-logos (public)

SELECT
  'Total Buckets: ' || COUNT(*)::text AS result
FROM storage.buckets;

-- Expected: 6 buckets

-- ============================================================================
-- TEST 13: Verify phase 1 columns were added (Migration 07)
-- ============================================================================
\echo ''
\echo 'TEST 13: Checking phase 1 columns exist...'
\echo ''

-- Check events table has location and capacity
SELECT
  'events.' || column_name AS column_check,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name IN ('location', 'capacity', 'registration_url')
ORDER BY column_name;

-- Check posts table has featured and excerpt
SELECT
  'posts.' || column_name AS column_check,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name IN ('featured', 'excerpt', 'published')
ORDER BY column_name;

-- ============================================================================
-- TEST 14: Critical tables verification checklist ✅
-- ============================================================================
\echo ''
\echo 'TEST 14: Critical tables checklist...'
\echo ''

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule_speakers')
    THEN '✅ schedule_speakers exists'
    ELSE '❌ schedule_speakers MISSING'
  END AS schedule_speakers_check,
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'event-images')
    THEN '✅ event-images bucket exists'
    ELSE '❌ event-images bucket MISSING'
  END AS storage_check,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_tags')
    THEN '✅ Tag system exists'
    ELSE '❌ Tag system MISSING'
  END AS tags_check,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expertise')
    THEN '✅ Expertise system exists'
    ELSE '❌ Expertise system MISSING'
  END AS expertise_check;

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo ''
\echo '========================================='
\echo 'VERIFICATION COMPLETE - 14 TESTS'
\echo '========================================='
\echo ''
\echo 'Tests Performed:'
\echo '  1. Table count verification (~20-22 tables)'
\echo '  2. RLS enabled on all tables'
\echo '  3. Form submission policies'
\echo '  4. Unique constraints'
\echo '  5. is_admin() function'
\echo '  5B. admin_roles RLS policy'
\echo '  6. admin_roles table structure'
\echo '  7. Anonymous user permissions'
\echo '  8. Photos table schema (year, event_id)'
\echo '  9. Tag system tables (4 tables)'
\echo '  10. Expertise tables (3 tables)'
\echo '  11. schedule_speakers junction table ⚡'
\echo '  12. Storage buckets (6 buckets) ⚡'
\echo '  13. Phase 1 columns added'
\echo '  14. Critical tables checklist ✅'
\echo ''
\echo 'Next steps:'
\echo '1. Review all test results above'
\echo '2. Verify all checks passed'
\echo '3. Ensure critical migrations completed:'
\echo '   - ✅ Storage buckets exist (migration 05)'
\echo '   - ✅ schedule_speakers table exists (migration 11)'
\echo '4. Test API endpoints with Postman/Insomnia'
\echo '5. Try submitting forms as anonymous user'
\echo '6. Test image uploads in admin panel'
\echo '7. Test schedule management functionality'
\echo '8. Test duplicate detection by submitting forms twice'
\echo ''
