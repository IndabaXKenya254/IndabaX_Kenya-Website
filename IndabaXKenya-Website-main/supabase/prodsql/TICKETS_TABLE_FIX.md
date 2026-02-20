# Tickets Table Missing - Fix Applied

## Problem

**File:** `36_tickets_table_enhancements.sql`
**Error:**
```
ERROR: 42P01: relation "tickets" does not exist
CONTEXT: SQL statement "ALTER TABLE tickets ADD COLUMN status..."
```

## Root Cause

The `tickets` table creation SQL was missing from the production SQL files (`prodsql/` folder).

- ✅ The table exists in dev migrations: `/supabase/migrations/20251120000000_registration_redesign.sql:472`
- ❌ The table was NOT included in production file: `35_registration_redesign_phase1_to_5.sql`
- ❌ File 36 tried to ALTER a table that doesn't exist

## Solution

Created a new production SQL file: **`35b_create_tickets_table.sql`**

This file:
1. Creates the `tickets` table with all base columns
2. Creates 5 indexes for performance
3. Enables Row Level Security (RLS)
4. Creates 5 RLS policies for access control
5. Adds documentation comments

## Tickets Table Structure

```sql
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY,

  -- Relationships
  event_id UUID → events(id)
  user_id UUID → user_profiles(id)
  registration_id UUID → registrations(id)  -- Will be updated in migration 40

  -- Ticket details
  ticket_number VARCHAR(50) UNIQUE
  ticket_type VARCHAR(50)
  qr_code_data TEXT
  pdf_url TEXT

  -- Attendee info (denormalized)
  attendee_name VARCHAR(255)
  attendee_email VARCHAR(255)
  attendee_organization VARCHAR(255)

  -- Status
  is_valid BOOLEAN

  -- Timestamps
  generated_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
);
```

## Migration Order

The correct order is now:

1. **File 35:** `35_registration_redesign_phase1_to_5.sql`
   - Creates: user_profiles, registrations, form_templates, form_responses, review_locks, activity_logs

2. **File 35b:** `35b_create_tickets_table.sql` ⭐ **NEW FILE**
   - Creates: tickets table with base columns

3. **File 36:** `36_tickets_table_enhancements.sql`
   - Adds: status, checked_in_at, checked_in_by, downloaded_at, download_count columns
   - Creates: check-in functions

4. **File 40:** `40_fix_tickets_foreign_key.sql`
   - Fixes: registration_id foreign key to point to form_responses instead of registrations

## What to Do

### Option 1: Run File 35b Only (Recommended if 35 already ran)
```sql
-- If you already ran file 35, just run the new file:
\i 35b_create_tickets_table.sql
```

### Option 2: Run in Sequence (Fresh database)
```sql
-- For fresh database, run in order:
\i 35_registration_redesign_phase1_to_5.sql
\i 35b_create_tickets_table.sql
\i 36_tickets_table_enhancements.sql
-- ... continue with remaining files
```

## Verification

After running `35b_create_tickets_table.sql`, verify:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'tickets'
);
-- Expected: true

-- Check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
-- Expected: 14 columns

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'tickets';
-- Expected: 6 indexes (1 primary key + 5 created)

-- Check RLS policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'tickets';
-- Expected: 5 policies
```

## Notes

- The tickets table initially references `registrations(id)` for the foreign key
- Migration 40 will fix this to reference `form_responses(id)` instead
- This matches the development migration structure
- File 36 should now run without errors

---

**Created:** 2025-12-14
**Status:** ✅ Fix applied
**Files Modified:** Added `35b_create_tickets_table.sql`
