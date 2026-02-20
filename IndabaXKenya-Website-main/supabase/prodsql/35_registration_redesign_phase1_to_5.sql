-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35: REGISTRATION REDESIGN (PHASE 1-5)
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-11-20 to 2025-11-27
-- Purpose: Complete registration and application system redesign
-- Phase: Consolidation of all November 2025 changes
--
-- This file consolidates the following migrations:
-- - 20251120000000_registration_redesign.sql (Phase 1: Core tables)
-- - 20251120_phase4_*.sql (Phase 4: Form templates and responses)
-- - 20251121040000_phase5_review_system.sql (Phase 5: Review workflow)
-- - 20251121160000_create_application_activity_log.sql (Activity tracking)
-- - SUCCESSFUL_FIX_RUN_THIS.sql (Critical fixes)
-- - FIX_VIEW_POINTS_TO_WRONG_TABLE.sql (View fix Nov 27)
--
-- IMPORTANT: Run this ONLY on fresh production database
-- For existing databases, use individual migration files
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 1: CREATE ENUMS
-- ═══════════════════════════════════════════════════════════════════════

-- User roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'applicant',
      'speaker',
      'reviewer',
      'admin'
    );
  END IF;
END $$;

-- Registration status (original enum - for registrations table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE registration_status AS ENUM (
      'interested',
      'pending',
      'shortlisted',
      'survey_sent',
      'survey_completed',
      'approved',
      'rejected',
      'attended'
    );
  END IF;
END $$;

-- Registration status v2 (enhanced for form_responses)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status_v2') THEN
    CREATE TYPE registration_status_v2 AS ENUM (
      'interested',
      'pending',
      'shortlisted',
      'survey_sent',
      'survey_completed',
      'approved',
      'rejected',
      'attended'
    );
  END IF;
END $$;

-- Form question types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM (
      'short_answer',
      'paragraph',
      'multiple_choice',
      'checkboxes',
      'dropdown',
      'linear_scale',
      'multiple_choice_grid',
      'checkbox_grid',
      'date',
      'time',
      'file_upload',
      'title_description',
      'image',
      'video',
      'section_break'
    );
  END IF;
END $$;

-- Response status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'response_status') THEN
    CREATE TYPE response_status AS ENUM (
      'not_started',
      'in_progress',
      'completed'
    );
  END IF;
END $$;

-- Email status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM (
      'pending',
      'sent',
      'delivered',
      'failed',
      'bounced'
    );
  END IF;
END $$;

-- Paper status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_status') THEN
    CREATE TYPE paper_status AS ENUM (
      'submitted',
      'under_review',
      'approved',
      'rejected'
    );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 2: CREATE/UPDATE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- User Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization VARCHAR(255),
  role user_role DEFAULT 'applicant' NOT NULL,
  avatar TEXT,
  bio TEXT,
  is_new_user BOOLEAN DEFAULT TRUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

