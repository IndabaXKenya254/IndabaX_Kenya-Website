-- ============================================================================
-- VERIFY MIGRATION: Registration System Redesign
-- ============================================================================
-- Purpose: Verify all tables, indexes, ENUMs, and policies were created
-- Run this in Supabase SQL Editor to verify migration success
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY TABLES
-- ============================================================================

SELECT
  '=== TABLES VERIFICATION ===' as section,
  '' as details;

SELECT
  'Tables Created' as check_name,
  COUNT(*) as count,
  '12 expected' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  );

-- List all tables
SELECT
  table_name,
  '✓' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: VERIFY ENUMS
-- ============================================================================

SELECT
  '' as spacer,
  '=== ENUMS VERIFICATION ===' as section;

SELECT
  'ENUMs Created' as check_name,
  COUNT(*) as count,
  '6 expected' as expected
FROM pg_type
WHERE typname IN (
  'user_role', 'registration_status', 'question_type',
  'response_status', 'email_status', 'paper_status'
);

-- List all ENUMs with their values
SELECT
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
  'user_role', 'registration_status', 'question_type',
  'response_status', 'email_status', 'paper_status'
)
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- SECTION 3: VERIFY INDEXES
-- ============================================================================

SELECT
  '' as spacer,
  '=== INDEXES VERIFICATION ===' as section;

SELECT
  'Indexes Created' as check_name,
  COUNT(*) as count,
  '~40 expected' as expected
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers', 'events'
  )
  AND indexname LIKE 'idx_%';

-- List indexes per table
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers', 'events'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 4: VERIFY UNIQUE CONSTRAINTS
-- ============================================================================

SELECT
  '' as spacer,
  '=== UNIQUE CONSTRAINTS VERIFICATION ===' as section;

SELECT
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ') as columns,
  '✓' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('registrations', 'review_locks', 'reviewers', 'tickets')
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- SECTION 5: VERIFY ROW LEVEL SECURITY (RLS)
-- ============================================================================

SELECT
  '' as spacer,
  '=== RLS VERIFICATION ===' as section;

SELECT
  'RLS Enabled' as check_name,
  COUNT(*) as count,
  '12 expected' as expected
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
  AND rowsecurity = true;

-- List RLS status per table
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
ORDER BY tablename;

-- ============================================================================
-- SECTION 6: VERIFY RLS POLICIES
-- ============================================================================

SELECT
  '' as spacer,
  '=== RLS POLICIES VERIFICATION ===' as section;

SELECT
  'Policies Created' as check_name,
  COUNT(*) as count,
  '~50 expected' as expected
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  );

-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 7: VERIFY STORAGE POLICIES
-- ============================================================================

SELECT
  '' as spacer,
  '=== STORAGE POLICIES VERIFICATION ===' as section;

SELECT
  'Storage Policies' as check_name,
  COUNT(*) as count,
  '6 expected' as expected
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'Users can view own tickets',
    'System can upload tickets',
    'Users can view own form uploads',
    'Users can upload to form-uploads',
    'Users can view own papers',
    'Users can upload papers'
  );

-- List storage policies
SELECT
  policyname,
  cmd as operation,
  '✓' as status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%tickets%'
     OR policyname LIKE '%form%'
     OR policyname LIKE '%papers%'
ORDER BY policyname;

-- ============================================================================
-- SECTION 8: VERIFY HELPER FUNCTIONS
-- ============================================================================

SELECT
  '' as spacer,
  '=== HELPER FUNCTIONS VERIFICATION ===' as section;

SELECT
  'Functions Created' as check_name,
  COUNT(*) as count,
  '3 expected' as expected
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin',
    'cleanup_expired_locks',
    'update_updated_at_column'
  );

-- List functions
SELECT
  proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  '✓' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin',
    'cleanup_expired_locks',
    'update_updated_at_column'
  )
ORDER BY proname;

-- ============================================================================
-- SECTION 9: VERIFY TRIGGERS
-- ============================================================================

SELECT
  '' as spacer,
  '=== TRIGGERS VERIFICATION ===' as section;

SELECT
  'Triggers Created' as check_name,
  COUNT(*) as count,
  '7 expected' as expected
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgname LIKE 'update_%_updated_at'
  AND NOT t.tgisinternal;

