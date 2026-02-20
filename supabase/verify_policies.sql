-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════
-- Run this to check if policies exist and are configured correctly

-- Check if RLS is enabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'subscribers', 'contact_submissions')
ORDER BY tablename;

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'subscribers', 'contact_submissions')
ORDER BY tablename, policyname;
