# Fix Plan — 43 Client Issues (IndabaX Kenya Website)
## VALIDATED & CORRECTED — 2026-02-01

> All file paths, line numbers, DB schema, and root causes verified against actual codebase.
> Base path: `/home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website/`

---

## Pre-requisite: Fix Webpack Crash
**Problem:** Admin pages + /events crash on localhost with `Cannot read properties of undefined (reading 'call')` at `webpack.js:716`. Stale `.next` cache cleared — dev server restart needed.
**Action:** Delete `.next` directory, restart `npm run dev`. If persists, investigate dynamic imports in admin layout and `EventsGrid.tsx` (client component using `useAuth`).

---

## Phase 1: CRITICAL (4 issues)

### 1.1 Issue #44 — Template Edit Breaks Existing Responses
**Files:** `src/app/admin/applications/[id]/page.tsx` (1,830 lines)
- Lines 987-1202: Template edit/response mapping section
- Lines 1039-1104: Question-response matching with order-based fallback
- Lines 885-985: Applicant info sections (Basic Info + User Profile cards)

**Root Cause:** Responses stored by question UUID, but when template is edited (questions reordered/deleted), the admin view's question-to-response mapping breaks. Warning banner already shows "Form questions were updated" but responses display scrambled. Fallback at line 1039 attempts order-based matching but is fragile.

**Fix:**
- Improve question-response matching in the fallback logic (lines 1039-1104)
- Store `template_snapshot` (question order + labels) at submission time in `form_responses` table
- When displaying, use snapshot for correct ordering if template has changed
- **DB MIGRATION REQUIRED:** Add `template_snapshot` JSONB column to `form_responses` (column does NOT currently exist — verified against 126 migration files)

### 1.2 Issue #6 — PII Permissions Not Enforced
**Files:** `src/app/api/reviewer/applications/[id]/route.ts` (233 lines)
- Lines 153-206: GET handler permission section
- Lines 157-162: Default permissions object (all `true`)
- Lines 196-197: `mapPermissions()` call maps JSONB to booleans

**Root Cause:** API returns all application data regardless of `canViewPII` setting. The `reviewerPermissions` variable (not `canViewPII` — corrected variable name) does not mask PII fields.

**Fix:**
- In the GET handler (after line 197), check `canViewPII` from the mapped permissions
- If false, mask: email -> "***@***.***", phone -> "***", name -> first initial only
- Add `pii_masked: boolean` flag in response so UI can show notice
- In `src/app/reviewer/applications/[id]/page.tsx`, show "PII hidden" notice when masked

**DB Context:** Reviewer permissions stored as JSONB in `reviewers.permissions` column with 11+ flags including `canViewPII` (default: `true`). Defined in migrations `20251120000000` and `20260109_add_reviewer_permissions.sql`.

### 1.3 Issue #24 — Permissions Not Taking Effect on Reviewer Side
**Files:**
- `src/app/api/reviewer/applications/[id]/route.ts` (233 lines) — Lines 196-197
- `src/app/reviewer/applications/[id]/page.tsx` (1,265 lines) — Lines 65-69, 728-732, 821-826

**Root Cause:** Permission mapping in API (`mapPermissions`) maps `canViewApplications` to both `can_view` AND `can_review`. Missing from mapping: `can_shortlist`, `can_waitlist`, `can_revoke`, `can_send_emails`, `can_send_reminders`. Reviewer UI shows limited buttons because only `canView`/`canReview`/`canApprove`/`canReject` are mapped (line 65-69).

**Fix:**
- Expand `mapPermissions()` in route.ts to include all 11 permission types from DB
- In reviewer page, conditionally render Approve/Reject/Shortlist/Waitlist buttons based on actual permissions
- Lines 821-826: Remove hardcoded "view-only" alert, replace with dynamic access description
- Lines 1202-1240: Notes textarea already respects `canReview` and `hasLock` — will work once permissions are properly mapped

### 1.4 Issue #2 — Events Page 500 Error
**Files:**
- `src/app/events/page.tsx` (29 lines) — Simple wrapper, NOT the source of error
- `src/components/Events/EventsGrid.tsx` — Client component with `useAuth`, likely error source
- `src/components/Events/EventsHeroBanner.tsx` — Server component fetching from DB

