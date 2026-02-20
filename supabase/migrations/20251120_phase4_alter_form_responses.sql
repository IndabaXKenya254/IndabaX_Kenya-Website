-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 4: REGISTRATION FLOW - ALTER FORM_RESPONSES TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Add columns needed for guest registration (no authentication required)
-- Migration Date: 2025-11-20

-- ============================================================================
-- ADD NEW COLUMNS FOR GUEST REGISTRATION
-- ============================================================================

-- Add response type column
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS response_type VARCHAR(50) DEFAULT 'initial_interest';

-- Add guest user identification columns (for users without accounts)
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS respondent_email VARCHAR(255);

ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS respondent_name VARCHAR(255);

-- Add response data storage (JSONB for flexibility)
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '{}';

-- Add progress tracking
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Add resume token for guest users
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS resume_token VARCHAR(255) UNIQUE;

-- Add metadata
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS ip_address INET;

-- ============================================================================
-- MODIFY EXISTING COLUMNS
-- ============================================================================

-- Make user_id nullable (for guest registration)
ALTER TABLE public.form_responses
ALTER COLUMN user_id DROP NOT NULL;

-- Update access_token to be resume_token equivalent (if not using resume_token)
-- Note: We'll keep both for now for backwards compatibility

-- ============================================================================
-- ADD INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_form_responses_respondent_email
ON public.form_responses(respondent_email);

CREATE INDEX IF NOT EXISTS idx_form_responses_response_type
ON public.form_responses(response_type);

CREATE INDEX IF NOT EXISTS idx_form_responses_resume_token
ON public.form_responses(resume_token);

CREATE INDEX IF NOT EXISTS idx_form_responses_event_email
ON public.form_responses(event_id, respondent_email);

-- ============================================================================
-- ADD COMMENTS FOR NEW COLUMNS
-- ============================================================================

COMMENT ON COLUMN public.form_responses.response_type IS 'Type of form: initial_interest or detailed_survey';
COMMENT ON COLUMN public.form_responses.respondent_email IS 'Email of guest respondent (for users without accounts)';
COMMENT ON COLUMN public.form_responses.respondent_name IS 'Name of guest respondent';
COMMENT ON COLUMN public.form_responses.responses IS 'JSONB object mapping question_id to answer value';
COMMENT ON COLUMN public.form_responses.is_complete IS 'Whether all required questions have been answered';
COMMENT ON COLUMN public.form_responses.completion_percentage IS 'Percentage of required questions answered (0-100)';
COMMENT ON COLUMN public.form_responses.resume_token IS 'Unique token for guest users to resume incomplete forms';
COMMENT ON COLUMN public.form_responses.user_id IS 'User ID (nullable for guest registration)';

-- ============================================================================
-- CREATE/UPDATE HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_resume_token()
RETURNS VARCHAR(255) AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'hex');
    SELECT EXISTS(
      SELECT 1 FROM public.form_responses
      WHERE resume_token = token OR access_token = token
    ) INTO token_exists;
    EXIT WHEN NOT token_exists;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_resume_token() IS 'Generates a unique resume token for form responses';

-- ============================================================================
-- ADD CHECK CONSTRAINT
-- ============================================================================

-- Ensure either user_id OR respondent_email is provided
ALTER TABLE public.form_responses
DROP CONSTRAINT IF EXISTS check_user_identification;

ALTER TABLE public.form_responses
ADD CONSTRAINT check_user_identification
CHECK (user_id IS NOT NULL OR respondent_email IS NOT NULL);

COMMENT ON CONSTRAINT check_user_identification ON public.form_responses
IS 'Ensures either authenticated user (user_id) or guest user (respondent_email) is identified';
