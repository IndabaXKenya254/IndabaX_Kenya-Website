-- ═══════════════════════════════════════════════════════════════════════
-- NOAI TIMELINE MILESTONES TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Stores Kenya's IOAI journey timeline milestones for the NOAI page
-- Editable via admin panel
-- ═══════════════════════════════════════════════════════════════════════

-- Create the table
CREATE TABLE IF NOT EXISTS noai_timeline_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200) NOT NULL,
  date VARCHAR(100) NOT NULL,
  icon VARCHAR(100) DEFAULT 'icofont-calendar',
  description TEXT NOT NULL,
  highlight VARCHAR(100),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE noai_timeline_milestones ENABLE ROW LEVEL SECURITY;

-- Public read access for published milestones
CREATE POLICY "Public can view published milestones"
  ON noai_timeline_milestones
  FOR SELECT
  USING (is_published = true);

-- Admin full access (authenticated users)
CREATE POLICY "Admins can manage milestones"
  ON noai_timeline_milestones
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create index for ordering
CREATE INDEX idx_noai_timeline_display_order ON noai_timeline_milestones(display_order);

-- Insert default milestone data
INSERT INTO noai_timeline_milestones (year, title, subtitle, date, icon, description, highlight, display_order, is_published) VALUES
  ('2025', 'Kenya''s First IOAI Participation', '2nd IOAI - Beijing, China', 'August 2, 2025', 'icofont-flag-alt-2', 'Kenya made history by participating in the International Olympiad in Artificial Intelligence for the first time, representing East Africa on the global AI stage.', 'Historic Debut', 1, true),
  ('2025/26', 'Round One Examination', 'NOAI Selection Process', 'December 17, 2025', 'icofont-paper', 'First round of the National Olympiad for AI. Open to all eligible Kenyan students interested in representing Kenya at IOAI 2026.', NULL, 2, true),
  ('2025/26', 'Round Two Examination', 'NOAI Selection Process', 'December 22, 2025', 'icofont-chart-line-alt', 'Second round for shortlisted candidates from Round One. Advanced problem-solving and AI concepts assessment.', NULL, 3, true),
  ('2026', 'Final Team Training', 'Intensive Preparation', 'January - July 2026', 'icofont-graduate', 'Selected team members undergo rigorous training in machine learning, natural language processing, computer vision, and AI problem-solving.', '6 Months', 4, true),
  ('2026', '3rd IOAI - Abu Dhabi', 'International Competition', 'August 2-9, 2026', 'icofont-trophy', 'Kenya''s team competes at the 3rd International Olympiad in Artificial Intelligence in Abu Dhabi, UAE.', NULL, 5, true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_noai_timeline_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_noai_timeline_milestones_updated_at
  BEFORE UPDATE ON noai_timeline_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_noai_timeline_milestones_updated_at();
