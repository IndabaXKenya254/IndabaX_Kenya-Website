-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - SECURITY ADVISOR FIXES
-- ═══════════════════════════════════════════════════════════════════════════
-- Fixes security issues flagged by Supabase Database Linter
-- Date: 2026-02-13
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. FIX: active_events view - Remove SECURITY DEFINER
-- Issue: View uses SECURITY DEFINER, bypassing RLS of querying user
-- Solution: Recreate view without SECURITY DEFINER (uses SECURITY INVOKER by default)

DROP VIEW IF EXISTS public.active_events;

-- Must use WITH (security_invoker = true) to explicitly set SECURITY INVOKER
CREATE VIEW public.active_events
WITH (security_invoker = true)
AS
SELECT *
FROM public.events
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.active_events IS 'View showing only active (non-deleted) events';

-- Grant permissions on view
GRANT SELECT ON public.active_events TO authenticated;
GRANT SELECT ON public.active_events TO anon;


-- 2. FIX: soft_delete_event function - Set explicit search_path
-- Issue: Function has mutable search_path which is a security risk
-- Solution: Set search_path to empty string to prevent search path injection

CREATE OR REPLACE FUNCTION public.soft_delete_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.events
  SET deleted_at = NOW()
  WHERE id = p_event_id
  AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_event IS 'Soft-delete an event by setting deleted_at timestamp';


-- 3. FIX: restore_event function - Set explicit search_path
-- Issue: Function has mutable search_path which is a security risk
-- Solution: Set search_path to empty string to prevent search path injection

CREATE OR REPLACE FUNCTION public.restore_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.events
  SET deleted_at = NULL
  WHERE id = p_event_id
  AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.restore_event IS 'Restore a soft-deleted event by clearing deleted_at';


-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════
-- Fixed:
-- - active_events view: Removed SECURITY DEFINER (now uses INVOKER)
-- - soft_delete_event: Added SET search_path = ''
-- - restore_event: Added SET search_path = ''
--
-- Note: The "RLS Policy Always True" warnings for applications,
-- contact_submissions, subscribers, and password_reset_tokens are
-- INTENTIONAL - these tables need public INSERT access for forms.
--
-- Leaked Password Protection should be enabled in Supabase Dashboard:
-- Settings > Auth > Password Protection > Enable HaveIBeenPwned check
-- ═══════════════════════════════════════════════════════════════════════════
