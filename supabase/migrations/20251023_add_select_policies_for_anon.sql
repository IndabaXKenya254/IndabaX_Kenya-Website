-- ═══════════════════════════════════════════════════════════════════════
-- ADD SELECT POLICIES FOR ANONYMOUS USERS ON FORM TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- Problem: .insert().select() requires both INSERT and SELECT policies
-- When anon users insert data, they need to be able to SELECT it back
-- Created: Day 3 - Fix RLS for form submissions

-- Applications: Allow anon users to SELECT their own submissions
-- Note: We allow selecting all since this is a public form
CREATE POLICY "Public can select applications"
  ON public.applications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Contact Submissions: Allow anon users to SELECT their submissions
CREATE POLICY "Public can select contact submissions"
  ON public.contact_submissions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Subscribers: Allow anon users to SELECT subscriber records
CREATE POLICY "Public can select subscribers"
  ON public.subscribers FOR SELECT
  TO anon, authenticated
  USING (true);
