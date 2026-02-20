-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 2: CREATE TAG SYSTEM FOR EVENTS AND POSTS
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Add tagging/categorization system for events and posts
-- Dependencies: Phase 1 must be completed first
-- Risk Level: LOW - Creating new tables, no impact on existing data
-- Rollback: Can drop tables if needed
-- Execution Time: ~2 seconds
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- STEP 1: CREATE EVENT TAGS TABLES
-- ============================================================================

-- Event Tags table (master list of available tags)
CREATE TABLE IF NOT EXISTS public.event_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.event_tags IS 'Available tags for categorizing events (e.g., "AI", "Workshop", "Kenya")';
COMMENT ON COLUMN public.event_tags.name IS 'Display name of the tag';
COMMENT ON COLUMN public.event_tags.slug IS 'URL-friendly slug for the tag';

-- Event Tag Relations (Many-to-Many junction table)
CREATE TABLE IF NOT EXISTS public.event_tag_relations (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.event_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, tag_id)
);

COMMENT ON TABLE public.event_tag_relations IS 'Junction table linking events to their tags (many-to-many)';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_tag_relations_event_id
  ON public.event_tag_relations(event_id);

CREATE INDEX IF NOT EXISTS idx_event_tag_relations_tag_id
  ON public.event_tag_relations(tag_id);

-- ============================================================================
-- STEP 2: CREATE POST TAGS TABLES
-- ============================================================================

-- Post Tags table (master list of available tags)
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.post_tags IS 'Available tags for categorizing blog posts (e.g., "Announcement", "Research")';
COMMENT ON COLUMN public.post_tags.name IS 'Display name of the tag';
COMMENT ON COLUMN public.post_tags.slug IS 'URL-friendly slug for the tag';

-- Post Tag Relations (Many-to-Many junction table)
CREATE TABLE IF NOT EXISTS public.post_tag_relations (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.post_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

COMMENT ON TABLE public.post_tag_relations IS 'Junction table linking posts to their tags (many-to-many)';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_tag_relations_post_id
  ON public.post_tag_relations(post_id);

CREATE INDEX IF NOT EXISTS idx_post_tag_relations_tag_id
  ON public.post_tag_relations(tag_id);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
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

-- ============================================================================
-- STEP 4: SEED COMMON TAGS FROM MOCK DATA
-- ============================================================================

-- Seed Event Tags (extracted from mock data analysis)
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

-- Seed Post Tags (extracted from mock data analysis)
INSERT INTO public.post_tags (name, slug) VALUES
  ('Registration', 'registration'),
  ('Announcement', 'announcement'),
  ('Speakers', 'speakers'),
  ('Keynote', 'keynote'),
  ('Program', 'program'),
  ('Call for Papers', 'call-for-papers'),
  ('Research', 'research'),
  ('Deadline', 'deadline'),
  ('Workshop', 'workshop'),
  ('Sponsors', 'sponsors'),
  ('Travel', 'travel'),
  ('Venue', 'venue'),
  ('Schedule', 'schedule'),
  ('Highlights', 'highlights'),
  ('2024', '2024'),
  ('2025', '2025'),
  ('2026', '2026')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  event_tags_count INTEGER;
  post_tags_count INTEGER;
BEGIN
  -- Verify event_tags table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_tags'
  ) THEN
    RAISE EXCEPTION 'event_tags table was not created';
  END IF;

  -- Verify event_tag_relations table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_tag_relations'
  ) THEN
    RAISE EXCEPTION 'event_tag_relations table was not created';
  END IF;

  -- Verify post_tags table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'post_tags'
  ) THEN
    RAISE EXCEPTION 'post_tags table was not created';
  END IF;

  -- Verify post_tag_relations table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'post_tag_relations'
  ) THEN
    RAISE EXCEPTION 'post_tag_relations table was not created';
  END IF;

  -- Count seeded tags
  SELECT COUNT(*) INTO event_tags_count FROM public.event_tags;
  SELECT COUNT(*) INTO post_tags_count FROM public.post_tags;

  RAISE NOTICE '✅ Phase 2 Complete: Tag system created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   - event_tags (% tags seeded)', event_tags_count;
  RAISE NOTICE '   - event_tag_relations (junction table)';
  RAISE NOTICE '   - post_tags (% tags seeded)', post_tags_count;
  RAISE NOTICE '   - post_tag_relations (junction table)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies applied:';
  RAISE NOTICE '   - Public can read all tags';
  RAISE NOTICE '   - Admins can manage tags';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Indexes created for fast lookups';
END $$;

COMMIT;

-- ============================================================================
-- PHASE 2 COMPLETE ✅
-- ============================================================================
-- What was done:
--   ✅ Created event_tags and event_tag_relations tables
--   ✅ Created post_tags and post_tag_relations tables
--   ✅ Applied RLS policies (public read, admin write)
--   ✅ Created indexes for performance
--   ✅ Seeded 27 event tags from mock data
--   ✅ Seeded 17 post tags from mock data
--
-- What's next:
--   → Phase 3: Create event_speakers junction table (link events to speakers)
--   → Phase 4: Create speaker_expertise system
--
-- How to use tags:
--   -- Add tag to event:
--   INSERT INTO event_tag_relations (event_id, tag_id)
--   VALUES ('event-uuid', 'tag-uuid');
--
--   -- Get event with tags:
--   SELECT e.*, array_agg(et.name) as tags
--   FROM events e
--   LEFT JOIN event_tag_relations etr ON e.id = etr.event_id
--   LEFT JOIN event_tags et ON etr.tag_id = et.id
--   WHERE e.id = 'event-uuid'
--   GROUP BY e.id;
--
-- How to rollback (if needed):
--   DROP TABLE IF EXISTS public.event_tag_relations CASCADE;
--   DROP TABLE IF EXISTS public.event_tags CASCADE;
--   DROP TABLE IF EXISTS public.post_tag_relations CASCADE;
--   DROP TABLE IF EXISTS public.post_tags CASCADE;
-- ============================================================================
