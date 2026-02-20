-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Add fields that exist in mock data but missing in database
-- Risk Level: LOW - Only adding columns, no data loss
-- Rollback: Can drop columns if needed
-- Execution Time: < 1 second
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- STEP 1: EVENTS TABLE - Add excerpt field
-- ============================================================================

-- Add excerpt for event previews/cards
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS excerpt TEXT;

COMMENT ON COLUMN public.events.excerpt IS 'Short summary for event cards and previews (1-2 sentences)';

-- ============================================================================
-- STEP 2: POSTS TABLE - Add featured flag and author display fields
-- ============================================================================

-- Add is_featured flag
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add author display fields (for posts without auth user)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS author_image TEXT;

COMMENT ON COLUMN public.posts.is_featured IS 'Whether post appears in featured/highlighted sections';
COMMENT ON COLUMN public.posts.author_name IS 'Display name for post author (when not auth user)';
COMMENT ON COLUMN public.posts.author_image IS 'Avatar/photo URL for post author';

-- ============================================================================
-- STEP 3: SPEAKERS TABLE - Add country field
-- ============================================================================

-- Add country field for speaker location
ALTER TABLE public.speakers
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

COMMENT ON COLUMN public.speakers.country IS 'Speaker country/location (e.g., "Kenya", "Nigeria")';

-- ============================================================================
-- STEP 4: PHOTOS TABLE - Add photo_date field
-- ============================================================================

-- Add photo_date for sorting and display
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS photo_date DATE;

COMMENT ON COLUMN public.photos.photo_date IS 'Date photo was taken (for sorting and display)';

-- ============================================================================
-- STEP 5: SPONSORS TABLE - Add description and update tier constraint
-- ============================================================================

-- Add description field
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.sponsors.description IS 'Sponsor description or sponsorship level details';

-- Update tier constraint to include 'organizer' (for Deep Learning Indaba)
ALTER TABLE public.sponsors
DROP CONSTRAINT IF EXISTS sponsors_tier_check;

ALTER TABLE public.sponsors
ADD CONSTRAINT sponsors_tier_check
CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'organizer'));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify events.excerpt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'excerpt'
  ) THEN
    RAISE EXCEPTION 'events.excerpt column was not created';
  END IF;

  -- Verify posts.is_featured
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'is_featured'
  ) THEN
    RAISE EXCEPTION 'posts.is_featured column was not created';
  END IF;

  -- Verify posts.author_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'author_name'
  ) THEN
    RAISE EXCEPTION 'posts.author_name column was not created';
  END IF;

  -- Verify speakers.country
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'speakers' AND column_name = 'country'
  ) THEN
    RAISE EXCEPTION 'speakers.country column was not created';
  END IF;

  -- Verify photos.photo_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'photos' AND column_name = 'photo_date'
  ) THEN
    RAISE EXCEPTION 'photos.photo_date column was not created';
  END IF;

  -- Verify sponsors.description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sponsors' AND column_name = 'description'
  ) THEN
    RAISE EXCEPTION 'sponsors.description column was not created';
  END IF;

  RAISE NOTICE '✅ Phase 1 Complete: All new columns added successfully!';
  RAISE NOTICE '   - events.excerpt';
  RAISE NOTICE '   - posts.is_featured';
  RAISE NOTICE '   - posts.author_name';
  RAISE NOTICE '   - posts.author_image';
  RAISE NOTICE '   - speakers.country';
  RAISE NOTICE '   - photos.photo_date';
  RAISE NOTICE '   - sponsors.description';
  RAISE NOTICE '   - sponsors tier constraint updated (added "organizer")';
END $$;

COMMIT;

-- ============================================================================
-- PHASE 1 COMPLETE ✅
-- ============================================================================
-- What was done:
--   ✅ Added 8 missing columns to 5 tables
--   ✅ Updated sponsors tier constraint
--   ✅ Added documentation comments
--   ✅ Verification checks passed
--
-- What's next:
--   → Phase 2: Create tag tables (event_tags, post_tags)
--   → Phase 3: Create relationship tables (event_speakers, speaker_expertise)
--
-- How to rollback (if needed):
--   ALTER TABLE public.events DROP COLUMN IF EXISTS excerpt;
--   ALTER TABLE public.posts DROP COLUMN IF EXISTS is_featured;
--   ALTER TABLE public.posts DROP COLUMN IF EXISTS author_name;
--   ALTER TABLE public.posts DROP COLUMN IF EXISTS author_image;
--   ALTER TABLE public.speakers DROP COLUMN IF EXISTS country;
--   ALTER TABLE public.photos DROP COLUMN IF EXISTS photo_date;
--   ALTER TABLE public.sponsors DROP COLUMN IF EXISTS description;
-- ============================================================================
