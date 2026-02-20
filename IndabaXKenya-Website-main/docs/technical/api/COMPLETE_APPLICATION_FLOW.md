# COMPLETE APPLICATION FLOW - END TO END

**Created:** 2025-11-27
**Status:** ✅ VERIFIED AND DOCUMENTED
**Purpose:** Complete documentation of the entire application lifecycle

---

## 📊 OVERVIEW

This document maps the **COMPLETE** user application flow from initial submission through admin review, shortlisting, surveys, and final approval/rejection.

**Key Tables:**
- `form_responses` - **ACTIVE** applications table (has data)
- `form_templates` - Question templates for forms
- `form_questions` - Individual questions in templates
- `events` - Event information
- `review_locks` - 30-minute admin review locks
- `user_profiles` - User account information

**Key View:**
- `applications_with_locks` - Joins `form_responses` with `review_locks` and `user_profiles`

---

## 🔄 COMPLETE FLOW DIAGRAM

```
USER SIDE                           ADMIN SIDE                         EMAIL NOTIFICATIONS
═══════════════════════════════════════════════════════════════════════════════════════════

1. User visits event page
   /events/[slug]
   ↓
2. Clicks "Register" button
   → Redirects to /login if not authenticated
   ↓
3. User logs in/registers
   → Supabase Auth creates user
   → user_profiles created
   ↓
4. Redirected to registration form
   /events/[slug]/register
   ↓
5. Form loads:
   - GET /api/events/[slug] → Event details
   - GET /api/forms/templates/[id] → Template
   - GET /api/forms/templates/[id]/questions → Questions
   ↓
6. User fills form
   - Auto-save every 30s
   - POST /api/forms/responses (is_complete: false)
   - status: 'in_progress'
   ↓
7. User submits form
   - POST /api/forms/responses (is_complete: true)
   ↓                                               → Email: Registration confirmation
   DATABASE:                                       → To: respondent_email
   - form_responses created                        → Content: "Application received"
   - template_id: [initial template]
   - event_id: [event UUID]
   - respondent_email: user email
   - respondent_name: user name
   - responses: {...} (JSONB)
   - status: 'completed'
   - status_v2: 'interested' ← INITIAL STATUS
   - is_complete: true
   - user_id: auth user ID
   - created_at: timestamp
                                ↓
                                Admin navigates to:
                                /admin/applications
                                ↓
                                GET /api/admin/applications
                                → Queries applications_with_locks view
                                → Returns list of form_responses
                                ↓
                                Admin sees application list:
                                - Name, Email, Status, Event
                                - Lock status (if locked by another admin)
                                - Created date, completion %
                                ↓
                                Admin clicks to review:
                                /admin/applications/[id]
                                ↓
                                GET /api/admin/applications/[id]
                                → Fetches form_responses by ID
                                → Auto-acquires 30-min lock
                                ↓
                                POST /api/admin/applications/[id]/lock
                                DATABASE:
                                - review_locks created
                                - registration_id: form_responses.id
                                - locked_by: admin user_id
                                - expires_at: NOW() + 30 minutes
                                ↓
                                Admin reviews application
                                - Sees all responses from JSONB
                                - Timer shows lock countdown
                                - Can add review notes
                                ↓
                                ADMIN DECISION #1: SHORTLIST
                                ↓
                                POST /api/admin/applications/[id]/shortlist
                                DATABASE:
                                - status_v2: 'shortlisted'
                                - shortlisted_by: admin ID
                                - shortlisted_at: timestamp
                                - access_token: [UUID] (for survey)
                                ↓                       → Email: Shortlist notification
                                                        → To: respondent_email
                                                        → Content: Survey link /survey/[token]
                                                        → Deadline: 7 days
                                ↓
                                After email sent:
                                - status_v2: 'survey_sent'
                                ↓
                                (LOCK RELEASED)

USER RECEIVES SHORTLIST EMAIL
↓
Clicks survey link:
/survey/[token]
↓
GET /api/survey/[token]
→ Validates access_token
→ Checks deadline
→ Returns detailed survey template
↓
User fills detailed survey
- POST /api/survey/[token]/save (auto-save)
- POST /api/survey/[token]/submit (final)
↓
DATABASE:
- responses: {...} (JSONB updated)
- status_v2: 'survey_completed'
- completed_at: timestamp
                                ↓
                                Admin sees updated status:
                                "Survey Completed"
                                ↓
                                ADMIN DECISION #2: APPROVE
                                ↓
                                POST /api/admin/applications/[id]/decision
                                Body: { decision: 'approved', notes: '...' }
                                ↓
                                DATABASE:
                                - status_v2: 'approved'
                                - approved_by: admin ID
                                - approved_at: timestamp
                                - decision_notes: notes
                                - decision_by: admin ID
                                - decision_at: timestamp
                                - reviewed_by: admin ID
                                - reviewed_at: timestamp
                                ↓                       → Email: Approval notification
                                                        → To: respondent_email
                                                        → Content: "Congratulations!"
                                                        → Event details, next steps
                                ↓
                                (LOCK RELEASED)

USER RECEIVES APPROVAL EMAIL
✅ Approved - Can attend event

                                OR

                                ADMIN DECISION #3: REJECT
                                ↓
                                POST /api/admin/applications/[id]/decision
                                Body: { decision: 'rejected', notes: '...' }
                                ↓
                                DATABASE:
                                - status_v2: 'rejected'
                                - rejected_by: admin ID
                                - rejected_at: timestamp
                                - decision_notes: notes (internal only)
                                ↓
                                ❌ NO EMAIL SENT (per requirements)
                                (Silent rejection)
                                ↓
                                (LOCK RELEASED)

USER NEVER NOTIFIED (rejected silently)
```

