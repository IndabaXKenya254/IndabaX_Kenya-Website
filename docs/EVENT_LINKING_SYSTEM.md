# Event Linking System & NOAI Archive Documentation

**Date**: January 3, 2026 (Updated: January 5, 2026)
**Commit**: `cd49eff`
**Status**: Complete & Deployed

---

## Overview

This update implements three major features:

1. **Event Linking System** - Link speakers, sponsors, and team members to specific events
2. **NOAI Archive System** - Clickable timeline with archive pages
3. **Bug Fix** - Rejection visibility in user dashboard

> **January 5, 2026 Update**: Event linking is now **bi-directional**! You can link events from either direction:
> - From Event → Select sponsors/speakers/team members
> - From Sponsor/Speaker/Team Member → Select events

---

## 1. Event Linking System

### Purpose
Allow filtering of speakers, sponsors, and team members by specific events. Previously, these entities were global - now they can be associated with specific events.

### Database Schema

Two new junction tables were created:

```sql
-- Links sponsors to events
CREATE TABLE event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  sponsorship_level VARCHAR(50),  -- 'title', 'platinum', 'gold', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, sponsor_id)
);

-- Links team members to events
CREATE TABLE event_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  event_role VARCHAR(100),  -- 'lead organizer', 'volunteer', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, team_member_id)
);
```

**Note**: `event_speakers` junction table already existed.

### API Endpoints

All public APIs now support `?event_id=xxx` query parameter:

| Endpoint | Description |
|----------|-------------|
| `GET /api/speakers?event_id=xxx` | Get speakers for a specific event |
| `GET /api/sponsors?event_id=xxx` | Get sponsors for a specific event |
| `GET /api/team?event_id=xxx` | Get team members for a specific event |

### Admin Panel Changes

**File**: `src/app/admin/events/[id]/page.tsx`

The event edit form now includes:
- **SponsorSelector** - Multi-select to link sponsors to the event
- **TeamMemberSelector** - Multi-select to link team members to the event
- Speaker selector (already existed)

### Public Page Changes

| Page | File | Changes |
|------|------|---------|
| `/speakers` | `src/components/Speakers/SpeakersGrid.tsx` | Added "Filter by Event" dropdown |
| `/sponsors` | `src/components/Sponsors/SponsorsGrid.tsx` | Added "Filter by Event" dropdown |
| `/team` | `src/components/Team/TeamGrid.tsx` | Added "Filter by Event" dropdown |

### How to Test Event Linking

#### Method 1: From Event Edit Page (Original)
1. Navigate to `/admin/events`
2. Click "Edit" on any event
3. Scroll down to find:
   - **Speakers** selector (existing)
   - **Sponsors** selector
   - **Team Members** selector
4. Select sponsors, speakers, and team members to link to this event
5. Click "Update Event"

#### Method 2: From Entity Edit Pages (NEW - Bi-directional)
**Sponsors:**
1. Navigate to `/admin/sponsors`
2. Click "Add Sponsor" or "Edit" on an existing sponsor
3. Find the "Link to Events" selector
4. Select events to link this sponsor to
5. Save

**Speakers:**
1. Navigate to `/admin/speakers`
2. Click "Add Speaker" or "Edit" on an existing speaker
3. Find the "Speaking at Events" selector (in a card section)
4. Select events to link this speaker to
5. Save

**Team Members:**
1. Navigate to `/admin/team`
2. Click "Add Team Member" or "Edit" on an existing member
3. In the modal, find the "Link to Events" selector
4. Select events to link this team member to
5. Save

#### Public Side
1. Navigate to `/speakers`
2. Look for the "Filter by Event" dropdown at the top
3. Select an event from the dropdown
4. Observe that only speakers linked to that event are shown
5. Repeat for `/sponsors` and `/team` pages

---

## 2. NOAI Archive System

### Purpose
Make timeline milestones clickable, linking to dedicated archive pages that show event details, participants, and gallery photos.

### Database Schema

Added two columns to `noai_timeline_milestones`:

```sql
ALTER TABLE noai_timeline_milestones
ADD COLUMN link_url TEXT,
ADD COLUMN link_type VARCHAR(50) DEFAULT 'internal';
-- link_type: 'internal', 'external', 'archive'
```

### New Pages

| Page | File | Description |
|------|------|-------------|
| `/noai/archive` | `src/app/noai/archive/page.tsx` | Archive listing page |
| `/noai/archive/[slug]` | `src/app/noai/archive/[slug]/page.tsx` | Individual archive page |

### Component Changes

**File**: `src/components/NOAI/KenyaJourneyTimelineDB.tsx`

- Timeline milestones are now clickable when `link_url` is set
- Internal links use Next.js `<Link>` component
- External links open in new tab with `target="_blank"`
- Visual indicator (arrow icon) shows which milestones are clickable

### Admin Panel Changes

**File**: `src/app/admin/noai/timeline/page.tsx`

Added fields for timeline milestone editing:
- **Link URL** - URL to navigate to when clicked
- **Link Type** - Dropdown: internal, external, archive

### How to Test NOAI Archive

#### Admin Side
1. Navigate to `/admin/noai/timeline`
2. Click "Edit" on any timeline milestone
3. Add a link URL (e.g., `/noai/archive/ioai-2025` or `https://example.com`)
4. Select link type (internal/external/archive)
5. Save the milestone

#### Public Side
1. Navigate to `/noai`
2. Scroll to the timeline section
3. Hover over milestones - clickable ones show visual indicator
4. Click a milestone with a link
5. Verify navigation works correctly
6. Visit `/noai/archive` to see the archive listing

---

## 3. Bug Fix: Rejection Visibility

### Problem
When admins rejected applications with notes, users couldn't see the rejection reason in their dashboard. The decision API was setting `decision_notes` but the dashboard was looking for `rejection_reason`.

