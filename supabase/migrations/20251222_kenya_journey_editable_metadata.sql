-- ═══════════════════════════════════════════════════════════════════════
-- KENYA'S JOURNEY EDITABLE METADATA
-- ═══════════════════════════════════════════════════════════════════════
-- Add metadata structure to kenya_journey section for fully editable content

-- Update the kenya_journey section with editable metadata structure
UPDATE public.noai_page_sections
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{metadata}',
  '{
    "milestone": {
      "year": "2025",
      "text": "First Participation: 2025",
      "icon": "icofont-flag-alt-2"
    },
    "organizers": [
      {
        "name": "Elimika Research Institute",
        "icon": "icofont-building"
      },
      {
        "name": "IndabaX Kenya",
        "icon": "icofont-users-alt-4"
      }
    ],
    "event": {
      "badge": "IOAI 2025",
      "location": "Beijing, China",
      "location_icon": "icofont-location-pin",
      "date": {
        "day": "2",
        "month": "August",
        "year": "2025"
      },
      "title": "Kenya''s Debut",
      "description": "The first Kenyan team to represent the nation at the International Olympiad in Artificial Intelligence.",
      "achievements": [
        {
          "icon": "icofont-trophy",
          "text": "Strong Performance"
        },
        {
          "icon": "icofont-star",
          "text": "Commendable Results"
        },
        {
          "icon": "icofont-graduate",
          "text": "STEM Excellence"
        }
      ],
      "quote": "Supported by local academic institutions and national initiatives aimed at nurturing talent in STEM fields."
    },
    "buttons": {
      "gallery": {
        "text": "View Gallery",
        "url": "#gallery",
        "icon": "icofont-image"
      },
      "apply": {
        "text": "Join the Team",
        "url": "#apply",
        "icon": "icofont-arrow-right"
      }
    },
    "futureGoals": [
      {
        "icon": "icofont-chart-growth",
        "title": "Grow Participation",
        "description": "Increase the number of students competing at national level"
      },
      {
        "icon": "icofont-medal",
        "title": "Win Medals",
        "description": "Aim for medal positions at IOAI 2026 in Abu Dhabi"
      },
      {
        "icon": "icofont-network",
        "title": "Build Community",
        "description": "Create a strong AI community among Kenyan youth"
      }
    ]
  }'::jsonb
)
WHERE section_key = 'kenya_journey';

-- Add comment
COMMENT ON COLUMN public.noai_page_sections.content IS 'JSONB content with optional metadata field for structured editable content';
