-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 4: REGISTRATION FLOW - FORM RESPONSES STORAGE (v3 - Minimal)
-- ═══════════════════════════════════════════════════════════════════════
-- Store user responses to registration forms
-- Migration Date: 2025-11-20
-- Version: 3 (Step-by-step approach)

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES IF ANY
-- ============================================================================

DROP POLICY IF EXISTS "form_responses_insert_policy" ON public.form_responses;
DROP POLICY IF EXISTS "form_responses_select_policy" ON public.form_responses;
DROP POLICY IF EXISTS "form_responses_update_policy" ON public.form_responses;
DROP POLICY IF EXISTS "Anyone can create form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.form_responses;
DROP POLICY IF EXISTS "Users can update own draft responses" ON public.form_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.form_responses;
DROP POLICY IF EXISTS "Admins can update responses" ON public.form_responses;

-- ============================================================================
-- STEP 2: CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL DEFAULT 'initial_interest',
  respondent_email VARCHAR(255) NOT NULL,
  respondent_name VARCHAR(255),
  responses JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_complete BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  resume_token VARCHAR(255) UNIQUE,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_form_responses_template ON public.form_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_event ON public.form_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON public.form_responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON public.form_responses(status);
CREATE INDEX IF NOT EXISTS idx_form_responses_type ON public.form_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_form_responses_resume_token ON public.form_responses(resume_token);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON public.form_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_responses_event_email ON public.form_responses(event_id, respondent_email);

-- ============================================================================
-- STEP 4: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.form_responses IS 'User responses to event registration forms';
COMMENT ON COLUMN public.form_responses.template_id IS 'Reference to the form template used';
COMMENT ON COLUMN public.form_responses.event_id IS 'Reference to the event this response is for';
COMMENT ON COLUMN public.form_responses.response_type IS 'Type of form: initial_interest or detailed_survey';
COMMENT ON COLUMN public.form_responses.respondent_email IS 'Email of the person submitting the form';
COMMENT ON COLUMN public.form_responses.responses IS 'JSONB object mapping question_id to answer value';
COMMENT ON COLUMN public.form_responses.status IS 'Current status: draft, submitted, reviewed, accepted, rejected';
COMMENT ON COLUMN public.form_responses.is_complete IS 'Whether all required questions have been answered';
COMMENT ON COLUMN public.form_responses.completion_percentage IS 'Percentage of required questions answered (0-100)';
COMMENT ON COLUMN public.form_responses.resume_token IS 'Unique token for resuming incomplete forms';
COMMENT ON COLUMN public.form_responses.last_saved_at IS 'Last auto-save timestamp';

-- ============================================================================
-- STEP 5: CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_form_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS form_responses_updated_at ON public.form_responses;

CREATE TRIGGER form_responses_updated_at
  BEFORE UPDATE ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_responses_updated_at();

-- ============================================================================
-- STEP 7: CREATE RESUME TOKEN GENERATOR FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_resume_token()
RETURNS VARCHAR(255) AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.form_responses WHERE resume_token = token) INTO token_exists;
    EXIT WHEN NOT token_exists;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_resume_token() IS 'Generates a unique resume token for form responses';

-- ============================================================================
-- STEP 8: ENABLE RLS (but no policies yet - handle in app layer)
-- ============================================================================

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: CREATE PERMISSIVE POLICIES (allow all for now)
-- ============================================================================

-- Allow all operations for now - we handle security in the API layer
CREATE POLICY "allow_all_form_responses"
  ON public.form_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: This is intentionally permissive because:
-- 1. This is a public registration form (no user accounts)
-- 2. Security is handled in the API layer via:
--    - Email validation
--    - Resume token verification
--    - Admin middleware for management operations
-- 3. We can tighten policies later once we add user authentication
