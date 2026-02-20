-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - ADD UPDATED_AT TO TEAM_MEMBERS
-- ═══════════════════════════════════════════════════════════════════════
-- Adds updated_at column and trigger to team_members table
-- Created: 2025-10-24

-- ============================================================================
-- 1. ADD UPDATED_AT COLUMN
-- ============================================================================

-- Add updated_at column if it doesn't exist
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set initial value for existing rows
UPDATE public.team_members
SET updated_at = created_at
WHERE updated_at IS NULL;

-- ============================================================================
-- 2. CREATE TRIGGER FUNCTION FOR AUTO-UPDATE
-- ============================================================================

-- Create or replace the generic updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ADD TRIGGER TO TEAM_MEMBERS TABLE
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. VERIFY SETUP
-- ============================================================================

-- Check if column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'team_members'
  AND column_name = 'updated_at';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'team_members'
  AND trigger_name = 'update_team_members_updated_at';

-- Show sample data
SELECT id, name, role, created_at, updated_at
FROM public.team_members
LIMIT 5;
