-- ============================================================================
-- SINGLE-QUERY MIGRATION VERIFICATION
-- ============================================================================
-- Purpose: Returns ALL verification results in ONE query (for Supabase SQL Editor)
-- Run this in Supabase SQL Editor to see all results at once
-- ============================================================================

WITH

-- Check tables
table_counts AS (
  SELECT
    'Tables Created' as check_name,
    12 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 12 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'user_profiles', 'registrations', 'form_templates',
      'form_questions', 'form_responses', 'form_answers',
      'review_locks', 'reviewers', 'email_templates',
      'email_logs', 'tickets', 'papers'
    )
),

-- Check ENUMs
enum_counts AS (
  SELECT
    'ENUMs Created' as check_name,
    6 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 6 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_type
  WHERE typname IN (
    'user_role', 'registration_status', 'question_type',
    'response_status', 'email_status', 'paper_status'
  )
),

-- Check indexes
index_counts AS (
  SELECT
    'Indexes Created' as check_name,
    35 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) >= 35 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN (
      'user_profiles', 'registrations', 'form_templates',
      'form_questions', 'form_responses', 'form_answers',
      'review_locks', 'reviewers', 'email_templates',
      'email_logs', 'tickets', 'papers', 'events'
    )
    AND indexname LIKE 'idx_%'
),

-- Check RLS enabled
rls_counts AS (
  SELECT
    'RLS Enabled' as check_name,
    12 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 12 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'user_profiles', 'registrations', 'form_templates',
      'form_questions', 'form_responses', 'form_answers',
      'review_locks', 'reviewers', 'email_templates',
      'email_logs', 'tickets', 'papers'
    )
    AND rowsecurity = true
),

-- Check RLS policies
policy_counts AS (
  SELECT
    'RLS Policies' as check_name,
    45 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) >= 45 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'user_profiles', 'registrations', 'form_templates',
      'form_questions', 'form_responses', 'form_answers',
      'review_locks', 'reviewers', 'email_templates',
      'email_logs', 'tickets', 'papers'
    )
),

-- Check storage policies
storage_policy_counts AS (
  SELECT
    'Storage Policies' as check_name,
    6 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) >= 6 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      policyname LIKE '%tickets%' OR
      policyname LIKE '%form%' OR
      policyname LIKE '%papers%'
    )
),

-- Check functions
function_counts AS (
  SELECT
    'Helper Functions' as check_name,
    3 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 3 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'is_admin',
      'cleanup_expired_locks',
      'update_updated_at_column'
    )
),

-- Check triggers
trigger_counts AS (
  SELECT
    'Triggers Created' as check_name,
    7 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 7 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.tgname LIKE 'update_%_updated_at'
    AND NOT t.tgisinternal
),

-- Check unique constraints
unique_constraint_counts AS (
  SELECT
    'UNIQUE Constraints' as check_name,
    3 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM information_schema.table_constraints
  WHERE constraint_type = 'UNIQUE'
    AND table_schema = 'public'
    AND table_name IN ('registrations', 'review_locks', 'reviewers', 'tickets')
    AND constraint_name IN ('unique_user_event', 'review_locks_registration_id_key', 'unique_reviewer_event')
),

-- Check events table columns
events_columns AS (
  SELECT
    'Events Table Columns' as check_name,
    2 as expected,
    COUNT(*) as actual,
    CASE WHEN COUNT(*) = 2 THEN '✓ PASS' ELSE '✗ FAIL' END as status
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name IN ('initial_template_id', 'detailed_template_id')
),

-- Combine all results
all_checks AS (
  SELECT * FROM table_counts
  UNION ALL SELECT * FROM enum_counts
  UNION ALL SELECT * FROM index_counts
  UNION ALL SELECT * FROM rls_counts
  UNION ALL SELECT * FROM policy_counts
  UNION ALL SELECT * FROM storage_policy_counts
  UNION ALL SELECT * FROM function_counts
  UNION ALL SELECT * FROM trigger_counts
  UNION ALL SELECT * FROM unique_constraint_counts
  UNION ALL SELECT * FROM events_columns
),

-- Calculate summary
summary AS (
  SELECT
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE status = '✓ PASS') as passed,
    COUNT(*) FILTER (WHERE status = '✗ FAIL') as failed
  FROM all_checks
)

-- Return results with summary
SELECT
  '═══════════════════════════════════════════════════════════════' as separator,
  'MIGRATION VERIFICATION RESULTS' as title
UNION ALL
SELECT
  '═══════════════════════════════════════════════════════════════',
  ''
UNION ALL
SELECT '', ''
UNION ALL
SELECT
  check_name,
  'Expected: ' || expected::text || ' | Actual: ' || actual::text || ' | ' || status
FROM all_checks
UNION ALL
SELECT '', ''
UNION ALL
SELECT
  '───────────────────────────────────────────────────────────────',
  ''
UNION ALL
SELECT
  'SUMMARY',
  (SELECT passed::text || '/' || total_checks::text || ' checks passed' FROM summary)
UNION ALL
SELECT
  '',
  CASE
    WHEN (SELECT passed FROM summary) = (SELECT total_checks FROM summary)
    THEN '✅ ALL CHECKS PASSED - Migration successful!'
    ELSE '⚠️ Some checks failed - Review errors above'
  END
UNION ALL
SELECT
  '═══════════════════════════════════════════════════════════════',
  '';
