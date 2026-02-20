# Table Transition History: What Happened and What Broke

**Created:** 2025-11-27
**Purpose:** Explain the messy table transition from `applications` → `form_responses` → `registrations` confusion

---

## Executive Summary

The system evolved through multiple phases, each introducing new tables. The confusion arose because:

1. **Phase 1-2:** Used `applications` table (deprecated)
2. **Phase 4:** Switched to `form_responses` table (CURRENT ACTIVE TABLE)
3. **Phase 5:** Review system DESIGNED for `registrations` table, but `registrations` was NEVER populated
4. **Bug:** APIs were incorrectly updated to query empty `registrations` table
5. **Fix:** Reverted APIs to use `form_responses` (where data actually lives)

**Current State:** `form_responses` is the active table with all application data.

---

## Timeline of Tables

```
October 2025: applications table created (Phase 1-2)
              └─→ Used for simple applications
              └─→ Still exists but DEPRECATED

November 20, 2025: form_responses table created (Phase 4)
                   └─→ Stores all current applications
                   └─→ Has 3 records currently
                   └─→ THIS IS THE ACTIVE TABLE

November 20, 2025: registrations table created (Phase 1 redesign)
                   └─→ Designed for future use
                   └─→ NEVER POPULATED WITH DATA
                   └─→ EMPTY TABLE

November 21, 2025: Phase 5 review system created
                   └─→ review_locks table created
                   └─→ applications_with_locks view created
                   └─→ Foreign key: review_locks.registration_id → form_responses.id
                   └─→ Correctly references form_responses

November 27, 2025: BUG - APIs incorrectly updated to use registrations
                   └─→ 3 API routes changed from form_responses to registrations
                   └─→ Caused "No registrations found" errors
                   └─→ REVERTED same day
```

---

## The Three Tables Explained

### 1. `applications` (DEPRECATED)

**Created:** October 2025 (Phase 2)
**Status:** DEPRECATED - Still exists but not used
**Purpose:** Original simple application storage

```sql
-- From 20251020_initial_schema.sql
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization VARCHAR(255),
  role VARCHAR(100),
  answers JSONB DEFAULT '{}',
  status application_status DEFAULT 'pending',
  -- ...simple structure
);
```

**Why Deprecated:** The redesign required a more sophisticated form system with:
- Auto-save functionality
- Resume tokens
- Multi-stage workflow
- Dynamic form builder support

---

### 2. `form_responses` (ACTIVE - CURRENT TABLE)

**Created:** November 20, 2025 (Phase 4)
**Status:** ACTIVE - All current applications stored here
**Purpose:** Store responses to dynamic registration forms

```sql
-- From 20251120_phase4_form_responses.sql
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Form identification
  template_id UUID NOT NULL REFERENCES public.form_templates(id),
  event_id UUID NOT NULL REFERENCES public.events(id),

  -- User identification
  respondent_email VARCHAR(255) NOT NULL,
  respondent_name VARCHAR(255),

  -- Response data (JSONB - stores all question responses)
  responses JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'draft',

  -- Auto-save support
  resume_token VARCHAR(255) UNIQUE,

  -- ...plus many more fields added in Phase 5
);
```

**Current Data:**
```
| ID                                   | Name         | Email                     | Status_v2   |
|--------------------------------------|--------------|---------------------------|-------------|
| f94b7e3c-83dc-4ff9-a56b-efad5f08eea9 | KELVIN GITHU | kelvingithu019@gmail.com  | interested  |
| 64d76b99-24af-442d-8d8c-4f85d60b9f35 | KELVIN GITHU | kelvingithu019@gmail.com  | interested  |
| 38b92f81-f7f0-4912-9714-7e5e663711ea | KELVIN GITHU | kelvingithu019@gmail.com  | interested  |
```

---

### 3. `registrations` (PLANNED BUT UNUSED)

**Created:** November 20, 2025 (Phase 1 redesign)
**Status:** EXISTS BUT EMPTY - Never populated
**Purpose:** Designed to be the "master" registration record linking to form_responses

```sql
-- From 20251120000000_registration_redesign.sql
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID REFERENCES public.events(id),
  user_id UUID REFERENCES public.user_profiles(id),

  -- Status tracking
  status registration_status DEFAULT 'interested',

  -- Form responses (links to form_responses table)
  initial_form_response_id UUID,  -- Never populated
  detailed_form_response_id UUID, -- Never populated

  -- ...designed but never used
);
```

**Why Never Used:**
The original design planned for `registrations` to be a "master record" that would link to multiple form responses. However:
1. The Phase 4 `form_responses` table was built to work standalone
2. The form submission API was written to save directly to `form_responses`
3. No migration was ever run to create registrations from form_responses
4. The table exists but has 0 records

