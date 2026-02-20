-- ═══════════════════════════════════════════════════════════════════════
-- CREATE EVENT AND POST TAGS
-- ═══════════════════════════════════════════════════════════════════════
-- Creates tags for events and blog posts, then links them appropriately
-- Date: December 15, 2025

BEGIN;

-- ───────────────────────────────────────────────────────────────────────
-- PART 1: CREATE EVENT TAGS
-- ───────────────────────────────────────────────────────────────────────

-- General event tags
INSERT INTO event_tags (name, slug) VALUES
  ('AI Research', 'ai-research'),
  ('Machine Learning', 'machine-learning'),
  ('Deep Learning', 'deep-learning'),
  ('Conference', 'conference'),
  ('IndabaX', 'indabax'),
  ('Education', 'education'),
  ('Innovation', 'innovation'),
  ('Collaboration', 'collaboration'),
  ('Kenya', 'kenya')
ON CONFLICT (slug) DO NOTHING;

-- Specific event theme tags
INSERT INTO event_tags (name, slug) VALUES
  ('Smart Cities', 'smart-cities'),
  ('Urban Planning', 'urban-planning'),
  ('Hackathon', 'hackathon'),
  ('Blue Economy', 'blue-economy'),
  ('Marine Science', 'marine-science'),
  ('Ocean Conservation', 'ocean-conservation'),
  ('Democracy', 'democracy'),
  ('Politics', 'politics'),
  ('Governance', 'governance'),
  ('Electoral Systems', 'electoral-systems')
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────
-- PART 2: CREATE POST TAGS
-- ───────────────────────────────────────────────────────────────────────

-- General post tags
INSERT INTO post_tags (name, slug) VALUES
  ('AI Research', 'ai-research'),
  ('Machine Learning', 'machine-learning'),
  ('Deep Learning', 'deep-learning'),
  ('Africa', 'africa'),
  ('Kenya', 'kenya'),
  ('Innovation', 'innovation'),
  ('Education', 'education'),
  ('Deep Learning Indaba', 'deep-learning-indaba'),
  ('IndabaX', 'indabax')
ON CONFLICT (slug) DO NOTHING;

