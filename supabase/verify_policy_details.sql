-- Get FULL policy details including USING and WITH CHECK clauses
SELECT
  tablename,
  policyname,
  permissive,  -- Should be 'PERMISSIVE' for all our policies
  roles,
  cmd,
  qual as using_expression,  -- USING clause
  with_check as with_check_expression  -- WITH CHECK clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'applications'
ORDER BY policyname;
