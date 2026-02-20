-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - PERFORMANCE OPTIMIZATION MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
-- Date: December 29, 2025
-- Purpose: Add indexes, update views, optimize common queries
-- Status: APPLIED TO DATABASE
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 1. UPDATE HOMEPAGE VIEWS WITH NEW IMAGE FIELDS
-- ============================================================================

-- Drop and recreate hero settings view with background image
DROP VIEW IF EXISTS v_homepage_hero_settings;
CREATE VIEW v_homepage_hero_settings AS
SELECT
    MAX(CASE WHEN key = 'hero_title_line1' THEN value::text END) AS hero_title_line1,
    MAX(CASE WHEN key = 'hero_title_line2' THEN value::text END) AS hero_title_line2,
    MAX(CASE WHEN key = 'hero_stats' THEN value::text END) AS hero_stats,
    MAX(CASE WHEN key = 'hero_description' THEN value::text END) AS hero_description,
    MAX(CASE WHEN key = 'hero_background_image' THEN value::text END) AS hero_background_image,
    MAX(updated_at) AS last_updated
FROM settings
WHERE key IN ('hero_title_line1', 'hero_title_line2', 'hero_stats', 'hero_description', 'hero_background_image');

-- Drop and recreate about settings view with images
DROP VIEW IF EXISTS v_homepage_about_settings;
CREATE VIEW v_homepage_about_settings AS
SELECT
    MAX(CASE WHEN key = 'about_subtitle' THEN value::text END) AS about_subtitle,
    MAX(CASE WHEN key = 'about_title' THEN value::text END) AS about_title,
    MAX(CASE WHEN key = 'about_paragraphs' THEN value::text END) AS about_paragraphs,
    MAX(CASE WHEN key = 'about_image1' THEN value::text END) AS about_image1,
    MAX(CASE WHEN key = 'about_image2' THEN value::text END) AS about_image2,
    MAX(updated_at) AS last_updated
FROM settings
WHERE key IN ('about_subtitle', 'about_title', 'about_paragraphs', 'about_image1', 'about_image2');

-- ============================================================================
-- 2. CREATE DASHBOARD STATS VIEW (Optimized)
-- ============================================================================

DROP VIEW IF EXISTS v_dashboard_stats;
CREATE VIEW v_dashboard_stats AS
SELECT
    -- Event counts
    (SELECT COUNT(*) FROM events WHERE status = 'upcoming') AS upcoming_events,
    (SELECT COUNT(*) FROM events WHERE status = 'ongoing') AS ongoing_events,
    (SELECT COUNT(*) FROM events WHERE status = 'past') AS past_events,
    (SELECT COUNT(*) FROM events) AS total_events,

    -- Application counts
    (SELECT COUNT(*) FROM applications WHERE status = 'pending') AS pending_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'under_review') AS under_review_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'accepted') AS accepted_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'rejected') AS rejected_applications,
    (SELECT COUNT(*) FROM applications) AS total_applications,

    -- Registration counts
    (SELECT COUNT(*) FROM form_responses WHERE status = 'completed') AS completed_registrations,
    (SELECT COUNT(*) FROM form_responses WHERE status = 'in_progress') AS in_progress_registrations,
    (SELECT COUNT(*) FROM form_responses) AS total_registrations,

    -- User counts
    (SELECT COUNT(*) FROM user_profiles WHERE email_verified = true) AS verified_users,
    (SELECT COUNT(*) FROM user_profiles) AS total_users,

    -- Subscriber count
    (SELECT COUNT(*) FROM subscribers WHERE status = 'active') AS active_subscribers,

    -- Ticket counts
    (SELECT COUNT(*) FROM tickets WHERE status = 'active') AS active_tickets,
    (SELECT COUNT(*) FROM tickets WHERE checked_in_at IS NOT NULL) AS checked_in_tickets,

    -- Timestamp
    NOW() AS generated_at;

-- ============================================================================
-- 3. CREATE EVENT DASHBOARD VIEW (Optimized for admin)
-- ============================================================================

DROP VIEW IF EXISTS v_admin_events_summary;
CREATE VIEW v_admin_events_summary AS
SELECT
    e.id,
    e.slug,
    e.title,
    e.status,
    e.event_type,
    e.start_date,
    e.end_date,
    e.registration_enabled,
    e.registration_deadline,
    e.is_featured,
    e.created_at,
    -- Registration counts
    COALESCE(reg.total_registrations, 0) AS total_registrations,
    COALESCE(reg.completed_registrations, 0) AS completed_registrations,
    -- Application counts
    COALESCE(app.total_applications, 0) AS total_applications,
    COALESCE(app.pending_applications, 0) AS pending_applications,
    COALESCE(app.accepted_applications, 0) AS accepted_applications,
    -- Speaker count
    COALESCE(spk.speaker_count, 0) AS speaker_count