---

## 📋 DETAILED STEP-BY-STEP FLOW

### **PHASE 1: USER REGISTRATION**

#### Step 1.1: User Lands on Event Page
**URL:** `/events/[slug]`
**Component:** `src/app/events/[slug]/page.tsx`
**Data Fetched:**
- GET `/api/events/[slug]` → Event details (title, dates, location, registration_enabled)

**User Sees:**
- Event information
- "Register" button (if registration_enabled = true)

---

#### Step 1.2: User Clicks Register
**Action:** Click "Register" button
**Redirect Logic:**
```typescript
if (!user) {
  router.push(`/login?redirect=/events/${slug}/register`)
} else {
  router.push(`/events/${slug}/register`)
}
```

---

#### Step 1.3: User Authentication
**URL:** `/login` or `/register`
**Process:**
1. User enters email + password
2. POST `/api/auth/login` or `/api/auth/register`
3. Supabase Auth creates session
4. `user_profiles` record created (if new user)
5. Redirect to `/events/[slug]/register?token=[resume_token]` (if resuming)

---

#### Step 1.4: Registration Form Loads
**URL:** `/events/[slug]/register`
**Component:** `src/app/events/[slug]/register/page.tsx`
**API Calls:**
```typescript
// 1. Load event
GET /api/events/[slug]
Response: { id, title, description, registration_enabled, initial_template_id, ... }

// 2. Load form template
GET /api/forms/templates/[initial_template_id]
Response: { id, name, description, ... }

// 3. Load questions
GET /api/forms/templates/[initial_template_id]/questions
Response: [
  { id, question_text, question_type, is_required, options, ... },
  ...
]

// 4. Check for existing response (resume)
GET /api/forms/responses?event_id=[id]&email=[user.email]
Response: { id, responses, is_complete, resume_token, ... } or null
```

**Component:** `FormRenderer` (`src/components/forms/FormRenderer.tsx`)
**Features:**
- Dynamic question rendering (15 question types)
- Auto-save every 30 seconds
- Progress tracking
- Validation

---

#### Step 1.5: User Fills Form (Auto-Save)
**Trigger:** User types, clicks, selects
**Frequency:** Every 30 seconds (debounced)
**API Call:**
```typescript
POST /api/forms/responses
Body: {
  template_id: "[UUID]",
  event_id: "[UUID]",
  response_type: "initial_interest",
  respondent_email: "user@example.com",
  respondent_name: "John Doe",
  responses: {
    "[question_id_1]": "Answer 1",
    "[question_id_2]": ["Option A", "Option B"],
    ...
  },
  is_complete: false,  // ← Auto-save
  resume_token: "[existing_token or null]"
}

Response: {
  success: true,
  data: {
    id: "[response_id]",
    resume_token: "[token]",
    status: "in_progress",
    completion_percentage: 45
  },
  message: "Progress saved successfully"
}
```

