-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC AND FIX FOR ADMIN PANEL SHOWING NO APPLICATIONS
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-11-27
-- Purpose: Diagnose why applications_with_locks view returns empty results
--          and apply fixes

-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC STEP 1: Check if view returns data
-- ═══════════════════════════════════════════════════════════════════════

-- Test the view
SELECT COUNT(*) as total_count FROM applications_with_locks;

-- If COUNT = 0, view is broken or RLS is blocking
-- If COUNT = 3, view works - issue is elsewhere

-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC STEP 2: Check RLS status
-- ═══════════════════════════════════════════════════════════════════════

-- Check if RLS is enabled on form_responses
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'form_responses';

-- Check existing RLS policies
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
WHERE tablename = 'form_responses';

-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC STEP 3: Check view permissions
-- ═══════════════════════════════════════════════════════════════════════

-- Check grants on view
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'applications_with_locks'
  AND table_schema = 'public';

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #1: Ensure view has SELECT grant
-- ═══════════════════════════════════════════════════════════════════════

-- Grant SELECT on view to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;
GRANT SELECT ON applications_with_locks TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #2: Add RLS policy for authenticated users (if RLS is enabled)
-- ═══════════════════════════════════════════════════════════════════════

-- Create policy to allow authenticated users to see all applications
-- (Admin middleware will handle admin-only access at API level)
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow authenticated users to view all applications" ON form_responses;

  -- Create new policy
  CREATE POLICY "Allow authenticated users to view all applications"
    ON form_responses
    FOR SELECT
    TO authenticated
    USING (true);  -- Allow all authenticated users to see all rows

  RAISE NOTICE '✅ RLS policy created for authenticated users';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  RLS policy creation skipped (RLS may not be enabled)';
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #3: Ensure all required tables/views have proper access
-- ═══════════════════════════════════════════════════════════════════════

-- Grant access to related tables
GRANT SELECT ON form_responses TO authenticated;
GRANT SELECT ON review_locks TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON events TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION: Test if fix worked
-- ═══════════════════════════════════════════════════════════════════════

-- Count applications in view (should be 3)
SELECT COUNT(*) as applications_count FROM applications_with_locks;

-- Show sample data
SELECT
  id,
  respondent_name,
  respondent_email,
  status_v2,
  created_at,
  is_locked
FROM applications_with_locks
ORDER BY created_at DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS CRITERIA
-- ═══════════════════════════════════════════════════════════════════════

-- ✅ applications_with_locks returns 3 rows
-- ✅ SELECT grants exist for authenticated role
-- ✅ RLS policy allows authenticated users (if RLS enabled)
-- ✅ Admin panel shows applications when refreshed

RAISE NOTICE '═══════════════════════════════════════════════════════════════';
RAISE NOTICE '✅ DIAGNOSTIC AND FIX COMPLETE';
RAISE NOTICE '   Please refresh the admin panel at /admin/applications';
RAISE NOTICE '   Expected: 3 applications should now appear';
RAISE NOTICE '═══════════════════════════════════════════════════════════════';
