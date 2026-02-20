# Complete Schema Validation - ALL Issues Found

## Date: 2025-12-14

This document lists **EVERY** schema mismatch between file 35 and dev database.

---

## 🔴 Critical Issues Found in File 35

File 35 (`35_registration_redesign_phase1_to_5.sql`) was supposed to replicate the dev migration but has **MAJOR schema errors**:

### Issue #1: `form_templates` - Missing Columns

**File 35 created (WRONG):**
```sql
form_templates (
  id, name, description,
  template_data,  ← SHOULD NOT EXIST
  is_active,      ← SHOULD NOT EXIST
  created_by → auth.users,  ← WRONG FK
  created_at, updated_at
)
```

**Dev has (CORRECT):**
```sql
form_templates (
  id, name, description,
  is_locked,              ← MISSING!
  locked_to_event_id,     ← MISSING!
  usage_type,             ← MISSING! (causes file 42 error)
  settings,
  created_by → user_profiles,
  created_at, updated_at
)
```

**Fixed in:** `35d_fix_form_templates_schema.sql`

---

### Issue #2: `registrations` - Wrong Columns

**File 35 created (WRONG - 21 columns):**
```sql
registrations (
  id, event_id, user_id, status,
  initial_form_response_id,  ← NO FK!
  detailed_form_response_id, ← NO FK!
  paper_id,                  ← NO FK!
  reviewed_by, review_notes, reviewed_at,
  shortlisted_by, shortlisted_at,
  approved_by,
  approved_at,      ← EXTRA! (not in dev)
  rejected_by,
  rejected_at,      ← EXTRA! (not in dev)
  rejection_reason, ← EXTRA! (not in dev)
  ticket_sent_at,   ← EXTRA! (not in dev)
  attended_at,      ← EXTRA! (not in dev)
  created_at,       ← EXTRA! (not in dev)
  updated_at
)
```

**Dev has (CORRECT - 19 columns):**
```sql
registrations (
  id, event_id, user_id, status,
  initial_form_response_id → form_responses,
  detailed_form_response_id → form_responses,
  paper_id → papers,
  reviewed_by, review_notes, reviewed_at,
  shortlisted_by, shortlisted_at,
  approved_by,
  rejected_by,
  decision_at,      ← MISSING in file 35!
  decision_notes,   ← MISSING in file 35!
  ticket_id,        ← MISSING in file 35!
  registered_at,    ← MISSING in file 35!
  updated_at
)
```

**Problems:**
1. ❌ Missing 4 columns: `decision_at`, `decision_notes`, `ticket_id`, `registered_at`
2. ❌ Has 6 extra columns not in dev
3. ❌ Missing 3 FK constraints

**Fixed in:** `35e_comprehensive_schema_fixes.sql`

---

### Issue #3: `form_responses` - Wrong Data Types

**File 35 created:**
```sql
status VARCHAR(50) DEFAULT 'draft'    ← WRONG TYPE!
submitted_at TIMESTAMPTZ              ← EXTRA! (not in dev)
```

**Dev has:**
```sql
status response_status DEFAULT 'not_started'  ← ENUM, not VARCHAR!
(no submitted_at column)
```

**Fixed in:** `35e_comprehensive_schema_fixes.sql`

---

### Issue #4: `review_locks` - Wrong Foreign Key

**File 35 created:**
```sql
locked_by UUID REFERENCES auth.users(id)  ← WRONG!
```

**Dev has:**
```sql
locked_by UUID REFERENCES user_profiles(id)  ← CORRECT!
```

**Fixed in:** `35e_comprehensive_schema_fixes.sql`

---

### Issue #5: Missing Tables

**File 35 completely omitted these tables:**
1. `form_questions`
2. `form_answers`
3. `reviewers` ← Caused "reviewers does not exist" error
4. `papers`

**Fixed in:** `35c_add_missing_tables.sql`

---

### Issue #6: `activity_logs` - Wrong Column Name

**File 35 originally created:**
```sql
actor_id UUID REFERENCES auth.users(id)  ← WRONG!
action VARCHAR(100)                      ← Should be activity_type
```

**Dev has:**
```sql
user_id UUID REFERENCES user_profiles(id)  ← CORRECT!
activity_type VARCHAR(100)
user_email VARCHAR(255)
metadata JSONB
```

**Fixed in:** `35_registration_redesign_phase1_to_5.sql` (modified) + `41c_fix_activity_logs_column.sql`

---

## ✅ Complete Fix Sequence

Run these files in **EXACT** order after file 35:

```
35  - registration_redesign_phase1_to_5.sql
35b - create_tickets_table.sql                    (adds tickets table)
35c - add_missing_tables.sql                      (adds 4 missing tables)
35d - fix_form_templates_schema.sql               (fixes form_templates)
35e - comprehensive_schema_fixes.sql              (fixes registrations, form_responses, review_locks)
36  - tickets_table_enhancements.sql
...
41c - fix_activity_logs_column.sql                (renames actor_id → user_id)
42  - performance_optimization_indexes.sql        (should now work!)
```

---

## 📊 Summary of ALL Fixes

| Fix File | Tables Fixed | Issues Resolved |
|----------|-------------|-----------------|
| `35b` | tickets | Table missing entirely |
| `35c` | form_questions, form_answers, reviewers, papers | 4 tables missing |
| `35d` | form_templates | Missing 3 columns, wrong 2 columns, wrong FK |
| `35e` | registrations, form_responses, review_locks | Wrong columns, wrong types, wrong FKs |
| `41c` | activity_logs | Wrong column name, wrong FK |

**Total Issues Fixed:** 15+ schema problems

---

## 🔍 Validation Query

After running all fixes, verify schema matches dev:

```sql
-- 1. Check all tables exist (should be 40)
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

-- 2. Check form_templates has correct columns
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'form_templates'
ORDER BY ordinal_position;
-- Should include: usage_type, is_locked, locked_to_event_id

-- 3. Check registrations has correct columns
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'registrations'
ORDER BY ordinal_position;
-- Should have: decision_at, decision_notes, ticket_id, registered_at
-- Should NOT have: approved_at, rejected_at, rejection_reason, ticket_sent_at, attended_at, created_at

-- 4. Check form_responses.status is ENUM
SELECT data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'form_responses'
  AND column_name = 'status';
-- Should return: USER-DEFINED (not character varying)

-- 5. Check review_locks.locked_by FK
SELECT ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'review_locks'
  AND tc.constraint_name = 'review_locks_locked_by_fkey';
-- Should return: user_profiles (not users)
```

---

## ⚠️ Why This Happened

File 35 was created as a "consolidation" of the dev migration, but:

1. **Incomplete port** - Some tables were completely omitted
2. **Wrong schema** - Used old/draft schemas instead of final dev schemas
3. **Mixed sources** - Appears to have mixed different migration versions
4. **No validation** - Never validated column-by-column against dev

**Lesson:** Always do schema-level comparison, not just table-level!

---

**Created:** 2025-12-14
**Status:** ✅ All issues identified and fixed
**Files Created:** 35b, 35c, 35d, 35e, 41c
**Total Schema Mismatches:** 15+
**Production Ready:** After running all fix files in sequence
