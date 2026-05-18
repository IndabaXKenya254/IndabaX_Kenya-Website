# Missing Tables Fix - File 35c

## Problem

**Error:** `ERROR: 42P01: relation "reviewers" does not exist`

**Root Cause:** File 35 (`35_registration_redesign_phase1_to_5.sql`) was consolidated from the dev migration `20251120000000_registration_redesign.sql` but accidentally omitted 4 critical tables.

## Missing Tables

The following tables exist in dev but were NOT created in file 35:

### 1. `form_questions`
- **Purpose:** Questions within form templates (Google Forms style)
- **Referenced by:** form_answers, form builder UI
- **Created in dev:** Line 220 of `20251120000000_registration_redesign.sql`
- **Criticality:** HIGH - Form builder won't work without this

### 2. `form_answers`
- **Purpose:** Individual answers to form questions
- **Status:** UNUSED in current implementation (denormalized in form_responses.responses JSONB)
- **Created in dev:** Line 305 of `20251120000000_registration_redesign.sql`
- **Criticality:** LOW - Reserved for future use, not actively used

### 3. `reviewers`
- **Purpose:** Reviewer assignments to events with permissions
- **Referenced by:** Files 42, 43, 44 (ANALYZE statements)
- **Created in dev:** Line 362 of `20251120000000_registration_redesign.sql`
- **Criticality:** HIGH - Reviewer system won't work without this

### 4. `papers`
- **Purpose:** Paper submissions (optional part of registration)
- **Referenced by:** registrations.paper_id foreign key
- **Created in dev:** Line 505 of `20251120000000_registration_redesign.sql`
- **Criticality:** MEDIUM - Optional feature, but FK constraint will fail

## Solution

**Created File:** `35c_add_missing_tables.sql`

**Run Order:**
```
35  - registration_redesign_phase1_to_5.sql
35b - create_tickets_table.sql
35c - add_missing_tables.sql          ← NEW FILE
36  - tickets_table_enhancements.sql
...
```

## File 35c Contents

### Tables Created:

1. **form_questions**
   - Primary key: id (UUID)
   - Foreign keys: template_id → form_templates(id)
   - Columns: type (question_type enum), title, description, is_required, order_index, config (JSONB), validation_rules (JSONB), conditional_logic (JSONB)
   - Indexes: idx_form_questions_template (template_id, order_index)

2. **form_answers**
   - Primary key: id (UUID)
   - Foreign keys: response_id → form_responses(id), question_id → form_questions(id)
   - Columns: text_answer, number_answer, date_answer, json_answer (JSONB), file_answer (JSONB)
   - Indexes: idx_form_answers_response, idx_form_answers_question

3. **reviewers**
   - Primary key: id (UUID)
   - Foreign keys: user_id → user_profiles(id), event_id → events(id), added_by → user_profiles(id)
   - Columns: permissions (JSONB), applications_reviewed (INTEGER), last_active_at
   - Constraint: UNIQUE(user_id, event_id) - prevents duplicate assignments
   - Indexes: idx_reviewers_event_id, idx_reviewers_user_id

4. **papers**
   - Primary key: id (UUID)
   - Foreign keys: user_id → user_profiles(id), event_id → events(id), registration_id → registrations(id), reviewed_by → user_profiles(id)
   - Columns: title, abstract, keywords (TEXT[]), paper_url, supplementary_files (JSONB), status (paper_status enum), review_notes, reviewed_at
   - Indexes: idx_papers_event_id, idx_papers_user_id, idx_papers_registration_id

### Foreign Key Constraints Added:

- `registrations.paper_id` → `papers.id` (ON DELETE SET NULL)
  - This FK was missing because papers table didn't exist yet

### RLS Policies:

All tables have RLS enabled with appropriate policies:
- **form_questions:** Authenticated users can view
- **form_answers:** Users can view/insert their own answers
- **reviewers:** Authenticated users can view (for permission checks)
- **papers:** Users can view/insert their own papers

## Validation After Running 35c

Run these queries to verify tables were created:

```sql
-- Check all 4 tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('form_questions', 'form_answers', 'reviewers', 'papers')
ORDER BY tablename;

-- Should return 4 rows:
-- form_answers
-- form_questions
-- papers
-- reviewers
```

## Impact on Subsequent Files

### Files that reference these tables:

- **File 37:** `reviewer_system.sql` - Uses reviewer_assignments (different table, already created in 37)
- **File 42:** `performance_optimization_indexes.sql` - ANALYZE reviewers (line 377)
- **File 43:** `additional_performance_indexes.sql` - ANALYZE reviewers (line 217)
- **File 44:** `rebuild_all_indexes.sql` - Will reference these tables

### Files that will now work correctly:

- Files 42, 43, 44 will no longer fail on `ANALYZE reviewers`
- Any future migrations that reference papers, form_questions, or form_answers

## Why This Happened

File 35 was created as a consolidation of the dev migration `20251120000000_registration_redesign.sql`. During consolidation, these 4 tables were accidentally omitted, possibly because:

1. **form_questions/form_answers** - Might have been considered "optional" since form_responses uses denormalized JSONB storage
2. **reviewers** - Was added in a later section of the migration and overlooked
3. **papers** - Optional feature, might have been skipped intentionally but FK constraint still references it

## Testing Checklist

After running file 35c, verify:

- ✅ All 4 tables exist in database
- ✅ RLS policies are enabled
- ✅ Indexes are created
- ✅ Foreign key constraints work (try inserting test data)
- ✅ Files 42, 43, 44 run without errors
- ✅ Reviewer system can assign reviewers to events
- ✅ Form builder can create questions
- ✅ Paper submission form works (if enabled)

## Related Files

- **Source Migration:** `/supabase/migrations/20251120000000_registration_redesign.sql`
- **Production File 35:** `35_registration_redesign_phase1_to_5.sql`
- **Fix File:** `35c_add_missing_tables.sql`
- **Other Fixes:** `35b_create_tickets_table.sql` (tickets table was also missing)

---

**Created:** 2025-12-14
**Status:** ✅ Fixed
**Files Modified:** Created `35c_add_missing_tables.sql`
