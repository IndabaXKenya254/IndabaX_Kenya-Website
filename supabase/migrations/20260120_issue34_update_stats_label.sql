-- Issue #34: Change "Countries" to "Counties" in stats table
-- Per client request: stats should reflect Kenyan counties (administrative divisions)
-- instead of countries

UPDATE stats
SET label = 'Counties'
WHERE label = 'Countries';

-- Note: Kenya has 47 counties (administrative divisions since 2013 constitution)
-- This change reflects that IndabaX Kenya reaches participants from across Kenya's counties
