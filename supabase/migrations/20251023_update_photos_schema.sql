-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - UPDATE PHOTOS TABLE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
-- Update photos table to match gallery.json format
-- Changes:
--   1. Change year from INT to VARCHAR to support string format ("2024")
--   2. Add category column for photo categorization
-- Created: 2025-10-23

-- Add category column
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';

COMMENT ON COLUMN public.photos.category IS 'Photo category (e.g., Keynotes, Workshops, Panels, Networking, Posters, Speakers, Social, Hackathon, Awards, Sponsors, Talks)';

-- Change year from INT to VARCHAR
-- Step 1: Add new column
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS year_temp VARCHAR(4);

-- Step 2: Copy data, converting INT to VARCHAR
UPDATE public.photos
SET year_temp = year::VARCHAR
WHERE year_temp IS NULL;

-- Step 3: Drop old column
ALTER TABLE public.photos
DROP COLUMN IF EXISTS year;

-- Step 4: Rename new column
ALTER TABLE public.photos
RENAME COLUMN year_temp TO year;

-- Step 5: Make it NOT NULL with default
ALTER TABLE public.photos
ALTER COLUMN year SET NOT NULL,
ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM NOW())::VARCHAR;

COMMENT ON COLUMN public.photos.year IS 'Year as string format (e.g., "2024", "2023") to match gallery.json';

-- Create index for faster filtering by year
CREATE INDEX IF NOT EXISTS idx_photos_year ON public.photos(year);

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_photos_category ON public.photos(category);

-- Verify the changes
SELECT
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'photos'
  AND column_name IN ('year', 'category')
ORDER BY ordinal_position;
