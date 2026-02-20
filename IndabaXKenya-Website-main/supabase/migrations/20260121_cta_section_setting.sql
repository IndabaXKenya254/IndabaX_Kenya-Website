-- ═══════════════════════════════════════════════════════════════════════
-- CTA SECTION SETTING
-- ═══════════════════════════════════════════════════════════════════════
-- Issue #44: Admin-editable "Secure Your Spot" CTA section
-- ═══════════════════════════════════════════════════════════════════════

-- Insert default CTA section content into settings
INSERT INTO settings (id, key, value, description, updated_at)
VALUES (
  gen_random_uuid(),
  'cta_section',
  '{
    "badge_text": "Don''t Miss Out!",
    "heading": "Secure Your Spot at IndabaX Kenya",
    "description": "Join 500+ AI enthusiasts from across Africa for 3 days of learning, networking, and innovation. Registration is FREE for students only. Limited seats available - register now to be part of East Africa''s premier AI conference.",
    "button_text": "Register Now",
    "button_link": "/register",
    "background_image": "/images/buy-tickets-bg.jpg",
    "highlights": [
      {"icon": "icofont-check-circled", "text": "50+ Expert Speakers"},
      {"icon": "icofont-check-circled", "text": "10+ Hands-on Workshops"},
      {"icon": "icofont-check-circled", "text": "Networking with 500+ Attendees"},
      {"icon": "icofont-check-circled", "text": "FREE for Students Only"}
    ],
    "is_visible": true
  }'::jsonb,
  'CTA section content for the homepage (Secure Your Spot section)',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
