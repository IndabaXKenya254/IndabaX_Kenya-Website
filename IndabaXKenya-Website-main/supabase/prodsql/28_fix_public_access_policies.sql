-- ═══════════════════════════════════════════════════════════════════════
-- FIX PUBLIC ACCESS RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 28
-- Date: October 24, 2025
--
-- This migration fixes two critical RLS policy issues:
-- 1. Events policy only allowed 'published' status, not 'upcoming'
-- 2. Settings policy didn't allow 'banner' key for public access
--
-- These issues caused:
-- - Homepage events section to show no data (upcoming events were blocked)
-- - Banner settings API to return 404 (banner key was blocked)
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- FIX 1: Update Events RLS Policy
-- ============================================================================
-- Problem: Only 'published' events visible, but we use 'upcoming' status too
-- Solution: Allow both 'published' AND 'upcoming' statuses for public viewing

-- Drop existing policy
DROP POLICY IF EXISTS "Public view published events" ON public.events;

-- Recreate with updated logic
CREATE POLICY "Public view published events"
  ON public.events FOR SELECT
  USING (status IN ('published', 'upcoming'));

COMMENT ON POLICY "Public view published events" ON public.events IS
'Allows public to view events with status published or upcoming';

-- ============================================================================
-- FIX 2: Update Settings RLS Policy
-- ============================================================================
-- Problem: Only 'popup' and 'site_info' settings accessible publicly
-- Solution: Add 'banner' to the allowed keys list

-- Drop existing policy
DROP POLICY IF EXISTS "Public view specific settings" ON public.settings;

-- Recreate with 'banner' included
CREATE POLICY "Public view specific settings"
  ON public.settings FOR SELECT
  USING (key IN ('popup', 'site_info', 'banner'));

COMMENT ON POLICY "Public view specific settings" ON public.settings IS
'Allows public to view popup, site_info, and banner settings';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fixes work:

-- Test 1: Check if public can now see upcoming events
-- SELECT id, title, status FROM public.events WHERE status = 'upcoming';

-- Test 2: Check if public can now see banner settings
-- SELECT key, value FROM public.settings WHERE key = 'banner';

-- Test 3: Verify policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('events', 'settings')
-- AND policyname IN ('Public view published events', 'Public view specific settings');
