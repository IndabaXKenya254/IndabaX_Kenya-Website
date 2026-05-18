-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 3: CREATE RELATIONSHIP TABLES (EVENT-SPEAKERS & SPEAKER EXPERTISE)
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Link events to speakers and speakers to expertise areas
-- Dependencies: Phase 1 and Phase 2 must be completed first
-- Risk Level: LOW - Creating new tables, no impact on existing data
-- Rollback: Can drop tables if needed
-- Execution Time: ~2 seconds
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- STEP 1: CREATE EVENT-SPEAKERS RELATIONSHIP (MANY-TO-MANY)
-- ============================================================================

-- Event Speakers Junction Table
-- Links events to their speakers (one event can have many speakers,
-- one speaker can appear at many events)
CREATE TABLE IF NOT EXISTS public.event_speakers (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, speaker_id)
);

COMMENT ON TABLE public.event_speakers IS 'Junction table linking events to speakers (many-to-many)';
COMMENT ON COLUMN public.event_speakers.display_order IS 'Order to display speakers for this event (0 = first)';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id
  ON public.event_speakers(event_id);

CREATE INDEX IF NOT EXISTS idx_event_speakers_speaker_id
  ON public.event_speakers(speaker_id);

-- ============================================================================
-- STEP 2: CREATE SPEAKER EXPERTISE SYSTEM
-- ============================================================================

-- Speaker Expertise table (master list of expertise areas)
CREATE TABLE IF NOT EXISTS public.speaker_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.speaker_expertise IS 'Available expertise areas/skills for speakers (e.g., "NLP", "Computer Vision")';
COMMENT ON COLUMN public.speaker_expertise.name IS 'Display name of the expertise area';
COMMENT ON COLUMN public.speaker_expertise.slug IS 'URL-friendly slug for the expertise';

-- Speaker Expertise Relations (Many-to-Many junction table)
CREATE TABLE IF NOT EXISTS public.speaker_expertise_relations (
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  expertise_id UUID NOT NULL REFERENCES public.speaker_expertise(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (speaker_id, expertise_id)
);

COMMENT ON TABLE public.speaker_expertise_relations IS 'Junction table linking speakers to their expertise areas (many-to-many)';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_speaker_expertise_relations_speaker_id
  ON public.speaker_expertise_relations(speaker_id);

CREATE INDEX IF NOT EXISTS idx_speaker_expertise_relations_expertise_id
  ON public.speaker_expertise_relations(expertise_id);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

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
-- STEP 4: SEED SPEAKER EXPERTISE FROM MOCK DATA
-- ============================================================================

-- Seed Speaker Expertise areas (extracted from mock data analysis)
-- These are the most common expertise areas from speakers.json
INSERT INTO public.speaker_expertise (name, slug) VALUES
  -- Core AI/ML
  ('NLP', 'nlp'),
  ('Natural Language Processing', 'natural-language-processing'),
  ('Computer Vision', 'computer-vision'),
  ('Deep Learning', 'deep-learning'),
  ('Machine Learning', 'machine-learning'),
  ('Reinforcement Learning', 'reinforcement-learning'),
  ('Machine Translation', 'machine-translation'),

  -- African Context
  ('African Languages', 'african-languages'),
  ('Multilingual NLP', 'multilingual-nlp'),
  ('Low-Resource ML', 'low-resource-ml'),

  -- Domain Applications
  ('AgriTech', 'agritech'),
  ('FinTech', 'fintech'),
  ('Healthcare AI', 'healthcare-ai'),
  ('EdTech', 'edtech'),
  ('Climate Tech', 'climate-tech'),
  ('Conservation Tech', 'conservation-tech'),

  -- Healthcare & Medical
  ('Medical Imaging', 'medical-imaging'),
  ('Diagnostics', 'diagnostics'),
  ('Bioinformatics', 'bioinformatics'),
  ('Genomics', 'genomics'),
  ('Disease Research', 'disease-research'),
  ('Healthcare ML', 'healthcare-ml'),

  -- Technical Skills
  ('ML Engineering', 'ml-engineering'),
  ('Data Science', 'data-science'),
  ('Analytics', 'analytics'),
  ('Fraud Detection', 'fraud-detection'),
  ('Speech Recognition', 'speech-recognition'),
  ('TTS', 'tts'),
  ('Algorithms', 'algorithms'),
  ('Optimization', 'optimization'),

  -- Specialized Areas
  ('AI Ethics', 'ai-ethics'),
  ('AI Safety', 'ai-safety'),
  ('Policy', 'policy'),
  ('Governance', 'governance'),
  ('Robotics', 'robotics'),
  ('Automation', 'automation'),
  ('Quantum Computing', 'quantum-computing'),
  ('Federated Learning', 'federated-learning'),
  ('Privacy', 'privacy'),

  -- Business & Product
  ('Product Management', 'product-management'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Supply Chain', 'supply-chain'),
  ('Logistics', 'logistics'),

  -- Industry Sectors
  ('Manufacturing', 'manufacturing'),
  ('Telecommunications', 'telecommunications'),
  ('Energy', 'energy'),
  ('Grid Optimization', 'grid-optimization'),

  -- Technical Approaches
  ('Predictive Modeling', 'predictive-modeling'),
  ('Remote Sensing', 'remote-sensing'),
  ('Adaptive Learning', 'adaptive-learning'),
  ('Offline-first', 'offline-first'),
  ('Cultural AI', 'cultural-ai'),
  ('Inclusive Tech', 'inclusive-tech'),

  -- Social Impact
  ('AI for Good', 'ai-for-good'),
  ('Wildlife Monitoring', 'wildlife-monitoring'),
  ('Community Building', 'community-building'),
  ('Mentorship', 'mentorship'),
  ('Talent Development', 'talent-development'),
  ('Alignment', 'alignment'),
  ('Global Perspectives', 'global-perspectives'),

  -- UI/UX
  ('User Experience', 'user-experience')

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  expertise_count INTEGER;
BEGIN
  -- Verify event_speakers table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_speakers'
  ) THEN
    RAISE EXCEPTION 'event_speakers table was not created';
  END IF;

  -- Verify speaker_expertise table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'speaker_expertise'
  ) THEN
    RAISE EXCEPTION 'speaker_expertise table was not created';
  END IF;

  -- Verify speaker_expertise_relations table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'speaker_expertise_relations'
  ) THEN
    RAISE EXCEPTION 'speaker_expertise_relations table was not created';
  END IF;

  -- Count seeded expertise areas
  SELECT COUNT(*) INTO expertise_count FROM public.speaker_expertise;

  RAISE NOTICE '✅ Phase 3 Complete: Relationship tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   - event_speakers (links events to speakers)';
  RAISE NOTICE '   - speaker_expertise (% expertise areas seeded)', expertise_count;
  RAISE NOTICE '   - speaker_expertise_relations (links speakers to expertise)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies applied:';
  RAISE NOTICE '   - Public can read all relationships';
  RAISE NOTICE '   - Admins can manage relationships';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Indexes created for fast lookups';
