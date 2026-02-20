-- ═══════════════════════════════════════════════════════════════════════
-- HOMEPAGE SETTINGS VIEWS AND INDEXES
-- Created: December 29, 2025
-- Purpose: Optimize homepage settings queries with views for easy access
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- VIEW: Homepage Hero Settings
-- Aggregates hero section settings into a single row for easy querying
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS v_homepage_hero_settings;
CREATE VIEW v_homepage_hero_settings AS
SELECT
  MAX(CASE WHEN key = 'hero_title_line1' THEN value::text END) AS hero_title_line1,
  MAX(CASE WHEN key = 'hero_title_line2' THEN value::text END) AS hero_title_line2,
  MAX(CASE WHEN key = 'hero_stats' THEN value::text END) AS hero_stats,
  MAX(CASE WHEN key = 'hero_description' THEN value::text END) AS hero_description,
  MAX(updated_at) AS last_updated
FROM settings
WHERE key IN ('hero_title_line1', 'hero_title_line2', 'hero_stats', 'hero_description');

-- ═══════════════════════════════════════════════════════════════════════
-- VIEW: Homepage About Settings
-- Aggregates about section settings into a single row
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS v_homepage_about_settings;
CREATE VIEW v_homepage_about_settings AS
SELECT
  MAX(CASE WHEN key = 'about_subtitle' THEN value::text END) AS about_subtitle,
  MAX(CASE WHEN key = 'about_title' THEN value::text END) AS about_title,
  MAX(CASE WHEN key = 'about_paragraphs' THEN value::text END) AS about_paragraphs,
  MAX(updated_at) AS last_updated
FROM settings
WHERE key IN ('about_subtitle', 'about_title', 'about_paragraphs');

-- ═══════════════════════════════════════════════════════════════════════
-- VIEW: Banner Settings (parsed from JSON)
-- Extracts banner configuration from the JSON stored in settings
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS v_banner_settings;
CREATE VIEW v_banner_settings AS
SELECT
  value->>'eventTitle' AS event_title,
  value->>'eventSubtitle' AS event_subtitle,
  value->>'eventLocation' AS event_location,
  value->>'eventDate' AS event_date,
  value->>'eventEndDate' AS event_end_date,
  (value->>'showCountdown')::boolean AS show_countdown,
  (value->>'showVideo')::boolean AS show_video,
  value->>'videoUrl' AS video_url,
  value->>'registrationUrl' AS registration_url,
  value->>'submitPaperUrl' AS submit_paper_url,
  updated_at AS last_updated
FROM settings
WHERE key = 'banner';

-- ═══════════════════════════════════════════════════════════════════════
-- VIEW: Popup Settings (parsed from JSON)
-- Extracts popup configuration from the JSON stored in settings
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS v_popup_settings;
CREATE VIEW v_popup_settings AS
SELECT
  (value->>'enabled')::boolean AS enabled,
  value->>'title' AS title,
  value->>'content' AS content,
  (value->>'delay')::integer AS delay_seconds,
  value->>'buttonText' AS button_text,
  value->>'buttonLink' AS button_link,
  value->'highlights' AS highlights,
  updated_at AS last_updated
FROM settings
WHERE key = 'popup';

-- ═══════════════════════════════════════════════════════════════════════
-- VIEW: All Site Settings (flattened)
-- Single row with all commonly accessed site settings
-- ═══════════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS v_site_settings;
CREATE VIEW v_site_settings AS
SELECT
  MAX(CASE WHEN key = 'site_name' THEN value::text END) AS site_name,
  MAX(CASE WHEN key = 'site_description' THEN value::text END) AS site_description,
  MAX(CASE WHEN key = 'site_keywords' THEN value::text END) AS site_keywords,
  MAX(CASE WHEN key = 'site_logo_url' THEN value::text END) AS site_logo_url,
  MAX(CASE WHEN key = 'contact_email' THEN value::text END) AS contact_email,
  MAX(CASE WHEN key = 'contact_phone' THEN value::text END) AS contact_phone,
  MAX(CASE WHEN key = 'contact_address' THEN value::text END) AS contact_address,
  MAX(CASE WHEN key = 'social_twitter' THEN value::text END) AS social_twitter,
  MAX(CASE WHEN key = 'social_linkedin' THEN value::text END) AS social_linkedin,
  MAX(CASE WHEN key = 'social_facebook' THEN value::text END) AS social_facebook,
  MAX(CASE WHEN key = 'social_instagram' THEN value::text END) AS social_instagram,
  MAX(CASE WHEN key = 'social_youtube' THEN value::text END) AS social_youtube,
  MAX(CASE WHEN key = 'social_github' THEN value::text END) AS social_github,
  MAX(CASE WHEN key = 'registration_popup_enabled' THEN value::text END) AS registration_popup_enabled,
  MAX(CASE WHEN key = 'site_maintenance_mode' THEN value::text END) AS site_maintenance_mode,
  MAX(CASE WHEN key = 'newsletter_enabled' THEN value::text END) AS newsletter_enabled,
  MAX(CASE WHEN key = 'current_event_year' THEN value::text END) AS current_event_year,
  MAX(updated_at) AS last_updated
FROM settings
WHERE key IN (
  'site_name', 'site_description', 'site_keywords', 'site_logo_url',
  'contact_email', 'contact_phone', 'contact_address',
  'social_twitter', 'social_linkedin', 'social_facebook',
  'social_instagram', 'social_youtube', 'social_github',
  'registration_popup_enabled', 'site_maintenance_mode',
  'newsletter_enabled', 'current_event_year'
);

-- ═══════════════════════════════════════════════════════════════════════
-- ADDITIONAL INDEX: GIN index on value for JSON queries
-- Useful when searching within JSON content
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_settings_value_gin ON settings USING gin(value);

-- ═══════════════════════════════════════════════════════════════════════
-- GRANT SELECT on views to anon and authenticated roles
-- ═══════════════════════════════════════════════════════════════════════
GRANT SELECT ON v_homepage_hero_settings TO anon, authenticated;
GRANT SELECT ON v_homepage_about_settings TO anon, authenticated;
GRANT SELECT ON v_banner_settings TO anon, authenticated;
GRANT SELECT ON v_popup_settings TO anon, authenticated;
GRANT SELECT ON v_site_settings TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- COMMENTS: Add documentation to views
-- ═══════════════════════════════════════════════════════════════════════
COMMENT ON VIEW v_homepage_hero_settings IS 'Aggregated hero section settings for the homepage banner';
COMMENT ON VIEW v_homepage_about_settings IS 'Aggregated about section settings for the homepage';
COMMENT ON VIEW v_banner_settings IS 'Parsed banner configuration (event title, dates, video, etc.)';
COMMENT ON VIEW v_popup_settings IS 'Parsed registration popup configuration';
COMMENT ON VIEW v_site_settings IS 'All commonly accessed site-wide settings in a single row';
