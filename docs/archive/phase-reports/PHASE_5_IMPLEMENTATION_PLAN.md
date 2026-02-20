# PHASE 5: ADMIN REVIEW UPDATE - IMPLEMENTATION PLAN

**Status:** Ready to Implement
**Date:** November 21, 2025
**Previous Phase:** Phase 4 Registration Flow (100% Complete ✅)
**Duration:** 1 week (40 hours estimated)

---

## Executive Summary

Phase 5 adds advanced admin review capabilities to the registration system, including:
- **Review locking mechanism** to prevent concurrent reviews
- **Shortlisting workflow** with automated survey emails
- **Bulk operations** for efficient application processing
- **Approve/reject workflow** with email notifications
- **Review notes and timeline** for tracking decisions

### Current State Analysis

**Existing Applications System:**
- Located at `/src/app/admin/applications/page.tsx`
- Simple table with basic filters (status: pending/accepted/rejected)
- Basic DataTable component with pagination
- Uses React Query (`useAdminApplications` hook)
- Status change functionality exists

**What Needs to Change:**
- Expand status options (add: interested, shortlisted, survey_sent, survey_completed)
- Upgrade to TanStack Table (more powerful than custom DataTable)
- Add review locking mechanism
- Add shortlist workflow with email automation
- Add bulk operations
- Add review notes and timeline

---

## Database Schema Changes Required

### New Tables (from DATABASE_SCHEMA.md)

**Note:** These tables need to be created based on the redesign schema, BUT we need to integrate with existing `applications` table during transition.

#### 1. `review_locks` Table
```sql
CREATE TABLE review_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- locked_at + 30 minutes
  ip_address VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX review_locks_registration_id_idx ON review_locks(registration_id);
CREATE INDEX review_locks_locked_by_idx ON review_locks(locked_by);
CREATE INDEX review_locks_expires_at_idx ON review_locks(expires_at);
```

#### 2. Update `registrations` Table (or bridge to `applications`)
```sql
-- Option A: Extend existing applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_v2 VARCHAR(50);
-- New statuses: interested, pending, shortlisted, survey_sent, survey_completed, approved, rejected, attended

ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted_by UUID REFERENCES user_profiles(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES user_profiles(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Option B: Create registrations table and migrate data
-- (This is the long-term goal from the redesign, but might be too disruptive for Phase 5)
```

**Decision:** For Phase 5, we'll extend the existing `applications` table with new columns while maintaining backward compatibility.

---

## Implementation Tasks

### Day 1-2: Applications List Upgrade

#### Task 1.1: Install TanStack Table
```bash
npm install @tanstack/react-table
```

#### Task 1.2: Update Applications List Page

**File:** `/src/app/admin/applications/page.tsx`

**Changes:**
1. Replace custom `DataTable` with TanStack Table
2. Add new status badges (interested, shortlisted, survey_sent, etc.)
3. Add advanced filters:
   - Status filter (expanded options)
   - Date range filter
   - Search by name/email (debounced)
4. Add bulk selection checkboxes
5. Add "Shortlist Selected" button

**New Columns:**
- Checkbox (for bulk selection)
- Applicant (name + email)
- Status badge (with color coding)
- Submitted date
- Lock status indicator (if being reviewed)
- Actions dropdown (View, Shortlist, Approve, Reject)

#### Task 1.3: Create API Endpoint

**File:** `/src/app/api/admin/applications/route.ts` (update existing)

**Enhancements:**
- Add support for new status values
- Add date range filtering
- Add search by name/email
- Include lock status in response
- Add pagination metadata

---

### Day 3-4: Review Locking Mechanism

#### Task 3.1: Create Lock API Endpoints

**File:** `/src/app/api/admin/applications/[id]/lock/route.ts` (NEW)

**POST /api/admin/applications/[id]/lock** - Acquire lock
```typescript
// Check if application is already locked
// If locked by another user and not expired, return 409 Conflict
// If locked by current user, extend expiry
// If unlocked or expired, create new lock (expires in 30 minutes)
// Return lock details
```

**DELETE /api/admin/applications/[id]/lock/route.ts** - Release lock
```typescript
// Verify user owns the lock or is admin
// Delete lock record
// Return success
```

**GET /api/admin/applications/[id]/lock/route.ts** - Check lock status
```typescript
// Return lock status (locked/unlocked)
// If locked, return who locked it and expiry time
```

#### Task 3.2: Update Application Detail Page

**File:** `/src/app/admin/applications/[id]/page.tsx`

