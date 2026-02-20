-- ═══════════════════════════════════════════════════════════════════════
-- ADD ORGANIZER URLs TO KENYA JOURNEY METADATA
-- ═══════════════════════════════════════════════════════════════════════
-- Add clickable URLs to organizer cards

UPDATE public.noai_page_sections
SET content = jsonb_set(
  content,
  '{metadata,organizers}',
  '[
    {
      "name": "Elimika Research Institute",
      "icon": "icofont-building",
      "url": "https://elimika-research-institute.netlify.app/"
    },
    {
      "name": "IndabaX Kenya",
      "icon": "icofont-users-alt-4",
      "url": null
    }
  ]'::jsonb
)
WHERE section_key = 'kenya_journey';
