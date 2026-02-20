-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Replace auth.users with user_profiles for permissions
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Fix auth.users permission denied error
-- Date: 2025-11-21 14:20
-- Issue: Functions cannot access auth.users due to permissions
-- Solution: Use user_profiles table instead (which we have access to)

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Fix is_application_locked function
-- ═══════════════════════════════════════════════════════════════════════

-- Drop ALL versions of the function (it may have multiple signatures)
DROP FUNCTION IF EXISTS is_application_locked(UUID);
DROP FUNCTION IF EXISTS is_application_locked(UUID, UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID, p_user_id UUID);

CREATE OR REPLACE FUNCTION is_application_locked(
  p_registration_id UUID
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by_user_id UUID,
  locked_by_email VARCHAR(255),
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_owned_by_requester BOOLEAN
) AS $$
DECLARE
  p_user_id UUID := auth.uid();
BEGIN
  -- Cleanup expired locks first
  PERFORM cleanup_expired_locks();

  -- Return lock status with user info from user_profiles
  RETURN QUERY
  SELECT
    (rl.id IS NOT NULL) AS is_locked,
    rl.locked_by AS locked_by_user_id,
    up.email AS locked_by_email,
    rl.locked_at,
    rl.expires_at,
    (rl.locked_by = p_user_id) AS is_owned_by_requester
  FROM review_locks rl
  LEFT JOIN public.user_profiles up ON up.id = rl.locked_by
  WHERE rl.registration_id = p_registration_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_application_locked IS
'Checks if an application is currently locked.
Automatically cleans up expired locks before checking.
Returns lock details including who locked it and when it expires.
Uses user_profiles table instead of auth.users for permissions.';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Fix applications_with_locks view
-- ═══════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS applications_with_locks CASCADE;

CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  up.email AS locked_by_email,
  up.name AS locked_by_name
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Applications with their current lock status.
Only shows active (non-expired) locks.
Uses user_profiles table instead of auth.users for permissions.';

-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Verify the fix
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_function_exists BOOLEAN;
  v_view_exists BOOLEAN;
BEGIN
  -- Check if function was recreated
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_application_locked'
  ) INTO v_function_exists;

  -- Check if view was recreated
  SELECT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'applications_with_locks'
  ) INTO v_view_exists;

  IF v_function_exists AND v_view_exists THEN
    RAISE NOTICE '✅ Auth permissions fix applied successfully';
    RAISE NOTICE '   - is_application_locked() now uses user_profiles';
    RAISE NOTICE '   - applications_with_locks view now uses user_profiles';
  ELSE
    RAISE WARNING '⚠️  Fix may not be complete';
    RAISE WARNING '   Function exists: %', v_function_exists;
    RAISE WARNING '   View exists: %', v_view_exists;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Add helpful comment
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.user_profiles IS
'User profiles extending Supabase Auth users.
Used by review lock system to get user information without accessing auth.users directly.
Permissions issue: auth.users is not accessible from public schema functions.';
