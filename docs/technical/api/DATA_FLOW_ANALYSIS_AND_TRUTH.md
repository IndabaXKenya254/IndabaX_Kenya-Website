# DATA FLOW ANALYSIS - THE COMPLETE TRUTH

**Date:** 2025-11-27
**Status:** DEFINITIVE ANALYSIS
**Purpose:** Document the ACTUAL vs INTENDED data flow to prevent future confusion

---

## 🔍 THE TRUTH: WHAT IS ACTUALLY RUNNING IN PRODUCTION

### **ACTIVE SYSTEM (Phase 4 - Currently in Production)**

#### **Primary Table: `form_responses`**
**Location:** Supabase database (production)
**Created:** Phase 4 implementation
**Status:** ✅ ACTIVE, HAS DATA (3 confirmed records)

**Schema:**
```sql
CREATE TABLE form_responses (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES form_templates(id),
  user_id UUID REFERENCES user_profiles(id),
  event_id UUID NOT NULL REFERENCES events(id),

  -- Response tracking
  status response_status DEFAULT 'not_started', -- not_started, in_progress, completed
  response_type VARCHAR(50) DEFAULT 'initial_interest', -- initial_interest, detailed_survey

  -- User identification
  respondent_email VARCHAR(255),
  respondent_name VARCHAR(255),

  -- Response data
  responses JSONB DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,

  -- Phase 5 additions: Review workflow
  status_v2 registration_status_v2, -- interested, pending, shortlisted, survey_sent, survey_completed, approved, rejected, attended
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  shortlisted_by UUID REFERENCES auth.users(id),
  shortlisted_at TIMESTAMPTZ,
  decision_by UUID REFERENCES auth.users(id),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Auto-save support
  resume_token VARCHAR(255) UNIQUE,
  last_saved_at TIMESTAMPTZ,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Facts:**
- ✅ Contains REAL user application data (3 records confirmed)
- ✅ Has dual status system: `status` (form completion) + `status_v2` (review workflow)
- ✅ Referenced by `review_locks.registration_id` foreign key
- ✅ Queried by `applications_with_locks` view
- ✅ Used by ALL admin APIs (list, detail, bulk operations)

#### **Lock System: `review_locks`**
**Foreign Key:**
```sql
ALTER TABLE review_locks
ADD CONSTRAINT review_locks_registration_id_fkey
  FOREIGN KEY (registration_id)
  REFERENCES form_responses(id) ON DELETE CASCADE;
```

**Proof:** See `/supabase/migrations/SUCCESSFUL_FIX_RUN_THIS.sql:50-55`

#### **View: `applications_with_locks`**
**Definition:**
```sql
CREATE OR REPLACE VIEW applications_with_locks AS
SELECT
  fr.*,  -- All columns from form_responses
  rl.id AS lock_id,
  rl.locked_by AS locked_by_user_id,
  rl.locked_at,
  rl.expires_at AS lock_expires_at,
  (rl.id IS NOT NULL) AS is_locked,
  (rl.locked_by = auth.uid()) AS is_locked_by_me,
  up.email AS locked_by_email,
  up.name AS locked_by_name
FROM form_responses fr  -- ← QUERIES form_responses
LEFT JOIN review_locks rl ON rl.registration_id = fr.id
LEFT JOIN user_profiles up ON up.id = rl.locked_by;
```

**Proof:** See `/supabase/migrations/SUCCESSFUL_FIX_RUN_THIS.sql:146-161`

---

## 📊 ACTUAL DATA FLOW (What Actually Happens)

### **1. User Submits Application**

**Endpoint:** `POST /api/forms/responses`
**File:** `/src/app/api/forms/responses/route.ts`

**Flow:**
```
User fills form
    ↓
POST /api/forms/responses
    ↓
Validates:
  - User is authenticated
  - Event exists and registration enabled
  - Template exists
    ↓
