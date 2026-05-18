-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 4: REGISTRATION FLOW - FORM RESPONSES STORAGE
-- ═══════════════════════════════════════════════════════════════════════
-- Store user responses to registration forms
-- Migration Date: 2025-11-20

-- ============================================================================
-- FORM RESPONSES TABLE
-- ============================================================================
-- Stores individual form submissions from users

CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Form identification
  template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Response type: initial_interest or detailed_survey
  response_type VARCHAR(50) NOT NULL DEFAULT 'initial_interest',

  -- User identification (for guests - email based)
  respondent_email VARCHAR(255) NOT NULL,
  respondent_name VARCHAR(255),

  -- Response data (JSONB - stores all question responses)
  responses JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- Possible values: draft, submitted, reviewed, accepted, rejected

  -- Progress tracking
  is_complete BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),

  -- Auto-save token for resuming
  resume_token VARCHAR(255) UNIQUE,

  -- Metadata
  user_agent TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_form_responses_template ON public.form_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_event ON public.form_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON public.form_responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON public.form_responses(status);
CREATE INDEX IF NOT EXISTS idx_form_responses_type ON public.form_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_form_responses_resume_token ON public.form_responses(resume_token);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON public.form_responses(submitted_at);

-- Composite index for finding user's response to a specific event
CREATE INDEX IF NOT EXISTS idx_form_responses_event_email
  ON public.form_responses(event_id, respondent_email);

-- ============================================================================
-- COMMENTS
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (create new response)
CREATE POLICY "Anyone can create form responses"
  ON public.form_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own responses (by email)
CREATE POLICY "Users can view own responses"
  ON public.form_responses
  FOR SELECT
  TO anon, authenticated
  USING (
    respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR resume_token IS NOT NULL  -- Allow access via resume token
  );

-- Allow users to update their own draft responses
CREATE POLICY "Users can update own draft responses"
  ON public.form_responses
  FOR UPDATE
  TO anon, authenticated
  USING (
    respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
    AND status = 'draft'
  )
  WITH CHECK (
    respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
    AND status = 'draft'
  );

-- Admins can view all responses
CREATE POLICY "Admins can view all responses"
  ON public.form_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update any response
CREATE POLICY "Admins can update responses"
  ON public.form_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_form_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_responses_updated_at
  BEFORE UPDATE ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_responses_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Generate Resume Token
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_resume_token()
RETURNS VARCHAR(255) AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token (using random + timestamp for uniqueness)
    token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'hex');

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.form_responses WHERE resume_token = token) INTO token_exists;

    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_resume_token() IS 'Generates a unique resume token for form responses';
