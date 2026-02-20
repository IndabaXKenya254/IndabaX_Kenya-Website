-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - MOCK DATA COMPATIBILITY MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Add missing fields and tables to match mock data structure
-- Created: 2025-10-23
-- Reference: See MOCK_DATA_VALIDATION_REPORT.md for full details
--
-- This migration ensures database schema matches mock data structure,
-- allowing seamless migration from JSON files to database.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- EVENTS table updates
-- Add excerpt field for event previews/cards
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS excerpt TEXT;

COMMENT ON COLUMN public.events.excerpt IS 'Short summary for event cards and previews (1-2 sentences)';

-- POSTS table updates
-- Add is_featured flag, author display fields
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS author_image TEXT;

COMMENT ON COLUMN public.posts.is_featured IS 'Whether post appears in featured/highlighted sections';
COMMENT ON COLUMN public.posts.author_name IS 'Display name for post author (when not auth user)';
COMMENT ON COLUMN public.posts.author_image IS 'Avatar/photo URL for post author';

-- SPEAKERS table updates
-- Add country field for speaker location
ALTER TABLE public.speakers
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

COMMENT ON COLUMN public.speakers.country IS 'Speaker country/location';

-- PHOTOS table updates
-- Add photo_date for sorting and display
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS photo_date DATE;

COMMENT ON COLUMN public.photos.photo_date IS 'Date photo was taken (for sorting and display)';

-- SPONSORS table updates
-- Add description and update tier constraint to include 'organizer'
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.sponsors.description IS 'Sponsor description or sponsorship level details';

-- Update sponsors tier constraint to include 'organizer'
ALTER TABLE public.sponsors
DROP CONSTRAINT IF EXISTS sponsors_tier_check;

ALTER TABLE public.sponsors
ADD CONSTRAINT sponsors_tier_check
CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'organizer'));

-- ============================================================================
-- SECTION 2: CREATE TAG TABLES FOR EVENTS AND POSTS
-- ============================================================================

-- Event Tags table
CREATE TABLE IF NOT EXISTS public.event_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.event_tags IS 'Available tags for categorizing events';

-- Event Tag Relations (Many-to-Many junction)
CREATE TABLE IF NOT EXISTS public.event_tag_relations (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.event_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, tag_id)
);

COMMENT ON TABLE public.event_tag_relations IS 'Junction table linking events to tags';

-- Create indexes for tag lookups
CREATE INDEX IF NOT EXISTS idx_event_tag_relations_event_id ON public.event_tag_relations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tag_relations_tag_id ON public.event_tag_relations(tag_id);

-- Post Tags table
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.post_tags IS 'Available tags for categorizing blog posts';