**Root Cause (CORRECTED):** The events page itself is a 29-line wrapper that imports 3 components — all verified to exist and export correctly. The 500 error is NOT from undefined references in this file. Likely caused by:
1. `EventsGrid.tsx` using `useAuth()` context that may not be available
2. `EventsHeroBanner.tsx` server-side DB query failing silently
3. Stale webpack chunk cache

**Fix:**
- Clear `.next` cache and restart dev server first
- Add error boundary around `EventsGrid` component
- Add try/catch in `EventsHeroBanner` `getUpcomingEventData()` function
- Add null checks on event data before rendering in EventsGrid
- Check if event API returns expected shape and handle empty results

---

## Phase 2: HIGH (17 issues)

### 2.1 Issue #3 — File Upload Shows [object Object]
**Files:** `src/components/forms/question-types/FileUpload.tsx`, `src/app/api/forms/responses/route.ts` (763 lines)
**Fix:** Ensure file upload handler uploads to Supabase Storage and stores the returned URL string (not File object) in responses. Display as clickable link in review view. Upload utilities exist at `src/lib/upload/uploader.ts`.

### 2.2 Issue #4 — Video/Image Upload Not Working
**Files:** `src/components/forms/question-types/ImageDisplay.tsx`, `VideoDisplay.tsx`
**Fix:** Wire up click handlers and file inputs for image and video fields. Upload to Supabase Storage with appropriate mime type filters. Use existing `src/lib/upload/` infrastructure.

### 2.3 Issue #7 — Lock Acquisition Failure
**Files:** `src/hooks/useReviewLock.ts` (360 lines)
- Lock acquire: lines 107-174
- Lock release: lines 180-207
- Auto-extend: lines 307-321 (20-minute interval)
- Auto-release on unmount: lines 327-337

**CORRECTION:** The plan referenced `application_locks` table — this table **DOES NOT EXIST**. The actual table is `review_locks` (created in `20251121040000_phase5_review_system.sql`). Structure: UNIQUE on `registration_id`, 30-min expiry, auto-cleanup via `cleanup_expired_locks()` function.

**Fix:** The hook code looks functional. Issue is likely:
1. Stale lock rows not being cleaned (check `cleanup_expired_locks()` is called)
2. RLS policy blocking lock creation for reviewers
3. Error messages being swallowed — add better error surfacing

### 2.4 Issue #8 — Comment Section Not Editable
**Files:** `src/app/reviewer/applications/[id]/page.tsx` (lines 1202-1240)
**Root Cause:** Textarea disabled when `canReview` is false or lock not acquired (`!hasLock`). Tied to #24 — once permissions are properly passed and mapped, notes section will enable.
**Fix:** Dependent on #24 fix. Also check for z-index/overlay blocking.

### 2.5 Issue #26 — Submissions Show Internal Option Names
**Files:** `src/app/admin/applications/[id]/page.tsx` (lines 1039-1104)
**Root Cause:** Dropdown/select responses stored as `option_2` key instead of display text. Grid responses stored as JSON objects.
**Fix:**
- When saving form responses, store the display label not the internal key
- In display code, look up option key against template questions to resolve display text
- For grid questions, format JSON into readable table

### 2.6 Issue #1 — Upcoming Events Not Showing
**Files:** `src/components/Events/EventsGrid.tsx`, `src/app/api/events/route.ts`
**Fix:** Debug event query — check `start_date > NOW()` logic, timezone handling, and `status`/`published` flags. Events table uses `status` enum (`draft`/`published`/`archived`) and `event_type` (`upcoming`/`past`). Verify events in DB have future dates and `status = 'published'`.

### 2.7 Issue #42 — Application Email Delay/Missing
**Files:** `src/lib/email/sender.ts` (471 lines)
- `sendRegistrationConfirmation()`: lines 115-283
- Email logs on success: lines 209-231
- Email logs on failure: lines 248-275
- Called from `src/app/api/forms/responses/route.ts` at line 587

