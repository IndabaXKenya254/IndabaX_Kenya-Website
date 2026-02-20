-- Check SELECT policies for form tables
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'contact_submissions', 'subscribers')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
