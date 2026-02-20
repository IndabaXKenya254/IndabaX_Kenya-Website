-- ═══════════════════════════════════════════════════════════════════════
-- ADD FOREIGN KEY AND INDEX FOR form_templates.created_by
-- ═══════════════════════════════════════════════════════════════════════
-- Created: 2024-12-16
-- Purpose: Add missing FK constraint and index for better performance and data integrity

-- Drop existing constraint if it exists (without the proper name)
DO $$
BEGIN
  -- Try to drop any existing unnamed constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%form_templates_created_by%'
    AND table_name = 'form_templates'
  ) THEN
    ALTER TABLE public.form_templates
    DROP CONSTRAINT IF EXISTS form_templates_created_by_fkey CASCADE;
  END IF;
END $$;

-- Add the foreign key constraint with explicit name
ALTER TABLE public.form_templates
  DROP CONSTRAINT IF EXISTS form_templates_created_by_fkey CASCADE;

ALTER TABLE public.form_templates
  ADD CONSTRAINT form_templates_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.user_profiles(id)
  ON DELETE CASCADE;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_form_templates_created_by
  ON public.form_templates(created_by);

-- Add comment
COMMENT ON CONSTRAINT form_templates_created_by_fkey ON public.form_templates
  IS 'Links form template to the user who created it';

-- Verify the constraint was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'form_templates_created_by_fkey'
    AND table_name = 'form_templates'
  ) THEN
    RAISE EXCEPTION 'Failed to create foreign key constraint';
  END IF;

  RAISE NOTICE 'Foreign key constraint form_templates_created_by_fkey created successfully';
END $$;
