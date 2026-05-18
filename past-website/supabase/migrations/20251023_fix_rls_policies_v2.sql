-- ═══════════════════════════════════════════════════════════════════════
-- FIX RLS POLICIES V2 - More Explicit Configuration
-- ═══════════════════════════════════════════════════════════════════════
-- This ensures public users (anon role) can insert into form tables
-- Created: Day 3 - Fix RLS policies for form submissions (attempt 2)

-- First, drop ALL existing policies on these tables to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on applications
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.applications';
    END LOOP;

    -- Drop all policies on subscribers
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subscribers';
    END LOOP;

    -- Drop all policies on contact_submissions
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_submissions')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.contact_submissions';
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create INSERT policies for anonymous users
CREATE POLICY "applications_insert_anon"
  ON public.applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "applications_insert_authenticated"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "subscribers_insert_anon"
  ON public.subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "subscribers_insert_authenticated"
  ON public.subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "contact_insert_anon"
  ON public.contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "contact_insert_authenticated"
  ON public.contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin policies (for future admin panel)
CREATE POLICY "applications_admin_all"
  ON public.applications
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "subscribers_admin_all"
  ON public.subscribers
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "contact_admin_all"
  ON public.contact_submissions
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admins WHERE role IN ('admin', 'super_admin')
    )
  );
