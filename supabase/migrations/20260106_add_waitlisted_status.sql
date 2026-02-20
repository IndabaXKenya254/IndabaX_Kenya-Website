-- ═══════════════════════════════════════════════════════════════════════
-- ADD WAITLISTED STATUS TO registration_status_v2 ENUM
-- ═══════════════════════════════════════════════════════════════════════
-- Created: 2026-01-06
-- Purpose: Add 'waitlisted' status for applications that are on the waitlist
-- ═══════════════════════════════════════════════════════════════════════

-- Add 'waitlisted' to the registration_status_v2 enum
-- PostgreSQL allows adding new values to existing enums
ALTER TYPE registration_status_v2 ADD VALUE IF NOT EXISTS 'waitlisted' AFTER 'rejected';

-- Add columns for tracking waitlist decisions
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS waitlisted_by UUID REFERENCES auth.users(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN form_responses.waitlisted_by IS 'Admin who moved application to waitlist';
COMMENT ON COLUMN form_responses.waitlisted_at IS 'Timestamp when application was waitlisted';

-- Create index for waitlisted applications
CREATE INDEX IF NOT EXISTS idx_form_responses_waitlisted
ON form_responses(event_id, status_v2)
WHERE status_v2 = 'waitlisted';
