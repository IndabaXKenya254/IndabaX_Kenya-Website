-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix posts category constraint
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Update category check constraint to include 'blog' and 'event'
-- Date: 2025-10-25
-- Risk: LOW - Only updates constraint, no data loss

BEGIN;

-- Drop old constraint
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_category_check;

-- Add new constraint with all 5 categories
ALTER TABLE public.posts
ADD CONSTRAINT posts_category_check CHECK (
  category IN ('news', 'announcement', 'article', 'blog', 'event')
);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Check constraint:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_category_check';
