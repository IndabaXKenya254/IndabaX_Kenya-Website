# Phase 5 Enhancements - Admin Application Management

**Date**: November 21, 2025
**Status**: Requirements Gathering
**Related**: Phase 5 Day 7 Complete, Moving to Enhanced Features

---

## 📋 Overview

Based on current Phase 5 implementation and future phase requirements (Phase 3: Form Builder, Phase 7: Email Templates), we're enhancing the application management system to support:

1. **Event-based grouping** of applications
2. **Bulk operations** (shortlist, accept, reject, export)
3. **Flexible form/survey assignment** (not auto-send)
4. **Email template management** from UI
5. **Advanced workflows** (shortlist first, send later)
6. **Custom per-application emails**
7. **Response tracking** and follow-up management

---

## 🎯 Core Requirements

### 1. Group Applications by Event

**Current**: All applications shown in flat list
**Requested**: Group/filter by event for easier management

**Options Discussed**:
- **Option A**: Event list first → Click event → See applications
- **Option B**: Applications list with event filter dropdown

**Decision**: Implement **both** for flexibility
- `/admin/applications` - All applications with event filter
- `/admin/events/[id]/applications` - Event-specific applications

**Features**:
```
Main Applications Page (/admin/applications):
├── Filter by Event dropdown
├── Filter by Status (pending, shortlisted, accepted, rejected)
├── Search by name/email
├── Bulk actions (select multiple)
└── Export to Excel

Event-Specific Page (/admin/events/[id]/applications):
├── Header: "[Event Name] - 45 Applications"
├── Same filters as above
├── Scoped to this event only
└── Quick stats: "12 pending, 8 shortlisted, 5 accepted"
```

---

### 2. Bulk Operations

**Requirement**: Select multiple applications and perform actions

**Operations**:

#### A. Bulk Shortlist
```
Workflow:
1. Admin selects 10 applications (checkboxes)
2. Click "Shortlist Selected" button
3. Modal appears: "Shortlist 10 applicants?"
   ├── Option 1: "Shortlist only (no email)"
   ├── Option 2: "Shortlist + Send Survey"
       ├── If Option 2: Show form selector
       ├── If no forms exist: Show "Create Form" link
4. Confirm → Process bulk action
5. Show progress: "Shortlisting 7/10..."
6. Show results: "✓ 10 shortlisted, 0 failed"
```

#### B. Bulk Accept
```
Workflow:
1. Select applications
2. Click "Accept Selected"
3. Modal: "Accept 10 applicants?"
   ├── Email template selector
   ├── Optional: Attach survey form
4. Confirm → Send emails in batch
5. Show progress bar
```

#### C. Bulk Reject
**User clarified**: No rejection emails needed
```
Workflow:
1. Select applications
2. Click "Reject Selected"
3. Confirm dialog
4. Update status → No email sent
```

#### D. Export to Excel
```
Options:
├── "Export Selected" - Only checked applications
└── "Export All" - All applications (filtered)

Fields to Export:
├── Name
├── Email
├── Event Name
├── Status
├── Submitted Date
├── Reviewed Date
├── Reviewer Name
├── Response to Survey (if completed)
├── Time to Complete Survey
└── Custom form responses (dynamic columns)
```

---

### 3. Flexible Form/Survey Configuration

**Current**: System auto-sends survey when shortlisting
**Requested**: Manual control over which form/survey to send

**Use Case**:
- Some applicants → Accept immediately (no survey needed)
- Others → Shortlist → Send specific survey form
- Survey form may vary by event or applicant category

**Implementation**:

#### A. Shortlist Action Options
```typescript
type ShortlistAction =
  | { type: 'shortlist_only' }  // No email
  | { type: 'shortlist_and_survey', formId: string, deadline: Date }
```

#### B. Accept Action Options
```typescript
type AcceptAction = {
  templateId: string;  // Email template to use
  attachSurvey?: {     // Optional survey link
    formId: string;
    deadline: Date;
  };
}
```

#### C. Custom Email Action (Per-Application)
```typescript
type CustomEmailAction = {
  templateId: string;
  attachForm?: string;  // Optional form to gather more details
  subject?: string;     // Override template subject
}
```

