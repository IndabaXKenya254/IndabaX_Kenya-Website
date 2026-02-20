-- Check which roles each policy applies to
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('applications', 'contact_submissions', 'subscribers')
ORDER BY tablename, policyname;