**Database Changes:**
```sql
-- If new response:
INSERT INTO form_responses (
  template_id, event_id, respondent_email, respondent_name,
  responses, is_complete, status, status_v2, user_id,
  started_at, last_saved_at, resume_token
) VALUES (
  '[UUID]', '[UUID]', 'user@example.com', 'John Doe',
  '{"q1": "answer1"}', false, 'in_progress', 'interested', '[user_id]',
  NOW(), NOW(), '[token]'
);

-- If updating existing:
UPDATE form_responses
SET responses = '{"q1": "answer1", "q2": "answer2"}',
    last_saved_at = NOW(),
    completion_percentage = 60
WHERE id = '[response_id]' AND status != 'completed';
```

---

#### Step 1.6: User Submits Form
**Trigger:** User clicks "Submit" button
**Validation:** All required fields must be filled
**API Call:**
```typescript
POST /api/forms/responses
Body: {
  ...same as auto-save,
  is_complete: true  // ← FINAL SUBMISSION
}

Response: {
  success: true,
  data: {
    id: "[response_id]",
    status: "completed",
    status_v2: "interested",  // ← INITIAL STATUS FOR ADMIN REVIEW
    completion_percentage: 100
  },
  message: "Form submitted successfully. Confirmation email sent!"
}
```

**Database Changes:**
```sql
UPDATE form_responses
SET
  responses = '[complete_responses_json]',
  is_complete = true,
  status = 'completed',
  status_v2 = 'interested',  -- ← Admin can now review
  completion_percentage = 100,
  completed_at = NOW(),
  last_saved_at = NOW()
WHERE id = '[response_id]';
```

**Email Sent:**
```typescript
// File: src/lib/email/sender.ts → sendRegistrationConfirmation()
To: respondent_email
From: applications@deeplearningindabaxkenya.com
Subject: "Registration Confirmed - [Event Title]"
Content:
- Thank you for registering
- Event details (date, location)
- What happens next (review process)
- Event URL link
```

---

### **PHASE 2: ADMIN REVIEW**

#### Step 2.1: Admin Views Applications List
**URL:** `/admin/applications`
**Component:** `src/app/admin/applications/page.tsx`
**API Call:**
```typescript
GET /api/admin/applications?status=interested&limit=20&offset=0

Response: {
  success: true,
  data: [
    {
      id: "[UUID]",
      respondent_name: "John Doe",
      respondent_email: "user@example.com",
      status_v2: "interested",
      completion_percentage: 100,
      created_at: "2025-11-27T10:00:00Z",
      is_locked: false,
      locked_by_name: null,
      lock_expires_at: null,
      event: {
        id: "[UUID]",
        title: "IndabaX Kenya 2025",
        slug: "indabax-kenya-2025"
      }
    },
    ...
  ],
  count: 42,
  pagination: {
    total: 42,
    limit: 20,
    offset: 0,
    page: 1,
    totalPages: 3
  }
}
```

**SQL Query (via `applications_with_locks` view):**
```sql
-- View definition from SUCCESSFUL_FIX_RUN_THIS.sql:146-161
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
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()  -- Only active locks
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;
```

**Table Display:**
| Name | Email | Status | Event | Lock Status | Created |
|------|-------|--------|-------|-------------|---------|
| John Doe | user@example.com | Interested | IndabaX 2025 | - | 2 hours ago |
| Jane Smith | jane@example.com | Shortlisted | IndabaX 2025 | 🔒 Admin A (28 min) | 1 day ago |

---