**Fix:** Add error logging/retry for failed sends. Update success modal text. Email logging already exists in sender.ts but verify all email-sending functions across `src/lib/email/` use it consistently.

### 2.8 Issue #43 — Grid Required Validation Not Enforced
**Files:** `src/components/forms/FormRenderer.tsx` (657 lines, lines 154-163)
**Root Cause:** Validation at line 159 only checks if response is empty/null/undefined. For grid questions, it checks `Array.isArray(response) && response.length === 0` — but doesn't validate ALL rows are filled.
**Fix:** For required grid questions (type `multiple_choice_grid` or `checkbox_grid`), iterate all rows and ensure each has at least one selection. Add per-row error highlighting.

### 2.9 Issue #33 — Duplicate Application on Survey Send
**Files:** `src/app/api/admin/applications/[id]/shortlist/route.ts` (318 lines)
**Finding (CORRECTED):** This is BY DESIGN — shortlist creates a NEW `form_response` (lines 198-226) for the detailed survey, then updates original status to 'shortlisted' (lines 232-244). Not a duplicate application.
**Fix:** Filter the applications list to not show survey responses as separate entries, or merge them visually. Show survey as a sub-item of the original application. The `response_type` column distinguishes them (`initial_interest` vs `detailed_survey`).

### 2.10 Issue #37 — Missing Email Logs
**Files:** `src/lib/email/sender.ts` + individual email senders:
- `src/lib/email/send-approval-email.ts`
- `src/lib/email/send-rejection-email.ts`
- `src/lib/email/send-shortlist-email.ts`
- `src/lib/email/send-waitlist-email.ts`
- `src/lib/email/send-paper-email.ts`

**Fix:** Audit every email-sending function to ensure each inserts into `email_logs`. The `sent_by` column already exists (added in `20250121_enhance_email_tables.sql`) — use it.

### 2.11 Issue #20 — Section Content Not Rendering
**Files:** `src/components/forms/question-types/TitleDescription.tsx`, `src/components/forms/FormRenderer.tsx` (lines 392-397)
**Fix:** Check that the TitleDescription component reads the `description` field from the question data. FormRenderer correctly passes `question` prop at line 395. Issue may be in TitleDescription not rendering the description content.

### 2.12 Issue #14 — Retain Reviewer Records After Event Deletion
**Files:** `src/app/api/admin/events/[id]/route.ts`, DB migrations
**DB CONTEXT (CORRECTED):** Events table has NO `deleted_at` column. Uses `status` enum (`draft`/`published`/`archived`).
**Fix:** Implement soft-delete via either:
- Option A: Add `deleted_at` TIMESTAMPTZ column (new migration required)
- Option B: Use existing `status = 'archived'` as soft-delete equivalent
- Add "Revoke Access" action separate from "Delete Record"

### 2.13 Issue #16 — Retain Applications After Event Deletion
**Fix:** Same soft-delete approach as #14. Add "Past Events" filter in applications dropdown. Applications are linked via `event_id` FK — setting event to archived preserves the relationship.