FROM events e
LEFT JOIN (
    SELECT
        event_id,
        COUNT(*) AS total_registrations,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_registrations
    FROM form_responses
    GROUP BY event_id
) reg ON e.id = reg.event_id
LEFT JOIN (
    SELECT
        event_id,
        COUNT(*) AS total_applications,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_applications,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_applications
    FROM applications
    GROUP BY event_id
) app ON e.id = app.event_id
LEFT JOIN (
    SELECT event_id, COUNT(*) AS speaker_count
    FROM event_speakers
    GROUP BY event_id
) spk ON e.id = spk.event_id
ORDER BY e.start_date DESC;

-- ============================================================================
-- 4. CREATE USER DASHBOARD VIEW (For applicant dashboard)
-- ============================================================================

DROP VIEW IF EXISTS v_user_dashboard_stats;
CREATE VIEW v_user_dashboard_stats AS
SELECT
    up.id AS user_id,
    up.email,
    up.name,
    -- Application stats
    COALESCE(app.active_applications, 0) AS active_applications,
    COALESCE(app.accepted_applications, 0) AS accepted_applications,
    COALESCE(app.pending_review, 0) AS pending_review,
    -- Registration stats
    COALESCE(reg.total_registrations, 0) AS total_registrations,
    COALESCE(reg.completed_registrations, 0) AS completed_registrations,
    -- Profile completeness (based on actual columns)
    CASE
        WHEN up.name IS NOT NULL AND up.phone IS NOT NULL AND up.organization IS NOT NULL
        THEN 100
        WHEN up.name IS NOT NULL AND up.phone IS NOT NULL
        THEN 75
        WHEN up.name IS NOT NULL
        THEN 50
        ELSE 25
    END AS profile_completeness
FROM user_profiles up
LEFT JOIN (
    SELECT
        email,
        COUNT(*) FILTER (WHERE status IN ('pending', 'under_review', 'shortlisted')) AS active_applications,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_applications,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_review
    FROM applications
    GROUP BY email
) app ON up.email = app.email
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) AS total_registrations,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_registrations
    FROM form_responses
    GROUP BY user_id
) reg ON up.id = reg.user_id;

-- ============================================================================
-- 5. CREATE PUBLIC HOMEPAGE DATA VIEW (Single query for homepage)
-- ============================================================================

DROP VIEW IF EXISTS v_homepage_data;
CREATE VIEW v_homepage_data AS
SELECT
    -- Hero section
    (SELECT value::text FROM settings WHERE key = 'hero_title_line1') AS hero_title_line1,
    (SELECT value::text FROM settings WHERE key = 'hero_title_line2') AS hero_title_line2,
    (SELECT value::text FROM settings WHERE key = 'hero_stats') AS hero_stats,
    (SELECT value::text FROM settings WHERE key = 'hero_description') AS hero_description,
    (SELECT value::text FROM settings WHERE key = 'hero_background_image') AS hero_background_image,
    -- About section
    (SELECT value::text FROM settings WHERE key = 'about_subtitle') AS about_subtitle,
    (SELECT value::text FROM settings WHERE key = 'about_title') AS about_title,
    (SELECT value::text FROM settings WHERE key = 'about_paragraphs') AS about_paragraphs,
    (SELECT value::text FROM settings WHERE key = 'about_image1') AS about_image1,
    (SELECT value::text FROM settings WHERE key = 'about_image2') AS about_image2,
    -- Counts for homepage stats
    (SELECT COUNT(*) FROM events WHERE status IN ('upcoming', 'ongoing', 'past')) AS total_events,
    (SELECT COUNT(*) FROM speakers) AS total_speakers,
    (SELECT COUNT(DISTINCT email) FROM applications) AS total_participants;

-- ============================================================================
-- 6. CREATE UPCOMING EVENTS VIEW (Optimized for public pages)
-- ============================================================================

DROP VIEW IF EXISTS v_upcoming_events;
CREATE VIEW v_upcoming_events AS
SELECT
    e.id,
    e.slug,
    e.title,
    e.description,
    e.theme,
    e.format,
    e.start_date,
    e.end_date,
    e.location,
    e.venue,
    e.featured_image,
    e.registration_enabled,
    e.registration_deadline,
    e.is_featured,
    e.event_type,
    e.status,
    -- Check if registration is open
    CASE
        WHEN e.registration_enabled = true
        AND (e.registration_deadline IS NULL OR e.registration_deadline > NOW())
        THEN true
        ELSE false
    END AS registration_open,
    -- Speaker count
    COALESCE(spk.speaker_count, 0) AS speaker_count
