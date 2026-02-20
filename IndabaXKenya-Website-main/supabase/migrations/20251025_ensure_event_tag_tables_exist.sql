-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Ensure event tag tables exist
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Verify and recreate event_tag_relations table if missing
-- Date: 2025-10-25
-- Risk: LOW - Creates table only if it doesn't exist

BEGIN;

-- ============================================================================
-- CREATE EVENT TAGS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.event_tags IS 'Available tags for categorizing events';

-- ============================================================================
-- CREATE EVENT TAG RELATIONS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_tag_relations (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.event_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, tag_id)
);

COMMENT ON TABLE public.event_tag_relations IS 'Junction table linking events to their tags (many-to-many)';

-- ============================================================================
-- CREATE INDEXES (if not exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_tag_relations_event_id
  ON public.event_tag_relations(event_id);

CREATE INDEX IF NOT EXISTS idx_event_tag_relations_tag_id
  ON public.event_tag_relations(tag_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tag_relations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view event tags" ON public.event_tags;
DROP POLICY IF EXISTS "Admin can manage event tags" ON public.event_tags;
DROP POLICY IF EXISTS "Public can view event tag relations" ON public.event_tag_relations;
DROP POLICY IF EXISTS "Admin can manage event tag relations" ON public.event_tag_relations;

-- Event Tags - Public read, admin write
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
CREATE POLICY "Public can view event tag relations"
  ON public.event_tag_relations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage event tag relations"
  ON public.event_tag_relations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Run these queries to verify:
--
-- 1. Check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('event_tags', 'event_tag_relations');
--
-- 2. Check columns:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'event_tag_relations';
--
-- 3. Check policies:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('event_tags', 'event_tag_relations');
