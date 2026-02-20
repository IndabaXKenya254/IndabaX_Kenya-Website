-- ============================================================================
-- SECURITY FIX: Revoke ALL public access to mv_site_statistics materialized view
-- ============================================================================
-- Issue: Materialized view public.mv_site_statistics has FULL privileges
--        (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
--        granted to anon and authenticated roles.
--
-- Data Exposed:
--   - total_events, upcoming_events
--   - total_speakers, featured_speakers
--   - team_members count
--   - total_photos
--   - published_posts count
--   - subscribers count (SENSITIVE)
--   - unique_applicants count (SENSITIVE)
--   - completed_registrations count (SENSITIVE)
--
-- Fix: Revoke ALL privileges from anon and authenticated.
--      Only service_role (admin/backend) should access this view.
-- ============================================================================

-- Revoke ALL privileges from anon role (public/unauthenticated users)
REVOKE ALL PRIVILEGES ON public.mv_site_statistics FROM anon;

-- Revoke ALL privileges from authenticated role (logged-in users)
REVOKE ALL PRIVILEGES ON public.mv_site_statistics FROM authenticated;

-- Ensure only service_role (admin/backend) can access this view
-- Grant only SELECT (read-only) to service_role
REVOKE ALL PRIVILEGES ON public.mv_site_statistics FROM service_role;
GRANT SELECT ON public.mv_site_statistics TO service_role;

-- Add comment documenting the security decision
COMMENT ON MATERIALIZED VIEW public.mv_site_statistics IS
  'Site statistics for admin dashboard only. Access restricted to service_role (SELECT only) for security. Contains sensitive aggregate data.';