-- List triggers per table
SELECT
  c.relname as table_name,
  t.tgname as trigger_name,
  '✓' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgname LIKE 'update_%_updated_at'
  AND NOT t.tgisinternal
ORDER BY c.relname;

-- ============================================================================
-- SECTION 10: VERIFY FOREIGN KEYS
-- ============================================================================

SELECT
  '' as spacer,
  '=== FOREIGN KEYS VERIFICATION ===' as section;

SELECT
  'Foreign Keys' as check_name,
  COUNT(*) as count,
  '~30 expected' as expected
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  );

-- Count FKs per table
SELECT
  table_name,
  COUNT(*) as fk_count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- SECTION 11: VERIFY EVENTS TABLE MODIFICATIONS
-- ============================================================================

SELECT
  '' as spacer,
  '=== EVENTS TABLE MODIFICATIONS ===' as section;

SELECT
  column_name,
  data_type,
  is_nullable,
  '✓' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name IN ('initial_template_id', 'detailed_template_id')
ORDER BY column_name;

-- ============================================================================
-- SECTION 12: VERIFY STORAGE BUCKETS (MANUAL)
-- ============================================================================

SELECT
  '' as spacer,
  '=== STORAGE BUCKETS VERIFICATION ===' as section;

-- Note: This requires checking Supabase Dashboard > Storage
-- or querying storage.buckets (requires elevated permissions)

SELECT
  'Storage buckets must be verified manually via Supabase Dashboard' as note,
  'Expected buckets: tickets, form-uploads, papers' as details;

-- ============================================================================
-- SECTION 13: CHECK FOR ERRORS OR WARNINGS
-- ============================================================================

SELECT
  '' as spacer,
  '=== POTENTIAL ISSUES ===' as section;

-- Check for tables without RLS
SELECT
  'Tables without RLS' as issue,
  tablename as table_name,
  '⚠️ WARNING' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
  AND rowsecurity = false;

-- Check for missing indexes on foreign keys
SELECT
  'Missing indexes on FKs' as issue,
  tc.table_name,
  kcu.column_name,
  '⚠️ WARNING' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'user_profiles', 'registrations', 'form_templates',
    'form_questions', 'form_responses', 'form_answers',
    'review_locks', 'reviewers', 'email_templates',
    'email_logs', 'tickets', 'papers'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  );

-- ============================================================================
-- SECTION 14: SUMMARY
-- ============================================================================

SELECT
  '' as spacer,
  '=== MIGRATION VERIFICATION SUMMARY ===' as section;

SELECT
  'Migration Status' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('user_profiles', 'registrations', 'form_templates',
                             'form_questions', 'form_responses', 'form_answers',
                             'review_locks', 'reviewers', 'email_templates',
                             'email_logs', 'tickets', 'papers')) = 12
    THEN '✓ SUCCESS - All 12 tables created'
    ELSE '✗ FAILED - Missing tables'
  END as status;

SELECT
  'ENUMs' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_type
          WHERE typname IN ('user_role', 'registration_status', 'question_type',
                           'response_status', 'email_status', 'paper_status')) = 6
    THEN '✓ All 6 ENUMs created'
    ELSE '✗ Missing ENUMs'
  END as status;

SELECT
  'RLS Status' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_tables
          WHERE schemaname = 'public'
          AND rowsecurity = true
          AND tablename IN ('user_profiles', 'registrations', 'form_templates',
                           'form_questions', 'form_responses', 'form_answers',
                           'review_locks', 'reviewers', 'email_templates',
                           'email_logs', 'tickets', 'papers')) = 12
    THEN '✓ RLS enabled on all 12 tables'
    ELSE '✗ RLS not enabled on all tables'
  END as status;

SELECT
  'Helper Functions' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname IN ('is_admin', 'cleanup_expired_locks', 'update_updated_at_column')) = 3
    THEN '✓ All 3 functions created'
    ELSE '✗ Missing functions'
  END as status;

SELECT
  'Next Steps' as item,
  '1. Verify storage buckets in Dashboard' as status
UNION ALL
SELECT
  '' as item,
  '2. Run data migration script (applications → registrations)' as status
UNION ALL
SELECT
  '' as item,
  '3. Test API endpoints' as status;

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
