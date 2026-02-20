-- ═══════════════════════════════════════════════════════════════════════
-- CREATE PAST EVENT VENUES
-- ═══════════════════════════════════════════════════════════════════════
-- Creates venue records for IndabaX Kenya past events (2022-2025)
-- Based on: INDABA PAST EVENTS.pdf

BEGIN;

-- 1. Strathmore University (2022 venue)
INSERT INTO venues (
  name,
  slug,
  address,
  city,
  country,
  capacity,
  description,
  facilities,
  website_url,
  is_active
) VALUES (
  'Strathmore University',
  'strathmore-university',
  'Ole Sangale Road, Madaraka',
  'Nairobi',
  'Kenya',
  1000,
  'Strathmore University is a leading private university in Kenya, known for its excellence in education and research. The campus features modern conference facilities and lecture halls.',
  ARRAY['Conference Halls', 'Lecture Rooms', 'WiFi', 'Parking', 'Catering Services', 'Audio-Visual Equipment']::text[],
  'https://www.strathmore.edu',
  true
);

-- 2. Dedan Kimathi University of Technology (2023 & 2024 venue)
INSERT INTO venues (
  name,
  slug,
  address,
  city,
  country,
  capacity,
  description,
  facilities,
  website_url,
  is_active
) VALUES (
  'Dedan Kimathi University of Technology',
  'dedan-kimathi-university',
  'Private Bag, Dedan Kimathi',
  'Nyeri',
  'Kenya',
  1500,
  'Dedan Kimathi University of Technology (DeKUT) is a public, technology-focused university in Nyeri, Kenya. The campus provides excellent facilities for technical conferences and workshops.',
  ARRAY['Conference Halls', 'Computer Labs', 'Lecture Theaters', 'WiFi', 'Parking', 'Accommodation', 'Hackathon Space']::text[],
  'https://www.dkut.ac.ke',
  true
);

-- 3. Maseno University (2025 venue)
INSERT INTO venues (
  name,
  slug,
  address,
  city,
  country,
  capacity,
  description,
  facilities,
  website_url,
  is_active
) VALUES (
  'Maseno University',
  'maseno-university',
  'Maseno',
  'Kisumu',
  'Kenya',
  1200,
  'Maseno University is one of Kenya''s leading public universities, located in Maseno, near Kisumu. The campus features modern facilities suitable for academic conferences and events.',
  ARRAY['Conference Halls', 'Lecture Rooms', 'WiFi', 'Parking', 'Accommodation', 'Catering Services']::text[],
  'https://www.maseno.ac.ke',
  true
);

COMMIT;

-- Verify the new venues
SELECT id, name, city, country FROM venues ORDER BY name;
