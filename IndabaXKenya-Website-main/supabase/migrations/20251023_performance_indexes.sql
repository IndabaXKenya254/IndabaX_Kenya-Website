-- ═══════════════════════════════════════════════════════════════════════
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- ═══════════════════════════════════════════════════════════════════════
-- Created: 2025-10-23
-- Purpose: Add indexes for frequently queried fields to improve query performance
--
-- Expected Impact:
-- - 50-80% faster query times
-- - Better performance as database grows
-- - Reduced database load
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM events WHERE status='published' AND event_type='upcoming' ORDER BY start_date
CREATE INDEX IF NOT EXISTS idx_events_status_type
ON events(status, event_type)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_events_start_date
ON events(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_featured
ON events(is_featured)
WHERE is_featured = true AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_events_slug
ON events(slug);

-- ============================================================================
-- POSTS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM posts WHERE status='published' ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_status_published
ON posts(status, published_at DESC)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_posts_category
ON posts(category)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_posts_slug
ON posts(slug);

-- ============================================================================
-- SPEAKERS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM speakers WHERE is_featured=true ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_speakers_featured_order
ON speakers(is_featured, display_order)
WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_speakers_display_order
ON speakers(display_order);

-- ============================================================================
-- FAQS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM faqs WHERE is_active=true AND category='X' ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_faqs_active_category
ON faqs(is_active, category, display_order)
WHERE is_active = true;

-- ============================================================================
-- SPONSORS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM sponsors WHERE is_active=true ORDER BY tier, display_order
CREATE INDEX IF NOT EXISTS idx_sponsors_active_tier
ON sponsors(is_active, tier, display_order)
WHERE is_active = true;

-- ============================================================================
-- PHOTOS TABLE INDEXES
-- ============================================================================
-- Most common query: SELECT * FROM photos WHERE year=2024 ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_photos_year
ON photos(year, display_order);

CREATE INDEX IF NOT EXISTS idx_photos_featured
ON photos(is_featured)
WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_photos_event_id
ON photos(event_id)
WHERE event_id IS NOT NULL;

-- ============================================================================
-- TEAM_MEMBERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_team_members_active_order
ON team_members(is_active, display_order)
WHERE is_active = true;

-- ============================================================================
-- SCHEDULE_ITEMS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_schedule_items_event_day
ON schedule_items(event_id, day_number, start_time);

-- ============================================================================
-- APPLICATIONS TABLE INDEXES
-- ============================================================================
-- Most common query for admin: SELECT * FROM applications WHERE status='pending' ORDER BY submitted_at DESC
CREATE INDEX IF NOT EXISTS idx_applications_status_submitted
ON applications(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_event_id
ON applications(event_id)
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_type
ON applications(application_type);

-- ============================================================================
-- SUBSCRIBERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscribers_email
ON subscribers(email)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscribers_status
ON subscribers(status);

-- ============================================================================
-- CONTACT_SUBMISSIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contact_status_created
ON contact_submissions(status, created_at DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify indexes were created:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