**UI Changes**:
- Shortlist button → Shows modal with options
- Accept button → Shows modal with template selector
- New button: "Send Custom Email" on application detail page

---

### 4. Email Template Management

**Reference**: Phase 7 (Days 1-2) - already designed
**Location**: `/home/de-coder/Documents/Side-Gigs/deeplearningindaba/features/PHASE_BY_PHASE_TODOS.md` (lines 872-906)

**Implementation** (from Phase 7):
```
Pages:
├── /admin/emails/templates - List all templates
├── /admin/emails/templates/new - Create template
└── /admin/emails/templates/[id]/edit - Edit template

Template Types:
├── verification (for new users)
├── application_confirmation (form submitted)
├── shortlist (you've been shortlisted)
├── approval (you're accepted + optional survey)
├── survey_complete (thank you for survey)
└── custom (admin-created)

Template Fields:
├── Name (e.g., "Acceptance Email - IndabaX 2025")
├── Subject (e.g., "Congratulations! You've been accepted")
├── Body (QuillJS rich text editor)
├── Variables:
│   ├── {{applicant_name}}
│   ├── {{event_name}}
│   ├── {{event_date}}
│   ├── {{survey_link}}
│   ├── {{deadline}}
│   └── {{custom_message}}
├── Type (dropdown)
└── Preview button
```

**Variables Support**:
- Use `{{variable_name}}` syntax
- Replace at send time
- Show available variables in sidebar when editing

---

### 5. Advanced Workflow: Two-Step Process

**User's Requirement**:
> "First shortlist, then depending on their response to survey, accept or reject. If they don't respond within given time, admin can wait longer or reject and give opportunity to another person."

**Workflow**:

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: Initial Interest (Application)             │
│ Status: interested → pending                        │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: Admin Reviews & Shortlists                 │
│ Action: Bulk shortlist (no email yet)              │
│ Status: pending → shortlisted                       │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: Send Survey to Shortlisted (Bulk)          │
│ Action: Select all shortlisted → Send survey       │
│ Choose form, set deadline                           │
│ Status: shortlisted → survey_sent                   │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 4: Wait for Survey Responses                  │
│ Filter: "Responded" vs "Not Responded"             │
│ Track: Time remaining until deadline                │
│ Admin can: Extend deadline for individual          │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 5: Review Survey Responses                    │
│ Action: Accept or Reject based on responses        │
│ Status: survey_completed → approved/rejected        │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 6: Send Acceptance Email + Ticket             │
│ Only accepted get email with ticket                 │
│ Rejected: No email sent                             │
└─────────────────────────────────────────────────────┘
```

**Filters Needed**:
```
Status Filters:
├── All
├── Interested (initial submission)
├── Pending Review
├── Shortlisted (no survey sent yet)
├── Survey Sent (waiting for response)
├── Survey Completed (admin needs to review)
├── Accepted
└── Rejected

Response Tracking Filters:
├── Responded to Email
├── Not Responded to Email
├── Deadline Approaching (< 48 hours)
├── Deadline Passed (no response)
```

---

### 6. Custom Per-Application Email

**Use Case**:
> "Admin may need to get more details from specific applicant"

**Feature**: Send custom email to individual applicant

**UI**:
```
Application Detail Page → New Button: "Send Custom Email"

Modal:
├── To: applicant@email.com (read-only)
├── Template Selector: [Dropdown of templates] or "Write Custom"
├── Subject: [Text input]
├── Body: [QuillJS editor]
├── Attach Form: [Optional form selector]
│   └── "Request additional information via this form"
├── Variables: [Insert {{variable}}]
├── Preview Button
└── Send Button
```

**Backend**:
```typescript
POST /api/admin/applications/[id]/send-email
Body: {
  templateId?: string;  // Optional, can be custom
  subject: string;
  body: string;
  attachFormId?: string;
}