FROM events e
LEFT JOIN (
    SELECT event_id, COUNT(*) AS speaker_count
    FROM event_speakers
    GROUP BY event_id
) spk ON e.id = spk.event_id
WHERE e.status IN ('upcoming', 'ongoing')
ORDER BY e.start_date ASC;

-- ============================================================================
-- 7. ADD ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Settings indexes for faster key lookups
CREATE INDEX IF NOT EXISTS idx_settings_homepage_keys
ON settings(key)
WHERE key IN ('hero_title_line1', 'hero_title_line2', 'hero_stats', 'hero_description',
              'hero_background_image', 'about_subtitle', 'about_title', 'about_paragraphs',
              'about_image1', 'about_image2');

-- Form responses index for user dashboard
CREATE INDEX IF NOT EXISTS idx_form_responses_user_status_event
ON form_responses(user_id, status, event_id);

-- Applications index for dashboard stats
CREATE INDEX IF NOT EXISTS idx_applications_email_status
ON applications(email, status);

-- Events index for public listing
CREATE INDEX IF NOT EXISTS idx_events_public_listing
ON events(status, start_date DESC)
WHERE status IN ('upcoming', 'ongoing', 'past');

-- Tickets index for check-in queries
CREATE INDEX IF NOT EXISTS idx_tickets_checkin_lookup
ON tickets(qr_code_data, event_id)
WHERE status = 'active';

-- ============================================================================
-- 8. CREATE MATERIALIZED VIEW FOR HEAVY STATS (refresh periodically)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_site_statistics;
CREATE MATERIALIZED VIEW mv_site_statistics AS
SELECT
    (SELECT COUNT(*) FROM events) AS total_events,
    (SELECT COUNT(*) FROM events WHERE status = 'upcoming') AS upcoming_events,
    (SELECT COUNT(*) FROM speakers) AS total_speakers,
    (SELECT COUNT(*) FROM speakers WHERE is_featured = true) AS featured_speakers,
    (SELECT COUNT(*) FROM team_members WHERE is_active = true) AS team_members,
    (SELECT COUNT(*) FROM photos) AS total_photos,
    (SELECT COUNT(*) FROM posts WHERE status = 'published') AS published_posts,
    (SELECT COUNT(*) FROM subscribers WHERE status = 'active') AS subscribers,
    (SELECT COUNT(DISTINCT email) FROM applications) AS unique_applicants,
    (SELECT COUNT(*) FROM form_responses WHERE status = 'completed') AS completed_registrations,
    NOW() AS last_refreshed;

-- Create unique index on materialized view (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_site_statistics_unique ON mv_site_statistics(last_refreshed);

-- ============================================================================
-- 9. CREATE FUNCTION TO REFRESH MATERIALIZED VIEW
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_site_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_site_statistics;
END;
$$;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Public views (readable by anon and authenticated)
GRANT SELECT ON v_homepage_hero_settings TO anon, authenticated;
GRANT SELECT ON v_homepage_about_settings TO anon, authenticated;
GRANT SELECT ON v_homepage_data TO anon, authenticated;
GRANT SELECT ON v_upcoming_events TO anon, authenticated;
GRANT SELECT ON mv_site_statistics TO anon, authenticated;

-- Admin views (authenticated only)
GRANT SELECT ON v_dashboard_stats TO authenticated;
GRANT SELECT ON v_admin_events_summary TO authenticated;
GRANT SELECT ON v_user_dashboard_stats TO authenticated;

-- ============================================================================
-- 11. UPDATE RLS POLICY FOR PUBLIC HOMEPAGE SETTINGS ACCESS
-- ============================================================================

-- Allow public access to homepage-related settings keys
DROP POLICY IF EXISTS "Public view specific settings" ON settings;

CREATE POLICY "Public view specific settings" ON settings
FOR SELECT
TO public
USING (
  key IN (
    -- Existing keys
    'popup', 'site_info', 'banner', 'banner_settings',
    -- Hero section
    'hero_title_line1', 'hero_title_line2', 'hero_stats', 'hero_description', 'hero_background_image',
    -- About section
    'about_subtitle', 'about_title', 'about_paragraphs', 'about_image1', 'about_image2',
    -- Social and contact
    'social_links', 'contact_info',
    -- Site settings
    'site_name', 'site_logo', 'current_year'
  )
);

-- ============================================================================
-- DONE - All migrations applied successfully
-- ============================================================================