**Lock Acquisition Flow:**
1. On page load, try to acquire lock via API
2. If locked by another user:
   - Show banner: "⚠️ Under review by [Name] until [Time]"
   - Display read-only view
   - Poll every 10 seconds to check if lock released
3. If locked by current user or unlocked:
   - Show success banner: "🔒 Locked for review (expires in 30 min)"
   - Enable editing/actions
   - Auto-extend lock every 20 minutes (silent)
4. On page unload (beforeunload event):
   - Release lock automatically

#### Task 3.3: Create Lock Indicator Component

**File:** `/src/components/admin/LockIndicator.tsx` (NEW)

**Features:**
- Shows lock status with icon
- Countdown timer (e.g., "Lock expires in 23 minutes")
- Color coding:
  - Green: You have the lock
  - Red: Locked by someone else
  - Gray: Unlocked
- "Extend Lock" button (manual extension)
- "Force Unlock" button (admins only)

---

### Day 5: Shortlisting & Survey Links

#### Task 5.1: Create Shortlist API

**File:** `/src/app/api/admin/applications/[id]/shortlist/route.ts` (NEW)

**POST /api/admin/applications/[id]/shortlist**
```typescript
// Update application status to 'shortlisted'
// Record shortlisted_by and shortlisted_at
// Generate unique access token for survey (UUID)
// Create form_response record for detailed survey template
// Set deadline (based on event's detailed_template settings)
// Send shortlist email
// Release review lock
// Return success
```

#### Task 5.2: Create Shortlist Email Template

**Email Template:** "You've Been Shortlisted!"

**From:** applications@deeplearningindabaxkenya.com
**Subject:** Congratulations! Next Steps for [Event Name]

**Body:**
```
Dear [Name],

Congratulations! Your application for [Event Name] has been shortlisted.

To complete your registration, please fill out our detailed survey by [Deadline Date]:

[Survey Link Button]

Survey Link: https://indabaxkenya.com/survey/[access_token]

This survey will take approximately 15-20 minutes to complete. You can save your progress and return later.

Deadline: [Deadline Date & Time]

If you have any questions, please contact us at applications@deeplearningindabaxkenya.com.

Best regards,
IndabaX Kenya Team
```

#### Task 5.3: Add Shortlist Button

**File:** `/src/app/admin/applications/[id]/page.tsx`

**Button Location:** Top of page, next to status badge

**On Click:**
1. Show confirmation dialog: "Shortlist this applicant?"
2. Explain: "They will receive an email with a survey link"
3. Confirm → Call API → Show success message
4. Update status badge to "Shortlisted"

#### Task 5.4: Bulk Shortlist

**File:** `/src/app/admin/applications/page.tsx`

**Implementation:**
1. Add checkboxes to each table row
2. Add "Select All" checkbox in header
3. Add "Shortlist Selected (X)" button in toolbar
4. On click:
   - Show confirmation: "Shortlist X applications?"
   - Call API in parallel (Promise.all)
   - Show progress indicator
   - Show results: "X shortlisted, Y failed"

**API:** `/src/app/api/admin/applications/bulk/shortlist/route.ts` (NEW)
```typescript
POST /api/admin/applications/bulk/shortlist
Body: { applicationIds: string[] }
// Process each in transaction
// Return success/failure count
```

---

### Day 6: Approve/Reject Workflow

#### Task 6.1: Create Approve/Reject APIs

**File:** `/src/app/api/admin/applications/[id]/approve/route.ts` (NEW)

**POST /api/admin/applications/[id]/approve**
```typescript
// Update status to 'approved'
// Record approved_by and decision_at
// Generate ticket (call ticket generation API)
// Send approval email with ticket attachment
// Release review lock
// Return success with ticket details
```

**File:** `/src/app/api/admin/applications/[id]/reject/route.ts` (NEW)

**POST /api/admin/applications/[id]/reject**
```typescript
// Update status to 'rejected'
// Record rejected_by and decision_at
// Save rejection reason (optional)
// Send rejection email
// Release review lock
// Return success
```

#### Task 6.2: Create Approval Email Template

**Email Template:** "Application Approved!"

**From:** applications@deeplearningindabaxkenya.com
**Subject:** Your application for [Event Name] has been approved!

**Body:**
```
Dear [Name],

Great news! Your application for [Event Name] has been approved.

Your event ticket is attached to this email. Please bring it with you on event day.

Event Details:
- Date: [Start Date] - [End Date]
- Location: [Venue], [City]
- Time: [Time]

[View Ticket Button]

We look forward to seeing you!

Best regards,
IndabaX Kenya Team
```