Creates/Updates record in form_responses:
  - template_id: Form template UUID
  - event_id: Event UUID
  - user_id: Authenticated user
  - respondent_email: User's email
  - respondent_name: User's name
  - responses: JSONB with all answers
  - status: 'completed' (if finished)
  - status_v2: 'interested' (initial workflow status)
  - completion_percentage: Auto-calculated
    ↓
Sends confirmation email
    ↓
Returns form_response ID
```

**Confirmed by:** Reading `/src/app/api/forms/responses/route.ts:270-308`

### **2. Admin Views Applications List**

**Page:** `/admin/applications`
**API:** `GET /api/admin/applications`

**Flow:**
```
Admin opens page
    ↓
GET /api/admin/applications
    ↓
SELECT * FROM applications_with_locks
    ↓
View queries:
  - form_responses (all application data)
  - review_locks (lock status)
  - user_profiles (admin names)
    ↓
Returns array of applications with:
  - Application details (from form_responses)
  - Lock status (is_locked, locked_by, expires_at)
  - Admin info (locked_by_name, locked_by_email)
    ↓
Frontend displays table
```

**Confirmed by:** View definition in `SUCCESSFUL_FIX_RUN_THIS.sql:146-161`

### **3. Admin Clicks Application to Review**

**Page:** `/admin/applications/[id]`
**Lock API:** `POST /api/admin/applications/[id]/lock`

**Flow:**
```
Admin clicks application
    ↓
Page loads with useReviewLock hook
    ↓
POST /api/admin/applications/[id]/lock
    ↓
Calls database function:
  acquire_review_lock(registration_id, user_id, ip_address, 30)
    ↓
Function checks review_locks table:
  - IF no lock exists → INSERT new lock
  - IF locked by same user → UPDATE expires_at (extend)
  - IF locked by other user → RETURN conflict
    ↓
Lock record created:
  {
    registration_id: form_responses.id,
    locked_by: admin user_id,
    expires_at: NOW() + 30 minutes,
    ip_address: request IP
  }
    ↓
Returns lock status to frontend
    ↓
Timer starts counting down from 30:00
```

**Confirmed by:** Reading `/src/hooks/useReviewLock.ts` and lock API

### **4. Admin Makes Decision (Approve/Reject/Shortlist)**

**APIs:**
- `POST /api/admin/applications/[id]/decision` (approve/reject)
- `POST /api/admin/applications/[id]/shortlist` (shortlist)
- `POST /api/admin/applications/bulk/reject` (bulk reject)

**Flow:**
```
Admin clicks decision button
    ↓
POST /api/admin/applications/[id]/decision
Body: { decision: 'approved' | 'rejected', notes: '...' }
    ↓
UPDATE form_responses SET:
  - status_v2 = 'approved' OR 'rejected'
  - decision_by = admin user_id
  - decision_at = NOW()
  - decision_notes = notes
  - approved_by = admin_id (if approved)
  - rejected_by = admin_id (if rejected)
WHERE id = application_id
    ↓
Send email (TODO: not implemented yet)
    ↓
DELETE FROM review_locks WHERE registration_id = application_id
(Lock released automatically)
    ↓
