-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 7: EMAIL SYSTEM - ENHANCE EXISTING EMAIL TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- Enhances existing email_templates and email_logs tables with additional columns

-- ═══════════════════════════════════════════════════════════════════════
-- ENHANCE: email_templates
-- ═══════════════════════════════════════════════════════════════════════

-- Add description column (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_templates'
                 AND column_name = 'description') THEN
    ALTER TABLE public.email_templates ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add category column (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_templates'
                 AND column_name = 'category') THEN
    ALTER TABLE public.email_templates ADD COLUMN category VARCHAR(100);
  END IF;
END $$;

-- Add is_system column (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_templates'
                 AND column_name = 'is_system') THEN
    ALTER TABLE public.email_templates ADD COLUMN is_system BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update existing data: set category from type (only if column exists and has NULL values)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'email_templates'
             AND column_name = 'category') THEN
    UPDATE public.email_templates
    SET category = type
    WHERE category IS NULL AND type IS NOT NULL;
  END IF;
END $$;

-- Update index
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);

COMMENT ON COLUMN public.email_templates.description IS 'Description of when to use this template';
COMMENT ON COLUMN public.email_templates.category IS 'Template category: application, survey, ticketing, general';
COMMENT ON COLUMN public.email_templates.is_system IS 'System templates cannot be deleted (used by automated flows)';

-- ═══════════════════════════════════════════════════════════════════════
-- ENHANCE: email_logs
-- ═══════════════════════════════════════════════════════════════════════

-- Add template_id reference (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'template_id') THEN
    ALTER TABLE public.email_logs ADD COLUMN template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add recipient_name (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'recipient_name') THEN
    ALTER TABLE public.email_logs ADD COLUMN recipient_name VARCHAR(255);
  END IF;
END $$;

-- Add variables_used (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'variables_used') THEN
    ALTER TABLE public.email_logs ADD COLUMN variables_used JSONB;
  END IF;
END $$;

-- Add sent_by (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'sent_by') THEN
    ALTER TABLE public.email_logs ADD COLUMN sent_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add event_id reference (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'event_id') THEN
    ALTER TABLE public.email_logs ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add registration_id reference (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'registration_id') THEN
    ALTER TABLE public.email_logs ADD COLUMN registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Rename to_email to recipient_email if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'email_logs'
             AND column_name = 'to_email') THEN
    ALTER TABLE public.email_logs RENAME COLUMN to_email TO recipient_email;
  END IF;
END $$;

-- Add updated_at column (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'email_logs'
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.email_logs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON public.email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON public.email_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_id ON public.email_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_registration_id ON public.email_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);

COMMENT ON COLUMN public.email_logs.template_id IS 'Template used (NULL if sent without template)';
COMMENT ON COLUMN public.email_logs.recipient_name IS 'Recipient name if available';
COMMENT ON COLUMN public.email_logs.variables_used IS 'Key-value pairs of variables used: {"applicant_name": "John Doe"}';
COMMENT ON COLUMN public.email_logs.sent_by IS 'Admin who sent (NULL for automated emails)';
COMMENT ON COLUMN public.email_logs.event_id IS 'Related event (if applicable)';
COMMENT ON COLUMN public.email_logs.registration_id IS 'Related registration (if applicable)';

-- ═══════════════════════════════════════════════════════════════════════
-- ADD TRIGGER FOR email_logs.updated_at
-- ═══════════════════════════════════════════════════════════════════════

-- Trigger already exists for email_templates from main migration
-- Add for email_logs
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Update email_templates policies to allow reading for template selection
-- (Already has "Admins can manage email templates" policy, keep it)

-- Update email_logs policy to allow service role inserts
-- (Already has policies from main migration)

-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA: UPDATE SYSTEM TEMPLATES WITH NEW STRUCTURE
-- ═══════════════════════════════════════════════════════════════════════

-- Update existing templates to mark as system and add categories
UPDATE public.email_templates
SET
  is_system = TRUE,
  category = 'application',
  description = 'Sent automatically when a user registers for an event'
WHERE type = 'verification' AND is_system IS NULL;

-- Note: If no templates exist yet, we'll seed them via the API after Phase 7 implementation

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Email Tables Enhancement Complete!';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Tables enhanced: 2 (email_templates, email_logs)';
  RAISE NOTICE 'Columns added: 9';
  RAISE NOTICE 'Indexes created: 6';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Ready for Phase 7 implementation!';
END $$;
