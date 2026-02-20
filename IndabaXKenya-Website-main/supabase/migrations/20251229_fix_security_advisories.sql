-- ═══════════════════════════════════════════════════════════════════════
-- FIX SECURITY ADVISORIES
-- ═══════════════════════════════════════════════════════════════════════
-- Addresses Supabase security linter warnings:
-- 1. SECURITY DEFINER views → Changed to SECURITY INVOKER
-- 2. Function search_path → Set immutable search_path
-- Applied: Dec 29, 2025
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- PART 1: FIX ALL VIEWS - Change from SECURITY DEFINER to SECURITY INVOKER
-- ═══════════════════════════════════════════════════════════════════════

ALTER VIEW IF EXISTS public.v_popup_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.noai_complete_page_data SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_event_registration SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_homepage_about_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_admin_events_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_upcoming_events SET (security_invoker = true);
ALTER VIEW IF EXISTS public.noai_faqs_by_category SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_site_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_homepage_hero_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.noai_participants_by_year SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_form_templates_with_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_form_questions_ordered SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_banner_settings SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_dashboard_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_homepage_data SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_user_dashboard_stats SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════
-- PART 2: FIX FUNCTIONS - Set immutable search_path
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_password_tokens' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.cleanup_expired_password_tokens() SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_registration_form' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.get_registration_form(TEXT, TEXT) SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_site_statistics' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.refresh_site_statistics() SET search_path = public;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- REMAINING ITEMS (Manual / Intentional)
-- ═══════════════════════════════════════════════════════════════════════
-- 1. mv_site_statistics materialized view - Intentionally public for stats
-- 2. Leaked Password Protection - Enable in Supabase Dashboard:
--    Authentication → Settings → Security → Enable "Leaked Password Protection"
