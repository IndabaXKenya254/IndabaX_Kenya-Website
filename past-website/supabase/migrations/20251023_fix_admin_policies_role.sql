-- ═══════════════════════════════════════════════════════════════════════
-- FIX ADMIN POLICIES - Restrict to Authenticated Users Only
-- ═══════════════════════════════════════════════════════════════════════
-- Problem: Admin policies were applying TO public (all users including anon)
-- This caused WITH CHECK (is_admin()) to be evaluated for anon users, blocking inserts
-- Solution: Recreate admin policies with TO authenticated only
-- Created: Day 3 - Fix admin policy roles

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
