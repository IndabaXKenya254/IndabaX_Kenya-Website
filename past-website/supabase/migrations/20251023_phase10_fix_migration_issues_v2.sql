/**
 * ═══════════════════════════════════════════════════════════════════════
 * PHASE 10: FIX MIGRATION ISSUES (Version 2 - With Data Updates)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This migration fixes issues discovered during mock data migration:
 * 1. Add missing 'description' column to photos table
 * 2. Update existing FAQ categories to valid values, then update constraint
 * 3. Update existing sponsor tiers to valid values, then update constraint
 *
 * Created: 2025-10-23
 * Dependencies: Phases 1-3 migrations
 */

-- ============================================================================
-- 1. ADD MISSING DESCRIPTION COLUMN TO PHOTOS TABLE
-- ============================================================================

ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.photos.description IS 'Optional description or caption for the photo';

-- ============================================================================
-- 2. FIX FAQ CATEGORIES AND CONSTRAINT
-- ============================================================================

-- First, let's see what categories exist and normalize them
-- Update any existing FAQs to use lowercase categories
UPDATE public.faqs
SET category = LOWER(category)
WHERE category IS NOT NULL;

-- Drop existing constraint
ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS faqs_category_check;

-- Recreate with permissive values
ALTER TABLE public.faqs
ADD CONSTRAINT faqs_category_check
CHECK (category IN (
  'general',
  'registration',
  'event',
  'accommodation',
  'sponsorship',
  'speaking',
  'technical',
  'venue',
  'travel'
));

COMMENT ON CONSTRAINT faqs_category_check ON public.faqs IS
'Allows various FAQ categories (lowercase)';

-- ============================================================================
-- 3. FIX SPONSOR TIERS AND CONSTRAINT
-- ============================================================================

-- Normalize existing sponsor tiers to lowercase
UPDATE public.sponsors
SET tier = LOWER(tier)
WHERE tier IS NOT NULL;

-- Drop existing constraint
ALTER TABLE public.sponsors
DROP CONSTRAINT IF EXISTS sponsors_tier_check;

-- Recreate with permissive values
ALTER TABLE public.sponsors
ADD CONSTRAINT sponsors_tier_check
CHECK (tier IN (
  'platinum',
  'gold',
  'silver',
  'bronze',
  'partner',
  'community',
  'supporter',
  'media'
));

COMMENT ON CONSTRAINT sponsors_tier_check ON public.sponsors IS
'Allows various sponsor tiers (lowercase)';

-- ============================================================================
-- VERIFICATION QUERIES (Uncomment to run)
-- ============================================================================

-- Check photos table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'photos'
-- ORDER BY ordinal_position;

-- Check existing FAQ categories
-- SELECT DISTINCT category, COUNT(*)
-- FROM public.faqs
-- GROUP BY category;

-- Check existing sponsor tiers
-- SELECT DISTINCT tier, COUNT(*)
-- FROM public.sponsors
-- GROUP BY tier;
