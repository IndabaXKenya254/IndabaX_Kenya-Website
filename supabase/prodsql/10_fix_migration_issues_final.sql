/**
 * ═══════════════════════════════════════════════════════════════════════
 * PHASE 10: FIX MIGRATION ISSUES (Version 4 - Include "organizer" tier)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This migration fixes issues discovered during mock data migration:
 * 1. Add missing 'description' column to photos table
 * 2. Drop constraints, update data, recreate constraints
 * 3. Include "organizer" tier for sponsors
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
-- 2. FIX FAQ CATEGORIES (DROP CONSTRAINT FIRST)
-- ============================================================================

-- Drop existing constraint to allow updates
ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS faqs_category_check;

-- Normalize all existing FAQs to lowercase
UPDATE public.faqs
SET category = LOWER(TRIM(category))
WHERE category IS NOT NULL;

-- Recreate constraint with all possible values
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
  'travel',
  'program',
  'networking'
));

-- ============================================================================
-- 3. FIX SPONSOR TIERS (DROP CONSTRAINT FIRST)
-- ============================================================================

-- Drop existing constraint to allow updates
ALTER TABLE public.sponsors
DROP CONSTRAINT IF EXISTS sponsors_tier_check;

-- Normalize all existing sponsor tiers to lowercase
UPDATE public.sponsors
SET tier = LOWER(TRIM(tier))
WHERE tier IS NOT NULL;

-- Recreate constraint with all possible values INCLUDING "organizer"
ALTER TABLE public.sponsors
ADD CONSTRAINT sponsors_tier_check
CHECK (tier IN (
  'platinum',
  'gold',
  'silver',
  'bronze',
  'organizer',
  'partner',
  'community',
  'supporter',
  'media',
  'academic',
  'institutional'
));

COMMENT ON CONSTRAINT sponsors_tier_check ON public.sponsors IS
'Allows various sponsor tiers: platinum, gold, silver, bronze, organizer, partner, community, supporter, media, academic, institutional';

-- ============================================================================
-- DONE
-- ============================================================================