-- Post Tag Relations (Many-to-Many junction)
CREATE TABLE IF NOT EXISTS public.post_tag_relations (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.post_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

COMMENT ON TABLE public.post_tag_relations IS 'Junction table linking posts to tags';

-- Create indexes for tag lookups
CREATE INDEX IF NOT EXISTS idx_post_tag_relations_post_id ON public.post_tag_relations(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tag_relations_tag_id ON public.post_tag_relations(tag_id);

-- ============================================================================
-- SECTION 3: CREATE EVENT-SPEAKER RELATIONSHIP (MANY-TO-MANY)
-- ============================================================================

-- Event Speakers Junction Table
CREATE TABLE IF NOT EXISTS public.event_speakers (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, speaker_id)
);

COMMENT ON TABLE public.event_speakers IS 'Junction table linking events to speakers (many-to-many)';
COMMENT ON COLUMN public.event_speakers.display_order IS 'Order to display speakers for this event';

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON public.event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_speaker_id ON public.event_speakers(speaker_id);

-- ============================================================================
-- SECTION 4: CREATE SPEAKER EXPERTISE SYSTEM
-- ============================================================================

-- Speaker Expertise table
CREATE TABLE IF NOT EXISTS public.speaker_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.speaker_expertise IS 'Available expertise areas/skills for speakers';

-- Speaker Expertise Relations (Many-to-Many junction)
CREATE TABLE IF NOT EXISTS public.speaker_expertise_relations (
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE,
  expertise_id UUID REFERENCES public.speaker_expertise(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (speaker_id, expertise_id)
);

COMMENT ON TABLE public.speaker_expertise_relations IS 'Junction table linking speakers to their expertise areas';

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_speaker_expertise_relations_speaker_id ON public.speaker_expertise_relations(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_expertise_relations_expertise_id ON public.speaker_expertise_relations(expertise_id);

-- ============================================================================
-- SECTION 5: SEED COMMON TAGS FROM MOCK DATA
-- ============================================================================

-- Seed Event Tags (from mock data analysis)
INSERT INTO public.event_tags (name, slug) VALUES
  ('AI', 'ai'),
  ('Machine Learning', 'machine-learning'),
  ('Conference', 'conference'),
  ('Kenya', 'kenya'),
  ('Africa', 'africa'),
  ('Workshop', 'workshop'),
  ('NOAI', 'noai'),
  ('Training', 'training'),
  ('Hands-on', 'hands-on'),
  ('ML', 'ml'),
  ('Healthcare', 'healthcare'),
  ('Medical AI', 'medical-ai'),
  ('Symposium', 'symposium'),
  ('Health-Tech', 'health-tech'),
  ('Women in AI', 'women-in-ai'),
  ('Diversity', 'diversity'),
  ('Networking', 'networking'),
  ('Mentorship', 'mentorship'),
  ('Startups', 'startups'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Pitch Competition', 'pitch-competition'),
  ('Investment', 'investment'),
  ('Past Event', 'past-event'),
  ('IndabaX', 'indabax'),
  ('2024', '2024'),
  ('2023', '2023'),
  ('2026', '2026')
ON CONFLICT (name) DO NOTHING;

-- Seed Post Tags (from mock data analysis)
INSERT INTO public.post_tags (name, slug) VALUES
  ('Registration', 'registration'),
  ('Announcement', 'announcement'),
  ('Speakers', 'speakers'),
  ('Keynote', 'keynote'),
  ('Program', 'program'),
  ('Call for Papers', 'call-for-papers'),
  ('Research', 'research'),
  ('Deadline', 'deadline'),
  ('2024', '2024'),
  ('2026', '2026')
ON CONFLICT (name) DO NOTHING;

-- Seed Speaker Expertise (from mock data analysis)
INSERT INTO public.speaker_expertise (name, slug) VALUES
  ('NLP', 'nlp'),
  ('African Languages', 'african-languages'),
  ('Machine Translation', 'machine-translation'),
  ('Computer Vision', 'computer-vision'),
  ('AgriTech', 'agritech'),
  ('Deep Learning', 'deep-learning'),
  ('AI Ethics', 'ai-ethics'),
  ('Policy', 'policy'),
  ('Governance', 'governance'),
  ('Fraud Detection', 'fraud-detection'),
  ('FinTech', 'fintech'),
  ('ML Engineering', 'ml-engineering'),
  ('Healthcare AI', 'healthcare-ai'),
  ('Medical Imaging', 'medical-imaging'),
  ('Diagnostics', 'diagnostics'),
  ('Data Science', 'data-science'),
  ('Analytics', 'analytics'),
  ('Telecommunications', 'telecommunications'),
  ('EdTech', 'edtech'),
  ('Adaptive Learning', 'adaptive-learning'),
  ('AI for Good', 'ai-for-good'),
  ('Robotics', 'robotics'),
  ('Automation', 'automation'),
  ('Manufacturing', 'manufacturing'),
  ('Climate Tech', 'climate-tech'),
  ('Predictive Modeling', 'predictive-modeling'),
  ('Remote Sensing', 'remote-sensing'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Supply Chain', 'supply-chain'),
  ('Logistics', 'logistics'),
  ('Cultural AI', 'cultural-ai'),
  ('Inclusive Tech', 'inclusive-tech'),
  ('Quantum Computing', 'quantum-computing'),
  ('Algorithms', 'algorithms'),
  ('Optimization', 'optimization'),
  ('Product Management', 'product-management'),
  ('Offline-first', 'offline-first'),
  ('User Experience', 'user-experience'),
  ('Speech Recognition', 'speech-recognition'),
  ('TTS', 'tts'),
  ('Multilingual NLP', 'multilingual-nlp'),
  ('Conservation Tech', 'conservation-tech'),
  ('Wildlife Monitoring', 'wildlife-monitoring'),
  ('Reinforcement Learning', 'reinforcement-learning'),
  ('Energy', 'energy'),
  ('Grid Optimization', 'grid-optimization'),
  ('Community Building', 'community-building'),
  ('Mentorship', 'mentorship'),
  ('Talent Development', 'talent-development'),
  ('Bioinformatics', 'bioinformatics'),
  ('Genomics', 'genomics'),
  ('Disease Research', 'disease-research'),
  ('AI Safety', 'ai-safety'),
  ('Alignment', 'alignment'),
  ('Global Perspectives', 'global-perspectives'),
  ('Federated Learning', 'federated-learning'),
  ('Privacy', 'privacy'),
  ('Healthcare ML', 'healthcare-ml')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 6: UPDATE RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Event Tags - Public read, admin write
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event tags"
ON public.event_tags FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage event tags"
ON public.event_tags FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Event Tag Relations - Public read, admin write
ALTER TABLE public.event_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event tag relations"
ON public.event_tag_relations FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage event tag relations"
ON public.event_tag_relations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Post Tags - Public read, admin write
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view post tags"
ON public.post_tags FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage post tags"
ON public.post_tags FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Post Tag Relations - Public read, admin write
ALTER TABLE public.post_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view post tag relations"
ON public.post_tag_relations FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage post tag relations"
ON public.post_tag_relations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Event Speakers - Public read, admin write
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event speakers"
ON public.event_speakers FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage event speakers"
ON public.event_speakers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Speaker Expertise - Public read, admin write
ALTER TABLE public.speaker_expertise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view speaker expertise"
ON public.speaker_expertise FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage speaker expertise"
ON public.speaker_expertise FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Speaker Expertise Relations - Public read, admin write
ALTER TABLE public.speaker_expertise_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view speaker expertise relations"
ON public.speaker_expertise_relations FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin can manage speaker expertise relations"
ON public.speaker_expertise_relations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'excerpt'
  ), 'events.excerpt column not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_featured'
  ), 'posts.is_featured column not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speakers' AND column_name = 'country'
  ), 'speakers.country column not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'photo_date'
  ), 'photos.photo_date column not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsors' AND column_name = 'description'
  ), 'sponsors.description column not created';

  RAISE NOTICE 'All new columns created successfully!';
END $$;

-- Verify new tables exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_tags'
  ), 'event_tags table not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_speakers'
  ), 'event_speakers table not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'speaker_expertise'
  ), 'speaker_expertise table not created';

  RAISE NOTICE 'All new tables created successfully!';
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update API layer to map field names (see MOCK_DATA_VALIDATION_REPORT.md)
-- 3. Create data import script to migrate mock data to database
-- 4. Test all frontend components with database data
-- ============================================================================
