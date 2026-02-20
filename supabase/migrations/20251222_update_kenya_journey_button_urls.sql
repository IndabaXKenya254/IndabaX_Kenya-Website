-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE KENYA JOURNEY BUTTON URLs - Consolidation to Single Page
-- ═══════════════════════════════════════════════════════════════════════
-- Change button URLs from separate pages (/noai/apply, /noai/gallery)
-- to anchor links on the main NOAI page (#apply, #gallery)

UPDATE public.noai_page_sections
SET content = jsonb_set(
  jsonb_set(
    content,
    '{metadata,buttons,gallery,url}',
    '"#gallery"'::jsonb
  ),
  '{metadata,buttons,apply,url}',
  '"#apply"'::jsonb
)
WHERE section_key = 'kenya_journey'
  AND content->'metadata'->'buttons' IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.noai_page_sections.content IS 'JSONB content with metadata field - Updated button URLs to use anchor links (Dec 22, 2025)';
