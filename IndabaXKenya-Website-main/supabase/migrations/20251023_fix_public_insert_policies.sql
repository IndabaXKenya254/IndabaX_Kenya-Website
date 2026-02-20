-- ═══════════════════════════════════════════════════════════════════════
-- FIX PUBLIC INSERT POLICIES
-- ═══════════════════════════════════════════════════════════════════════
-- This migration ensures that public users can submit forms
-- (applications, contact, newsletter subscription)
-- Created: Day 3 - Fix RLS policies for form submissions

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public submit applications" ON public.applications;
DROP POLICY IF EXISTS "Public subscribe" ON public.subscribers;
DROP POLICY IF EXISTS "Public submit contact" ON public.contact_submissions;

-- Recreate policies with proper permissions
CREATE POLICY "Public submit applications"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public subscribe"
  ON public.subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public submit contact"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify RLS is enabled on these tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