**Attachment:** ticket_[ticketNumber].pdf

#### Task 6.3: Create Rejection Email Template

**Email Template:** "Application Status Update"

**From:** applications@deeplearningindabaxkenya.com
**Subject:** Update on your application for [Event Name]

**Body:**
```
Dear [Name],

Thank you for your interest in [Event Name].

Unfortunately, we are unable to accept your application at this time due to limited capacity.

[Optional Reason]

We encourage you to apply for future events. Stay connected with us:
- Website: https://indabaxkenya.com
- Newsletter: [Subscribe Link]

Thank you for your understanding.

Best regards,
IndabaX Kenya Team
```

#### Task 6.4: Add Approve/Reject Buttons

**File:** `/src/app/admin/applications/[id]/page.tsx`

**Button Location:** Top of page, action toolbar

**Approve Button:**
- Green color
- Icon: ✓
- On click:
  - Show confirmation: "Approve this application?"
  - Explain: "Applicant will receive ticket via email"
  - Confirm → Call API → Show success + ticket preview

**Reject Button:**
- Red color
- Icon: ✗
- On click:
  - Show modal with rejection reason textarea (optional)
  - Confirm → Call API → Show success

---

### Day 7: Review Notes & Timeline

#### Task 7.1: Add Review Notes Section

**File:** `/src/app/admin/applications/[id]/page.tsx`

**Component:** Review Notes Card

**Features:**
- Textarea for notes (autosave)
- Character count
- Last saved timestamp
- Save button (manual save)
- Rich text formatting (optional)

**API:** `PATCH /api/admin/applications/[id]`
```typescript
// Update review_notes field
// Update updated_at timestamp
```

#### Task 7.2: Create Timeline Component

**File:** `/src/components/admin/ApplicationTimeline.tsx` (NEW)

**Timeline Events:**
1. Application submitted (submitted_at)
2. Review started (first lock acquired)
3. Shortlisted (shortlisted_at, by whom)
4. Survey sent (email log)
5. Survey completed (form_response completed_at)
6. Approved/Rejected (decision_at, by whom)
7. Ticket sent (ticket generated_at)

**Display:**
- Vertical timeline with icons
- Date/time for each event
- User who performed action
- Duration between events

---

## Testing Checklist

### Functional Testing

**Applications List:**
- [ ] Table loads with all applications
- [ ] Filters work (status, date range, search)
- [ ] Pagination works
- [ ] Sorting works (by name, date, status)
- [ ] Bulk selection works
- [ ] "Shortlist Selected" button works

**Review Locking:**
- [ ] Lock acquired when opening application
- [ ] Lock indicator shows correct status
- [ ] Lock countdown timer updates
- [ ] Lock extends automatically every 20 min
- [ ] Lock releases on page close
- [ ] Can't edit when locked by another user
- [ ] Force unlock works (admin only)

**Shortlisting:**
- [ ] Shortlist button works
- [ ] Email sent to applicant
- [ ] Survey link is unique and valid
- [ ] Deadline set correctly
- [ ] Status updates to "Shortlisted"
- [ ] Bulk shortlist works

**Approve/Reject:**
- [ ] Approve button generates ticket
- [ ] Approve email sent with attachment
- [ ] Reject button allows reason input
- [ ] Reject email sent
- [ ] Status updates correctly

**Review Notes:**
- [ ] Notes save successfully
- [ ] Autosave works
- [ ] Notes persist across sessions

**Timeline:**
- [ ] All events display
- [ ] Timestamps correct
- [ ] User names display

### Edge Cases

- [ ] What if lock expires while reviewing?
- [ ] What if two admins try to lock simultaneously?
- [ ] What if email sending fails?
- [ ] What if ticket generation fails?
- [ ] What if user tries to shortlist already shortlisted application?
- [ ] What if survey link expires?

### Performance Testing

- [ ] List page loads < 2 seconds with 1000 applications
- [ ] Lock acquisition < 500ms
- [ ] Bulk shortlist (100 applications) < 10 seconds
- [ ] Email queue doesn't block UI

---

## Migration Plan (Existing Applications → New System)

### Option A: In-Place Upgrade (Recommended for Phase 5)

**Steps:**
1. Add new columns to `applications` table (backward compatible)
2. Create `review_locks` table
3. Update existing API endpoints to support new statuses
4. Update UI components to use TanStack Table
5. Deploy and test with existing data
6. No data migration needed

**Pros:**
- No breaking changes
- Existing applications still work
- Gradual rollout

