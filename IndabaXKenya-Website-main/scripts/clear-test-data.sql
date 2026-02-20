-- ═══════════════════════════════════════════════════════════════════════
-- CLEAR ALL TEST DATA (Keep admin_roles)
-- ═══════════════════════════════════════════════════════════════════════
-- This script clears all tables EXCEPT admin_roles to start fresh testing
-- Tables are cleared in order to respect foreign key constraints
-- Updated to match actual database schema
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- ============================================================================
-- STEP 1: Clear relationship/junction tables first (they reference other tables)
-- ============================================================================

TRUNCATE TABLE public.event_speakers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.event_tag_relations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.post_tag_relations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.speaker_expertise_relations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.schedule_speakers RESTART IDENTITY CASCADE;

-- ============================================================================
-- STEP 2: Clear child tables (tables that reference events, posts, speakers, etc.)
-- ============================================================================

TRUNCATE TABLE public.schedule_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.applications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.photos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.contact_submissions RESTART IDENTITY CASCADE;

-- ============================================================================
-- STEP 3: Clear main content tables
-- ============================================================================

TRUNCATE TABLE public.events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.posts RESTART IDENTITY CASCADE;

-- ============================================================================
-- STEP 4: Clear supporting/reference tables
-- ============================================================================

TRUNCATE TABLE public.speakers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sponsors RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.event_tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.post_tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.speaker_expertise RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.faqs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.team_members RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.subscribers RESTART IDENTITY CASCADE;

-- ============================================================================
-- STEP 5: Clear settings (optional - you may want to keep some settings)
-- ============================================================================

-- Uncomment to clear settings
-- TRUNCATE TABLE public.settings RESTART IDENTITY CASCADE;

-- Uncomment to clear static content
-- TRUNCATE TABLE public.static_content RESTART IDENTITY CASCADE;

-- ============================================================================
-- STEP 6: Keep admin_roles (DO NOT CLEAR)
-- ============================================================================

-- admin_roles table is NOT cleared - your admin access remains intact

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- ============================================================================
-- VERIFICATION: Check row counts
-- ============================================================================

SELECT
  'events' as table_name, COUNT(*) as row_count FROM public.events
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts
UNION ALL
SELECT 'speakers', COUNT(*) FROM public.speakers
UNION ALL
SELECT 'sponsors', COUNT(*) FROM public.sponsors
UNION ALL
SELECT 'event_tags', COUNT(*) FROM public.event_tags
UNION ALL
SELECT 'post_tags', COUNT(*) FROM public.post_tags
UNION ALL
SELECT 'speaker_expertise', COUNT(*) FROM public.speaker_expertise
UNION ALL
SELECT 'faqs', COUNT(*) FROM public.faqs
UNION ALL
SELECT 'team_members', COUNT(*) FROM public.team_members
UNION ALL
SELECT 'subscribers', COUNT(*) FROM public.subscribers
UNION ALL
SELECT 'applications', COUNT(*) FROM public.applications
UNION ALL
SELECT 'photos', COUNT(*) FROM public.photos
UNION ALL
SELECT 'schedule_items', COUNT(*) FROM public.schedule_items
UNION ALL
SELECT 'event_speakers', COUNT(*) FROM public.event_speakers
UNION ALL
SELECT 'schedule_speakers', COUNT(*) FROM public.schedule_speakers
UNION ALL
SELECT 'admin_roles', COUNT(*) FROM public.admin_roles
ORDER BY table_name;
