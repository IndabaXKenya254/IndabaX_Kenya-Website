-- ============================================================================
-- MIGRATION: Add Registration Fields to Events Table
-- ============================================================================
-- Created: 2025-10-24
-- Description: Add max_attendees and registration_url columns to events table
-- ============================================================================

-- Add max_attendees column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS max_attendees INTEGER;

COMMENT ON COLUMN public.events.max_attendees IS 'Maximum number of attendees for the event';

-- Add registration_url column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS registration_url TEXT;

COMMENT ON COLUMN public.events.registration_url IS 'URL for event registration page';

-- Add validation constraint for max_attendees (must be positive if provided)
ALTER TABLE public.events
ADD CONSTRAINT check_max_attendees_positive
CHECK (max_attendees IS NULL OR max_attendees > 0);

-- Add validation constraint for registration_url (must be valid URL format if provided)
-- Note: This is a basic check, actual URL validation should be done in application layer
ALTER TABLE public.events
ADD CONSTRAINT check_registration_url_format
CHECK (
  registration_url IS NULL OR
  registration_url = '' OR
  registration_url ~* '^https?://'
);

-- Update existing rows to have NULL for these new columns (they're already NULL by default)
-- This is just for documentation purposes
-- UPDATE public.events SET max_attendees = NULL WHERE max_attendees IS NULL;
-- UPDATE public.events SET registration_url = NULL WHERE registration_url IS NULL;
