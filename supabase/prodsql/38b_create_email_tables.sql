-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #38b: CREATE EMAIL TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Create email_templates and email_logs tables for email system
-- Run Order: AFTER 38_email_verification_tokens.sql
--            BEFORE 39_enhance_email_tables.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CREATE EMAIL_TEMPLATES TABLE
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 2. CREATE EMAIL_LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email details
  from_email VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL, -- Changed from to_email to match dev
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

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

-- email_templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON public.email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON public.email_templates(created_at);

-- email_logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CREATE RLS POLICIES - EMAIL_TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
DROP POLICY IF EXISTS "Service can insert email logs" ON email_logs;
DROP POLICY IF EXISTS "Admins can update email logs" ON email_logs;

-- Admins can manage all email templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

-- All authenticated users can view templates (for selection)
CREATE POLICY "Authenticated users can view email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. CREATE RLS POLICIES - EMAIL_LOGS
-- ═══════════════════════════════════════════════════════════════════════

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

-- Service role can insert email logs (for automated emails)
CREATE POLICY "Service can insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update email logs (for status updates)
CREATE POLICY "Admins can update email logs"
  ON email_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #38b: Email Tables Created';
  RAISE NOTICE '   Tables: email_templates, email_logs';
  RAISE NOTICE '   Indexes: 7 indexes created';
  RAISE NOTICE '   RLS: Enabled with 5 policies';
  RAISE NOTICE '   Triggers: updated_at trigger added';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run migration 39 to enhance these tables';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
