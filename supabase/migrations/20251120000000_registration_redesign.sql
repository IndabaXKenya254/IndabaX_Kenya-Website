-- ============================================================================
-- INDABAX KENYA - REGISTRATION SYSTEM REDESIGN
-- ============================================================================
-- Created: 2025-11-20
-- Purpose: Complete redesign of registration and application system
-- Phase: Database Migration (Phase 1)
-- Tables: 12 new tables + modifications to existing events table
-- Execution: Will be executed via Supabase MCP after local review
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE ENUMS
-- ============================================================================

-- User roles (extends beyond just applicants)
CREATE TYPE user_role AS ENUM (
  'applicant',    -- Regular user applying to events
  'speaker',      -- Speaker (can also apply, emphasis on papers)
  'reviewer',     -- Can review applications
  'admin'         -- Full platform access
);

-- Registration status (multi-stage workflow)
CREATE TYPE registration_status AS ENUM (
  'interested',        -- User showed initial interest
  'pending',           -- Admin reviewing
  'shortlisted',       -- Admin shortlisted, awaiting detailed survey
  'survey_sent',       -- Survey link sent
  'survey_completed',  -- User completed detailed survey
  'approved',          -- Final approval, ticket sent
  'rejected',          -- Application rejected
  'attended'           -- User attended event (post-event update)
);

-- Form question types (15 types - Google Forms style)
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

-- Response status (for auto-save functionality)
CREATE TYPE response_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

-- Email status (for tracking delivery)
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced'
);

-- Paper status (for paper submissions)
CREATE TYPE paper_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'rejected'
);

-- ============================================================================
-- SECTION 2: CREATE NEW TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
-- Purpose: Extend Supabase Auth users with profile information
-- Note: Links to auth.users via id (foreign key to Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic profile info
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization VARCHAR(255),

  -- Role and status
  role user_role DEFAULT 'applicant' NOT NULL,
  avatar TEXT, -- URL to profile picture
  bio TEXT,

  -- User flags
  is_new_user BOOLEAN DEFAULT TRUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

COMMENT ON TABLE public.user_profiles IS 'User profiles extending Supabase Auth users';
COMMENT ON COLUMN public.user_profiles.id IS 'Links to auth.users(id)';
COMMENT ON COLUMN public.user_profiles.is_new_user IS 'Flag for first-time users (show onboarding)';

-- ============================================================================
-- TABLE: registrations
-- ============================================================================
-- Purpose: User event registrations (replaces simple applications table)
-- Note: UNIQUE constraint on (user_id, event_id) prevents duplicate registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Status tracking (multi-stage workflow)
  status registration_status DEFAULT 'interested' NOT NULL,

  -- Form responses
  initial_form_response_id UUID, -- References form_responses (added after table creation)
  detailed_form_response_id UUID, -- References form_responses (added after table creation)

  -- Paper submission (optional)
  paper_id UUID, -- References papers (added after table creation)

  -- Review tracking
  reviewed_by UUID REFERENCES public.user_profiles(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Shortlisting
  shortlisted_by UUID REFERENCES public.user_profiles(id),
  shortlisted_at TIMESTAMPTZ,

  -- Final decision
  approved_by UUID REFERENCES public.user_profiles(id),
  rejected_by UUID REFERENCES public.user_profiles(id),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,

  -- Ticket (generated on approval)
  ticket_id UUID, -- References tickets (added after table creation)

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- UNIQUE constraint to prevent duplicate registrations
  CONSTRAINT unique_user_event UNIQUE(user_id, event_id)
);

COMMENT ON TABLE public.registrations IS 'User event registrations (replaces applications table)';
COMMENT ON COLUMN public.registrations.status IS 'Multi-stage workflow: interested → pending → shortlisted → survey_sent → survey_completed → approved/rejected';
COMMENT ON CONSTRAINT unique_user_event ON public.registrations IS 'Prevents duplicate registrations for same user and event';

-- ============================================================================
-- TABLE: form_templates
-- ============================================================================
-- Purpose: Reusable form templates (Google Forms style)
-- Note: Can be locked to specific events or reusable across events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Configuration
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  locked_to_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  -- Usage type
  usage_type VARCHAR(50) NOT NULL, -- 'initial_interest', 'detailed_survey', 'paper_submission', 'custom'

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "validityPeriodDays": 7,
    "autoSave": true,
    "allowResume": true,
    "showProgress": true
  }'::jsonb,

  -- Ownership
  created_by UUID REFERENCES public.user_profiles(id) NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.form_templates IS 'Reusable form templates (Google Forms style)';