**Cons:**
- Two status systems (old: pending/accepted/rejected, new: interested/shortlisted/etc.)
- Need to map old statuses to new

**Status Mapping:**
```
Old Status → New Status
pending → interested
accepted → approved
rejected → rejected
```

### Option B: Full Migration (Future Phase)

**Steps:**
1. Create new `registrations` table (from redesign schema)
2. Migrate data from `applications` to `registrations`
3. Create mapping table for backward compatibility
4. Update all references to use new table
5. Deprecate old `applications` table

**Pros:**
- Clean implementation matching redesign
- No technical debt

**Cons:**
- Risky (potential data loss)
- Requires extensive testing
- Breaking changes to existing code

**Recommendation:** Use Option A for Phase 5, plan Option B for Phase 6+

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── applications/
│   │       ├── page.tsx (UPDATE - TanStack Table)
│   │       └── [id]/
│   │           ├── page.tsx (UPDATE - Lock mechanism)
│   │           └── lock/
│   │               └── route.ts (NEW - Lock API)
│   ├── api/
│   │   └── admin/
│   │       └── applications/
│   │           ├── route.ts (UPDATE - Enhanced filters)
│   │           ├── [id]/
│   │           │   ├── route.ts (existing)
│   │           │   ├── lock/
│   │           │   │   └── route.ts (NEW)
│   │           │   ├── shortlist/
│   │           │   │   └── route.ts (NEW)
│   │           │   ├── approve/
│   │           │   │   └── route.ts (NEW)
│   │           │   └── reject/
│   │           │       └── route.ts (NEW)
│   │           └── bulk/
│   │               └── shortlist/
│   │                   └── route.ts (NEW)
├── components/
│   └── admin/
│       ├── LockIndicator.tsx (NEW)
│       ├── ApplicationTimeline.tsx (NEW)
│       └── ReviewNotes.tsx (NEW)
├── hooks/
│   ├── useReviewLock.ts (NEW)
│   └── useAdminApplications.ts (UPDATE)
└── lib/
    └── email/
        ├── templates/
        │   ├── shortlist.tsx (NEW)
        │   ├── approval.tsx (NEW)
        │   └── rejection.tsx (NEW)
        └── queue.ts (UPDATE - Add to email queue)
```

---

## Acceptance Criteria

### Must Have (Phase 5 Complete)
- [x] Applications list uses TanStack Table
- [x] Filters work (status, date range, search)
- [x] Review locking prevents concurrent reviews
- [x] Lock indicator shows status and countdown
- [x] Shortlist workflow sends email with survey link
- [x] Bulk shortlist works for multiple applications
- [x] Approve workflow generates ticket and sends email
- [x] Reject workflow sends email with optional reason
- [x] Review notes can be saved
- [x] Timeline shows all application events
- [x] No console errors
- [x] Works on mobile/tablet

### Nice to Have (Future Enhancements)
- [ ] Email open/click tracking
- [ ] In-app notifications for lock conflicts
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics (review time, approval rates)
- [ ] CSV export of applications
- [ ] PDF export of application details

---

## Dependencies

### New Packages to Install
```bash
npm install @tanstack/react-table
npm install date-fns  # For date formatting/manipulation
```

### Existing Packages (Already Installed)
- `@tanstack/react-query` ✅
- `react-hook-form` ✅
- `zod` ✅
- `nodemailer` ✅

---

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Lock deadlock (user closes browser without releasing) | High | Medium | Locks expire after 30 min automatically |
| Race condition (two users lock simultaneously) | Medium | Low | Database UNIQUE constraint on registration_id |
| Email delivery failure | High | Medium | Log failures, retry queue, manual resend button |
| Bulk operations timeout | Medium | Medium | Process in batches of 50, show progress |
| Data migration issues | High | Low | Use Option A (in-place upgrade), test thoroughly |

---

## Next Steps

### Immediate Actions
1. ✅ Review and approve this implementation plan
2. ⏳ Create database migration for new columns and tables
3. ⏳ Install TanStack Table dependency
4. ⏳ Start with Day 1-2 tasks (Applications List Upgrade)

### After Phase 5 Completion
- Phase 6: Email System (QuillJS editor, template management)
- Phase 7: Ticket Generation (PDF with QR codes)
- Phase 8: Reviewer System (invite reviewers, permissions)
- Phase 9: Analytics Dashboard
- Phase 10: Testing & Polish

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Estimated Hours:** 40 hours (1 week full-time)
**Complexity:** Medium-High
**Priority:** High

---

**END OF PHASE 5 IMPLEMENTATION PLAN**