#### Step 2.2: Admin Clicks to Review Application
**Action:** Click on application row
**URL:** `/admin/applications/[id]`
**Component:** `src/app/admin/applications/[id]/page.tsx`
**API Calls:**
```typescript
// 1. Fetch application details
GET /api/admin/applications/[id]

Response: {
  success: true,
  data: {
    id: "[UUID]",
    respondent_name: "John Doe",
    respondent_email: "user@example.com",
    status_v2: "interested",
    responses: {
      "q1_id": "Bachelor's in Computer Science",
      "q2_id": ["Machine Learning", "NLP"],
      "q3_id": "I want to learn about AI applications in healthcare..."
    },
    event: {
      title: "IndabaX Kenya 2025",
      start_date: "2025-12-01T09:00:00Z",
      location: "Nairobi, Kenya"
    },
    template: {
      name: "Initial Interest Form"
    },
    created_at: "2025-11-27T10:00:00Z",
    completed_at: "2025-11-27T10:15:00Z"
  }
}

// 2. Auto-acquire review lock
POST /api/admin/applications/[id]/lock

Response: {
  success: true,
  message: "Lock acquired successfully",
  data: {
    lock_id: "[UUID]",
    expires_at: "2025-11-27T12:30:00Z"  // 30 minutes
  }
}
```

**Database Changes (Lock Acquisition):**
```sql
-- Call database function
SELECT * FROM acquire_review_lock(
  p_registration_id := '[form_response_id]',
  p_lock_duration := INTERVAL '30 minutes'
);

-- Function creates:
INSERT INTO review_locks (
  registration_id,
  locked_by,
  locked_at,
  expires_at
) VALUES (
  '[form_response_id]',
  auth.uid(),  -- Current admin
  NOW(),
  NOW() + INTERVAL '30 minutes'
)
ON CONFLICT (registration_id) DO UPDATE
SET locked_by = auth.uid(),
    locked_at = NOW(),
    expires_at = NOW() + INTERVAL '30 minutes';
```

**Lock Rules:**
1. Only ONE admin can hold a lock at a time
2. Lock duration: 30 minutes
3. Lock auto-extends if admin is active
4. Lock auto-expires after 30 minutes of inactivity
5. Other admins see "Locked by [Name]" warning

---

#### Step 2.3: Admin Reviews Application
**UI Shows:**
- Applicant information (name, email)
- All form responses (rendered from JSONB)
- Event details
- Lock timer countdown (29:45 ... 29:44 ... 29:43)
- Review notes textarea
- Action buttons:
  - **Shortlist** (blue) → Send survey
  - **Approve** (green) → Accept immediately
  - **Reject** (red) → Reject immediately

**Lock Auto-Extend:**
```typescript
// Every 20 minutes, extend lock
PUT /api/admin/applications/[id]/lock

Response: {
  success: true,
  message: "Lock extended",
  data: {
    expires_at: "2025-11-27T13:00:00Z"  // Extended +30 min
  }
}
```

---

### **PHASE 3: ADMIN DECISIONS**

#### Decision Path A: SHORTLIST (Send Survey)

**Action:** Admin clicks "Shortlist" button
**API Call:**
```typescript
POST /api/admin/applications/[id]/shortlist
Body: {
  survey_deadline_days: 7  // Optional, default 7
}

Response: {
  success: true,
  message: "Application shortlisted successfully. Survey email sent.",
  data: {
    registration_id: "[UUID]",
    status: "survey_sent",
    survey_link: "https://site.com/survey/[access_token]",
    deadline: "2025-12-04T23:59:59Z",
    emailSent: true
  }
}
```

**Database Changes:**
```sql
-- 1. Update status
UPDATE form_responses
SET
  status_v2 = 'shortlisted',
  shortlisted_by = auth.uid(),
  shortlisted_at = NOW()
WHERE id = '[response_id]';

-- 2. Generate survey access token
-- (Done in API, stored in access_token column)

-- 3. After email sent successfully:
UPDATE form_responses
SET status_v2 = 'survey_sent'
WHERE id = '[response_id]';

-- 4. Release lock
DELETE FROM review_locks
WHERE registration_id = '[response_id]';
```