END $$;

COMMIT;

-- ============================================================================
-- PHASE 3 COMPLETE ✅
-- ============================================================================
-- What was done:
--   ✅ Created event_speakers junction table (events ↔ speakers)
--   ✅ Created speaker_expertise and speaker_expertise_relations tables
--   ✅ Applied RLS policies (public read, admin write)
--   ✅ Created indexes for performance
--   ✅ Seeded 60+ expertise areas from mock data
--
-- What's next:
--   → Phase 4: Update API layer to use new tables
--   → Phase 5: Migrate mock data to database
--
-- Example Usage:
--
-- 1. Link a speaker to an event:
--    INSERT INTO event_speakers (event_id, speaker_id, display_order)
--    VALUES ('event-uuid', 'speaker-uuid', 0);
--
-- 2. Get all speakers for an event:
--    SELECT s.*
--    FROM speakers s
--    JOIN event_speakers es ON s.id = es.speaker_id
--    WHERE es.event_id = 'event-uuid'
--    ORDER BY es.display_order;
--
-- 3. Add expertise to a speaker:
--    INSERT INTO speaker_expertise_relations (speaker_id, expertise_id)
--    SELECT 'speaker-uuid', id FROM speaker_expertise WHERE name = 'NLP';
--
-- 4. Get speaker with expertise:
--    SELECT s.*, array_agg(se.name) as expertise
--    FROM speakers s
--    LEFT JOIN speaker_expertise_relations ser ON s.id = ser.speaker_id
--    LEFT JOIN speaker_expertise se ON ser.expertise_id = se.id
--    WHERE s.id = 'speaker-uuid'
--    GROUP BY s.id;
--
-- 5. Find speakers by expertise:
--    SELECT s.*
--    FROM speakers s
--    JOIN speaker_expertise_relations ser ON s.id = ser.speaker_id
--    JOIN speaker_expertise se ON ser.expertise_id = se.id
--    WHERE se.slug = 'nlp';
--
-- How to rollback (if needed):
--   DROP TABLE IF EXISTS public.speaker_expertise_relations CASCADE;
--   DROP TABLE IF EXISTS public.speaker_expertise CASCADE;
--   DROP TABLE IF EXISTS public.event_speakers CASCADE;
-- ============================================================================
