-- ═══════════════════════════════════════════════════════════════════════
-- FIX: applications_with_locks view points to wrong table
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-11-27
-- Issue: View queries empty 'registrations' table instead of 'form_responses'
-- Root Cause: Migration changed view to registrations, but data was never migrated
--
-- This fix recreates the view to point back to form_responses (where data lives)
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the broken view
DROP VIEW IF EXISTS applications_with_locks CASCADE;

-- Recreate the view pointing to form_responses (correct table)
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
FROM form_responses fr  -- ← CORRECT: Query from form_responses (has 3 records)
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;

-- Add comment
COMMENT ON VIEW applications_with_locks IS
'Applications with their current lock status.
Uses form_responses table (active applications table).
Uses user_profiles table instead of auth.users for permissions.';

-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;
GRANT SELECT ON applications_with_locks TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

-- Test 1: Count should be 3
SELECT COUNT(*) as total_applications FROM applications_with_locks;
-- Expected: 3

-- Test 2: Show sample data
SELECT
  id,
  respondent_name,
  respondent_email,
  status_v2,
  created_at,
  is_locked,
  event_id
FROM applications_with_locks
ORDER BY created_at DESC
LIMIT 10;
-- Expected: 3 KELVIN GITHU records

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS CRITERIA
-- ═══════════════════════════════════════════════════════════════════════
-- ✅ View returns 3 records (not 0)
-- ✅ Admin panel shows applications when refreshed
-- ✅ No "No applications found" error
-- ✅ View queries form_responses table (active table with data)