Response: {
  success: true,
  message: "Email sent successfully",
  emailLogId: "uuid"
}
```

**Email Log**:
- Store in `email_logs` table
- Track: sent, opened, clicked, responded

---

### 7. Response Tracking & Follow-Up

**Requirement**: Track who responded to emails and follow up with non-responders

**Features**:

#### A. Email Open/Response Tracking
```sql
-- Already exists in Phase 7 schema
email_logs table:
├── sent_at
├── opened_at (track email opens via pixel)
├── clicked_at (track link clicks)
├── responded_at (track form submission)
└── status (sent, opened, clicked, completed, bounced, failed)
```

#### B. Response Dashboard
```
Page: /admin/events/[id]/responses

Tabs:
├── All (45 applicants)
├── Responded (23) ✓
├── Not Responded (22) ⚠️
└── Deadline Passed (5) ❌

Columns:
├── Name
├── Email
├── Survey Sent At
├── Deadline
├── Status (Responded / Not Responded)
├── Days Remaining
├── Last Activity
└── Actions (Extend Deadline / Send Reminder / Reject)
```

#### C. Reminder Emails
```
Action: Select non-responders → "Send Reminder"

Template:
Subject: Reminder: Complete Your Survey - Deadline Approaching
Body: Hi {{name}}, you have {{days_remaining}} days to complete...
```

#### D. Deadline Extension
```
Per-Applicant:
Button: "Extend Deadline"
Modal: Select new deadline date
Email: "Your deadline has been extended to..."

Bulk:
Select multiple → "Extend Deadline for Selected"
```

---

## 🗂️ Database Schema Updates

### New Tables (from existing Phase 7 design)

Already designed in `DATABASE_SCHEMA.md`:
- ✅ `form_templates` - Survey forms
- ✅ `form_questions` - Form questions
- ✅ `form_responses` - User survey responses
- ✅ `email_templates` - Email templates
- ✅ `email_logs` - Email tracking

### Schema Extensions Needed

#### 1. registrations table (extend existing `form_responses`)
```sql
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS
  shortlisted_at TIMESTAMP WITH TIME ZONE,
  shortlisted_by UUID REFERENCES auth.users(id),
  survey_sent_at TIMESTAMP WITH TIME ZONE,
  survey_deadline TIMESTAMP WITH TIME ZONE,
  survey_form_id UUID REFERENCES form_templates(id),
  survey_responded_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  acceptance_email_template_id UUID REFERENCES email_templates(id),
  rejection_reason TEXT;
```

#### 2. email_logs table
```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES form_responses(id),
  template_id UUID REFERENCES email_templates(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50),  -- sent, opened, clicked, completed, bounced, failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB
);
```

---

## 🎨 UI/UX Design

### 1. Applications List Page

```
┌────────────────────────────────────────────────────────┐
│ Applications                             [+ Add Filter] │
├────────────────────────────────────────────────────────┤
│ Event: [All Events ▼]  Status: [All ▼]  Search: [___] │
│                                                         │
│ Selected: 3          [Shortlist] [Accept] [Reject]     │
│ Total: 45           [Send Email] [Export ▼]            │
├────────────────────────────────────────────────────────┤
│ [☑] Name          Event          Status      Submitted │
│ ├─────────────────────────────────────────────────────┤
│ [☑] John Doe      IndabaX 2025   Pending     Nov 20    │
│ [☑] Jane Smith    IndabaX 2025   Shortlisted Nov 19    │
│ [☑] Bob Johnson   NOAI Workshop  Accepted    Nov 18    │
│ [ ] Alice Brown   IndabaX 2025   Rejected    Nov 17    │
└────────────────────────────────────────────────────────┘
```

### 2. Bulk Shortlist Modal

```
┌────────────────────────────────────────┐
│ Shortlist 3 Applicants                 │
├────────────────────────────────────────┤
│                                        │
│ What would you like to do?             │
│                                        │
│ ○ Shortlist only (no email sent)      │
│                                        │
│ ● Shortlist and send survey            │
│   ┌──────────────────────────────┐    │
│   │ Survey Form: [Select ▼]     │    │
│   │ > IndabaX Detailed Survey    │    │
│   │ > NOAI Participant Survey    │    │
│   │ > [+ Create New Form]        │    │
│   └──────────────────────────────┘    │
│                                        │
│   Deadline: [Nov 28, 2025 ▼]         │
│   Time: [23:59]                        │
│                                        │
│ [Cancel]              [Confirm]        │
└────────────────────────────────────────┘
```

### 3. Response Tracking Page

```
┌────────────────────────────────────────────────────────┐
│ IndabaX 2025 - Survey Responses            [Send All]  │
├────────────────────────────────────────────────────────┤
│ [All] [Responded: 12] [Not Responded: 8] [Expired: 2] │
├────────────────────────────────────────────────────────┤
│ Name         Sent      Deadline    Status      Actions │
│ ├────────────────────────────────────────────────────┤
│ John Doe     Nov 20    Nov 27      ✓ Completed  [View]│
│ Jane Smith   Nov 20    Nov 27      ⏳ Pending   [Remind│
│                                                  Extend]│
│ Bob Johnson  Nov 20    Nov 22      ❌ Expired   [Extend│
│                                     (5 days ago) Reject]│
└────────────────────────────────────────────────────────┘
```

---

## 🔧 API Endpoints

### New Endpoints Needed

#### 1. Bulk Operations
```typescript
POST /api/admin/applications/bulk-shortlist
Body: {
  applicationIds: string[];
  sendSurvey?: {
    formId: string;
    deadline: Date;
  };
}