### Solution
Updated both:
1. **Decision API** (`src/app/api/admin/applications/[id]/decision/route.ts`):
   - Now sets both `rejection_reason` AND `decision_notes`

2. **User Dashboard** (`src/app/dashboard/applications/page.tsx`):
   - Now checks for both fields: `rejection_reason || decision_notes`

### How to Test Rejection Visibility

1. **As Admin**:
   - Navigate to `/admin/applications`
   - Find a pending application
   - Click to review it
   - Select "Rejected" decision
   - Add notes explaining the rejection
   - Submit the decision

2. **As User**:
   - Log in as the applicant
   - Navigate to `/dashboard/applications`
   - The rejection reason should now be visible with the feedback

---

## Files Changed Summary

### New Files
```
src/app/noai/archive/page.tsx                    # Archive listing
src/app/noai/archive/[slug]/page.tsx             # Individual archive
src/components/admin/selectors/SponsorSelector.tsx
src/components/admin/selectors/TeamMemberSelector.tsx
supabase/migrations/20260103_event_linking_system.sql
supabase/migrations/20260103_add_timeline_links.sql
```

### Modified Files (January 5, 2026 - Bi-directional Linking)
```
# Validation Schemas
src/lib/validations/admin.ts                     # Added event_ids to speaker/sponsor schemas

# APIs - Bi-directional Linking
src/app/api/admin/sponsors/route.ts              # Handle event_ids in POST
src/app/api/admin/sponsors/[id]/route.ts         # Handle event_ids in GET/PATCH
src/app/api/admin/speakers/route.ts              # Handle event_ids in POST
src/app/api/admin/speakers/[id]/route.ts         # Handle event_ids in GET/PATCH
src/app/api/admin/team/route.ts                  # Handle event_ids in POST/PUT
src/app/api/admin/team/[id]/events/route.ts      # NEW: Get events for team member

# Admin Forms
src/app/admin/sponsors/new/page.tsx              # Added EventSelector
src/app/admin/sponsors/[id]/page.tsx             # Added EventSelector
src/app/admin/speakers/new/page.tsx              # Added EventSelector
src/app/admin/speakers/[id]/page.tsx             # Added EventSelector
src/app/admin/team/page.tsx                      # Added EventSelector to modal
```

### Modified Files (Original - January 3, 2026)
```
# APIs
src/app/api/speakers/route.ts                    # event_id filter
src/app/api/sponsors/route.ts                    # event_id filter
src/app/api/team/route.ts                        # event_id filter
src/app/api/events/[slug]/route.ts               # include sponsors/team
src/app/api/admin/events/[id]/route.ts           # handle sponsor/team IDs
src/app/api/noai/timeline/route.ts               # link fields
src/app/api/noai/timeline/[id]/route.ts          # link fields
src/app/api/admin/applications/[id]/decision/route.ts  # rejection fix

# Admin Pages
src/app/admin/events/[id]/page.tsx               # sponsor/team selectors
src/app/admin/noai/timeline/page.tsx             # link URL/type fields

# Public Components
src/components/Speakers/SpeakersGrid.tsx         # event filter dropdown
src/components/Sponsors/SponsorsGrid.tsx         # event filter dropdown
src/components/Team/TeamGrid.tsx                 # event filter dropdown
src/components/NOAI/KenyaJourneyTimelineDB.tsx   # clickable milestones

# Dashboard
src/app/dashboard/applications/page.tsx          # rejection visibility

# Types & Validations
src/types/api.ts                                 # EventSponsor, EventTeamMember
src/lib/validations/admin.ts                     # sponsor_ids, team_member_ids
src/components/admin/selectors/index.ts          # export new selectors

# Styles
styles/noai.css                                  # archive page styles
```

---

## Database Migrations

### Migration 1: Event Linking System
**File**: `supabase/migrations/20260103_event_linking_system.sql`

Creates:
- `event_sponsors` table
- `event_team_members` table
- Indexes and RLS policies

### Migration 2: Timeline Links
**File**: `supabase/migrations/20260103_add_timeline_links.sql`

Adds to `noai_timeline_milestones`:
- `link_url` column
- `link_type` column

**Note**: These migrations have already been applied to the development database.

---

## Testing Checklist

### Event Linking
- [ ] Admin: Edit event → Select sponsors → Save → Verify linked
- [ ] Admin: Edit event → Select team members → Save → Verify linked
- [ ] Public: /speakers → Event filter dropdown works
- [ ] Public: /sponsors → Event filter dropdown works
- [ ] Public: /team → Event filter dropdown works
- [ ] API: GET /api/speakers?event_id=xxx returns filtered results
- [ ] API: GET /api/sponsors?event_id=xxx returns filtered results
- [ ] API: GET /api/team?event_id=xxx returns filtered results

### NOAI Archive
- [ ] Admin: Edit timeline → Add link URL → Save
- [ ] Public: /noai → Timeline milestones are clickable
- [ ] Public: /noai/archive → Archive listing displays
- [ ] Public: /noai/archive/[slug] → Individual archive page works
- [ ] External links open in new tab

### Rejection Visibility
- [ ] Admin: Reject application with notes
- [ ] User: View dashboard → Rejection reason visible

---

## Troubleshooting

### Event filter not working
1. Check browser console for API errors
2. Verify `event_sponsors` and `event_team_members` tables exist
3. Check RLS policies allow public read access

### Timeline links not clickable
1. Verify `link_url` is set in the database
2. Check `link_type` is 'internal', 'external', or 'archive'
3. Inspect element to ensure link is rendered

### Rejection not visible
1. Check both `rejection_reason` and `decision_notes` columns
2. Verify the decision was saved in `application_decisions` table
3. Check the application status is 'rejected'
