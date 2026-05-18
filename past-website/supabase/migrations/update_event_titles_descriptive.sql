-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE EVENT TITLES TO BE MORE DESCRIPTIVE
-- ═══════════════════════════════════════════════════════════════════════
-- Makes event titles more engaging by incorporating themes
-- Date: December 15, 2025

BEGIN;

-- IndabaX Kenya 2022: AI for Smart Cities
UPDATE events
SET title = 'IndabaX Kenya 2022: AI for Smart Cities'
WHERE slug = 'indabax-kenya-2022';

-- IndabaX Kenya 2023: Innovation Through Collaboration
UPDATE events
SET title = 'IndabaX Kenya 2023: Innovation Through Collaboration'
WHERE slug = 'indabax-kenya-2023';

-- IndabaX Kenya 2024: Unlocking AI in the Blue Economy
UPDATE events
SET title = 'IndabaX Kenya 2024: Unlocking AI in the Blue Economy'
WHERE slug = 'indabax-kenya-2024';

-- IndabaX Kenya 2025: AI in Politics and Democracy
UPDATE events
SET title = 'IndabaX Kenya 2025: AI in Politics and Democracy'
WHERE slug = 'indabax-kenya-2025';

COMMIT;

-- Verify the updated titles
SELECT
  title,
  theme,
  event_year,
  TO_CHAR(start_date, 'Mon DD, YYYY') as start_date
FROM events
WHERE event_category = 'indabax'
ORDER BY event_year DESC;
