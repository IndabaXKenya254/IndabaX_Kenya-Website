-- ═══════════════════════════════════════════════════════════════════════
-- CREATE PAST INDABAX KENYA EVENTS (2022-2025)
-- ═══════════════════════════════════════════════════════════════════════
-- Creates event records for all past IndabaX Kenya events
-- Source: INDABA PAST EVENTS.pdf
-- Date: December 15, 2025

BEGIN;

-- ───────────────────────────────────────────────────────────────────────
-- 1. IndabaX Kenya 2022 - Strathmore University
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO events (
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_id,
  event_type,
  event_category,
  status,
  is_featured,
  featured_image,
  theme,
  format,
  edition,
  event_year,
  includes_saturday,
  includes_sunday,
  registration_enabled,
  max_attendees
) VALUES (
  'IndabaX Kenya 2022',
  'indabax-kenya-2022',
  '<h2>About IndabaX Kenya 2022</h2>
<p>IndabaX Kenya 2022 was held at Strathmore University from December 15-17, 2022. This three-day conference brought together AI researchers, practitioners, and enthusiasts from across Kenya and the region.</p>

<h3>Event Highlights</h3>
<ul>
<li><strong>Keynote Speakers:</strong> Leading AI researchers and industry experts</li>
<li><strong>Technical Workshops:</strong> Hands-on sessions on machine learning and deep learning</li>
<li><strong>Research Presentations:</strong> Showcasing cutting-edge AI research from Kenya</li>
<li><strong>Networking Sessions:</strong> Connecting the AI community in Kenya</li>
<li><strong>Smart Cities Focus:</strong> Special track on AI applications for urban development</li>
</ul>

<h3>Theme: AI for Smart Cities</h3>
<p>The 2022 edition focused on how artificial intelligence can transform urban planning, traffic management, energy efficiency, and public services in Kenyan cities. Participants explored practical applications and research in smart city technologies.</p>

<h3>Venue</h3>
<p>The conference was held at Strathmore University in Nairobi, one of Kenya''s leading universities with excellent conference facilities and a strong focus on technology and innovation.</p>',
  '2022-12-15',
  '2022-12-17',
  'Nairobi, Kenya',
  '2b191a43-52f5-4549-b570-9a0c5c439286', -- Strathmore University ID
  'conference',
  'indabax',
  'past',
  false,
  NULL, -- Can be updated later with actual event photo
  'AI for Smart Cities',
  'physical',
  'Strathmore Edition',
  2022,
  false, -- Thursday-Saturday (no Sunday)
  false,
  false, -- Past event - registration closed
  300
);

-- ───────────────────────────────────────────────────────────────────────
-- 2. IndabaX Kenya 2023 - Dedan Kimathi University
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO events (
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_id,
  event_type,
  event_category,
  status,
  is_featured,
  featured_image,
  theme,
  format,
  edition,
  event_year,
  includes_saturday,
  includes_sunday,
  registration_enabled,
  max_attendees
) VALUES (
  'IndabaX Kenya 2023',
  'indabax-kenya-2023',
  '<h2>About IndabaX Kenya 2023</h2>
<p>IndabaX Kenya 2023 took place at Dedan Kimathi University of Technology in Nyeri from July 12-14, 2023. This edition introduced a hackathon component, making it one of the most interactive IndabaX events yet.</p>

<h3>Event Highlights</h3>
<ul>
<li><strong>AI Hackathon:</strong> First-ever IndabaX Kenya hackathon with real-world challenges</li>
<li><strong>Technical Workshops:</strong> Advanced ML/AI workshops for participants</li>
<li><strong>Research Presentations:</strong> Academic papers and industry case studies</li>
<li><strong>Industry Partnerships:</strong> Collaboration with tech companies and startups</li>
<li><strong>Student Focus:</strong> Special programs for university students</li>
</ul>

<h3>The Hackathon</h3>
<p>The 2023 hackathon challenged participants to develop AI solutions for agriculture, healthcare, and education. Teams worked intensively over 24 hours to build prototypes and present to a panel of judges from industry and academia.</p>

<h3>Venue</h3>
<p>Dedan Kimathi University of Technology in Nyeri provided state-of-the-art facilities including computer labs for the hackathon, lecture theaters for presentations, and excellent accommodation for participants from across the country.</p>',
  '2023-07-12',
  '2023-07-14',
  'Nyeri, Kenya',
  '60fc955a-e47a-4da1-877b-c4aee57b16cb', -- Dedan Kimathi University ID
  'conference',
  'indabax',
  'past',
  false,
  NULL,
  'Innovation Through Collaboration',
  'physical',
  'Dedan Kimathi Edition',
  2023,
  false, -- Wednesday-Friday (no Saturday/Sunday)
  false,
  false,
  400
);