**Email Sent:**
```typescript
// File: src/lib/email/send-shortlist-email.ts
To: respondent_email
From: applications@deeplearningindabaxkenya.com
Subject: "You've Been Shortlisted - [Event Title]"
Content:
- Congratulations, you've been shortlisted
- Next step: Complete detailed survey
- Survey link: /survey/[access_token]
- Deadline: December 4, 2025 at 11:59 PM
- Instructions
```

---

#### Decision Path B: APPROVE (Immediate Accept)

**Action:** Admin clicks "Approve" button
**API Call:**
```typescript
POST /api/admin/applications/[id]/decision
Body: {
  decision: "approved",
  notes: "Strong background in ML. Great fit for the event."
}

Response: {
  success: true,
  message: "Application approved. Approval email sent.",
  data: {
    id: "[UUID]",
    status_v2: "approved",
    approved_at: "2025-11-27T11:30:00Z"
  },
  emailSent: true
}
```

**Database Changes:**
```sql
UPDATE form_responses
SET
  status_v2 = 'approved',
  approved_by = auth.uid(),
  approved_at = NOW(),
  decision_notes = 'Strong background in ML...',
  decision_by = auth.uid(),
  decision_at = NOW(),
  reviewed_by = auth.uid(),
  reviewed_at = NOW()
WHERE id = '[response_id]';

-- Release lock
DELETE FROM review_locks
WHERE registration_id = '[response_id]';
```

**Email Sent:**
```typescript
// File: src/lib/email/send-approval-email.ts
To: respondent_email
From: applications@deeplearningindabaxkenya.com
Subject: "🎉 Application Approved - Welcome to [Event Title]!"
Content:
- Congratulations! Your application has been approved
- Event details (date, location, time)
- Next steps:
  * Check your email for ticket (if generated)
  * Add event to calendar
  * Review preparation materials
- Event URL link
- Contact information
```

---

#### Decision Path C: REJECT (Silent Rejection)

**Action:** Admin clicks "Reject" button
**API Call:**
```typescript
POST /api/admin/applications/[id]/decision
Body: {
  decision: "rejected",
  notes: "Does not meet experience requirements."  // Internal only
}

Response: {
  success: true,
  message: "Application rejected.",
  data: {
    id: "[UUID]",
    status_v2: "rejected",
    rejected_at: "2025-11-27T11:30:00Z"
  },
  emailSent: false  // NO EMAIL SENT
}
```

**Database Changes:**
```sql
UPDATE form_responses
SET
  status_v2 = 'rejected',
  rejected_by = auth.uid(),
  rejected_at = NOW(),
  decision_notes = 'Does not meet experience requirements.',  -- INTERNAL ONLY
  decision_by = auth.uid(),
  decision_at = NOW(),
  reviewed_by = auth.uid(),
  reviewed_at = NOW()
WHERE id = '[response_id]';

-- Release lock
DELETE FROM review_locks
WHERE registration_id = '[response_id]';
```

**Email:** ❌ **NO EMAIL SENT** (per requirements - silent rejection)

---

### **PHASE 4: USER COMPLETES SURVEY** (If Shortlisted)

#### Step 4.1: User Receives Shortlist Email
**Email Content:**
- Survey link: `https://site.com/survey/[access_token]`
- Deadline: 7 days from shortlist date
- Instructions

---

#### Step 4.2: User Clicks Survey Link
**URL:** `/survey/[access_token]`
**Component:** `src/app/survey/[token]/page.tsx`
**API Call:**
```typescript
GET /api/survey/[access_token]

Response: {
  success: true,
  data: {
    response_id: "[UUID]",
    event: { title, start_date, ... },
    template: { name: "Detailed Survey" },
    questions: [
      { id, question_text, question_type, options, is_required, ... },
      ...
    ],
    existing_responses: {},  // Empty for first visit
    deadline_at: "2025-12-04T23:59:59Z",
    is_expired: false
  }
}
```

**Validation:**
```sql
-- Check if access_token is valid
SELECT * FROM form_responses
WHERE access_token = '[token]'
  AND status_v2 IN ('survey_sent', 'survey_completed')
  AND (deadline_at IS NULL OR deadline_at > NOW());
```

