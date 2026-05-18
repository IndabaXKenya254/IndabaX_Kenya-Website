-- ============================================================================
-- Migration 49: Fix Auth RLS Initialization Plan Issues
-- ============================================================================
-- Date: 2025-12-15
-- Author: Performance Optimization
-- Status: READY FOR PRODUCTION
--
-- Purpose: Fix RLS policies that re-evaluate auth functions for each row
-- - Wraps auth.uid() as (select auth.uid())
-- - Wraps auth.email() as (select auth.email())
-- - Wraps auth.role() as (select auth.role())
-- - Wraps is_admin() as (select is_admin())
--
-- Impact: HIGH PERFORMANCE IMPROVEMENT
-- - Prevents function re-evaluation for each row
-- - Significantly improves query performance at scale
-- - Affects ~60 RLS policies across 25+ tables
--
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

BEGIN;

-- ============================================================================
-- activity_logs table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Service role full access" ON activity_logs;
CREATE POLICY "Service role full access" ON activity_logs
  FOR ALL
  USING ((select auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT
  USING (
    application_id IN (
      SELECT form_responses.id FROM form_responses
      WHERE form_responses.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- admin_roles table
-- ============================================================================

DROP POLICY IF EXISTS "admin_roles_select_own" ON admin_roles;
CREATE POLICY "admin_roles_select_own" ON admin_roles
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- applications table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to applications" ON applications;
CREATE POLICY "Admin full access to applications" ON applications
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- contact_submissions table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to contact" ON contact_submissions;
CREATE POLICY "Admin full access to contact" ON contact_submissions
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- email_logs table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

-- ============================================================================
-- email_templates table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

-- ============================================================================
-- email_verification_tokens table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all verification tokens" ON email_verification_tokens;
CREATE POLICY "Admins can view all verification tokens" ON email_verification_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own verification tokens" ON email_verification_tokens;
CREATE POLICY "Users can create own verification tokens" ON email_verification_tokens
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own verification tokens" ON email_verification_tokens;
CREATE POLICY "Users can view own verification tokens" ON email_verification_tokens
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- event_speakers table
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage event speakers" ON event_speakers;
CREATE POLICY "Admin can manage event speakers" ON event_speakers
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

DROP POLICY IF EXISTS "Admin full access to event_speakers" ON event_speakers;
CREATE POLICY "Admin full access to event_speakers" ON event_speakers
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- events table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to events" ON events;
CREATE POLICY "Admin full access to events" ON events
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- faqs table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to FAQs" ON faqs;
CREATE POLICY "Admin full access to FAQs" ON faqs
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

DROP POLICY IF EXISTS "Admin full access to faqs" ON faqs;
CREATE POLICY "Admin full access to faqs" ON faqs
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- form_answers table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all answers" ON form_answers;
CREATE POLICY "Admins can view all answers" ON form_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can create answers" ON form_answers;
CREATE POLICY "Users can create answers" ON form_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM form_responses
      WHERE form_responses.id = form_answers.response_id
        AND form_responses.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own answers" ON form_answers;
CREATE POLICY "Users can update own answers" ON form_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM form_responses
      WHERE form_responses.id = form_answers.response_id
        AND form_responses.user_id = (select auth.uid())
        AND form_responses.status <> 'completed'::response_status
    )
  );

DROP POLICY IF EXISTS "Users can view own answers" ON form_answers;
CREATE POLICY "Users can view own answers" ON form_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_responses
      WHERE form_responses.id = form_answers.response_id
        AND form_responses.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- form_questions table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage questions" ON form_questions;
CREATE POLICY "Admins can manage questions" ON form_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

-- ============================================================================
-- form_responses table
-- ============================================================================

DROP POLICY IF EXISTS "Allow admins full access to form responses" ON form_responses;
CREATE POLICY "Allow admins full access to form responses" ON form_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users to insert form responses" ON form_responses;
CREATE POLICY "Allow authenticated users to insert form responses" ON form_responses
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (respondent_email)::text = (select auth.email())
  );

DROP POLICY IF EXISTS "Allow authenticated users to update own form responses" ON form_responses;
CREATE POLICY "Allow authenticated users to update own form responses" ON form_responses
  FOR UPDATE
  USING ((respondent_email)::text = (select auth.email()))
  WITH CHECK (
    (respondent_email)::text = (select auth.email())
    AND status = ANY (ARRAY['in_progress'::response_status, 'completed'::response_status])
  );

DROP POLICY IF EXISTS "Allow authenticated users to view own form responses" ON form_responses;
CREATE POLICY "Allow authenticated users to view own form responses" ON form_responses
  FOR SELECT
  USING (
    (respondent_email)::text = (select auth.email())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can create responses" ON form_responses;
CREATE POLICY "Users can create responses" ON form_responses
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own responses" ON form_responses;
CREATE POLICY "Users can update own responses" ON form_responses
  FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    AND status <> 'completed'::response_status
  );

-- ============================================================================
-- form_templates table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can create templates" ON form_templates;
CREATE POLICY "Admins can create templates" ON form_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can delete templates" ON form_templates;
CREATE POLICY "Admins can delete templates" ON form_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can update templates" ON form_templates;
CREATE POLICY "Admins can update templates" ON form_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

-- ============================================================================
-- papers table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update papers" ON papers;
CREATE POLICY "Admins can update papers" ON papers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can view all papers" ON papers;
CREATE POLICY "Admins can view all papers" ON papers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can create papers" ON papers;
CREATE POLICY "Users can create papers" ON papers
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own papers" ON papers;
CREATE POLICY "Users can update own papers" ON papers
  FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    AND status = 'submitted'::paper_status
  );

