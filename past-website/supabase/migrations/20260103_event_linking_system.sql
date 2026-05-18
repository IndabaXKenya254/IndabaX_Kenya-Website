-- ═══════════════════════════════════════════════════════════════════════
-- EVENT LINKING SYSTEM: Sponsors & Team Members
-- ═══════════════════════════════════════════════════════════════════════
-- Links speakers, sponsors, and team members to specific events
-- Allows filtering by event on public pages
-- NOTE: Uses existing team_members table (not separate organizers table)
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. EVENT-SPONSORS JUNCTION TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Links sponsors to specific events with sponsorship level

CREATE TABLE IF NOT EXISTS event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  sponsorship_level VARCHAR(50), -- 'title', 'platinum', 'gold', 'silver', 'bronze', 'partner'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, sponsor_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_sponsors_event ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_sponsor ON event_sponsors(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_level ON event_sponsors(sponsorship_level);

-- RLS Policies
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view event sponsors" ON event_sponsors;
CREATE POLICY "Public can view event sponsors"
  ON event_sponsors
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage event sponsors" ON event_sponsors;
CREATE POLICY "Admins can manage event sponsors"
  ON event_sponsors
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════
-- 2. EVENT-TEAM MEMBERS JUNCTION TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Links existing team_members to specific events with event-specific role
-- Uses the existing team_members table (no new organizers table needed)

CREATE TABLE IF NOT EXISTS event_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  event_role VARCHAR(100), -- 'lead organizer', 'co-organizer', 'volunteer', 'advisor', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, team_member_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_team_members_event ON event_team_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_team_members_member ON event_team_members(team_member_id);

-- RLS Policies
ALTER TABLE event_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view event team members" ON event_team_members;
CREATE POLICY "Public can view event team members"
  ON event_team_members
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage event team members" ON event_team_members;
CREATE POLICY "Admins can manage event team members"
  ON event_team_members
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════
COMMENT ON TABLE event_sponsors IS 'Junction table linking sponsors to specific events with sponsorship level';
COMMENT ON TABLE event_team_members IS 'Junction table linking team members to specific events with event-specific role';

COMMENT ON COLUMN event_sponsors.sponsorship_level IS 'Sponsorship tier: title, platinum, gold, silver, bronze, partner';
COMMENT ON COLUMN event_team_members.event_role IS 'Role for this specific event: lead organizer, co-organizer, volunteer, advisor';