If expired:
```json
{
  "success": false,
  "error": {
    "code": "SURVEY_EXPIRED",
    "message": "Survey deadline has passed"
  }
}
```

---

#### Step 4.3: User Fills Detailed Survey
**Same process as initial registration:**
- Auto-save every 30s
- POST `/api/survey/[token]/save` (progress)
- Validation on required fields

```sql
UPDATE form_responses
SET
  responses = '[updated_responses_json]',  -- Merges with initial responses
  last_saved_at = NOW()
WHERE access_token = '[token]';
```

---

#### Step 4.4: User Submits Survey
**API Call:**
```typescript
POST /api/survey/[access_token]/submit

Response: {
  success: true,
  message: "Survey submitted successfully!",
  data: {
    response_id: "[UUID]",
    status_v2: "survey_completed",
    completed_at: "2025-11-30T14:00:00Z"
  }
}
```

**Database Changes:**
```sql
UPDATE form_responses
SET
  responses = '[complete_responses_json]',
  status_v2 = 'survey_completed',
  completed_at = NOW(),
  is_complete = true
WHERE access_token = '[token]';
```

**Admin sees updated status:**
- Status badge changes: "Survey Sent" → "Survey Completed"
- Admin can now review survey responses
- Admin can approve/reject based on survey

---

### **PHASE 5: BULK OPERATIONS**

#### Bulk Reject
**Action:** Admin selects multiple applications, clicks "Reject (N)"
**API Call:**
```typescript
POST /api/admin/applications/bulk/reject
Body: {
  application_ids: ["[UUID1]", "[UUID2]", "[UUID3]"]
}

Response: {
  success: true,
  message: "Rejected 3 of 3 applications",
  data: {
    total: 3,
    success: 3,
    failed: 0,
    results: [
      { application_id: "[UUID1]", success: true },
      { application_id: "[UUID2]", success: true },
      { application_id: "[UUID3]", success: true }
    ]
  }
}
```

**Database Changes (per application):**
```sql
UPDATE form_responses
SET
  status_v2 = 'rejected',
  rejected_by = auth.uid(),
  rejected_at = NOW(),
  decision_by = auth.uid(),
  decision_at = NOW(),
  reviewed_by = auth.uid(),
  reviewed_at = NOW()
WHERE id = '[application_id]'
  AND status_v2 != 'rejected';  -- Skip if already rejected
```

**Email:** ❌ **NO EMAILS SENT** (per requirements)

---

## 🗂️ DATABASE SCHEMA DETAILS

### **table: form_responses** (ACTIVE APPLICATIONS TABLE)

```sql
-- Core columns
id UUID PRIMARY KEY
template_id UUID → form_templates.id
event_id UUID → events.id
user_id UUID → user_profiles.id (authenticated user)

-- Respondent info
respondent_email VARCHAR(255) NOT NULL
respondent_name VARCHAR(255)

-- Form data
responses JSONB DEFAULT '{}'  -- All question answers
response_type VARCHAR(50) DEFAULT 'initial_interest'

-- Progress tracking
status VARCHAR(50) DEFAULT 'draft'  -- OLD: draft/submitted/reviewed
status_v2 registration_status_v2 DEFAULT 'interested'  -- NEW: workflow status
is_complete BOOLEAN DEFAULT FALSE
completion_percentage INTEGER DEFAULT 0

-- Timestamps
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
last_saved_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()

-- Survey access (for shortlisted users)
access_token TEXT UNIQUE  -- For /survey/[token]
deadline_at TIMESTAMPTZ  -- Survey deadline
resume_token TEXT  -- For /events/[slug]/register?token=[resume]

-- Review tracking (Phase 5)
reviewed_by UUID → auth.users.id
reviewed_at TIMESTAMPTZ
review_notes TEXT

-- Shortlist tracking
shortlisted_by UUID → auth.users.id
shortlisted_at TIMESTAMPTZ

-- Decision tracking
decision_by UUID → auth.users.id
decision_at TIMESTAMPTZ
decision_notes TEXT  -- Internal admin notes

-- Approval tracking
approved_by UUID → auth.users.id
approved_at TIMESTAMPTZ

-- Rejection tracking
rejected_by UUID → auth.users.id
rejected_at TIMESTAMPTZ

-- Attendance tracking
attended_at TIMESTAMPTZ
checked_in_by UUID → auth.users.id
```