Return success
```

**Confirmed by:** Reading decision API routes

---

## 🏗️ THE INTENDED SYSTEM (Phase 0 Redesign - NOT YET IMPLEMENTED)

### **Target Table: `registrations`**
**Location:** Supabase database (exists but EMPTY)
**Created:** Migration `20251120000000_registration_redesign.sql`
**Status:** ❌ NOT IN USE

**Schema:**
```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES user_profiles(id),

  -- Status tracking (single source of truth)
  status registration_status DEFAULT 'interested', -- interested, pending, shortlisted, survey_sent, survey_completed, approved, rejected, attended

  -- Form responses
  initial_form_response_id UUID REFERENCES form_responses(id),
  detailed_form_response_id UUID REFERENCES form_responses(id),

  -- Paper submission
  paper_id UUID REFERENCES papers(id),

  -- Review tracking
  reviewed_by UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Shortlisting
  shortlisted_by UUID REFERENCES user_profiles(id),
  shortlisted_at TIMESTAMPTZ,

  -- Final decision
  approved_by UUID REFERENCES user_profiles(id),
  rejected_by UUID REFERENCES user_profiles(id),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,

  -- Ticket
  ticket_id UUID REFERENCES tickets(id),

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_event UNIQUE(user_id, event_id)
);
```

**Intended Design Goals:**
1. Single source of truth for registration status
2. Links to form_responses (initial + detailed surveys)
3. Links to papers (for paper submissions)
4. Links to tickets (generated on approval)
5. Prevents duplicate registrations (unique constraint)

**Why It's Not Used:**
- Never migrated data from form_responses
- No APIs write to it
- Admin panel doesn't read from it
- Lock system doesn't reference it

---

## 🚫 THE DEPRECATED SYSTEM (Phase 2 - OLD)

### **Old Table: `applications`**
**Location:** Supabase database (may have old data)
**Created:** Initial schema `20251020_initial_schema.sql`
**Status:** ⚠️ DEPRECATED (marked in schema comments)

**Schema:**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  application_type VARCHAR(50), -- 'registration' | 'call_for_papers'

  -- Personal Info
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  organization VARCHAR(255),
  country VARCHAR(100),

  -- Registration Specific
  ticket_type VARCHAR(50),
  dietary_requirements TEXT,
  tshirt_size VARCHAR(10),
  accessibility_needs TEXT,

  -- Call for Papers Specific
  presentation_type VARCHAR(50),
  presentation_title VARCHAR(255),
  abstract TEXT,
  keywords TEXT,
  track VARCHAR(100),
  bio TEXT,
  linkedin_url TEXT,
  file_url TEXT,

  -- Status (OLD, simple)
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);
```

**Why It's Deprecated:**
- Replaced by `form_responses` (Phase 4)
- No lock system
- No workflow stages
- No auto-save
- No form builder integration

**Data Migration:** Was never done from applications → form_responses

---

## ⚠️ THE CONFUSION: What Went Wrong

### **Problem 1: Multiple Systems Co-existing**
Three tables exist simultaneously:
1. `applications` (old, deprecated)
2. `form_responses` (current, active)
3. `registrations` (future, not used)

### **Problem 2: Misleading Names**
- `form_responses` SOUNDS like it's just for forms
- But it's ACTUALLY the applications table with review workflow
- `registrations` SOUNDS like it should be active
- But it's NOT being used at all

### **Problem 3: Documentation Gaps**
- Phase 5 docs mention "applications" without clarifying which table
- Lock system docs don't explicitly state table names
- Migration scripts reference `registrations` but system uses `form_responses`

### **Problem 4: API Inconsistency (THE BUG YOU FOUND)**
Some API routes were updated to query `registrations`:
- `/api/admin/applications/[id]/decision/route.ts:55` ❌ queries `registrations`
- `/api/admin/applications/bulk/reject/route.ts:87` ❌ queries `registrations`
- `/api/admin/applications/[id]/shortlist/route.ts:47` ❌ queries `registrations`

But the data is in `form_responses`!

Result: **"No registrations found"** error

---

## ✅ THE CORRECT UNDERSTANDING

### **Single Source of Truth:**
```
form_responses = THE applications table
```

### **Correct Terminology:**
- **Application** = A record in `form_responses` table
- **Registration** = A concept (user registering for event), NOT the table name
- **Lock** = A record in `review_locks` referencing `form_responses.id`

### **Data Relationships:**
```
user_profiles (user accounts)
    ↓ user_id
form_responses (applications)
    ← registration_id ←
review_locks (30-min locks)
```

