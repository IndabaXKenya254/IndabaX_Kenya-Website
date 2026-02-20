-- ═══════════════════════════════════════════════════════════════════════
-- ADD UNIQUE CONSTRAINTS TO APPLICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Prevent duplicate submissions for the same event
-- Created: Day 3 - Unique email/phone validation

-- Add unique constraint: email + event_id + application_type
-- This prevents the same person from:
-- - Registering twice for the same event
-- - Submitting multiple CFP for the same event with the same email
CREATE UNIQUE INDEX IF NOT EXISTS applications_email_event_type_unique
  ON public.applications (email, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid), application_type);

-- Add unique constraint: phone + event_id + application_type (if phone is provided)
-- This prevents the same phone number from being used multiple times for the same event
CREATE UNIQUE INDEX IF NOT EXISTS applications_phone_event_type_unique
  ON public.applications (phone, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid), application_type)
  WHERE phone IS NOT NULL;

-- Note: We use COALESCE to handle NULL event_id (when no specific event is selected)
-- This ensures uniqueness even when event_id is NULL