### 2.14 Issue #21 — Reviewer/Applicant Portal Switch
**Files:** `src/components/dashboard/DashboardLayout.tsx` (lines 342-388)
**Fix:** Check if user has multiple roles (reviewer + applicant). If so, add "Switch to Reviewer/Applicant Portal" button in sidebar nav (around lines 374-386). Implement self-application filter (reviewer can't review own application).

### 2.15 Issue #31 — Progressive Form Save
**Files:** `src/components/forms/FormRenderer.tsx` (657 lines)
**Context:** `src/hooks/useAutoSave.ts` already exists.
**Fix:** Add localStorage auto-save on field change (immediate). Add debounced DB draft save (every 30s) using existing `useAutoSave` hook. Show "Draft saved" indicator. Restore on page load. Clear on submission.

### 2.16 Issue #35 — Tracking for All Applications
**Files:** `src/app/admin/applications/responses/page.tsx`
**CORRECTION:** The page title is "SURVEY RESPONSE TRACKING (PHASE 5B)" — NOT "Shortlist Tracking" as the original plan stated. No "Shortlist Tracking" text exists in this file.
**Fix:** Expand this page to track all application statuses and form types, not just survey responses. Add feedback forms section.

### 2.17 Issue #47 — Duplicate of #3/#5
**Fix:** Covered by #3 and #5 fixes.

---

## Phase 3: MEDIUM (15 issues)

### 3.1 Hero Section Responsive
**Files:** `src/components/HomeDefault/MainBanner/index.tsx` (243 lines), `styles/style.scss` (4,772 lines)
**CORRECTION:** MainBanner is a **server component** using `d-table`/`d-table-cell` layout with database-driven content. There is NO inline `height: 100vh` or `overflow: hidden` in the component. The responsive fix needs to target `.main-banner` CSS class in `style.scss`, not the component itself.
**Fix:** Find `.main-banner` styles in `style.scss`. Change to `min-height: 100vh`. Fix mobile card layout. Check for `overflow: hidden` in SCSS file.

### 3.2 Issue #5 — Grid Can't Unselect
**Files:** `src/components/forms/question-types/MultipleChoiceGrid.tsx`
**Fix:** Add "Clear row" button or implement click-to-toggle on radio buttons.

### 3.3 Issue #11 — Phone Country Code
**Files:** `src/components/Auth/SignupForm.tsx` (381 lines), `src/lib/validations/form-validation.ts` (432 lines)
**Context:** `form-validation.ts` already has phone validation with East African format support (lines 68-106) and phone normalization (lines 133-156).
**Fix:** Add placeholder "+254...", helper text, validation requiring `+` prefix. Consider country code dropdown. Leverage existing `validatePhone()` function.

### 3.4 Issue #12 — Login Verification Loading Hang
**Files:** `src/app/verify-email/page.tsx` (294 lines, lines 177-199)
**Fix:** Add timeout message "Still working..." after 5 seconds. Investigate auth redirect optimization.

### 3.5 Issue #13 — Reviewer Can't Change Event
**Files:** `src/app/admin/reviewers/page.tsx` (1,098 lines, lines 980-1094 = Edit Permissions modal)
**Fix:** Replace static event text with dropdown selector in the Edit Permissions modal. Add "Global Reviewer" option. Permission checkboxes organized by category (Core, Decisions, Communications) already at correct lines.

### 3.6 Issue #23 — Reviewer Active Status Not Updating
**Files:** Reviewer API endpoints, middleware
**DB Context:** `reviewers` table already has `last_active_at` column and `applications_reviewed` counter.
**Fix:** Add `last_active_at = NOW()` update on reviewer actions (view application, save notes, approve/reject). Debounce to max once per 5 minutes.

### 3.7 Issue #25 — Edit Application Missing
**Files:** `src/app/dashboard/applications/page.tsx` (614 lines, lines 510-558)
**Fix:** Add "Modify Application" button alongside existing "View Event" and "Download Ticket" buttons. Show only when `registration_deadline > NOW()` and status allows editing.

### 3.8 Issue #27 — Single QR Code Regeneration
**Files:** `src/lib/tickets.ts` (266 lines), admin tickets page
**Fix:** Add per-ticket "Regenerate QR" button in ticket table rows. Use existing QR generation at lines 34-50.

### 3.9 Issue #28 — Check-in Confirmation Email
**Files:** `src/app/api/tickets/checkin/route.ts` (316 lines)
**Fix:** Trigger email on successful check-in (after line 128 in `check_in_ticket` function or in the API route after successful DB update). Use "Thank you for attending" template. Log in email_logs.

### 3.10 Issue #29 — Check-in Time Discrepancy
**Files:** Check-in display components
**Fix:** Use `Intl.DateTimeFormat` with explicit timezone. Standardize to event timezone or user locale. Check-in API already stores `checked_in_at` as TIMESTAMPTZ.

### 3.11 Issue #29b — Survey Templates Limited
**Files:** Shortlist/survey template selector
**Fix:** Query ALL form templates, not just survey-typed ones. Or add tagging system to `form_templates` table.

### 3.12 Issue #32 — Call for Papers Quick Action
**Files:** Application review sidebar
**Fix:** Add "Send Call for Paper" button. Link to paper submission flow. Add self-review filter. Papers table exists (`20251120000000`).

### 3.13 Issue #34 — Menu Overflow on Scroll
**Files:** `src/components/dashboard/DashboardLayout.tsx`, admin CSS
**Fix:** Set sidebar `top: 64px` for sticky, ensure z-index < navbar, add `max-height: calc(100vh - 64px)` with `overflow-y: auto`.

### 3.14 Issue #39 — Registration Config on Event Create
**Files:** `src/app/admin/events/new/page.tsx` (759 lines)
**Context:** Registration config sections already exist at lines 547-558 (Registration URL) and 638-685 (Quick Event Days + Max Attendees).
**Fix:** Verify all registration fields from the Edit form are also present in the Create form. Add any missing fields.

### 3.15 Issue #46 — Preview vs Live Mismatch
**Files:** `src/components/admin/PostPreviewModal.tsx` (231 lines), `src/components/admin/EventPreviewModal.tsx` (362 lines)
**Fix:** Ensure preview uses same stylesheets/components as public site. Render in iframe with public CSS or import shared style modules.

---

## Phase 4: LOW (6 issues)

### 4.1 Issue #9 — Text Positioning
**Fix:** Fix decorative divider in contact section. Fix mobile newsletter spacing.

### 4.2 Issue #10 — Button on Image
**Files:** `src/components/HomeDefault/AboutUsContent.tsx` (133 lines)
**Context:** "Our Story" button at lines 121-123: `<Link href="/about-us" className="btn btn-primary">Our Story</Link>` positioned inside `about-image` div.
**Fix:** Move "Our Story" button below image with solid background. Change from absolute to relative positioning.

### 4.3 Issue #15 — Remove Watermark
**Files:** `src/components/Layouts/Footer.tsx` (216 lines, lines 194-206)
**Fix:** Remove "Built by Githu Kelvin" text and link at lines 197-206. Keep copyright at line 195.

### 4.4 Issue #22 — Application Reference Too Long
**Fix:** Ticket references already use short format (EVT-2026-XXXXX) via `src/lib/tickets.ts` (lines 25-29). Check if application reference in confirmation page/emails uses full UUID and shorten it.

### 4.5 Issue #38 — Email Log Detail Layout
**Files:** `src/app/admin/emails/logs/[id]/page.tsx` (360 lines)
**Context:** Delivery Status panel at lines 239-291.
**Fix:** Increase min-width for Delivery Status panel. Stack vertically on smaller viewports.

### 4.6 Issue #40 — Merge Applicant Info Sections
**Files:** `src/app/admin/applications/[id]/page.tsx` (lines 885-985)
**Context:** Two separate cards — Basic Info (lines 885-923) and User Profile (lines 925-985).
**Fix:** Merge into one unified section with two columns.

---

## Required DB Migrations (create BEFORE code changes)

### Migration 1: `template_snapshot` column
```sql
-- Add template_snapshot to form_responses for Issue #44
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS template_snapshot JSONB;

COMMENT ON COLUMN public.form_responses.template_snapshot IS
'Snapshot of form template questions at submission time for stable display';
```

### Migration 2: Event soft-delete (optional — can use status='archived' instead)
```sql
-- Add deleted_at for soft-delete support (Issues #14, #16)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at)
WHERE deleted_at IS NOT NULL;
```

---

## Verification Plan
1. Clear `.next` cache, restart dev server
2. Test each fix on localhost:3000 using Chrome DevTools MCP
3. Verify: Homepage hero, events page loads, footer clean, applicant portal, reviewer portal permissions, form submission with grid validation, application detail display
4. Test reviewer login to verify permissions (#6, #24) actually enforce
5. Test form submission to verify grid validation (#43) blocks incomplete submissions
6. Check email logs after actions to verify logging (#37)

---

## Key Reference: DB Table Names
| Plan Reference | Actual Table Name |
|---------------|-------------------|
| `application_locks` | `review_locks` |
| `form_responses` | `form_responses` (correct) |
| `email_logs` | `email_logs` (correct) |
| `reviewers` | `reviewers` (correct) |
| `events` | `events` (correct) |
