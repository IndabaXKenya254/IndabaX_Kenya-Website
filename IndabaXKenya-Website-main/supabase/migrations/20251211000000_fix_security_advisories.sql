-- Migration: Fix Security Advisories from Supabase Linter
-- Date: 2025-12-11
-- Purpose: Address security definer views, function search paths, and extension schema

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. FIX SECURITY DEFINER VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Issue: Views that reference auth.users are automatically created with SECURITY DEFINER
-- Solution: Recreate views with SECURITY INVOKER and avoid direct auth.users references

-- 1.1 Fix applications_with_locks view
DROP VIEW IF EXISTS applications_with_locks CASCADE;

CREATE VIEW applications_with_locks
WITH (security_invoker=true) AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  up_locker.email AS locked_by_email,
  up_locker.name AS locked_by_name
FROM form_responses fr
LEFT JOIN review_locks rl ON rl.registration_id = fr.id
LEFT JOIN user_profiles up_locker ON up_locker.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Convenient view combining form_responses with lock status.
Shows who has locked the application and when it expires.
Uses SECURITY INVOKER to enforce user permissions.';

GRANT SELECT ON applications_with_locks TO authenticated;

-- 1.2 Fix reviewer_stats view
DROP VIEW IF EXISTS reviewer_stats CASCADE;

CREATE VIEW reviewer_stats
WITH (security_invoker=true) AS
SELECT
  up.id AS reviewer_id,
  up.name AS reviewer_name,
  up.email AS reviewer_email,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id THEN reg.id END) AS total_reviews,
  COUNT(DISTINCT CASE WHEN reg.shortlisted_by = up.id THEN reg.id END) AS total_shortlists,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id AND reg.status = 'approved' THEN reg.id END) AS total_accepted,
  COUNT(DISTINCT CASE WHEN reg.reviewed_by = up.id AND reg.status = 'rejected' THEN reg.id END) AS total_rejected,
  AVG(
    CASE
      WHEN reg.reviewed_by = up.id AND reg.reviewed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (reg.reviewed_at - reg.registered_at)) / 3600
      ELSE NULL
    END
  )::NUMERIC(10,2) AS avg_review_hours,
  MAX(CASE WHEN reg.reviewed_by = up.id THEN reg.reviewed_at END) AS last_review_at
FROM user_profiles up
LEFT JOIN registrations reg ON reg.reviewed_by = up.id OR reg.shortlisted_by = up.id
WHERE up.role IN ('reviewer', 'admin')
GROUP BY up.id, up.name, up.email;

COMMENT ON VIEW reviewer_stats IS
'Aggregates reviewer performance metrics.
Uses SECURITY INVOKER to enforce user permissions.';

GRANT SELECT ON reviewer_stats TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FIX FUNCTION SEARCH PATH ISSUES
-- ═══════════════════════════════════════════════════════════════════════════

-- Issue: Functions with mutable search_path are vulnerable to search path injection
-- Solution: Set search_path to empty string or specific schemas

-- 2.1 Ticketing functions
ALTER FUNCTION check_in_ticket(uuid) SET search_path = public, auth;
ALTER FUNCTION lookup_ticket_by_qr(text) SET search_path = public, auth;

-- 2.2 Review lock functions
ALTER FUNCTION cleanup_expired_locks() SET search_path = public, auth;
ALTER FUNCTION acquire_review_lock(uuid, uuid) SET search_path = public, auth;
ALTER FUNCTION release_review_lock(uuid) SET search_path = public, auth;
ALTER FUNCTION is_application_locked(uuid) SET search_path = public, auth;
ALTER FUNCTION get_reviewer_workload(uuid) SET search_path = public, auth;

-- 2.3 Reviewer assignment functions
ALTER FUNCTION update_reviewer_assignment_count() SET search_path = public, auth;

-- 2.4 Role check functions
ALTER FUNCTION get_user_role() SET search_path = public, auth;
ALTER FUNCTION is_reviewer() SET search_path = public, auth;
ALTER FUNCTION is_admin() SET search_path = public, auth;

-- 2.5 Token generation
ALTER FUNCTION generate_resume_token(uuid) SET search_path = public, auth;

-- 2.6 Trigger functions
ALTER FUNCTION update_venues_updated_at() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public, auth;
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION log_application_activity() SET search_path = public, auth;
ALTER FUNCTION trigger_log_status_change() SET search_path = public, auth;
ALTER FUNCTION trigger_log_notes_update() SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FIX EXTENSION IN PUBLIC SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

-- Issue: pg_trgm extension is in public schema (security risk)
-- Solution: Move it to extensions schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
-- Note: This is a metadata-only operation, doesn't affect performance
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  security_definer_count INTEGER;
  mutable_search_path_count INTEGER;
  extension_schema TEXT;
BEGIN
  -- Check for remaining SECURITY DEFINER views
  SELECT COUNT(*) INTO security_definer_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('applications_with_locks', 'reviewer_stats')
    AND definition LIKE '%security_definer%';

  -- Check for functions with mutable search_path
  SELECT COUNT(*) INTO mutable_search_path_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'check_in_ticket', 'lookup_ticket_by_qr', 'cleanup_expired_locks',
      'acquire_review_lock', 'release_review_lock', 'is_application_locked',
      'get_reviewer_workload', 'update_reviewer_assignment_count', 'get_user_role',
      'is_reviewer', 'generate_resume_token', 'update_venues_updated_at',
      'handle_new_user', 'update_updated_at_column', 'is_admin',
      'log_application_activity', 'trigger_log_status_change', 'trigger_log_notes_update'
    )
    AND prosecdef = false -- SECURITY DEFINER flag
    AND NOT EXISTS (
      SELECT 1
      FROM pg_proc_config(p.oid)
      WHERE pg_proc_config LIKE 'search_path=%'
    );

  -- Check pg_trgm extension schema
  SELECT n.nspname INTO extension_schema
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_trgm';

  -- Report results
  RAISE NOTICE '✅ Security Advisory Fixes Applied:';
  RAISE NOTICE '   - SECURITY DEFINER views remaining: %', security_definer_count;
  RAISE NOTICE '   - Functions with mutable search_path: %', mutable_search_path_count;
  RAISE NOTICE '   - pg_trgm extension schema: %', extension_schema;

  IF security_definer_count > 0 THEN
    RAISE WARNING '⚠️  Some SECURITY DEFINER views remain. Manual review needed.';
  END IF;

  IF mutable_search_path_count > 0 THEN
    RAISE WARNING '⚠️  Some functions still have mutable search_path. Check function signatures.';
  END IF;

  IF extension_schema = 'public' THEN
    RAISE WARNING '⚠️  pg_trgm extension is still in public schema. Manual migration may be needed.';
  ELSE
    RAISE NOTICE '✅ pg_trgm successfully moved to % schema', extension_schema;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES FOR AUTH LEAKED PASSWORD PROTECTION
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️  The "Leaked Password Protection" setting cannot be enabled via SQL migration
--
-- To enable it:
-- 1. Go to Supabase Dashboard → Authentication → Settings
-- 2. Find "Leaked Password Protection" section
-- 3. Toggle it ON
-- 4. This will check passwords against HaveIBeenPwned.org database
--
-- This setting is at the project level and requires dashboard access.