COMMENT ON COLUMN public.form_templates.usage_type IS 'initial_interest | detailed_survey | paper_submission | custom';
COMMENT ON COLUMN public.form_templates.settings IS 'JSON settings: validityPeriodDays, autoSave, allowResume, showProgress';

-- ============================================================================
-- TABLE: form_questions
-- ============================================================================
-- Purpose: Questions within form templates
-- Note: order_index determines display order, config is type-specific
-- ============================================================================

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

-- ============================================================================
-- TABLE: form_responses
-- ============================================================================
-- Purpose: User responses to form templates (with auto-save)
-- Note: access_token enables tokenized survey links for shortlisted users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,

  -- Status and timing
  status response_status DEFAULT 'not_started' NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  time_to_complete_seconds INTEGER, -- Calculated on completion

  -- Survey access (for shortlisted users)
  access_token TEXT UNIQUE, -- Unique token for survey link: /survey/[token]
  deadline_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.form_responses IS 'User responses to forms (supports auto-save and resume)';
COMMENT ON COLUMN public.form_responses.access_token IS 'Unique token for survey links (/survey/[token])';
COMMENT ON COLUMN public.form_responses.last_saved_at IS 'Auto-save timestamp (updates every 30 seconds)';
COMMENT ON COLUMN public.form_responses.time_to_complete_seconds IS 'Time from started_at to completed_at';

-- ============================================================================
-- TABLE: form_answers
-- ============================================================================
-- Purpose: Individual answers to form questions
-- Note: Uses multiple columns to support different answer types
-- ============================================================================

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

COMMENT ON TABLE public.form_answers IS 'Individual answers to form questions';
COMMENT ON COLUMN public.form_answers.json_answer IS 'For array answers (multiple choice, checkboxes, grids)';
COMMENT ON COLUMN public.form_answers.file_answer IS 'For file uploads (array of file metadata)';

-- ============================================================================
-- TABLE: review_locks
-- ============================================================================
-- Purpose: Prevent concurrent reviews (conflict prevention mechanism)
-- Note: UNIQUE constraint on registration_id ensures only one lock per registration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  locked_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Lock timing
  locked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- Lock expires after 30 minutes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.review_locks IS 'Prevents concurrent reviews (30-minute lock)';
COMMENT ON COLUMN public.review_locks.expires_at IS 'Lock expires after 30 minutes from locked_at';
COMMENT ON CONSTRAINT review_locks_registration_id_key ON public.review_locks IS 'Only one lock per registration (conflict prevention)';

-- ============================================================================
-- TABLE: reviewers
-- ============================================================================
-- Purpose: Reviewer assignments to events with permissions
-- Note: UNIQUE constraint on (user_id, event_id) prevents duplicate assignments
-- ============================================================================

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

-- ============================================================================
-- TABLE: email_templates
-- ============================================================================
-- Purpose: Reusable email templates with rich HTML (QuillJS)
-- Note: variables array lists available placeholders like {{name}}, {{event_name}}
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template details
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- Rich HTML from QuillJS editor

  -- Configuration
  type VARCHAR(100), -- 'verification', 'shortlist', 'approval', 'rejection', 'survey_reminder', 'custom'
  is_reusable BOOLEAN DEFAULT TRUE NOT NULL,

  -- Variables (for template replacement)
  variables TEXT[] DEFAULT ARRAY['{{name}}', '{{email}}', '{{event_name}}', '{{event_date}}', '{{survey_link}}', '{{ticket_url}}'],

  -- Ownership
  created_by UUID REFERENCES public.user_profiles(id) NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.email_templates IS 'Reusable email templates with rich HTML (QuillJS)';
COMMENT ON COLUMN public.email_templates.body IS 'Rich HTML from QuillJS editor';
COMMENT ON COLUMN public.email_templates.variables IS 'Available placeholders: {{name}}, {{event_name}}, etc.';

