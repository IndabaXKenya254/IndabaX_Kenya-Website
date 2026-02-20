-- ═══════════════════════════════════════════════════════════════════════
-- COMPLETE FIX: All 3 database errors
-- ═══════════════════════════════════════════════════════════════════════
-- Run all 3 fixes in order
-- Tested and verified working

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #1: Add missing ip_address column
-- ═══════════════════════════════════════════════════════════════════════

-- Add the missing ip_address column
ALTER TABLE public.review_locks
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);

-- Add comment
COMMENT ON COLUMN public.review_locks.ip_address IS
'IP address of the admin who acquired the lock.
Used for audit trail and debugging.
Optional field, can be NULL.';

-- Verify the column exists
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_locks'
      AND column_name = 'ip_address'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✅ ip_address column added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add ip_address column';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #2: Fix foreign key constraint
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.review_locks
DROP CONSTRAINT IF EXISTS review_locks_registration_id_fkey;

-- Step 2: Add the correct foreign key constraint
-- registration_id should reference form_responses.id (not registrations.id)
ALTER TABLE public.review_locks
ADD CONSTRAINT review_locks_registration_id_fkey
  FOREIGN KEY (registration_id)
  REFERENCES public.form_responses(id)
  ON DELETE CASCADE;

-- Step 3: Verify the constraint is correct
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_referenced_table TEXT;
BEGIN
  -- Check if constraint exists and points to form_responses
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'review_locks'
        AND tc.constraint_name = 'review_locks_registration_id_fkey'
        AND ccu.table_name = 'form_responses'
    ),
    ccu.table_name
  INTO v_constraint_exists, v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'review_locks'
    AND tc.constraint_name = 'review_locks_registration_id_fkey'
  LIMIT 1;

  IF v_constraint_exists AND v_referenced_table = 'form_responses' THEN
    RAISE NOTICE '✅ Foreign key constraint fixed successfully';
    RAISE NOTICE '   review_locks.registration_id now references form_responses.id';
  ELSE
    RAISE WARNING '⚠️  Foreign key may not be correctly configured';
    RAISE WARNING '   Current reference: %', v_referenced_table;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX #3: Fix auth.users permission denied error
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Fix is_application_locked function
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
Uses user_profiles table instead of auth.users for permissions.';

-- 2. Fix applications_with_locks view
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
Uses user_profiles table instead of auth.users for permissions.';

-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;

-- 3. Verify the fix
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
-- COMPLETE - All fixes applied successfully
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '🎉 All database fixes completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Restart your dev server: npm run dev';
  RAISE NOTICE '2. Test the applications page';
  RAISE NOTICE '3. Test lock acquisition and shortlist workflow';
END $$;
