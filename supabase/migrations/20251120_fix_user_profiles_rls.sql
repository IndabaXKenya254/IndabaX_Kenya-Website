-- ============================================================================
-- FIX: user_profiles RLS Infinite Recursion
-- ============================================================================
-- Issue: RLS policies that check user_profiles.role create infinite recursion
-- Solution: Use SECURITY DEFINER function to bypass RLS when checking roles
-- Date: 2025-11-20
-- ============================================================================

-- ============================================================================
-- Step 1: Create helper function that bypasses RLS
-- ============================================================================

-- Function to get user role (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role IS 'Get user role bypassing RLS (prevents infinite recursion)';

-- Update existing is_admin function to use get_user_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create similar functions for other roles
CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) IN ('reviewer', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 2: Drop and recreate user_profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can create profiles" ON public.user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Public can insert new profiles during registration
CREATE POLICY "Public can create profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (uses SECURITY DEFINER function)
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- Step 3: Update problematic policies in other tables
-- ============================================================================

-- Drop and recreate policies that check user_profiles.role
-- These now use the SECURITY DEFINER function instead

-- registrations table
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;

CREATE POLICY "Admins can view all registrations"
  ON public.registrations
  FOR SELECT
  USING (public.is_reviewer());

CREATE POLICY "Admins can update registrations"
  ON public.registrations
  FOR UPDATE
  USING (public.is_admin());

-- form_templates table
DROP POLICY IF EXISTS "Admins can create templates" ON public.form_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.form_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.form_templates;

CREATE POLICY "Admins can create templates"
  ON public.form_templates
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update templates"
  ON public.form_templates
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete templates"
  ON public.form_templates
  FOR DELETE
  USING (public.is_admin());

-- form_questions table
DROP POLICY IF EXISTS "Admins can manage questions" ON public.form_questions;

CREATE POLICY "Admins can manage questions"
  ON public.form_questions
  FOR ALL
  USING (public.is_admin());

-- form_responses table
DROP POLICY IF EXISTS "Admins can view all responses" ON public.form_responses;
DROP POLICY IF EXISTS "Admins can update responses" ON public.form_responses;

CREATE POLICY "Admins can view all responses"
  ON public.form_responses
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update responses"
  ON public.form_responses
  FOR UPDATE
  USING (public.is_admin());

-- form_answers table
DROP POLICY IF EXISTS "Admins can view all answers" ON public.form_answers;

CREATE POLICY "Admins can view all answers"
  ON public.form_answers
  FOR SELECT
  USING (public.is_admin());

-- review_locks table
DROP POLICY IF EXISTS "Admins and reviewers can view locks" ON public.review_locks;
DROP POLICY IF EXISTS "Admins and reviewers can create locks" ON public.review_locks;
DROP POLICY IF EXISTS "Admins can delete any lock" ON public.review_locks;

CREATE POLICY "Admins and reviewers can view locks"
  ON public.review_locks
  FOR SELECT
  USING (public.is_reviewer());

CREATE POLICY "Admins and reviewers can create locks"
  ON public.review_locks
  FOR INSERT
  WITH CHECK (public.is_reviewer());

CREATE POLICY "Admins can delete any lock"
  ON public.review_locks
  FOR DELETE
  USING (public.is_admin());

-- reviewers table
DROP POLICY IF EXISTS "Admins can manage reviewers" ON public.reviewers;

CREATE POLICY "Admins can manage reviewers"
  ON public.reviewers
  FOR ALL
  USING (public.is_admin());

-- email_templates table
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (public.is_admin());

-- email_logs table
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;

CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (public.is_admin());

-- tickets table
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;

CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  USING (public.is_admin());

-- papers table
DROP POLICY IF EXISTS "Admins can view all papers" ON public.papers;
DROP POLICY IF EXISTS "Admins can update papers" ON public.papers;

CREATE POLICY "Admins can view all papers"
  ON public.papers
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update papers"
  ON public.papers
  FOR UPDATE
  USING (public.is_admin());

-- storage policies
DROP POLICY IF EXISTS "Users can view own tickets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own form uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own papers" ON storage.objects;

CREATE POLICY "Users can view own tickets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tickets' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can view own form uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'form-uploads' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can view own papers"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'papers' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );

-- ============================================================================
-- COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS Infinite Recursion Fix Complete!';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Created SECURITY DEFINER helper functions:';
  RAISE NOTICE '  - get_user_role(user_id)';
  RAISE NOTICE '  - is_admin()';
  RAISE NOTICE '  - is_reviewer()';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Updated all RLS policies to use helper functions';
  RAISE NOTICE 'No more infinite recursion!';
END $$;
