-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35g: ENABLE RLS ON MISSING TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Enable Row Level Security (RLS) on tables that file 35 missed
-- Run Order: AFTER 35f_add_review_lock_functions.sql
--            BEFORE 36_tickets_table_enhancements.sql
--
-- Problem: File 35 created tables but didn't enable RLS on:
--   - registrations
--   - form_templates
--   - review_locks
--   - activity_logs
--   - user_profiles
--
-- Root Cause: File 35 was incomplete - didn't enable RLS on these critical tables
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ENABLE RLS ON ALL MISSING TABLES
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR EACH TABLE
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- REGISTRATIONS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Reviewers can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Reviewers can update registrations" ON public.registrations;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Reviewers and admins can view all registrations
CREATE POLICY "Reviewers can view all registrations"
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (public.is_reviewer());

-- Users can create their own registrations
CREATE POLICY "Users can insert their own registrations"
  ON public.registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Reviewers can update registrations
CREATE POLICY "Reviewers can update registrations"
  ON public.registrations
  FOR UPDATE
  TO authenticated
  USING (public.is_reviewer());

-- ───────────────────────────────────────────────────────────────────────
-- FORM_TEMPLATES TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Admins can manage form templates" ON public.form_templates;

-- Anyone can view templates (needed for public registration)
CREATE POLICY "Anyone can view form templates"
  ON public.form_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage form templates"
  ON public.form_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ───────────────────────────────────────────────────────────────────────
-- REVIEW_LOCKS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reviewers can view all locks" ON public.review_locks;
DROP POLICY IF EXISTS "Reviewers can manage locks" ON public.review_locks;

-- Reviewers can view all locks
CREATE POLICY "Reviewers can view all locks"
  ON public.review_locks
  FOR SELECT
  TO authenticated
  USING (public.is_reviewer());

-- Reviewers can manage locks (via functions only)
CREATE POLICY "Reviewers can manage locks"
  ON public.review_locks
  FOR ALL
  TO authenticated
  USING (public.is_reviewer())
  WITH CHECK (public.is_reviewer());

-- ───────────────────────────────────────────────────────────────────────
-- ACTIVITY_LOGS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- System functions can insert logs
CREATE POLICY "System can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────
-- USER_PROFILES TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35g: RLS Enabled on Missing Tables';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Tables with RLS enabled:';
  RAISE NOTICE '     ✓ registrations (4 policies)';
  RAISE NOTICE '     ✓ form_templates (2 policies)';
  RAISE NOTICE '     ✓ review_locks (2 policies)';
  RAISE NOTICE '     ✓ activity_logs (2 policies)';
  RAISE NOTICE '     ✓ user_profiles (4 policies)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Total: 5 tables, 14 policies created';
  RAISE NOTICE '   ';
  RAISE NOTICE '   This fixes the RLS security advisories!';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run file 36_tickets_table_enhancements.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
