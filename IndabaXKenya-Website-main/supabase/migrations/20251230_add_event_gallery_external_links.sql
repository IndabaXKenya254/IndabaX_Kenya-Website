-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Add gallery_link and external_link fields to events
-- ═══════════════════════════════════════════════════════════════════════
-- Date: December 30, 2025
-- Purpose: Add fields to store Google Drive gallery links and external
--          article/awards links for events
-- ═══════════════════════════════════════════════════════════════════════

-- Add gallery_link column for Google Drive photo gallery links
ALTER TABLE events
ADD COLUMN IF NOT EXISTS gallery_link TEXT;

COMMENT ON COLUMN events.gallery_link IS 'Google Drive or external link to full photo gallery';

-- Add external_link column for external articles/awards pages
ALTER TABLE events
ADD COLUMN IF NOT EXISTS external_link TEXT;

COMMENT ON COLUMN events.external_link IS 'External link to articles, awards, or related pages';

-- Add external_link_label column for customizing the button text
ALTER TABLE events
ADD COLUMN IF NOT EXISTS external_link_label VARCHAR(100);

COMMENT ON COLUMN events.external_link_label IS 'Label for the external link button (e.g., "Awards & Highlights")';

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE: Add data for 2024 event
-- ═══════════════════════════════════════════════════════════════════════

-- Update IndabaX Kenya 2024 with external link
UPDATE events
SET
  external_link = 'https://www.dkut.ac.ke/index.php/deep-learning-indabax-awards-2024',
  external_link_label = 'Awards & Highlights'
WHERE slug = 'indabax-kenya-2024';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('gallery_link', 'external_link', 'external_link_label');