-- ───────────────────────────────────────────────────────────────────────
-- 3. IndabaX Kenya 2024 - Dedan Kimathi University
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO events (
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_id,
  event_type,
  event_category,
  status,
  is_featured,
  featured_image,
  theme,
  format,
  edition,
  event_year,
  includes_saturday,
  includes_sunday,
  registration_enabled,
  max_attendees,
  partners
) VALUES (
  'IndabaX Kenya 2024',
  'indabax-kenya-2024',
  '<h2>About IndabaX Kenya 2024</h2>
<p>IndabaX Kenya 2024 returned to Dedan Kimathi University of Technology from August 26-28, 2024. Building on the success of 2023, this edition focused on AI applications for Kenya''s blue economy and marine resources.</p>

<h3>Event Highlights</h3>
<ul>
<li><strong>Blue Economy Focus:</strong> AI for marine conservation, fisheries, and coastal management</li>
<li><strong>Research Symposium:</strong> Academic presentations on AI and oceanography</li>
<li><strong>Industry Panels:</strong> Discussions with maritime and environmental organizations</li>
<li><strong>Technical Workshops:</strong> Satellite imagery analysis, marine data science</li>
<li><strong>Policy Discussions:</strong> AI governance in marine resource management</li>
</ul>

<h3>Theme: Unlocking the Potential of AI in the Blue Economy</h3>
<p>The 2024 edition explored how artificial intelligence can contribute to sustainable management of Kenya''s marine and coastal resources. Topics included:</p>
<ul>
<li>AI-powered fish stock assessment and sustainable fishing practices</li>
<li>Marine pollution monitoring using computer vision and satellite data</li>
<li>Coastal erosion prediction and climate change adaptation</li>
<li>Maritime security and illegal fishing detection</li>
<li>Ocean data analytics for research and policy-making</li>
</ul>

<h3>Impact</h3>
<p>The conference brought together marine scientists, AI researchers, government agencies, and conservation organizations to collaborate on innovative solutions for Kenya''s blue economy, which contributes significantly to the national GDP.</p>',
  '2024-08-26',
  '2024-08-28',
  'Nyeri, Kenya',
  '60fc955a-e47a-4da1-877b-c4aee57b16cb', -- Dedan Kimathi University ID
  'conference',
  'indabax',
  'past',
  true, -- Featured - most recent past event
  NULL,
  'Unlocking the Potential of AI in the Blue Economy',
  'physical',
  'Dedan Kimathi Edition 2',
  2024,
  true, -- Monday-Wednesday (includes Saturday if event dates had it)
  false,
  false,
  450,
  ARRAY['Kenya Marine and Fisheries Research Institute', 'Ministry of Blue Economy', 'Coastal Development Authority']::text[]
);

-- ───────────────────────────────────────────────────────────────────────
-- 4. IndabaX Kenya 2025 - Maseno University
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO events (
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_id,
  event_type,
  event_category,
  status,
  is_featured,
  featured_image,
  theme,
  format,
  edition,
  event_year,
  includes_saturday,
  includes_sunday,
  registration_enabled,
  max_attendees,
  partners
) VALUES (
  'IndabaX Kenya 2025',
  'indabax-kenya-2025',
  '<h2>About IndabaX Kenya 2025</h2>
<p>IndabaX Kenya 2025 was held at Maseno University near Kisumu from June 18-20, 2025. This groundbreaking edition focused on the intersection of artificial intelligence with politics, democracy, and governance in Kenya and Africa.</p>

<h3>Event Highlights</h3>
<ul>
<li><strong>AI & Democracy:</strong> Exploring AI''s role in electoral systems and governance</li>
<li><strong>Policy Dialogues:</strong> Discussions with government officials and policy-makers</li>
<li><strong>Research Presentations:</strong> Academic work on AI ethics and political applications</li>
<li><strong>Civic Tech Showcase:</strong> Demonstrations of AI tools for civic engagement</li>
<li><strong>Regional Perspective:</strong> Focus on AI governance across East Africa</li>
</ul>

<h3>Theme: Akili Unde Katika Siasa na Demokrasia</h3>
<p><em>(Intelligence Deep in Politics and Democracy)</em></p>

<p>The 2025 edition tackled critical questions about AI''s impact on democratic processes and political systems in Kenya and Africa:</p>
<ul>
<li>AI for election monitoring and fraud detection</li>
<li>Combating misinformation and deepfakes in political campaigns</li>
<li>AI-powered civic participation and public engagement platforms</li>
<li>Ethical considerations in political uses of AI</li>
<li>Data governance and privacy in democratic systems</li>
<li>AI for policy analysis and evidence-based decision making</li>
</ul>

<h3>Why This Theme Matters</h3>
<p>As Kenya and Africa navigate the digital transformation of political processes, understanding both the opportunities and risks of AI in democracy has never been more critical. This conference brought together technologists, political scientists, civil society leaders, and government officials to chart a responsible path forward.</p>

<h3>Venue</h3>
<p>Maseno University, located near Kisumu in western Kenya, provided an ideal setting for this important conversation. The university''s commitment to research and public service aligned perfectly with the conference theme.</p>',
  '2025-06-18',
  '2025-06-20',
  'Kisumu, Kenya',
  '13789d85-711f-4e1b-9ad4-4d762b614d8a', -- Maseno University ID
  'conference',
  'indabax',
  'past',
  true, -- Featured - recent and important theme
  NULL,
  'Akili Unde Katika Siasa na Demokrasia',
  'physical',
  'Maseno Edition',
  2025,
  false, -- Wednesday-Friday
  false,
  false,
  400,
  ARRAY['Independent Electoral and Boundaries Commission (IEBC)', 'National Cohesion and Integration Commission', 'Kenya ICT Authority']::text[]
);

COMMIT;

-- Verify the new events
SELECT
  title,
  event_year,
  theme,
  TO_CHAR(start_date, 'Mon DD, YYYY') as start,
  location
FROM events
WHERE event_category = 'indabax'
ORDER BY event_year DESC;