DROP POLICY IF EXISTS "Users can view own papers" ON papers;
CREATE POLICY "Users can view own papers" ON papers
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- photos table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to photos" ON photos;
CREATE POLICY "Admin full access to photos" ON photos
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- posts table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to posts" ON posts;
CREATE POLICY "Admin full access to posts" ON posts
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- pricing_tiers table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON pricing_tiers;
CREATE POLICY "Admins can manage pricing tiers" ON pricing_tiers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- registrations table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update registrations" ON registrations;
CREATE POLICY "Admins can update registrations" ON registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
CREATE POLICY "Admins can view all registrations" ON registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'reviewer'::user_role])
    )
  );

DROP POLICY IF EXISTS "Reviewers can view assigned registrations" ON registrations;
CREATE POLICY "Reviewers can view assigned registrations" ON registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviewers r
      WHERE r.user_id = (select auth.uid())
        AND r.event_id = registrations.event_id
        AND ((r.permissions ->> 'canViewApplications'::text))::boolean = true
    )
  );

DROP POLICY IF EXISTS "Users can create registrations" ON registrations;
CREATE POLICY "Users can create registrations" ON registrations
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- review_locks table
-- ============================================================================

DROP POLICY IF EXISTS "Admins and reviewers can create locks" ON review_locks;
CREATE POLICY "Admins and reviewers can create locks" ON review_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'reviewer'::user_role])
    )
  );

DROP POLICY IF EXISTS "Admins and reviewers can view locks" ON review_locks;
CREATE POLICY "Admins and reviewers can view locks" ON review_locks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'reviewer'::user_role])
    )
  );

DROP POLICY IF EXISTS "Admins can create locks" ON review_locks;
CREATE POLICY "Admins can create locks" ON review_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can delete any lock" ON review_locks;
CREATE POLICY "Admins can delete any lock" ON review_locks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can delete own locks" ON review_locks;
CREATE POLICY "Admins can delete own locks" ON review_locks
  FOR DELETE
  USING (
    locked_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Admins can view all locks" ON review_locks;
CREATE POLICY "Admins can view all locks" ON review_locks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Lock owner can delete own lock" ON review_locks;
CREATE POLICY "Lock owner can delete own lock" ON review_locks
  FOR DELETE
  USING ((select auth.uid()) = locked_by);

-- ============================================================================
-- reviewer_assignments table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage reviewer assignments" ON reviewer_assignments;
CREATE POLICY "Admins can manage reviewer assignments" ON reviewer_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Reviewers can view own assignments" ON reviewer_assignments;
CREATE POLICY "Reviewers can view own assignments" ON reviewer_assignments
  FOR SELECT
  USING (reviewer_id = (select auth.uid()));

-- ============================================================================
-- reviewers table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage reviewers" ON reviewers;
CREATE POLICY "Admins can manage reviewers" ON reviewers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Reviewers can view own assignments" ON reviewers;
CREATE POLICY "Reviewers can view own assignments" ON reviewers
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- schedule_items table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to schedule" ON schedule_items;
CREATE POLICY "Admin full access to schedule" ON schedule_items
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- schedule_speakers table
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage schedule speakers" ON schedule_speakers;
CREATE POLICY "Admin can manage schedule speakers" ON schedule_speakers
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- settings table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to settings" ON settings;
CREATE POLICY "Admin full access to settings" ON settings
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- speaker_expertise table
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage speaker expertise" ON speaker_expertise;
CREATE POLICY "Admin can manage speaker expertise" ON speaker_expertise
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- speaker_expertise_relations table
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage speaker expertise relations" ON speaker_expertise_relations;
CREATE POLICY "Admin can manage speaker expertise relations" ON speaker_expertise_relations
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- speakers table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to speakers" ON speakers;
CREATE POLICY "Admin full access to speakers" ON speakers
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- sponsors table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to sponsors" ON sponsors;
CREATE POLICY "Admin full access to sponsors" ON sponsors
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- static_content table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to static_content" ON static_content;
CREATE POLICY "Admin full access to static_content" ON static_content
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- stats table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage stats" ON stats;
CREATE POLICY "Admins can manage stats" ON stats
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- subscribers table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to subscribers" ON subscribers;
CREATE POLICY "Admin full access to subscribers" ON subscribers
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- team_members table
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to team" ON team_members;
CREATE POLICY "Admin full access to team" ON team_members
  FOR ALL
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));

-- ============================================================================
-- tickets table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets" ON tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- user_profiles table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT
  USING ((select is_admin()));

DROP POLICY IF EXISTS "Public can create profiles" ON user_profiles;
CREATE POLICY "Public can create profiles" ON user_profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

-- ============================================================================
-- venues table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all venues" ON venues;
CREATE POLICY "Admins can manage all venues" ON venues
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Verify policies were recreated
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  IF policy_count < 100 THEN
    RAISE WARNING 'Migration 49: Expected at least 100 policies, found %', policy_count;
  END IF;

  RAISE NOTICE '✅ Migration 49 SUCCESS: Fixed auth RLS initplan issues';
  RAISE NOTICE '   - Wrapped auth.uid(), auth.email(), auth.role() in SELECT';
  RAISE NOTICE '   - Wrapped is_admin() in SELECT';
  RAISE NOTICE '   - Total policies: %', policy_count;
END $$;

COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- Performance improvement: Queries should now execute faster at scale
-- The wrapped functions are evaluated once per query instead of once per row
-- Monitor query performance after deployment to measure improvement
-- ============================================================================
