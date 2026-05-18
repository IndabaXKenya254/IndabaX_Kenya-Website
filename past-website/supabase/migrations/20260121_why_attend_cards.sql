-- ═══════════════════════════════════════════════════════════════════════
-- WHY ATTEND CARDS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Issue #44: Backend-managed "Why Choose IndabaX Kenya" section

-- Create the why_attend_cards table
CREATE TABLE IF NOT EXISTS why_attend_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon VARCHAR(100) NOT NULL DEFAULT 'icofont-star',
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#006700',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_why_attend_cards_sort ON why_attend_cards(sort_order);
CREATE INDEX IF NOT EXISTS idx_why_attend_cards_active ON why_attend_cards(is_active);

-- Enable RLS
ALTER TABLE why_attend_cards ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read active cards)
CREATE POLICY "Anyone can read active why_attend cards"
  ON why_attend_cards FOR SELECT
  USING (is_active = true);

-- Admin full access policy
CREATE POLICY "Admins can manage why_attend cards"
  ON why_attend_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert default data from the existing JSON
INSERT INTO why_attend_cards (icon, title, description, color, sort_order) VALUES
  ('icofont-users-alt-4', 'World-Class Speakers', 'Learn from 50+ leading AI researchers and practitioners from across Africa and around the globe. Get insights from experts at Google, Microsoft, DeepMind, and top African universities.', '#FF2D55', 1),
  ('icofont-certificate', 'Hands-On Workshops', 'Participate in 10+ practical workshops covering deep learning, NLP, computer vision, and AI deployment. Gain skills you can immediately apply to your projects.', '#00ACEE', 2),
  ('icofont-network', 'Networking Opportunities', 'Connect with 500+ attendees from 20+ countries. Build lasting relationships with researchers, students, entrepreneurs, and industry professionals in African AI.', '#FFA500', 3),
  ('icofont-ui-file', 'Research Presentations', 'Discover cutting-edge AI research from African scholars. Present your own work and get feedback from peers. 30+ technical paper presentations across multiple tracks.', '#9C27B0', 4),
  ('icofont-rocket-alt-2', 'Startup & Career Expo', 'Explore opportunities at Africa''s leading AI startups and tech companies. Attend the pitch competition with $20,000 in prizes. Access exclusive job postings.', '#4CAF50', 5),
  ('icofont-certificate-alt-1', 'Certificate of Attendance', 'Receive an official IndabaX Kenya certificate to showcase your participation in Africa''s premier AI conference. Enhance your professional profile.', '#FF6B6B', 6)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_why_attend_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_why_attend_cards_updated_at ON why_attend_cards;
CREATE TRIGGER trigger_why_attend_cards_updated_at
  BEFORE UPDATE ON why_attend_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_why_attend_cards_updated_at();

-- Add comment for documentation
COMMENT ON TABLE why_attend_cards IS 'Stores the "Why Choose IndabaX Kenya" cards displayed on the homepage';
