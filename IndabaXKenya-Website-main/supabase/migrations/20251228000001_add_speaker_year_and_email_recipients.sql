-- ============================================================================
-- MIGRATION: Add Speaker Year Field & Email Recipients Table
-- ============================================================================
-- Created: December 28, 2025
-- Purpose:
--   1. Add speaker_year field to distinguish current vs previous year speakers
--   2. Create email_recipients table for CC/BCC email management
-- ============================================================================

-- ============================================================================
-- PART 1: ADD SPEAKER_YEAR FIELD TO SPEAKERS TABLE
-- ============================================================================
-- This allows distinguishing between current year speakers and past speakers
-- Example: 2025 speakers vs 2024 speakers vs earlier

-- Add speaker_year column (nullable, defaults to current year for new entries)
ALTER TABLE public.speakers
ADD COLUMN IF NOT EXISTS speaker_year INT;

-- Add comment explaining the field
COMMENT ON COLUMN public.speakers.speaker_year IS 'Year the speaker participated (e.g., 2025, 2024). NULL means unspecified/legacy speaker.';

-- Create index for efficient filtering by year
CREATE INDEX IF NOT EXISTS idx_speakers_year ON public.speakers(speaker_year DESC);

-- Update existing speakers to have 2025 as their year (assuming they are current)
-- You may want to manually adjust this based on actual data
UPDATE public.speakers
SET speaker_year = 2025
WHERE speaker_year IS NULL;

-- ============================================================================
-- PART 2: CREATE EMAIL_RECIPIENTS TABLE FOR CC/BCC MANAGEMENT
-- ============================================================================
-- This table stores email addresses that should receive CC/BCC copies
-- of all system emails (applications, notifications, etc.)

CREATE TABLE IF NOT EXISTS public.email_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Email information
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255), -- Optional display name

  -- Type: CC or BCC
  recipient_type VARCHAR(10) NOT NULL DEFAULT 'cc'
    CHECK (recipient_type IN ('cc', 'bcc')),

  -- Category: Which types of emails to include this recipient
  -- 'all' = all emails, 'applications' = only application emails, etc.
  email_category VARCHAR(50) NOT NULL DEFAULT 'all'
    CHECK (email_category IN ('all', 'applications', 'registrations', 'notifications', 'support')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure no duplicate email+type+category combinations
  UNIQUE(email, recipient_type, email_category)
);

-- Add comments
COMMENT ON TABLE public.email_recipients IS 'Email addresses to CC/BCC on system emails for team tracking';
COMMENT ON COLUMN public.email_recipients.recipient_type IS 'cc = carbon copy (visible), bcc = blind carbon copy (hidden)';
COMMENT ON COLUMN public.email_recipients.email_category IS 'Category of emails: all, applications, registrations, notifications, support';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON public.email_recipients(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_recipients_type ON public.email_recipients(recipient_type);
CREATE INDEX IF NOT EXISTS idx_email_recipients_category ON public.email_recipients(email_category);

-- Enable RLS
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage email recipients
CREATE POLICY "Admin full access to email_recipients"
  ON public.email_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_email_recipients_updated_at
    BEFORE UPDATE ON public.email_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Add default CC recipients (adjust emails as needed)
-- ============================================================================
-- INSERT INTO public.email_recipients (email, name, recipient_type, email_category, is_active)
-- VALUES
--   ('team@indabaxkenya.org', 'IndabaX Team', 'cc', 'all', true),
--   ('applications@indabaxkenya.org', 'Applications Team', 'cc', 'applications', true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
