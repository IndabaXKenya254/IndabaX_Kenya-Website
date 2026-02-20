-- ═══════════════════════════════════════════════════════════════════════
-- ADD RATING COLUMN TO PAPERS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251222_add_rating_to_papers
-- Date: December 22, 2025
--
-- Issue Fixed:
--   ERROR: column papers.rating does not exist (42703)
--   Root cause: Frontend code expects rating column for paper reviews
--
-- Solution:
--   Add rating column (1-5 stars) to papers table for review scores
-- ═══════════════════════════════════════════════════════════════════════

-- Add rating column to papers table
ALTER TABLE public.papers
ADD COLUMN IF NOT EXISTS rating INTEGER;

-- Add constraint to ensure rating is between 1 and 5
ALTER TABLE public.papers
ADD CONSTRAINT IF NOT EXISTS papers_rating_range
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Add comment
COMMENT ON COLUMN public.papers.rating IS
'Paper review rating (1-5 stars). NULL if not yet rated.
1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
-- Check column was added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'papers' AND column_name = 'rating';

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
