-- ═══════════════════════════════════════════════════════════════════════
-- POST-DEPLOYMENT VERIFICATION SCRIPT (SUPABASE SQL EDITOR VERSION)
-- ═══════════════════════════════════════════════════════════════════════
-- Run this script in Supabase SQL Editor after deploying migrations
-- This version uses SQL comments instead of \echo (which only works in psql)
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- TEST 1: Verify all tables exist (should be ~20-22)
-- ============================================================================

SELECT 'TEST 1: TABLE COUNT' as test_name;
SELECT
  'Total Tables: ' || COUNT(*)::text AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

SELECT 'Table List:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- TEST 2: Verify RLS is enabled on all tables
-- ============================================================================

SELECT 'TEST 2: RLS STATUS' as test_name;
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- TEST 3: Verify form submission policies
-- ============================================================================

SELECT 'TEST 3: FORM SUBMISSION POLICIES' as test_name;
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'contact_submissions', 'subscribers')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- TEST 4: Verify unique constraints
-- ============================================================================

SELECT 'TEST 4: UNIQUE CONSTRAINTS' as test_name;
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'applications'
  AND indexname LIKE '%unique%';

-- ============================================================================
-- TEST 5: Verify is_admin() function exists
-- ============================================================================

SELECT 'TEST 5: IS_ADMIN FUNCTION' as test_name;
SELECT
  proname AS function_name,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- TEST 5B: Verify admin_roles RLS policy
-- ============================================================================

SELECT 'TEST 5B: ADMIN_ROLES RLS POLICY' as test_name;
SELECT
  policyname,
  roles,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_roles';

-- ============================================================================
-- TEST 6: Check admin_roles table structure
-- ============================================================================

SELECT 'TEST 6: ADMIN_ROLES TABLE STRUCTURE' as test_name;
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_roles'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 7: Test anonymous user permissions
-- ============================================================================

SELECT 'TEST 7: ANONYMOUS USER PERMISSIONS' as test_name;
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

-- ============================================================================
-- TEST 8: Verify photos table schema (Migration 06)
-- ============================================================================

SELECT 'TEST 8: PHOTOS TABLE SCHEMA' as test_name;
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'photos'
  AND column_name IN ('year', 'event_id', 'metadata')
ORDER BY column_name;

-- ============================================================================
-- TEST 9: Verify tag system tables (Migration 08)
-- ============================================================================

SELECT 'TEST 9: TAG SYSTEM TABLES' as test_name;
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_tags', 'post_tags', 'event_tag_relations', 'post_tag_relations')
ORDER BY table_name;

-- ============================================================================
-- TEST 10: Verify expertise tables (Migration 09)
-- ============================================================================

SELECT 'TEST 10: EXPERTISE TABLES' as test_name;
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('speaker_expertise', 'speaker_expertise_relations', 'event_speakers')
ORDER BY table_name;

-- ============================================================================
-- TEST 11: Verify schedule_speakers junction table (Migration 11) ⚡
-- ============================================================================

SELECT 'TEST 11: SCHEDULE_SPEAKERS TABLE' as test_name;
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schedule_speakers'
ORDER BY ordinal_position;

SELECT 'Foreign Keys:' as info;
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'public.schedule_speakers'::regclass
  AND contype = 'f';

-- ============================================================================
-- TEST 12: Verify storage buckets (Migration 05) ⚡
-- ============================================================================

SELECT 'TEST 12: STORAGE BUCKETS' as test_name;
SELECT
  name AS bucket_name,
  public AS is_public
FROM storage.buckets
ORDER BY name;

SELECT 'Total Buckets: ' || COUNT(*)::text AS result
FROM storage.buckets;

-- ============================================================================
-- TEST 13: Verify phase 1 columns (Migration 07)
-- ============================================================================

SELECT 'TEST 13: PHASE 1 COLUMNS' as test_name;

-- Check events table
SELECT
  'events.' || column_name AS column_check,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name IN ('location', 'capacity', 'registration_url')
ORDER BY column_name;

-- Check posts table
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

SELECT 'TEST 14: CRITICAL TABLES CHECKLIST' as test_name;
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
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'speaker_expertise')
    THEN '✅ Expertise system exists'
    ELSE '❌ Expertise system MISSING'
  END AS expertise_check;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=========================================' as summary;
SELECT 'VERIFICATION COMPLETE - 14 TESTS' as summary;
SELECT '=========================================' as summary;
SELECT '' as summary;
SELECT 'All tests completed. Review results above.' as summary;
SELECT 'Expected Results:' as summary;
SELECT '- ~20-22 tables total' as summary;
SELECT '- RLS enabled on all tables' as summary;
SELECT '- Storage buckets exist (6 buckets)' as summary;
SELECT '- schedule_speakers table exists' as summary;
SELECT '- Tag system tables exist (4 tables)' as summary;
SELECT '- Expertise tables exist (3 tables)' as summary;