-- ============================================================================
-- TABLE: email_logs
-- ============================================================================
-- Purpose: Track all sent emails for debugging and compliance
-- Note: Logs every email sent through the system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email details
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  cc_emails TEXT[], -- Array of CC recipients
  bcc_emails TEXT[], -- Array of BCC recipients
  subject TEXT,
  body TEXT, -- Final HTML after variable replacement

  -- Status tracking
  status email_status DEFAULT 'pending' NOT NULL,
  error_message TEXT, -- If status = 'failed', store error here
  attempts INTEGER DEFAULT 1 NOT NULL, -- Number of send attempts

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.email_logs IS 'Logs all sent emails for debugging and compliance';
COMMENT ON COLUMN public.email_logs.status IS 'pending | sent | delivered | failed | bounced';
COMMENT ON COLUMN public.email_logs.attempts IS 'Number of send attempts (for retry logic)';

-- ============================================================================
-- TABLE: tickets
-- ============================================================================
-- Purpose: Generated event tickets (PDF with QR code)
-- Note: Generated on approval, includes QR code data and PDF URL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,

  -- Ticket details
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- Format: EVENT-001234
  qr_code_data TEXT NOT NULL, -- JSON: {ticketId, userId, eventId}
  pdf_url TEXT, -- Stored in Supabase Storage: tickets/[eventId]/[ticketId].pdf

  -- Status
  is_valid BOOLEAN DEFAULT TRUE NOT NULL, -- Can be invalidated if needed

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  downloaded_at TIMESTAMPTZ -- Track when user downloads ticket
);

COMMENT ON TABLE public.tickets IS 'Generated event tickets (PDF with QR code)';
COMMENT ON COLUMN public.tickets.ticket_number IS 'Unique ticket number (format: EVENT-001234)';
COMMENT ON COLUMN public.tickets.qr_code_data IS 'JSON encoded: {ticketId, userId, eventId}';
COMMENT ON COLUMN public.tickets.pdf_url IS 'Supabase Storage URL: tickets/[eventId]/[ticketId].pdf';

-- ============================================================================
-- TABLE: papers
-- ============================================================================
-- Purpose: Paper submissions (optional part of event registration)
-- Note: May already exist in database, create only if not exists
-- ============================================================================

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

-- ============================================================================
-- SECTION 3: ADD FOREIGN KEY CONSTRAINTS (Circular References)
-- ============================================================================
-- Note: These FKs reference tables created after registrations, so we add them now

ALTER TABLE public.registrations
  ADD CONSTRAINT fk_initial_form_response
  FOREIGN KEY (initial_form_response_id)
  REFERENCES public.form_responses(id)
  ON DELETE SET NULL;

ALTER TABLE public.registrations
  ADD CONSTRAINT fk_detailed_form_response
  FOREIGN KEY (detailed_form_response_id)
  REFERENCES public.form_responses(id)
  ON DELETE SET NULL;

ALTER TABLE public.registrations
  ADD CONSTRAINT fk_paper
  FOREIGN KEY (paper_id)
  REFERENCES public.papers(id)
  ON DELETE SET NULL;

ALTER TABLE public.registrations
  ADD CONSTRAINT fk_ticket
  FOREIGN KEY (ticket_id)
  REFERENCES public.tickets(id)
  ON DELETE SET NULL;

-- ============================================================================
-- SECTION 4: MODIFY EXISTING TABLES
-- ============================================================================

-- Add template assignment columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS initial_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS detailed_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.initial_template_id IS 'Template for initial interest form';
COMMENT ON COLUMN public.events.detailed_template_id IS 'Template for detailed survey (post-shortlist)';