---

## What Broke and Why

### The Bug (November 27, 2025)

During a session earlier today, 3 API routes were incorrectly updated:

```diff
# WRONG CHANGE (what was done):
- .from('form_responses')
+ .from('registrations')
```

**Files affected:**
1. `src/app/api/admin/applications/[id]/decision/route.ts`
2. `src/app/api/admin/applications/[id]/shortlist/route.ts`
3. `src/app/api/admin/applications/bulk/reject/route.ts`

**Why it broke:**
- `registrations` table has 0 records
- `form_responses` table has 3 records
- APIs queried empty table → returned "No registrations found"

### The Fix (Same Day)

Commit `0683327` reverted the changes:

```diff
# CORRECT FIX (reverted to):
- .from('registrations')
+ .from('form_responses')
```

Plus additional fixes:
- Changed `status` → `status_v2` (correct column for review workflow)
- Updated variable names and error messages
- Used `respondent_name` and `respondent_email` columns (native to form_responses)

---

## The Confusion Source

The confusion came from **two competing design patterns**:

### Pattern A: Separate Registrations Table (Design)
```
user_profiles
     │
     ▼
registrations (master record)
     │
     ├──► initial_form_response_id ──► form_responses
     │
     └──► detailed_form_response_id ──► form_responses
```

This pattern was DESIGNED in `20251120000000_registration_redesign.sql` but NEVER IMPLEMENTED.

### Pattern B: Direct Form Responses (Actual Implementation)
```
form_responses (contains everything)
     │
     ├── respondent_name
     ├── respondent_email
     ├── status_v2 (review workflow status)
     ├── responses (JSONB with all answers)
     ├── reviewed_by, reviewed_at
     ├── shortlisted_by, shortlisted_at
     └── approved_at, rejected_at
```

This pattern is what was ACTUALLY BUILT and is in production.

---

## Proof: Foreign Key Points to form_responses

The definitive proof is in `SUCCESSFUL_FIX_RUN_THIS.sql` (lines 50-55):

```sql
ALTER TABLE public.review_locks
ADD CONSTRAINT review_locks_registration_id_fkey
  FOREIGN KEY (registration_id)
  REFERENCES public.form_responses(id)  -- ← PROOF!
  ON DELETE CASCADE;
```

Even though the column is named `registration_id`, it references `form_responses.id`.

---

## The View That Powers Admin Panel

The admin panel uses `applications_with_locks` view (lines 146-161):

```sql
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
FROM form_responses fr  -- ← Uses form_responses!
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;
```

---

## Current State Summary

| Table | Status | Records | Used By |
|-------|--------|---------|---------|
| `applications` | DEPRECATED | Unknown | Nothing (legacy) |
| `form_responses` | ACTIVE | 3 | Admin panel, APIs, view |
| `registrations` | UNUSED | 0 | Nothing |

---

## What Still Needs Fixing

The table transition is now CORRECT (APIs use form_responses), but there's still one issue:

**Admin panel shows no applications** even though 3 exist in database.

**Root Cause:** Likely permissions/RLS blocking the `applications_with_locks` view.

**Fix:** Run `DIAGNOSTIC_AND_FIX.sql` which includes:
```sql
-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;

-- Ensure RLS allows access
CREATE POLICY "Allow authenticated users to view all applications"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (true);
```

---

## Lessons Learned

1. **Always check existing schema before assuming table structure**
   - Read migration files in `supabase/migrations/`
   - Check foreign key constraints to understand relationships

2. **Design vs Implementation can diverge**
   - `registrations` was designed but never implemented
   - `form_responses` was the actual implementation

3. **Column names can be misleading**
   - `review_locks.registration_id` actually points to `form_responses.id`
   - The name is historical, not functional

4. **Follow the data**
   - When debugging, always verify which table has actual records
   - Empty table = something is wrong

---

## File References

| Migration | Purpose |
|-----------|---------|
| `20251020_initial_schema.sql` | Created `applications` (deprecated) |
| `20251120000000_registration_redesign.sql` | Created `registrations` (unused) |
| `20251120_phase4_form_responses.sql` | Created `form_responses` (ACTIVE) |
| `20251121040000_phase5_review_system.sql` | Added review columns to `form_responses` |
| `SUCCESSFUL_FIX_RUN_THIS.sql` | Fixed foreign keys, created view |

---

## Quick Reference for Future

**Which table to use for applications?**
→ Always use `form_responses`

**Which status column to use?**
→ Use `status_v2` (registration_status_v2 enum)

**Which view for admin panel?**
→ Use `applications_with_locks`

**What about registrations table?**
→ Ignore it - exists but empty, not used
