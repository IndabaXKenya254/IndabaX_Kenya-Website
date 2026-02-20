# Root Cause Analysis: Admin Panel Showing No Applications

**Date:** 2025-11-27
**Issue:** Admin panel at `/admin/applications` shows 0 applications despite 3 existing in database

---

## Summary

The `applications_with_locks` view in the database is querying the empty `registrations` table instead of `form_responses` table (where data actually lives).

---

## Timeline of What Happened

### 10 Hours Ago (Commit `a2d015f`)
**Action:** Created migration `20251127000004_migrate_form_responses_to_registrations.sql`

**What it did:**
1. Created migration to copy data from `form_responses` → `registrations`
2. Recreated `applications_with_locks` view to query from `registrations`
3. Updated API code to work with new view

**Migration was executed on database** - View now points to `registrations`

### 8 Hours Ago (Commit `0683327`)
**Action:** Reverted the changes

**What it did:**
1. Reverted 3 API routes back to query `form_responses`
2. **DELETED** the migration file `20251127000004_migrate_form_responses_to_registrations.sql`
3. Updated code comments

**What it DIDN'T do:**
- Did NOT revert the view in the database
- View still points to `registrations` table (empty)

---

## Current State

### Code (Correct) ✅
```typescript
// src/app/api/admin/applications/route.ts:46
let query = supabase
  .from('applications_with_locks')  // Queries the view
  .select(...)
```

### Database (BROKEN) ❌

**View Definition (IN DATABASE NOW):**
```sql
CREATE VIEW applications_with_locks AS
SELECT ... FROM registrations  -- ← WRONG! This table is empty
```

**Should Be:**
```sql
CREATE VIEW applications_with_locks AS
SELECT ... FROM form_responses  -- ← CORRECT! This has 3 records
```

---

## Evidence

### Test 1: Direct Query to form_responses
```sql
SELECT COUNT(*) FROM form_responses;
-- Result: 3 ✅
```

### Test 2: Direct Join (what view should do)
```sql
SELECT COUNT(*) FROM form_responses fr
LEFT JOIN review_locks rl ON rl.registration_id = fr.id;
-- Result: 3 ✅
```

### Test 3: Query the View
```sql
SELECT COUNT(*) FROM applications_with_locks;
-- Result: 0 ❌ (BROKEN!)
```

### Test 4: Check registrations table
```sql
SELECT COUNT(*) FROM registrations;
-- Result: 0 (Empty as expected)
```

---

## Why This Happened

1. **Migration was run** - Changed view to point to `registrations`
2. **Data was NOT migrated** - `registrations` table stayed empty
3. **Code was reverted** - But database changes were not reverted
4. **Migration file deleted** - Lost the ability to see what changed

**Classic mistake:** Changed database schema but didn't migrate the data.

---

## The Fix

We need to recreate the `applications_with_locks` view to query from `form_responses`:

```sql
DROP VIEW IF EXISTS applications_with_locks CASCADE;

CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  up.email AS locked_by_email,
  up.name AS locked_by_name
FROM form_responses fr  -- ← Changed back to form_responses
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;

-- Grant access
GRANT SELECT ON applications_with_locks TO authenticated;
GRANT SELECT ON applications_with_locks TO anon;
```

---

## Verification Steps

After running the fix:

1. **Query the view:**
   ```sql
   SELECT COUNT(*) FROM applications_with_locks;
   -- Should return: 3
   ```

2. **Check sample data:**
   ```sql
   SELECT id, respondent_name, respondent_email, status_v2
   FROM applications_with_locks
   LIMIT 5;
   -- Should show 3 KELVIN GITHU records
   ```

3. **Refresh admin panel:**
   - Navigate to http://localhost:3001/admin/applications
   - Should see 3 applications

---

## Lessons Learned

1. **Never delete migration files** - Even when reverting, keep them for reference
2. **Database changes need database reverts** - Reverting code doesn't revert database
3. **Verify data migration before changing schema** - Check that data actually moved
4. **Test the full flow** - Don't just test the code, test the database queries too

---

## Related Files

- **Migration (deleted):** `supabase/migrations/20251127000004_migrate_form_responses_to_registrations.sql`
- **API Route:** `src/app/api/admin/applications/route.ts`
- **View Definition (correct):** `supabase/migrations/SUCCESSFUL_FIX_RUN_THIS.sql:146-161`
- **Fix SQL:** `supabase/migrations/FIX_VIEW_POINTS_TO_WRONG_TABLE.sql` (to be created)