-- Specific post topic tags
INSERT INTO post_tags (name, slug) VALUES
  ('AI Startups', 'ai-startups'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Healthcare', 'healthcare'),
  ('Agriculture', 'agriculture'),
  ('Financial Inclusion', 'financial-inclusion'),
  ('Capacity Building', 'capacity-building'),
  ('Community', 'community'),
  ('Research', 'research'),
  ('Technology', 'technology'),
  ('Development', 'development')
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────
-- PART 3: LINK TAGS TO EVENTS
-- ───────────────────────────────────────────────────────────────────────

-- IndabaX Kenya 2022 - AI for Smart Cities
INSERT INTO event_tag_relations (event_id, tag_id)
SELECT
  e.id,
  t.id
FROM events e
CROSS JOIN event_tags t
WHERE e.slug = 'indabax-kenya-2022'
  AND t.slug IN (
    'ai-research',
    'machine-learning',
    'conference',
    'indabax',
    'smart-cities',
    'urban-planning',
    'innovation',
    'kenya'
  )
ON CONFLICT DO NOTHING;

-- IndabaX Kenya 2023 - Innovation Through Collaboration
INSERT INTO event_tag_relations (event_id, tag_id)
SELECT
  e.id,
  t.id
FROM events e
CROSS JOIN event_tags t
WHERE e.slug = 'indabax-kenya-2023'
  AND t.slug IN (
    'ai-research',
    'machine-learning',
    'deep-learning',
    'conference',
    'indabax',
    'hackathon',
    'innovation',
    'collaboration',
    'education',
    'kenya'
  )
ON CONFLICT DO NOTHING;

-- IndabaX Kenya 2024 - Blue Economy
INSERT INTO event_tag_relations (event_id, tag_id)
SELECT
  e.id,
  t.id
FROM events e
CROSS JOIN event_tags t
WHERE e.slug = 'indabax-kenya-2024'
  AND t.slug IN (
    'ai-research',
    'machine-learning',
    'conference',
    'indabax',
    'blue-economy',
    'marine-science',
    'ocean-conservation',
    'innovation',
    'kenya'
  )
ON CONFLICT DO NOTHING;

-- IndabaX Kenya 2025 - Politics and Democracy
INSERT INTO event_tag_relations (event_id, tag_id)
SELECT
  e.id,
  t.id
FROM events e
CROSS JOIN event_tags t
WHERE e.slug = 'indabax-kenya-2025'
  AND t.slug IN (
    'ai-research',
    'machine-learning',
    'conference',
    'indabax',
    'democracy',
    'politics',
    'governance',
    'electoral-systems',
    'innovation',
    'kenya'
  )
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────
-- PART 4: LINK TAGS TO BLOG POSTS
-- ───────────────────────────────────────────────────────────────────────

-- Blog Post 1: The Rise of AI Research in Africa
INSERT INTO post_tag_relations (post_id, tag_id)
SELECT
  p.id,
  t.id
FROM posts p
CROSS JOIN post_tags t
WHERE p.slug = 'rise-of-ai-research-africa'
  AND t.slug IN (
    'ai-research',
    'machine-learning',
    'deep-learning',
    'africa',
    'kenya',
    'research',
    'deep-learning-indaba',
    'indabax',
    'education',
    'innovation'
  )
ON CONFLICT DO NOTHING;

-- Blog Post 2: African AI Startups
INSERT INTO post_tag_relations (post_id, tag_id)
SELECT
  p.id,
  t.id
FROM posts p
CROSS JOIN post_tags t
WHERE p.slug = 'african-ai-startups-innovating-impact'
  AND t.slug IN (
    'ai-startups',
    'innovation',
    'entrepreneurship',
    'africa',
    'kenya',
    'healthcare',
    'agriculture',
    'financial-inclusion',
    'technology',
    'development'
  )
ON CONFLICT DO NOTHING;

-- Blog Post 3: Building Kenya's AI Future
INSERT INTO post_tag_relations (post_id, tag_id)
SELECT
  p.id,
  t.id
FROM posts p
CROSS JOIN post_tags t
WHERE p.slug = 'building-kenya-ai-capacity-education'
  AND t.slug IN (
    'education',
    'capacity-building',
    'kenya',
    'indabax',
    'deep-learning-indaba',
    'community',
    'ai-research',
    'machine-learning',
    'innovation',
    'development'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ───────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Verify event tags
SELECT
  e.title,
  e.event_year,
  ARRAY_AGG(et.name ORDER BY et.name) as tags
FROM events e
JOIN event_tag_relations etr ON e.id = etr.event_id
JOIN event_tags et ON etr.tag_id = et.id
WHERE e.event_category = 'indabax'
GROUP BY e.id, e.title, e.event_year
ORDER BY e.event_year DESC;

-- Verify post tags
SELECT
  p.title,
  TO_CHAR(p.published_at, 'Mon DD, YYYY') as published,
  ARRAY_AGG(pt.name ORDER BY pt.name) as tags
FROM posts p
JOIN post_tag_relations ptr ON p.id = ptr.post_id
JOIN post_tags pt ON ptr.tag_id = pt.id
WHERE p.category = 'blog'
GROUP BY p.id, p.title, p.published_at
ORDER BY p.published_at DESC;

-- Count tags
SELECT
  'Event Tags' as type,
  COUNT(*) as total
FROM event_tags
UNION ALL
SELECT
  'Post Tags' as type,
  COUNT(*) as total
FROM post_tags
UNION ALL
SELECT
  'Event Tag Relations' as type,
  COUNT(*) as total
FROM event_tag_relations
UNION ALL
SELECT
  'Post Tag Relations' as type,
  COUNT(*) as total
FROM post_tag_relations;
