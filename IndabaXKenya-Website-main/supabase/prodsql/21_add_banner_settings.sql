-- ═══════════════════════════════════════════════════════════════════════
-- ADD BANNER/EVENT CONFIGURATION SETTINGS
-- ═══════════════════════════════════════════════════════════════════════
-- Adds banner settings for homepage countdown, video, and CTA buttons
-- This replaces hardcoded data in lib/mock-data/settings.json
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Insert banner configuration settings
INSERT INTO public.settings (key, value, description)
VALUES (
  'banner',
  jsonb_build_object(
    'eventDate', '2026-03-15',
    'eventEndDate', '2026-03-17',
    'eventLocation', 'KICC, Nairobi, Kenya',
    'eventTitle', 'IndabaX Kenya 2026',
    'eventSubtitle', 'Machine Learning & AI Conference',
    'videoUrl', 'bk7McNUjWgw',
    'registrationUrl', '/register',
    'submitPaperUrl', '/submit',
    'showCountdown', true,
    'showVideo', true
  ),
  'Homepage banner and event configuration (countdown, video, CTAs)'
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

SELECT
  key,
  value,
  description,
  updated_at
FROM public.settings
WHERE key = 'banner';
