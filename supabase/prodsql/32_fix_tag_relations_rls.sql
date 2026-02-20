-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix RLS policies for tag relations tables
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Ensure authenticated users can manage tag relations
-- Date: 2025-10-25
-- Risk: LOW - Only updates RLS policies

BEGIN;

-- ============================================================================
-- FIX POST TAG RELATIONS RLS
-- ============================================================================

-- Disable RLS temporarily to ensure access
ALTER TABLE public.post_tag_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view post tag relations" ON public.post_tag_relations;
DROP POLICY IF EXISTS "Admin can manage post tag relations" ON public.post_tag_relations;
DROP POLICY IF EXISTS "Public can view post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Admin can manage post tags" ON public.post_tags;

-- Re-enable RLS
ALTER TABLE public.post_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can manage post tag relations"
  ON public.post_tag_relations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view post tag relations"
  ON public.post_tag_relations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage post tags"
  ON public.post_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view post tags"
  ON public.post_tags
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- FIX EVENT TAG RELATIONS RLS
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE public.event_tag_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view event tag relations" ON public.event_tag_relations;
DROP POLICY IF EXISTS "Admin can manage event tag relations" ON public.event_tag_relations;
DROP POLICY IF EXISTS "Public can view event tags" ON public.event_tags;
DROP POLICY IF EXISTS "Admin can manage event tags" ON public.event_tags;

-- Re-enable RLS
ALTER TABLE public.event_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can manage event tag relations"
  ON public.event_tag_relations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view event tag relations"
  ON public.event_tag_relations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage event tags"
  ON public.event_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view event tags"
  ON public.event_tags
  FOR SELECT
  TO anon
  USING (true);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Check policies:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('post_tag_relations', 'post_tags', 'event_tag_relations', 'event_tags')
-- ORDER BY tablename, policyname;