-- Registrations Table (designed but not actively used - data is in form_responses)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  status registration_status DEFAULT 'interested' NOT NULL,
  initial_form_response_id UUID,
  detailed_form_response_id UUID,
  paper_id UUID,
  reviewed_by UUID REFERENCES public.user_profiles(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  shortlisted_by UUID REFERENCES public.user_profiles(id),
  shortlisted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.user_profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ticket_sent_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Form Templates Table
CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{"sections": []}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Form Responses Table (ACTIVE TABLE - stores all applications)
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL DEFAULT 'initial_interest',
  respondent_email VARCHAR(255) NOT NULL,
  respondent_name VARCHAR(255),
  responses JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_complete BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  time_to_complete_seconds INTEGER,
  resume_token VARCHAR(255) UNIQUE,
  access_token VARCHAR(255),
  deadline_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Phase 5 columns
  survey_deadline_days INTEGER DEFAULT 7,
  status_v2 registration_status_v2 DEFAULT 'interested',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  shortlisted_by UUID REFERENCES auth.users(id),
  shortlisted_at TIMESTAMPTZ,
  decision_by UUID REFERENCES auth.users(id),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Review Locks Table
CREATE TABLE IF NOT EXISTS public.review_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.form_responses(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 3: CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_form_responses_template ON public.form_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_event ON public.form_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user ON public.form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON public.form_responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON public.form_responses(status);
CREATE INDEX IF NOT EXISTS idx_form_responses_status_v2 ON public.form_responses(status_v2);
CREATE INDEX IF NOT EXISTS idx_form_responses_type ON public.form_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_form_responses_resume_token ON public.form_responses(resume_token);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON public.form_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_responses_event_email ON public.form_responses(event_id, respondent_email);

CREATE INDEX IF NOT EXISTS idx_review_locks_registration_id ON public.review_locks(registration_id);
CREATE INDEX IF NOT EXISTS idx_review_locks_locked_by ON public.review_locks(locked_by);
CREATE INDEX IF NOT EXISTS idx_review_locks_expires_at ON public.review_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_application_id ON public.activity_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 4: CREATE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Function: Cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM review_locks
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Check if application is locked
DROP FUNCTION IF EXISTS is_application_locked(UUID);
DROP FUNCTION IF EXISTS is_application_locked(UUID, UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID, p_user_id UUID);

CREATE OR REPLACE FUNCTION is_application_locked(
  p_registration_id UUID
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by_user_id UUID,
  locked_by_email VARCHAR(255),
  locked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_owned_by_requester BOOLEAN
) AS $$
DECLARE
  p_user_id UUID := auth.uid();
BEGIN
  PERFORM cleanup_expired_locks();

  RETURN QUERY
  SELECT
    (rl.id IS NOT NULL) AS is_locked,
    rl.locked_by AS locked_by_user_id,
    up.email AS locked_by_email,
    rl.locked_at,
    rl.expires_at,
    (rl.locked_by = p_user_id) AS is_owned_by_requester
  FROM review_locks rl
  LEFT JOIN public.user_profiles up ON up.id = rl.locked_by
  WHERE rl.registration_id = p_registration_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 5: CREATE VIEWS
-- ═══════════════════════════════════════════════════════════════════════

-- Applications with Locks View (queries form_responses - the active table)
DROP VIEW IF EXISTS applications_with_locks CASCADE;

CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  up.email AS locked_by_email,
  up.name AS locked_by_name
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Applications with their current lock status.
Uses form_responses table (active applications table).
Uses user_profiles table instead of auth.users for permissions.';

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 6: GRANTS AND PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;
GRANT SELECT ON applications_with_locks TO anon;
GRANT SELECT ON form_responses TO authenticated;
GRANT SELECT ON review_locks TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 7: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on form_responses
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view all applications" ON form_responses;
DROP POLICY IF EXISTS "Allow public to insert form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow authenticated users to update their own responses" ON form_responses;

-- Create policies
CREATE POLICY "Allow authenticated users to view all applications"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public to insert form responses"
  ON form_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their own responses"
  ON form_responses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR respondent_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION 8: ADD COMMENTS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.form_responses IS 'ACTIVE TABLE: User responses to event registration forms. This is where all application data lives.';
COMMENT ON TABLE public.registrations IS 'UNUSED: Designed for future use. Data currently stored in form_responses.';
COMMENT ON TABLE public.review_locks IS 'Prevents concurrent reviews. Locks expire after 30 minutes.';
COMMENT ON TABLE public.activity_logs IS 'Audit trail for all application actions.';

COMMENT ON COLUMN public.form_responses.status_v2 IS 'Enhanced status for Phase 5+ workflow. Use this instead of status column.';
COMMENT ON COLUMN public.form_responses.review_notes IS 'Admin notes during review. Autosave supported.';
COMMENT ON COLUMN public.review_locks.registration_id IS 'References form_responses.id (not registrations.id)';

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35: Registration Redesign Complete';
  RAISE NOTICE '   Tables created: user_profiles, registrations, form_templates,';
  RAISE NOTICE '                   form_responses, review_locks, activity_logs';
  RAISE NOTICE '   Views created: applications_with_locks';
  RAISE NOTICE '   Functions created: cleanup_expired_locks, is_application_locked';
  RAISE NOTICE '   ';
  RAISE NOTICE '   IMPORTANT: form_responses is the ACTIVE table for applications';
  RAISE NOTICE '              registrations table exists but is UNUSED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