### **enum: registration_status_v2** (APPLICATION STATES)

```sql
CREATE TYPE registration_status_v2 AS ENUM (
  'interested',       -- User submitted initial form (DEFAULT)
  'pending',          -- Admin is reviewing
  'shortlisted',      -- Admin shortlisted, survey being sent
  'survey_sent',      -- Survey email sent, awaiting response
  'survey_completed', -- User completed detailed survey
  'approved',         -- Admin approved (final positive outcome)
  'rejected',         -- Admin rejected (final negative outcome)
  'attended'          -- User attended event (post-event status)
);
```

### **table: review_locks** (ADMIN REVIEW LOCKS)

```sql
id UUID PRIMARY KEY
registration_id UUID → form_responses.id  -- NOT registrations!
locked_by UUID → auth.users.id
locked_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
ip_address VARCHAR(50)

-- Constraint: ONE lock per application
UNIQUE(registration_id)
```

### **view: applications_with_locks**

```sql
-- Combines form_responses with active locks
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
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;
```

---

## 📊 STATUS FLOW DIAGRAM

```
interested
    ↓
    ├─→ shortlisted
    │       ↓
    │   survey_sent
    │       ↓
    │   survey_completed
    │       ↓
    │       ├─→ approved ✅
    │       └─→ rejected ❌
    │
    ├─→ approved ✅ (direct approval, skip survey)
    └─→ rejected ❌ (direct rejection, skip survey)
```

**Status Transitions:**
- `interested` → `shortlisted` (admin action)
- `shortlisted` → `survey_sent` (after email sent)
- `survey_sent` → `survey_completed` (user action)
- `survey_completed` → `approved` or `rejected` (admin action)
- `interested` → `approved` (direct approval, skip survey)
- `interested` → `rejected` (direct rejection, skip survey)

---

## 🔒 LOCK SYSTEM MECHANICS

### Lock Acquisition
```typescript
// When admin opens application detail page
POST /api/admin/applications/[id]/lock

// Database function: acquire_review_lock(registration_id, duration)
// Returns: lock_id, expires_at
```

### Lock Rules
1. **ONE lock per application** - Only one admin can review at a time
2. **30-minute duration** - Lock expires after 30 minutes
3. **Auto-extend** - Lock extends every 20 minutes if admin is active
4. **Auto-cleanup** - Expired locks removed automatically
5. **Conflict detection** - Other admins see "Locked by [Name]" warning

### Lock Release
```typescript
// Automatic release on:
- Admin approves application
- Admin rejects application
- Admin shortlists application
- Lock expires (30 minutes)

// Manual release:
POST /api/admin/applications/[id]/lock (DELETE)
```

---

## 📧 EMAIL NOTIFICATIONS SUMMARY

| Trigger | Email Sent? | To | Subject | Template File |
|---------|-------------|--------|---------|---------------|
| User submits initial form | ✅ Yes | respondent_email | "Registration Confirmed - [Event]" | `sender.ts:sendRegistrationConfirmation()` |
| Admin shortlists | ✅ Yes | respondent_email | "You've Been Shortlisted - [Event]" | `send-shortlist-email.ts` |
| Admin approves | ✅ Yes | respondent_email | "🎉 Application Approved - Welcome to [Event]!" | `send-approval-email.ts` |
| Admin rejects | ❌ **NO** | - | - | - |
| Bulk reject | ❌ **NO** | - | - | - |

---

## 🚨 CRITICAL GAPS IDENTIFIED

### Gap 1: Admin Can't See Applications Yet
**Problem:** You mentioned "the page i cant see any thing yet we had some applications"

**Possible Causes:**
1. **No applications in `interested` status** - Check database:
   ```sql
   SELECT status_v2, COUNT(*)
   FROM form_responses
   GROUP BY status_v2;
   ```

2. **Status filter issue** - Default filter may be wrong in UI

