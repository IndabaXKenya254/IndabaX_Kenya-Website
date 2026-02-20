-- ═══════════════════════════════════════════════════════════════════════
-- ADD LINK FIELDS TO NOAI TIMELINE MILESTONES
-- ═══════════════════════════════════════════════════════════════════════
-- Adds link_url and link_type columns to make timeline items clickable
-- Links can point to archive pages, external URLs, or internal pages
-- ═══════════════════════════════════════════════════════════════════════

-- Add link columns to existing table
ALTER TABLE noai_timeline_milestones
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_type VARCHAR(50) DEFAULT 'internal';

-- Comment explaining the link types
COMMENT ON COLUMN noai_timeline_milestones.link_url IS 'URL to navigate when milestone is clicked. Can be internal path or external URL.';
COMMENT ON COLUMN noai_timeline_milestones.link_type IS 'Type of link: internal (Next.js routing), external (new tab), archive (NOAI archive page)';

-- ═══════════════════════════════════════════════════════════════════════
-- NOAI ARCHIVES TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Stores archive pages for NOAI events/competitions
-- Each archive can have a custom slug and content

CREATE TABLE IF NOT EXISTS noai_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  year VARCHAR(20),
  description TEXT,
  featured_image TEXT,

  -- Content sections (JSONB for flexibility)
  content_sections JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE noai_archives ENABLE ROW LEVEL SECURITY;

-- Public read access for published archives
CREATE POLICY "Public can view published archives"
  ON noai_archives
  FOR SELECT
  USING (is_published = true);

-- Admin full access
CREATE POLICY "Admins can manage archives"
  ON noai_archives
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_noai_archives_slug ON noai_archives(slug);
CREATE INDEX IF NOT EXISTS idx_noai_archives_year ON noai_archives(year);
CREATE INDEX IF NOT EXISTS idx_noai_archives_published ON noai_archives(is_published) WHERE is_published = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_noai_archives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_noai_archives_updated_at ON noai_archives;
CREATE TRIGGER trigger_update_noai_archives_updated_at
  BEFORE UPDATE ON noai_archives
  FOR EACH ROW
  EXECUTE FUNCTION update_noai_archives_updated_at();

-- Insert sample archive for IOAI 2025 Beijing (Kenya's first participation)
INSERT INTO noai_archives (slug, title, subtitle, year, description, is_published, display_order)
VALUES (
  'ioai-2025-beijing',
  'IOAI 2025 - Beijing, China',
  'Kenya''s Historic First Participation',
  '2025',
  'Kenya made history by participating in the International Olympiad in Artificial Intelligence for the first time, representing East Africa on the global AI stage. Our team competed against the world''s brightest young minds in AI.',
  true,
  1
)
ON CONFLICT (slug) DO NOTHING;

-- Update the first timeline milestone to link to this archive
UPDATE noai_timeline_milestones
SET
  link_url = '/noai/archive/ioai-2025-beijing',
  link_type = 'archive'
WHERE year = '2025' AND title LIKE '%First IOAI%';
