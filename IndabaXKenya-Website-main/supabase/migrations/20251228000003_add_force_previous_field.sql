-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Add force_previous field to speakers and sponsors
-- Created: December 28, 2025
-- Purpose: Allow manual override to show speakers/sponsors as "previous"
--          regardless of their year field value
-- ═══════════════════════════════════════════════════════════════════════

-- Add force_previous to speakers table
ALTER TABLE public.speakers
ADD COLUMN IF NOT EXISTS force_previous BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.speakers.force_previous IS
'When TRUE, this speaker shows as "previous/past" in UI regardless of speaker_year value. Use to prep for new year before Jan 1st.';

-- Add force_previous to sponsors table
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS force_previous BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.sponsors.force_previous IS
'When TRUE, this sponsor shows as "previous/past" in UI regardless of sponsor_year value. Use to prep for new year before Jan 1st.';

-- Set all existing speakers to force_previous = true (prep for 2026)
UPDATE public.speakers SET force_previous = TRUE WHERE force_previous IS NULL OR force_previous = FALSE;

-- Set all existing sponsors to force_previous = true (prep for 2026)
UPDATE public.sponsors SET force_previous = TRUE WHERE force_previous IS NULL OR force_previous = FALSE;