-- Mark old applications table as deprecated (don't delete yet - data migration needed)
COMMENT ON TABLE public.applications IS '[DEPRECATED] Use registrations table instead. Will be removed after data migration.';

-- ============================================================================
-- SECTION 5: CREATE INDEXES
-- ============================================================================

-- user_profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON public.registrations(registered_at);

-- form_templates indexes
CREATE INDEX IF NOT EXISTS idx_form_templates_name ON public.form_templates(name);
CREATE INDEX IF NOT EXISTS idx_form_templates_created_by ON public.form_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_form_templates_usage_type ON public.form_templates(usage_type);

-- form_questions indexes
CREATE INDEX IF NOT EXISTS idx_form_questions_template_id ON public.form_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_questions_order_index ON public.form_questions(template_id, order_index);

-- form_responses indexes
CREATE INDEX IF NOT EXISTS idx_form_responses_template_id ON public.form_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON public.form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_event_id ON public.form_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON public.form_responses(status);
CREATE INDEX IF NOT EXISTS idx_form_responses_access_token ON public.form_responses(access_token);

-- form_answers indexes
CREATE INDEX IF NOT EXISTS idx_form_answers_response_id ON public.form_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_question_id ON public.form_answers(question_id);

-- review_locks indexes
CREATE INDEX IF NOT EXISTS idx_review_locks_registration_id ON public.review_locks(registration_id);
CREATE INDEX IF NOT EXISTS idx_review_locks_locked_by ON public.review_locks(locked_by);
CREATE INDEX IF NOT EXISTS idx_review_locks_expires_at ON public.review_locks(expires_at);

-- reviewers indexes
CREATE INDEX IF NOT EXISTS idx_reviewers_user_id ON public.reviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewers_event_id ON public.reviewers(event_id);

-- email_templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON public.email_templates(created_by);

-- email_logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON public.tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);

-- papers indexes
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_event_id ON public.papers(event_id);
CREATE INDEX IF NOT EXISTS idx_papers_registration_id ON public.papers(registration_id);
CREATE INDEX IF NOT EXISTS idx_papers_status ON public.papers(status);

-- events indexes (for new columns)
CREATE INDEX IF NOT EXISTS idx_events_initial_template_id ON public.events(initial_template_id);
CREATE INDEX IF NOT EXISTS idx_events_detailed_template_id ON public.events(detailed_template_id);

-- ============================================================================
-- SECTION 6: CREATE STORAGE BUCKETS
-- ============================================================================

