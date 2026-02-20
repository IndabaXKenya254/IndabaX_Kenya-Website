-- ============================================================================
-- Migration 48: Fix Security Definer Views
-- ============================================================================
-- Date: 2025-12-15
-- Author: Security Audit Fix
-- Status: READY FOR PRODUCTION
--
-- Purpose: Fix critical security vulnerabilities in database views
-- - Removes SECURITY DEFINER from views (fixes RLS bypass vulnerability)
-- - Recreates views with SECURITY INVOKER (respects RLS policies)
-- - Restricts permissions to appropriate roles
-- - Separates public views from admin-only views
--
-- Affected views:
-- - event_registration_stats (ADMIN ONLY - contains internal metrics)
-- - noai_faqs_categorized (PUBLIC - FAQ display)
-- - user_application_summary (ADMIN ONLY - contains PII)
-- - noai_active_events (PUBLIC - event listings)
--
-- Security Impact: HIGH
-- - Prevents anonymous users from accessing sensitive user data (PII)
-- - Ensures RLS policies are properly enforced
-- - Limits admin views to service_role access only
--
-- Dependencies: Requires existing tables from migration 47
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Drop existing views (will be recreated with SECURITY INVOKER)
-- ============================================================================

DROP VIEW IF EXISTS public.event_registration_stats CASCADE;
DROP VIEW IF EXISTS public.noai_faqs_categorized CASCADE;
DROP VIEW IF EXISTS public.user_application_summary CASCADE;
DROP VIEW IF EXISTS public.noai_active_events CASCADE;

-- ============================================================================
-- Step 2: Recreate views with SECURITY INVOKER (respects RLS policies)
-- ============================================================================

-- View 1: event_registration_stats (ADMIN ONLY)
-- ============================================================================
-- Provides comprehensive statistics about event registrations
-- Access: service_role only (admin panel)
-- Contains: Internal metrics, registration counts, capacity calculations
CREATE VIEW public.event_registration_stats
WITH (security_invoker = true)
AS
SELECT
  e.id AS event_id,
  e.title,
  e.event_category,
  e.event_year,
  e.max_attendees,
  count(r.id) AS total_applications,
  count(r.id) FILTER (WHERE r.status = 'pending') AS pending_count,
  count(r.id) FILTER (WHERE r.status = 'shortlisted') AS shortlisted_count,
  count(r.id) FILTER (WHERE r.status = 'approved') AS approved_count,
  count(r.id) FILTER (WHERE r.status = 'rejected') AS rejected_count,
  count(r.id) FILTER (WHERE r.initial_form_response_id IS NOT NULL) AS initial_form_completed,
  count(r.id) FILTER (WHERE r.detailed_form_response_id IS NOT NULL) AS detailed_form_completed,
  count(r.id) FILTER (WHERE r.paper_id IS NOT NULL) AS papers_submitted,
  count(r.id) FILTER (WHERE r.ticket_id IS NOT NULL) AS tickets_issued,
  count(t.id) FILTER (WHERE t.checked_in_at IS NOT NULL) AS checked_in_count,
  CASE
    WHEN (e.max_attendees IS NOT NULL AND e.max_attendees > 0)
    THEN round(((count(r.id) FILTER (WHERE r.status = 'approved')::numeric / e.max_attendees::numeric) * 100::numeric), 2)
    ELSE NULL::numeric
  END AS capacity_percentage
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
LEFT JOIN tickets t ON t.id = r.ticket_id
GROUP BY e.id, e.title, e.event_category, e.event_year, e.max_attendees;

-- View 2: noai_faqs_categorized (PUBLIC)
-- ============================================================================
-- Shows active NOAI FAQs organized by category for public website
-- Access: anon, authenticated (read-only)
-- Contains: Public FAQ content only
CREATE VIEW public.noai_faqs_categorized
WITH (security_invoker = true)
AS
SELECT
  id,
  question,
  answer,
  category,
  classification,
  is_active,
  display_order,
  created_at,
  updated_at
FROM faqs f
WHERE classification = 'noai' AND is_active = true
ORDER BY category, COALESCE(display_order, 999999), created_at DESC;

-- View 3: user_application_summary (ADMIN ONLY)
-- ============================================================================
-- Comprehensive view of user applications with sensitive personal data
-- Access: service_role only (admin panel)
-- Contains: PII (names, emails, organization), registration status, form responses
-- SECURITY: This view contains sensitive personal information and must be restricted
CREATE VIEW public.user_application_summary
WITH (security_invoker = true)
AS
SELECT
  r.id AS registration_id,
  r.user_id,
  r.event_id,
  r.status AS registration_status,
  r.registered_at,
  r.reviewed_at,
  r.shortlisted_at,
  up.name AS user_name,
  up.email AS user_email,
  up.organization,
  e.title AS event_title,
  e.event_year,
  e.event_category,
  e.start_date AS event_start_date,
  fr_initial.status_v2 AS initial_form_status,
  fr_detailed.status_v2 AS detailed_form_status,
  p.status AS paper_status,
  p.title AS paper_title,
  t.id AS ticket_id,
  t.status AS ticket_status,
  t.checked_in_at
FROM registrations r
JOIN user_profiles up ON up.id = r.user_id
JOIN events e ON e.id = r.event_id
LEFT JOIN form_responses fr_initial ON fr_initial.id = r.initial_form_response_id
LEFT JOIN form_responses fr_detailed ON fr_detailed.id = r.detailed_form_response_id
LEFT JOIN papers p ON p.id = r.paper_id
LEFT JOIN tickets t ON t.id = r.ticket_id;