POST /api/admin/applications/bulk-accept
Body: {
  applicationIds: string[];
  templateId: string;
  attachSurvey?: {
    formId: string;
    deadline: Date;
  };
}

POST /api/admin/applications/bulk-reject
Body: {
  applicationIds: string[];
  reason?: string;
}
```

#### 2. Email Management
```typescript
POST /api/admin/applications/[id]/send-email
Body: {
  templateId?: string;
  subject: string;
  body: string;
  attachFormId?: string;
}

POST /api/admin/applications/bulk-send-reminder
Body: {
  applicationIds: string[];
  templateId: string;
}
```

#### 3. Deadline Management
```typescript
PATCH /api/admin/applications/[id]/extend-deadline
Body: {
  newDeadline: Date;
  sendNotification: boolean;
}

PATCH /api/admin/applications/bulk-extend-deadline
Body: {
  applicationIds: string[];
  newDeadline: Date;
}
```

#### 4. Export
```typescript
GET /api/admin/applications/export?eventId=[id]&status=[status]&format=xlsx
Response: Excel file download
```

---

## ✅ Implementation Plan

### Phase 5A: Core Enhancements (Week 1)
- [ ] Event grouping and filters
- [ ] Bulk selection UI (checkboxes)
- [ ] Bulk shortlist (no email)
- [ ] Export to Excel

### Phase 5B: Email Templates (Week 2)
- [ ] Email template management page
- [ ] QuillJS editor integration
- [ ] Variable replacement system
- [ ] Template preview

### Phase 5C: Advanced Workflows (Week 3)
- [ ] Bulk shortlist + send survey
- [ ] Bulk accept with template selector
- [ ] Custom per-application email
- [ ] Response tracking dashboard

### Phase 5D: Follow-Up System (Week 4)
- [ ] Email open/click tracking
- [ ] Reminder emails
- [ ] Deadline extension (individual + bulk)
- [ ] Automated deadline notifications

---

## 📊 Success Metrics

- [ ] Admin can group applications by event
- [ ] Admin can bulk shortlist 10+ applications in < 30 seconds
- [ ] Admin can choose which survey form to send
- [ ] Admin can create email templates without code
- [ ] Admin can track who responded to surveys
- [ ] Admin can send reminders to non-responders
- [ ] Admin can extend deadlines easily
- [ ] Export includes all relevant data

---

## 🚀 Next Steps

1. **Review this document** - Confirm all requirements understood
2. **Prioritize features** - Which to build first?
3. **Design database changes** - Extend existing schema
4. **Create wireframes** - For new UI components
5. **Start implementation** - Phase 5A (Core Enhancements)

---

**Ready to proceed? Let me know if anything needs clarification!**
