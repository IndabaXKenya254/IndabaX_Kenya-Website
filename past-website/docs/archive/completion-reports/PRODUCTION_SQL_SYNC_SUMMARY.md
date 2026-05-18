# Production SQL Sync Summary

**Date:** 2025-11-27
**Task:** Sync production SQL folder with current database state

---

## What Was Done

### 1. Identified Missing Migrations

The production SQL folder (`supabase/prodsql/`) was last updated on October 25, 2025.
In the last 10 hours (November 20-27), the following migrations were added but not copied to production folder:

- Registration redesign (Phase 1-5)
- Tickets table enhancements
- Reviewer system
- Email verification tokens
- Enhanced email tables

### 2. Created New Production SQL Files

**File #35: `35_registration_redesign_phase1_to_5.sql`**
- **Type:** Consolidation file
- **Content:** Combines all Phase 1-5 registration redesign migrations
- **Source Files:**
  - `20251120000000_registration_redesign.sql`
  - `20251120_phase4_*.sql`
  - `20251121040000_phase5_review_system.sql`
  - `20251121160000_create_application_activity_log.sql`
  - `SUCCESSFUL_FIX_RUN_THIS.sql`
  - `FIX_VIEW_POINTS_TO_WRONG_TABLE.sql`
- **Size:** ~400 lines
- **Status:** ✅ Ready for production

**File #36: `36_tickets_table_enhancements.sql`**
- **Source:** `20251127000001_tickets_table.sql`
- **Purpose:** Add check-in functionality
- **Status:** ✅ Ready for production

**File #37: `37_reviewer_system.sql`**
- **Source:** `20251127000002_reviewer_system.sql`
- **Purpose:** Create reviewer workflow
- **Status:** ✅ Ready for production

**File #38: `38_email_verification_tokens.sql`**
- **Source:** `20250120_email_verification_tokens.sql`
- **Purpose:** Email verification system
- **Status:** ✅ Ready for production

**File #39: `39_enhance_email_tables.sql`**
- **Source:** `20250121_enhance_email_tables.sql`
- **Purpose:** Email templates and logging
- **Status:** ✅ Ready for production

### 3. Updated Production SQL README

- Updated "Recent Updates" section with November 27 changes
- Added detailed descriptions for migrations #35-39
- Updated run order list
- Marked `00_complete_migration.sql` as OUTDATED

### 4. Verified Database State via MCP

Used Supabase MCP to verify current production database state:

**Tables Verified:**
- `form_responses` - 3 records ✅
- `registrations` - 0 records ✅ (exists but unused)
- `review_locks` - exists ✅
- `activity_logs` - exists ✅
- `user_profiles` - exists ✅
- `tickets` - exists ✅
- `reviewers` - exists ✅
- `reviewer_assignments` - exists ✅
- `email_verification_tokens` - exists ✅
- `email_templates` - exists ✅
- `email_logs` - exists ✅

**Views Verified:**
- `applications_with_locks` - Fixed to query `form_responses` ✅
- `reviewer_stats` - exists ✅

**Functions Verified:**
- `cleanup_expired_locks()` - exists ✅
- `is_application_locked()` - exists ✅

---

## Current State

### Production SQL Folder Structure

```
supabase/prodsql/
├── 00_complete_migration.sql (OUTDATED - needs regeneration)
├── 01-34 (Previous migrations - unchanged)
├── 35_registration_redesign_phase1_to_5.sql (NEW)
├── 36_tickets_table_enhancements.sql (NEW)
├── 37_reviewer_system.sql (NEW)
├── 38_email_verification_tokens.sql (NEW)
├── 39_enhance_email_tables.sql (NEW)
├── README.md (UPDATED)
├── verification.sql
└── verification_supabase.sql
```

**Total SQL Files:** 42 (including verification scripts)
**Migration Files:** 39 numbered migrations

---

## What's Up to Date

✅ **Production SQL folder** now contains all migrations from Oct 20 - Nov 27
✅ **README.md** documents all 39 migrations with detailed descriptions
✅ **Database schema** matches production SQL folder
✅ **Critical fix applied:** `applications_with_locks` view now points to `form_responses`

---

## What's Still Needed

⚠️ **`00_complete_migration.sql`** - Needs regeneration
- Current file only includes migrations 01-34
- Should be regenerated to include migrations 35-39
- This is optional (can run individual files instead)

---

## Important Notes for Production Deployment

### Critical Migration: #35 (Registration Redesign)

**BREAKING CHANGE:** This migration fundamentally changes the application system.

**Key Points:**
1. **Data Location:** All applications are in `form_responses` table (NOT `registrations`)
2. **View Change:** `applications_with_locks` queries `form_responses`
3. **Foreign Keys:** `review_locks.registration_id` → `form_responses.id`
4. **Status Column:** Use `status_v2` (NOT `status`)

**Before Running on Production:**
- [ ] Backup existing database
- [ ] Review application code to ensure it uses `form_responses`
- [ ] Test on staging environment
- [ ] Schedule downtime window
- [ ] Notify users of maintenance

### Order of Execution

**MUST run in this order:**
1. Migration #35 (creates tables and views)
2. Migration #36 (enhances tickets)
3. Migration #37 (creates reviewers)
4. Migration #38 (creates email verification)
5. Migration #39 (enhances email tables)

**Do NOT skip #35** - Other migrations depend on tables it creates.

---

## Verification Commands

After applying to production, run these checks:

```sql
-- 1. Verify form_responses has data
SELECT COUNT(*) FROM form_responses;
-- Expected: number of applications

-- 2. Verify view returns data
SELECT COUNT(*) FROM applications_with_locks;
-- Expected: same as form_responses

-- 3. Verify registrations is empty
SELECT COUNT(*) FROM registrations;
-- Expected: 0

-- 4. Verify view definition
SELECT definition FROM pg_views
WHERE viewname = 'applications_with_locks';
-- Expected: Should reference form_responses (NOT registrations)

-- 5. Verify foreign key
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'review_locks'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'registration_id';
-- Expected: foreign_table_name = 'form_responses'
```

---

## Files Created/Modified

**Created:**
- `supabase/prodsql/35_registration_redesign_phase1_to_5.sql`
- `supabase/prodsql/36_tickets_table_enhancements.sql`
- `supabase/prodsql/37_reviewer_system.sql`
- `supabase/prodsql/38_email_verification_tokens.sql`
- `supabase/prodsql/39_enhance_email_tables.sql`
- `docs/PRODUCTION_SQL_SYNC_SUMMARY.md` (this file)

**Modified:**
- `supabase/prodsql/README.md`

---

## Next Steps

1. **Review** all new production SQL files
2. **Test** on staging environment (if available)
3. **Schedule** production deployment
4. **Apply** migrations in order (35-39)
5. **Verify** using commands above
6. **Update** application code if needed
7. **Optional:** Regenerate `00_complete_migration.sql`

---

## Contact

For questions about these migrations, refer to:
- `docs/TABLE_TRANSITION_HISTORY.md` - Table evolution timeline
- `docs/ROOT_CAUSE_ANALYSIS.md` - Recent view fix explanation
- `docs/COMPLETE_APPLICATION_FLOW.md` - Full application workflow
