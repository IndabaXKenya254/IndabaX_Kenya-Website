-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35c: ADD MISSING TABLES FROM REGISTRATION REDESIGN
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Add missing tables from dev migration that were not included in file 35
-- Run Order: AFTER 35_registration_redesign_phase1_to_5.sql
--            AFTER 35b_create_tickets_table.sql
--            BEFORE 36_tickets_table_enhancements.sql
--
-- Missing Tables:
--   1. form_questions
--   2. form_answers
--   3. reviewers
--   4. papers
--
-- Root Cause: File 35 was consolidated from dev migration 20251120000000_registration_redesign.sql
--             but accidentally omitted these 4 tables.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 1: form_questions
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Questions within form templates (Google Forms style)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE NOT NULL,

  -- Question details
  type question_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE NOT NULL,
  order_index INTEGER NOT NULL,

  -- Type-specific configuration (JSONB for flexibility)
  config JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- short_answer: { "placeholder": "...", "minLength": 10, "maxLength": 500, "pattern": "..." }
  -- multiple_choice: { "options": ["A", "B", "C"], "allowOther": true, "randomize": false }
  -- file_upload: { "allowedTypes": ["pdf", "docx"], "maxSize": 10485760, "maxFiles": 3 }
  -- linear_scale: { "min": 1, "max": 5, "minLabel": "Poor", "maxLabel": "Excellent" }

  -- Validation rules (JSONB for flexibility)
  validation_rules JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- { "type": "email" }
  -- { "type": "url" }
  -- { "type": "number", "min": 0, "max": 100 }
  -- { "type": "length", "min": 10, "max": 500 }
  -- { "type": "regex", "pattern": "...", "message": "..." }

  -- Conditional logic (future feature)
  conditional_logic JSONB,
  -- Example: { "showIf": { "questionId": "...", "answer": "..." } }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.form_questions IS 'Questions within form templates';
COMMENT ON COLUMN public.form_questions.type IS 'One of 15 question types (Google Forms style)';
COMMENT ON COLUMN public.form_questions.config IS 'Type-specific configuration (options, validation, etc.)';
COMMENT ON COLUMN public.form_questions.order_index IS 'Display order (0-based)';


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 2: form_answers
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Individual answers to form questions
-- Note: UNUSED in current implementation - form_responses.responses (JSONB) is used instead
--       Reserved for future normalized storage if needed
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  response_id UUID REFERENCES public.form_responses(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.form_questions(id) ON DELETE CASCADE NOT NULL,

  -- Answer storage (use appropriate column based on question type)
  text_answer TEXT,              -- For short_answer, paragraph, dropdown
  number_answer NUMERIC,         -- For linear_scale, number inputs
  date_answer TIMESTAMPTZ,       -- For date, time questions
  json_answer JSONB,             -- For multiple_choice, checkboxes, grids (array of selected values)
  file_answer JSONB,             -- For file_upload (array of file URLs and metadata)
  -- Example: [{"url": "...", "name": "...", "size": 12345, "type": "application/pdf"}]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.form_answers IS 'UNUSED: Reserved for future normalized storage of form answers.
Current implementation uses denormalized JSONB in form_responses.responses column.
Created in migration 20251120000000_registration_redesign.sql but never populated.';
COMMENT ON COLUMN public.form_answers.json_answer IS 'For array answers (multiple choice, checkboxes, grids)';
COMMENT ON COLUMN public.form_answers.file_answer IS 'For file uploads (array of file metadata)';


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 3: reviewers
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Reviewer assignments to events with permissions
-- Note: UNIQUE constraint on (user_id, event_id) prevents duplicate assignments
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,

  -- Permissions (JSONB for flexibility)
  permissions JSONB DEFAULT '{
    "canViewApplications": true,
    "canApprove": false,
    "canReject": false,
    "canViewPII": true,
    "canViewSurveyResponses": true,
    "canViewPaperSubmissions": true
  }'::jsonb NOT NULL,

  -- Activity tracking
  applications_reviewed INTEGER DEFAULT 0 NOT NULL,
  last_active_at TIMESTAMPTZ,

  -- Assignment
  added_by UUID REFERENCES public.user_profiles(id) NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- UNIQUE constraint to prevent duplicate reviewer assignments
  CONSTRAINT unique_reviewer_event UNIQUE(user_id, event_id)
);

