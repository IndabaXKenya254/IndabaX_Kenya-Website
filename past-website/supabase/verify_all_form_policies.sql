-- Verify all form submission tables have correct policies
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