### **Workflow States (`status_v2` column):**
```
interested (initial submission)
    ↓
pending (admin reviewing)
    ↓
shortlisted (passed initial review)
    ↓
survey_sent (detailed survey sent)
    ↓
survey_completed (user completed survey)
    ↓
approved OR rejected (final decision)
    ↓
attended (post-event, marked as attended)
```

---

## 🔧 THE FIX: What Needs to Happen

### **Option A: Keep Current System (RECOMMENDED)**

**What:** Continue using `form_responses` as the applications table

**Why:**
- ✅ Already has data
- ✅ Already integrated with lock system
- ✅ Already used by admin panel
- ✅ Has complete review workflow
- ✅ Minimal changes needed

**Required Changes:**
1. ✅ Revert APIs back to query `form_responses` (not `registrations`)
   - `/api/admin/applications/[id]/decision/route.ts`
   - `/api/admin/applications/bulk/reject/route.ts`
   - `/api/admin/applications/[id]/shortlist/route.ts`

2. ✅ Update documentation to clarify:
   - `form_responses` = applications table
   - `registrations` = not in use (future phase)

3. ✅ Consider renaming (future):
   - `form_responses` → `application_submissions` (clearer name)
   - But not urgent - system works fine as-is

### **Option B: Migrate to `registrations` Table (NOT RECOMMENDED)**

**What:** Migrate all data from `form_responses` → `registrations`

**Why NOT to do this:**
- ❌ Complex migration (3 records now, but could be hundreds)
- ❌ Need to update ALL APIs
- ❌ Need to recreate `applications_with_locks` view
- ❌ Need to update lock system foreign keys
- ❌ Risk of data loss
- ❌ Breaks currently working system
- ❌ No clear benefit (form_responses already works)

---

## 📋 ACTION PLAN: Fix the Bug

### **Step 1: Revert Incorrect API Changes**

**Files to fix:**
1. `/src/app/api/admin/applications/[id]/decision/route.ts:55`
   - Change: `.from('registrations')` → `.from('form_responses')`

2. `/src/app/api/admin/applications/bulk/reject/route.ts:87`
   - Change: `.from('registrations')` → `.from('form_responses')`

3. `/src/app/api/admin/applications/[id]/shortlist/route.ts:47`
   - Change: `.from('registrations')` → `.from('form_responses')`

### **Step 2: Test the Fix**

1. Admin panel loads → ✅ Shows 3 applications
2. Click application → ✅ Acquires lock
3. Approve application → ✅ Updates status_v2 to 'approved'
4. Reject application → ✅ Updates status_v2 to 'rejected'
5. Bulk reject → ✅ No more "No registrations found" error

### **Step 3: Update Documentation**

1. Create this document (✅ DONE)
2. Update `MIGRATION_COMPLETE_FLOW_PLAN.md` with correct understanding
3. Add note to `CLAUDE.md` about table naming
4. Update Phase 5 docs to clarify table usage

### **Step 4: Delete Incorrect Migration**

Remove: `/supabase/migrations/20251127000005_migrate_applications_to_registrations.sql`
Reason: Based on incorrect understanding, not needed

---

## 🎯 CONCLUSION

### **THE TRUTH:**
- `form_responses` IS the applications table (has data, is active)
- `registrations` is NOT in use (empty, not integrated)
- `applications` is old/deprecated (Phase 2, replaced by form_responses)

### **THE BUG:**
- Some API routes mistakenly query `registrations` instead of `form_responses`
- Result: "No registrations found" error

### **THE FIX:**
- Revert 3 API routes to query `form_responses`
- Update documentation to prevent future confusion
- Delete incorrect migration file

### **LESSONS LEARNED:**
1. Always check ACTUAL production schema, not just documentation
2. Verify foreign key relationships (they reveal the truth)
3. Check which table has data before making assumptions
4. Table names can be misleading - verify with SQL queries

---

**Status:** Analysis Complete
**Next Action:** Implement Step 1 (Revert API changes)
**Confidence Level:** 100% (Verified with production schema)