-- View 4: noai_active_events (PUBLIC)
-- ============================================================================
-- Shows active NOAI events with registration information for public website
-- Access: anon, authenticated (read-only)
-- Contains: Public event details, registration deadlines, capacity info
CREATE VIEW public.noai_active_events
WITH (security_invoker = true)
AS
SELECT
  id,
  slug,
  title,
  description,
  start_date,
  end_date,
  location,
  event_year,
  registration_deadline,
  registration_enabled,
  application_form_url,
  initial_template_id,
  detailed_template_id,
  max_attendees,
  status,
  created_at,
  CASE
    WHEN registration_deadline IS NULL THEN true
    WHEN registration_deadline >= now() THEN true
    ELSE false
  END AS is_registration_open,
  CASE
    WHEN registration_deadline IS NOT NULL
    THEN EXTRACT(day FROM (registration_deadline - now()))::integer
    ELSE NULL::integer
  END AS days_until_deadline,
  (SELECT count(*) FROM registrations r WHERE r.event_id = e.id) AS total_registrations,
  (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'approved') AS approved_count
FROM events e
WHERE event_category = 'noai' AND status = 'published'
ORDER BY start_date DESC;

-- ============================================================================
-- Step 3: Revoke all existing permissions (clean slate approach)
-- ============================================================================

REVOKE ALL ON public.event_registration_stats FROM anon, authenticated, service_role;
REVOKE ALL ON public.noai_faqs_categorized FROM anon, authenticated, service_role;
REVOKE ALL ON public.user_application_summary FROM anon, authenticated, service_role;
REVOKE ALL ON public.noai_active_events FROM anon, authenticated, service_role;

-- ============================================================================
-- Step 4: Grant appropriate permissions based on data sensitivity
-- ============================================================================

-- PUBLIC VIEWS: Read-only access for all users
-- These views contain only public information safe for anonymous access
GRANT SELECT ON public.noai_faqs_categorized TO anon, authenticated;
GRANT SELECT ON public.noai_active_events TO anon, authenticated;

-- ADMIN VIEWS: Restricted to service_role only
-- These views contain sensitive data and internal metrics
GRANT SELECT ON public.event_registration_stats TO service_role;
GRANT SELECT ON public.user_application_summary TO service_role;

-- ============================================================================
-- Step 5: Add documentation comments
-- ============================================================================

COMMENT ON VIEW public.event_registration_stats IS
'Admin-only view: Event registration statistics and capacity metrics. Access restricted to service_role. Migration 48.';

COMMENT ON VIEW public.noai_faqs_categorized IS
'Public view: Active NOAI FAQs organized by category. Uses SECURITY INVOKER to respect RLS policies. Migration 48.';

COMMENT ON VIEW public.user_application_summary IS
'Admin-only view: Comprehensive user application data including PII (names, emails, organizations). Access restricted to service_role. Migration 48.';

COMMENT ON VIEW public.noai_active_events IS
'Public view: Active NOAI events with registration information. Uses SECURITY INVOKER to respect RLS policies. Migration 48.';

-- ============================================================================
-- Step 6: Verify migration success
-- ============================================================================

DO $$
DECLARE
  view_count INTEGER;
  permission_count INTEGER;
BEGIN
  -- Check all views were created
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('event_registration_stats', 'noai_faqs_categorized', 'user_application_summary', 'noai_active_events');

  IF view_count != 4 THEN
    RAISE EXCEPTION 'Migration 48 FAILED: Expected 4 views, found %', view_count;
  END IF;

  -- Check public views have correct permissions
  SELECT COUNT(*) INTO permission_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('noai_faqs_categorized', 'noai_active_events')
    AND grantee = 'anon'
    AND privilege_type = 'SELECT';

  IF permission_count != 2 THEN
    RAISE EXCEPTION 'Migration 48 FAILED: Public views missing anon SELECT permissions';
  END IF;

  RAISE NOTICE '✅ Migration 48 SUCCESS: All 4 views recreated with proper security settings';
  RAISE NOTICE '   - 2 public views: noai_faqs_categorized, noai_active_events';
  RAISE NOTICE '   - 2 admin views: event_registration_stats, user_application_summary';
END $$;

COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify correctness:
--
-- 1. Verify all views exist:
-- SELECT viewname, schemaname
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname IN ('event_registration_stats', 'noai_faqs_categorized',
--                    'user_application_summary', 'noai_active_events')
-- ORDER BY viewname;
--
-- 2. Verify permissions (should only show SELECT):
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND table_name IN ('event_registration_stats', 'noai_faqs_categorized',
--                      'user_application_summary', 'noai_active_events')
-- ORDER BY table_name, grantee, privilege_type;
--
-- 3. Test public view access (should work with anon key):
-- SELECT COUNT(*) FROM noai_faqs_categorized;
-- SELECT COUNT(*) FROM noai_active_events;
--
-- 4. Test admin view access (should only work with service_role key):
-- SELECT COUNT(*) FROM event_registration_stats;
-- SELECT COUNT(*) FROM user_application_summary;
--
-- 5. Run Supabase security advisors to confirm no SECURITY DEFINER warnings
-- ============================================================================