COMMENT ON TABLE public.reviewers IS 'Reviewer assignments to events with permissions';
COMMENT ON COLUMN public.reviewers.permissions IS 'JSON permissions: canViewApplications, canApprove, canReject, canViewPII, etc.';
COMMENT ON CONSTRAINT unique_reviewer_event ON public.reviewers IS 'One reviewer assignment per user per event';


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 4: papers
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Paper submissions (optional part of registration)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,

  -- Paper details
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT[], -- Array of keywords

  -- File upload
  paper_url TEXT NOT NULL, -- PDF stored in Supabase Storage
  supplementary_files JSONB, -- Array of additional files

  -- Status
  status paper_status DEFAULT 'submitted' NOT NULL,

  -- Review
  reviewed_by UUID REFERENCES public.user_profiles(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.papers IS 'Paper submissions (optional part of registration)';
COMMENT ON COLUMN public.papers.paper_url IS 'PDF stored in Supabase Storage: papers/[eventId]/[paperId].pdf';
COMMENT ON COLUMN public.papers.status IS 'submitted | under_review | approved | rejected';


-- ═══════════════════════════════════════════════════════════════════════
-- ADD FOREIGN KEY CONSTRAINTS TO REGISTRATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Note: These FKs reference tables created after registrations, so we add them now
-- These are circular references that couldn't be added in file 35
-- ═══════════════════════════════════════════════════════════════════════

-- Add FK for paper_id if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'registrations'
      AND constraint_name = 'fk_paper'
  ) THEN
    ALTER TABLE public.registrations
    ADD CONSTRAINT fk_paper
    FOREIGN KEY (paper_id)
    REFERENCES public.papers(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Added FK constraint fk_paper to registrations table';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

-- form_questions indexes
CREATE INDEX IF NOT EXISTS idx_form_questions_template
ON form_questions(template_id, order_index);

-- form_answers indexes
CREATE INDEX IF NOT EXISTS idx_form_answers_response
ON form_answers(response_id);

CREATE INDEX IF NOT EXISTS idx_form_answers_question
ON form_answers(question_id);

-- reviewers indexes
CREATE INDEX IF NOT EXISTS idx_reviewers_event_id
ON reviewers(event_id);

CREATE INDEX IF NOT EXISTS idx_reviewers_user_id
ON reviewers(user_id, event_id);

-- papers indexes
CREATE INDEX IF NOT EXISTS idx_papers_event_id
ON papers(event_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_papers_user_id
ON papers(user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_papers_registration_id
ON papers(registration_id)
WHERE registration_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to view form questions" ON form_questions;
DROP POLICY IF EXISTS "Allow users to view their own answers" ON form_answers;
DROP POLICY IF EXISTS "Allow users to insert their own answers" ON form_answers;
DROP POLICY IF EXISTS "Allow reviewers to view reviewer assignments" ON reviewers;
DROP POLICY IF EXISTS "Allow users to view their own papers" ON papers;
DROP POLICY IF EXISTS "Allow users to insert their own papers" ON papers;

-- form_questions: Authenticated users can view
CREATE POLICY "Allow authenticated users to view form questions"
  ON form_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- form_answers: Users can view/update their own answers
CREATE POLICY "Allow users to view their own answers"
  ON form_answers
  FOR SELECT
  TO authenticated
  USING (
    response_id IN (
      SELECT id FROM form_responses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to insert their own answers"
  ON form_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    response_id IN (
      SELECT id FROM form_responses WHERE user_id = auth.uid()
    )
  );

-- reviewers: Only admins/reviewers can view
CREATE POLICY "Allow reviewers to view reviewer assignments"
  ON reviewers
  FOR SELECT
  TO authenticated
  USING (true);

-- papers: Users can view/manage their own papers
CREATE POLICY "Allow users to view their own papers"
  ON papers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own papers"
  ON papers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════════

GRANT SELECT ON form_questions TO authenticated;
GRANT SELECT ON form_answers TO authenticated;
GRANT SELECT ON reviewers TO authenticated;
GRANT SELECT ON papers TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35c: Missing Tables Added Successfully';
  RAISE NOTICE '   Tables created:';
  RAISE NOTICE '     - form_questions (form builder component)';
  RAISE NOTICE '     - form_answers (reserved for future use)';
  RAISE NOTICE '     - reviewers (reviewer assignment system)';
  RAISE NOTICE '     - papers (paper submission system)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   Foreign keys: Added registrations.paper_id → papers.id';
  RAISE NOTICE '   Indexes: Created performance indexes for all tables';
  RAISE NOTICE '   RLS: Enabled with appropriate policies';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run file 36_tickets_table_enhancements.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
