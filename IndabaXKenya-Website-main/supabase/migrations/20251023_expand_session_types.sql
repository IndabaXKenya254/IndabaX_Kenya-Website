-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Expand session_type constraint to include all valid types
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Support all real-world conference session types
-- Date: 2025-10-23
-- Tables: schedule_items

BEGIN;

-- Drop the old restrictive constraint
ALTER TABLE public.schedule_items
DROP CONSTRAINT IF EXISTS schedule_items_session_type_check;

-- Add new expanded constraint with all session types
ALTER TABLE public.schedule_items
ADD CONSTRAINT schedule_items_session_type_check
CHECK (
  (session_type)::text = ANY (
    ARRAY[
      'keynote'::character varying,
      'talk'::character varying,
      'workshop'::character varying,
      'panel'::character varying,
      'break'::character varying,
      'networking'::character varying,
      'registration'::character varying,
      'track'::character varying,
      'tutorial'::character varying,
      'poster'::character varying,
      'hackathon'::character varying,
      'social'::character varying,
      'special'::character varying,
      'closing'::character varying
    ]::text[]
  )
);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
-- Run this query to verify the constraint was updated:
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname = 'schedule_items_session_type_check';

-- ═══════════════════════════════════════════════════════════════════════
-- VALID SESSION TYPES (after migration)
-- ═══════════════════════════════════════════════════════════════════════
-- keynote      - Main keynote presentations
-- talk         - Regular conference talks/presentations
-- workshop     - Hands-on workshop sessions
-- panel        - Panel discussions
-- break        - Coffee breaks, lunch breaks
-- networking   - Networking sessions, mixers
-- registration - Registration and check-in
-- track        - Track sessions (parallel sessions)
-- tutorial     - Tutorial sessions
-- poster       - Poster presentations
-- hackathon    - Hackathon sessions
-- social       - Social events, receptions
-- special      - Special events, ceremonies
-- closing      - Closing sessions, final remarks

-- ═══════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════
-- BEGIN;
-- ALTER TABLE public.schedule_items DROP CONSTRAINT IF EXISTS schedule_items_session_type_check;
-- ALTER TABLE public.schedule_items
-- ADD CONSTRAINT schedule_items_session_type_check
-- CHECK (
--   (session_type)::text = ANY (
--     ARRAY['keynote', 'talk', 'workshop', 'break', 'networking']::text[]
--   )
-- );
-- COMMIT;