3. **View not returning data** - Test the view:
   ```sql
   SELECT * FROM applications_with_locks LIMIT 10;
   ```

4. **RLS policy blocking** - Check permissions:
   ```sql
   SELECT * FROM form_responses LIMIT 10;  -- As admin user
   ```

**NEXT STEP:** We need to investigate why admin panel shows no applications despite having data.

---

### Gap 2: Survey Template Missing
**Problem:** Shortlist creates `access_token` but no detailed survey template exists

**Current Behavior:**
- Shortlist email sent with `/survey/[token]` link
- User clicks link → 404 or error (no template configured)

**What's Needed:**
1. Create detailed survey template in `form_templates`
2. Link it to event (`event.detailed_template_id`)
3. Create questions in `form_questions`

**NEXT STEP:** Either:
- Skip shortlist workflow (approve/reject directly)
- OR create detailed survey templates

---

### Gap 3: Ticket Generation Not Implemented
**Problem:** Approved users don't get tickets

**Current Behavior:**
- User approved → Email sent
- No ticket PDF generated
- No QR code for check-in

**What's Needed:**
- Ticket generation on approval
- PDF with QR code
- Email attachment or download link

**NEXT STEP:** Decide if tickets are needed for this phase.

---

## ✅ WHAT'S WORKING

1. ✅ User registration form submission
2. ✅ Form data stored in `form_responses`
3. ✅ Auto-save functionality
4. ✅ Email confirmation on submission
5. ✅ Admin lock system (30-minute locks)
6. ✅ Admin decision API (approve/reject)
7. ✅ Approval email sending
8. ✅ Shortlist email sending
9. ✅ Bulk reject (no email)
10. ✅ Status tracking via `status_v2`

---

## ❌ WHAT NEEDS INVESTIGATION

1. ❌ **Why admin panel shows no applications?**
   - Database has data (3 form_responses)
   - Admin list API exists
   - View exists
   - **INVESTIGATE:** Filter, permissions, or frontend issue?

2. ❌ **Survey workflow incomplete**
   - No detailed survey templates
   - Survey submission endpoint exists but unused
   - **DECIDE:** Keep or skip survey phase?

3. ❌ **Ticket generation missing**
   - No PDF generation
   - No QR codes
   - **DECIDE:** Implement now or later?

---

## 🔍 NEXT STEPS FOR DEBUGGING

### Step 1: Verify Database Has Applications
```sql
-- Check form_responses data
SELECT
  id,
  respondent_name,
  respondent_email,
  status_v2,
  event_id,
  created_at
FROM form_responses
ORDER BY created_at DESC
LIMIT 10;

-- Check if view works
SELECT * FROM applications_with_locks LIMIT 10;
```

### Step 2: Test Admin API Directly
```bash
# Get applications list
curl -X GET "http://localhost:3000/api/admin/applications?limit=50" \
  -H "Authorization: Bearer [admin_session_token]"
```

### Step 3: Check Frontend Console
- Open `/admin/applications`
- Check browser DevTools console
- Look for API errors, 404s, or permission errors

### Step 4: Verify Event Has Registration Form
```sql
SELECT
  id,
  title,
  slug,
  registration_enabled,
  initial_template_id
FROM events
WHERE registration_enabled = true;
```

---

## 📝 SUMMARY

**Complete Flow:**
1. User registers → `form_responses` (status_v2: 'interested')
2. Admin reviews → Lock acquired
3. Admin shortlists → Survey email sent (status_v2: 'survey_sent')
4. User completes survey → status_v2: 'survey_completed'
5. Admin approves → Approval email sent (status_v2: 'approved')
6. OR Admin rejects → No email (status_v2: 'rejected')

**Key Tables:**
- `form_responses` - Active applications
- `review_locks` - Admin review locks
- `applications_with_locks` - View combining both

**Email Flow:**
- Registration → ✅ Confirmation email
- Shortlist → ✅ Survey email
- Approve → ✅ Approval email
- Reject → ❌ No email

**Current Issue:**
- Admin panel not showing applications despite data existing
- Need to investigate why

---

**Created by:** Claude Code
**Date:** 2025-11-27
**Status:** Ready for investigation
