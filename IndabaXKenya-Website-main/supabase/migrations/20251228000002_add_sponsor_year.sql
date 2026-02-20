-- ============================================================================
-- MIGRATION: Add Sponsor Year Field
-- ============================================================================
-- Created: December 28, 2025
-- Purpose: Add sponsor_year field to distinguish current vs previous sponsors
-- ============================================================================

-- Add sponsor_year column
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS sponsor_year INT;

-- Add comment
COMMENT ON COLUMN public.sponsors.sponsor_year IS 'Year the sponsor participated (e.g., 2025, 2024). NULL means unspecified.';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_sponsors_year ON public.sponsors(sponsor_year DESC);

-- Update existing sponsors to 2025
UPDATE public.sponsors
SET sponsor_year = 2025
WHERE sponsor_year IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
