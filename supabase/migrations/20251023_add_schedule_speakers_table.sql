-- ═══════════════════════════════════════════════════════════════════════
-- ADD SCHEDULE_SPEAKERS JUNCTION TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Create missing schedule_speakers table for schedule-speaker relationships
-- Issue: API expects schedule_speakers junction table but it doesn't exist in schema
-- Risk Level: LOW - Creating new table, no impact on existing data
-- Rollback: DROP TABLE IF EXISTS public.schedule_speakers CASCADE;
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- STEP 1: CREATE SCHEDULE_SPEAKERS JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_speakers (
  schedule_item_id UUID NOT NULL REFERENCES public.schedule_items(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (schedule_item_id, speaker_id)
);

COMMENT ON TABLE public.schedule_speakers IS 'Junction table linking schedule items to speakers (many-to-many)';
COMMENT ON COLUMN public.schedule_speakers.display_order IS 'Order to display speakers for this schedule item (0 = first)';

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_schedule_speakers_schedule_item
  ON public.schedule_speakers(schedule_item_id);

CREATE INDEX IF NOT EXISTS idx_schedule_speakers_speaker
  ON public.schedule_speakers(speaker_id);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.schedule_speakers ENABLE ROW LEVEL SECURITY;

-- Public can view schedule speakers
CREATE POLICY "Public can view schedule speakers"
  ON public.schedule_speakers FOR SELECT
  TO public
  USING (true);

-- Admin can manage schedule speakers
CREATE POLICY "Admin can manage schedule speakers"
  ON public.schedule_speakers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 4: MIGRATE EXISTING DATA (if any)
-- ============================================================================

-- If there's existing data in schedule_items.speaker_ids array,
-- migrate it to the junction table
DO $$
DECLARE
  schedule_record RECORD;
  speaker_uuid UUID;
BEGIN
  -- Loop through all schedule items that have speaker_ids
  FOR schedule_record IN
    SELECT id, speaker_ids
    FROM public.schedule_items
    WHERE speaker_ids IS NOT NULL AND array_length(speaker_ids, 1) > 0
  LOOP
    -- Loop through each speaker_id in the array
    FOREACH speaker_uuid IN ARRAY schedule_record.speaker_ids
    LOOP
      -- Insert into junction table (ignore if already exists)
      INSERT INTO public.schedule_speakers (schedule_item_id, speaker_id)
      VALUES (schedule_record.id, speaker_uuid)
      ON CONFLICT (schedule_item_id, speaker_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Migrated speaker_ids from schedule_items to schedule_speakers junction table';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  row_count INTEGER;
BEGIN
  -- Verify table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schedule_speakers'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'schedule_speakers table was not created';
  END IF;

  -- Count migrated rows
  SELECT COUNT(*) INTO row_count FROM public.schedule_speakers;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Schedule Speakers Table Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Table: schedule_speakers';
  RAISE NOTICE '   - Purpose: Links schedule items to speakers (many-to-many)';
  RAISE NOTICE '   - Rows migrated: %', row_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '   - Public can view schedule speakers';
  RAISE NOTICE '   - Admins can manage schedule speakers';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Indexes created for fast lookups';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: speaker_ids column in schedule_items is now deprecated';
  RAISE NOTICE '   Use schedule_speakers junction table instead';
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================
-- What was done:
--   ✅ Created schedule_speakers junction table
--   ✅ Applied RLS policies (public read, admin write)
--   ✅ Created indexes for performance
--   ✅ Migrated existing data from speaker_ids array
--
-- Example Usage:
--
-- 1. Add speaker to schedule item:
--    INSERT INTO schedule_speakers (schedule_item_id, speaker_id, display_order)
--    VALUES ('schedule-uuid', 'speaker-uuid', 0);
--
-- 2. Get all speakers for a schedule item:
--    SELECT s.*
--    FROM speakers s
--    JOIN schedule_speakers ss ON s.id = ss.speaker_id
--    WHERE ss.schedule_item_id = 'schedule-uuid'
--    ORDER BY ss.display_order;
--
-- 3. Query used by API:
--    SELECT *,
--           event:events(id, title),
--           speakers:schedule_speakers(speaker:speakers(id, name))
--    FROM schedule_items
--    ORDER BY day_number, start_time;
--
-- How to rollback:
--   DROP TABLE IF EXISTS public.schedule_speakers CASCADE;
-- ============================================================================
