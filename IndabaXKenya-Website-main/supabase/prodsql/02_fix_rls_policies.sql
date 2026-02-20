-- ═══════════════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR PUBLIC FORM SUBMISSIONS
-- ═══════════════════════════════════════════════════════════════════════
-- This migration fixes two critical issues:
-- 1. Admin policies were applying to all users (public) instead of just authenticated users
-- 2. Missing SELECT policies prevented .insert().select() from working for anonymous users
--
-- Run this AFTER 01_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- PART 1: FIX ADMIN POLICIES - Restrict to Authenticated Users Only
-- ============================================================================
-- Problem: Admin policies with "TO public" applied to everyone including anon users
-- Solution: Change to "TO authenticated" so they only apply to logged-in users

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin full access to events" ON public.events;
DROP POLICY IF EXISTS "Admin full access to posts" ON public.posts;
DROP POLICY IF EXISTS "Admin full access to speakers" ON public.speakers;
DROP POLICY IF EXISTS "Admin full access to event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Admin full access to applications" ON public.applications;
DROP POLICY IF EXISTS "Admin full access to subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admin full access to photos" ON public.photos;
DROP POLICY IF EXISTS "Admin full access to schedule" ON public.schedule_items;
DROP POLICY IF EXISTS "Admin full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Admin full access to contact" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin full access to faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admin full access to sponsors" ON public.sponsors;

-- Recreate admin policies with TO authenticated (not public)
CREATE POLICY "Admin full access to events"
  ON public.events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to posts"
  ON public.posts FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to speakers"
  ON public.speakers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to event_speakers"
  ON public.event_speakers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to subscribers"
  ON public.subscribers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to photos"
  ON public.photos FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to schedule"
  ON public.schedule_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to contact"
  ON public.contact_submissions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to faqs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin full access to sponsors"
  ON public.sponsors FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- PART 2: ADD SELECT POLICIES FOR ANONYMOUS USERS
-- ============================================================================
-- Problem: .insert().select() requires both INSERT and SELECT policies
-- Solution: Add SELECT policies for anon users on form submission tables

-- Applications: Allow anon users to SELECT after INSERT
CREATE POLICY "Public can select applications"
  ON public.applications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Contact Submissions: Allow anon users to SELECT after INSERT
CREATE POLICY "Public can select contact submissions"
  ON public.contact_submissions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Subscribers: Allow anon users to SELECT after INSERT
CREATE POLICY "Public can select subscribers"
  ON public.subscribers FOR SELECT
  TO anon, authenticated
  USING (true);
