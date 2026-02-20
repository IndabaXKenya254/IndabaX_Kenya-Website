/**
 * ═══════════════════════════════════════════════════════════════════════
 * PHASE 10: FIX MIGRATION ISSUES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This migration fixes issues discovered during mock data migration:
 * 1. Add missing 'description' column to photos table
 * 2. Update FAQ category check constraint to accept mock data values
 * 3. Update sponsor tier check constraint to accept mock data values
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
-- 2. FIX FAQ CATEGORY CHECK CONSTRAINT
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS faqs_category_check;

-- Recreate with more permissive values that match mock data
ALTER TABLE public.faqs
ADD CONSTRAINT faqs_category_check
CHECK (category IN (
  'general',
  'registration',
  'event',
  'accommodation',
  'sponsorship',
  'speaking',
  'General',
  'Registration',
  'Event',
  'Accommodation',
  'Sponsorship',
  'Speaking'
));

COMMENT ON CONSTRAINT faqs_category_check ON public.faqs IS
'Allows both lowercase and capitalized FAQ categories';

-- ============================================================================
-- 3. FIX SPONSOR TIER CHECK CONSTRAINT
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.sponsors
DROP CONSTRAINT IF EXISTS sponsors_tier_check;

-- Recreate with more permissive values that match mock data
ALTER TABLE public.sponsors
ADD CONSTRAINT sponsors_tier_check
CHECK (tier IN (
  'platinum',
  'gold',
  'silver',
  'bronze',
  'partner',
  'community',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Partner',
  'Community'
));

COMMENT ON CONSTRAINT sponsors_tier_check ON public.sponsors IS
'Allows both lowercase and capitalized sponsor tiers';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check photos table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'photos'
-- ORDER BY ordinal_position;

-- Check FAQ constraint
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'faqs_category_check';

-- Check sponsor constraint
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'sponsors_tier_check';