-- IMPORTANT: Storage buckets must be created via Supabase UI, not SQL
-- Reason: storage.buckets table is owned by supabase_storage_admin role
--
-- MANUAL STEPS (Do this in Supabase Dashboard):
-- 1. Go to Storage → Create new bucket
-- 2. Create the following buckets:
--
--    Bucket: tickets
--    - Public: NO (private)
--    - File size limit: 10 MB
--    - Allowed MIME types: application/pdf
--
--    Bucket: form-uploads
--    - Public: NO (private)
--    - File size limit: 10 MB
--    - Allowed MIME types: application/pdf, image/*, application/msword, etc.
--
--    Bucket: papers
--    - Public: NO (private)
--    - File size limit: 20 MB
--    - Allowed MIME types: application/pdf
--
-- Storage policies will be created below (Section 9)

-- ============================================================================
-- SECTION 7: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 8: CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- POLICIES: user_profiles
-- ============================================================================

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

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public can insert new profiles (registration)
CREATE POLICY "Public can create profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- POLICIES: registrations
-- ============================================================================

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON public.registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create registrations
CREATE POLICY "Users can create registrations"
  ON public.registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
  ON public.registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- Admins can update registrations
CREATE POLICY "Admins can update registrations"
  ON public.registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviewers can view assigned registrations
CREATE POLICY "Reviewers can view assigned registrations"
  ON public.registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviewers r
      WHERE r.user_id = auth.uid()
        AND r.event_id = registrations.event_id
        AND (r.permissions->>'canViewApplications')::boolean = true
    )
  );

-- ============================================================================
-- POLICIES: form_templates
-- ============================================================================

-- Public can read templates (for viewing forms)
CREATE POLICY "Public can view templates"
  ON public.form_templates
  FOR SELECT
  USING (true);

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON public.form_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update templates
CREATE POLICY "Admins can update templates"
  ON public.form_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete templates
CREATE POLICY "Admins can delete templates"
  ON public.form_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: form_questions
-- ============================================================================

-- Public can read questions (for viewing forms)
CREATE POLICY "Public can view questions"
  ON public.form_questions
  FOR SELECT
  USING (true);

-- Admins can manage questions
CREATE POLICY "Admins can manage questions"
  ON public.form_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: form_responses
-- ============================================================================

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
  ON public.form_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create responses
CREATE POLICY "Users can create responses"
  ON public.form_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own in-progress responses (auto-save)
CREATE POLICY "Users can update own responses"
  ON public.form_responses
  FOR UPDATE
  USING (auth.uid() = user_id AND status != 'completed');

-- Admins can view all responses
CREATE POLICY "Admins can view all responses"
  ON public.form_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update responses (extend deadline, etc.)
CREATE POLICY "Admins can update responses"
  ON public.form_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: form_answers
-- ============================================================================

-- Users can view their own answers
CREATE POLICY "Users can view own answers"
  ON public.form_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE id = form_answers.response_id AND user_id = auth.uid()
    )
  );

-- Users can create answers
CREATE POLICY "Users can create answers"
  ON public.form_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE id = form_answers.response_id AND user_id = auth.uid()
    )
  );

-- Users can update their own answers (auto-save)
CREATE POLICY "Users can update own answers"
  ON public.form_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE id = form_answers.response_id
        AND user_id = auth.uid()
        AND status != 'completed'
    )
  );

-- Admins can view all answers
CREATE POLICY "Admins can view all answers"
  ON public.form_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: review_locks
-- ============================================================================

-- Admins and reviewers can view locks
CREATE POLICY "Admins and reviewers can view locks"
  ON public.review_locks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- Admins and reviewers can create locks
CREATE POLICY "Admins and reviewers can create locks"
  ON public.review_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- Lock owner can delete their own lock
CREATE POLICY "Lock owner can delete own lock"
  ON public.review_locks
  FOR DELETE
  USING (auth.uid() = locked_by);

-- Admins can delete any lock
CREATE POLICY "Admins can delete any lock"
  ON public.review_locks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: reviewers
-- ============================================================================

-- Admins can manage reviewers
CREATE POLICY "Admins can manage reviewers"
  ON public.reviewers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviewers can view their own assignments
CREATE POLICY "Reviewers can view own assignments"
  ON public.reviewers
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: email_templates
-- ============================================================================

-- Admins can manage email templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: email_logs
-- ============================================================================

-- Admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert email logs (service role)
CREATE POLICY "System can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: tickets
-- ============================================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can create tickets (service role)
CREATE POLICY "System can create tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- POLICIES: papers
-- ============================================================================

-- Users can view their own papers
CREATE POLICY "Users can view own papers"
  ON public.papers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create papers
CREATE POLICY "Users can create papers"
  ON public.papers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own papers (before submission)
CREATE POLICY "Users can update own papers"
  ON public.papers
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'submitted');

-- Admins can view all papers
CREATE POLICY "Admins can view all papers"
  ON public.papers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update papers (review)
CREATE POLICY "Admins can update papers"
  ON public.papers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 9: STORAGE POLICIES
-- ============================================================================

-- NOTE: These policies will be created, but they won't take effect until
-- the storage buckets are manually created via Supabase Dashboard (see Section 6)

-- Tickets bucket policies (private - only owner and admins)
CREATE POLICY "Users can view own tickets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tickets' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "System can upload tickets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'tickets');

-- Form uploads bucket policies (private - only owner and admins)
CREATE POLICY "Users can view own form uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'form-uploads' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can upload to form-uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'form-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Papers bucket policies (private - only owner and admins)
CREATE POLICY "Users can view own papers"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'papers' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can upload papers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- SECTION 10: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Helper function to check if current user is admin';

-- Function to clean up expired review locks (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.review_locks
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_locks IS 'Deletes expired review locks (call periodically via cron)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_answers_updated_at
  BEFORE UPDATE ON public.form_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviewers_updated_at
  BEFORE UPDATE ON public.reviewers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Registration System Redesign Migration Complete!';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Tables created: 12';
  RAISE NOTICE 'Indexes created: ~40';
  RAISE NOTICE 'RLS policies created: ~50';
  RAISE NOTICE 'Storage policies created: 6 (buckets must be created manually)';
  RAISE NOTICE 'Helper functions created: 3';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'IMPORTANT: Create storage buckets via Supabase Dashboard (see Section 6)';
  RAISE NOTICE 'Next step: Data migration from applications to registrations';
END $$;
