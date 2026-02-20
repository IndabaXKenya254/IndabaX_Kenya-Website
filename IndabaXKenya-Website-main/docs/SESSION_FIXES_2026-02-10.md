# IndabaX Kenya Website - Bug Fixes & Features Session
## Date: February 10-12, 2026

This document summarizes all the bug fixes and features implemented during this development session.

---

## Table of Contents

1. [Issue #4: Upcoming Events Not Showing](#issue-4-upcoming-events-not-showing)
2. [Issue #5: System Load Resilience](#issue-5-system-load-resilience)
3. [Issue #22: Application Reference Shortening](#issue-22-application-reference-shortening)
4. [Issue #28: Check-in Confirmation Email](#issue-28-check-in-confirmation-email)
5. [Issue #29: Timezone Discrepancy Fix](#issue-29-timezone-discrepancy-fix)
6. [Issue #31: Progressive Form Saving](#issue-31-progressive-form-saving)

---

## Issue #4: Upcoming Events Not Showing

### Problem
The home page and events page showed "No Upcoming Events" even when events existed in the database with correct status and dates.

### Root Causes
1. **Caching**: `createPublicClient()` cached data, so stale responses were served
2. **Date comparison bug**: `eventDate > now` excluded events starting TODAY (due to timestamp comparison at midnight vs current time)
3. **Strict deadline filter**: Events with `registration_deadline = NULL` were excluded

### Solution

**1. Use No-Cache Client**
```typescript
// Before
const supabase = createPublicClient();

// After - always fetch fresh data
const supabase = createNoCachePublicClient();
```

**2. Fix Date Comparison**
```typescript
// Before (WRONG) - excludes events starting today
if (eventDate > now) { ... }

// After (CORRECT) - compares date strings
const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const eventDateStr = new Date(event.start_date).toISOString().split('T')[0];
if (eventDateStr >= todayDate) { ... }
```

**3. Deadline with Fallback**
```typescript
// Show events where:
// 1. registration_deadline >= today, OR
// 2. registration_deadline is null AND (end_date >= today OR start_date >= today)
const filteredEvents = events.filter((event) => {
  const deadline = event.registration_deadline?.split('T')[0];
  if (deadline) return deadline >= today;
  // No deadline - use end_date or start_date
  const effectiveEndDate = event.end_date || event.start_date;
  return effectiveEndDate >= today;
});
```

### Files Modified

| File | Changes |
|------|---------|
| `src/components/HomeDefault/UpcomingEvents.tsx` | No-cache client, deadline-based filtering |
| `src/components/Events/EventsHeroBanner.tsx` | No-cache client, deadline-based filtering, date comparison fix |
| `src/components/Events/UpcomingEventBanner.tsx` | Type assertion fixes |
| `src/components/HomeDefault/MainBanner/index.tsx` | Type assertion fixes |

---

## Issue #5: System Load Resilience

### Problem
When 10+ users accessed the system simultaneously:
- Events wouldn't load (API timeouts)
- Sign-in issues occurred
- Users were asked to re-verify accounts
- General "Error" popups appeared

### Root Cause
Each request created a new Supabase client instance, leading to connection pool exhaustion under concurrent load.

### Solution
Implemented singleton pattern for public Supabase clients to reuse connections.

```typescript
// src/lib/supabase/public.ts

// Singleton instances
let _publicClient: ReturnType<typeof createClient> | null = null
let _noCacheClient: ReturnType<typeof createClient> | null = null

export function createPublicClient() {
  if (_publicClient) return _publicClient  // Reuse existing

  _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: fetchWithTimeout },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return _publicClient
}

export function createNoCachePublicClient() {
  if (_noCacheClient) return _noCacheClient  // Reuse existing

  _noCacheClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: fetchWithoutCache },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return _noCacheClient
}
```

### Benefits
- Reduced connection pool usage
- Better performance under concurrent load
- Existing retry logic (3 retries, exponential backoff) now more effective

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/supabase/public.ts` | Singleton pattern for both public client types |
| `src/lib/supabase/settings.ts` | Type assertion fixes |
| `src/components/Common/WhyUs.tsx` | Type assertion fixes |
| `src/app/layout.tsx` | Type assertion fixes |

---

---

## Issue #22: Application Reference Shortening

### Problem
Application references displayed full UUIDs (e.g., `125cd3cc-0e71-4f29-a857-402a58658b95`) which were:
- Too long and hard to read
- Difficult for users to reference in communications
- Inconsistent format across different email templates

### Solution
Shortened application references to a maximum of 15 characters with no hyphens.

**Format:** `APP` + first 12 characters of UUID (uppercase, no hyphens)

**Example:** `APP125CD3CC0E71`

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/email/templates.ts` | Updated `registrationConfirmationTemplate` and `applicationReceivedEmailTemplate` |
| `src/lib/email/sender.ts` | Pass full UUID to templates, added `application_reference` variable |
| `src/app/admin/email-templates/new/page.tsx` | Added `{{application_reference}}` variable |
| `src/app/admin/email-templates/[id]/edit/page.tsx` | Added `{{application_reference}}` variable |
| `scripts/test-all-email-templates.ts` | Updated test to use proper UUID format |

### Database Template Variables

For database-stored email templates:
- Use `{{application_reference}}` for the shortened 15-character reference
- Use `{{application_id}}` for the complete UUID (now labeled "Full Application ID")

### Code Example

```typescript
// Issue #22 FIX: Shorten application reference to max 15 chars, no hyphens
const shortRef = applicationId
  ? `APP${applicationId.replace(/-/g, '').substring(0, 12).toUpperCase()}`
  : ''
```

---

## Issue #28: Check-in Confirmation Email

### Problem
When users were checked in at events, they didn't receive a confirmation email to confirm their attendance.

### Solution
Created a professional "Thank you for attending" email that is sent automatically when a user is checked in.

### Email Content

**Subject:** `Welcome to {Event Title}! Check-in Confirmed ✅`

**Includes:**
- Welcome message with attendee name
- Event title, date, and location
- Ticket number
- Check-in time (EAT timezone)
- Professional HTML template design
- Plain text fallback version

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/email/templates.ts` | Added `checkInConfirmationEmailTemplate`, `checkInConfirmationEmailTextTemplate`, `getCheckInConfirmationSubject` |
| `src/app/api/tickets/checkin/route.ts` | Updated to use proper email templates instead of inline HTML |
| `src/app/admin/email-templates/new/page.tsx` | Added `{{check_in_time}}` variable |
| `src/app/admin/email-templates/[id]/edit/page.tsx` | Added `{{check_in_time}}` variable |

### Email Template Interface

```typescript
export interface CheckInConfirmationEmailData {
  attendeeName: string
  eventTitle: string
  ticketNumber: string
  checkedInAt: string
  eventDate?: string
  eventLocation?: string
}
```

---

## Issue #29: Timezone Discrepancy Fix

### Problem
There was a time discrepancy between what admins saw in check-in reports and what users saw on their tickets:
- Admin showed: `2/7/2026, 2:00:04 PM` (with Africa/Nairobi timezone)
- User showed: `10:50 AM` (browser's local timezone)

### Solution
Standardized all date/time displays to use East Africa Time (EAT) with consistent formatting.

### Changes Made

**Before:**
```javascript
// User dashboard - NO timezone specified
return new Date(dateStr).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
})
```

**After:**
```javascript
// User dashboard - EAT timezone specified
return new Date(dateStr).toLocaleTimeString('en-KE', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Nairobi',
})
```

### Files Modified

| File | Changes |
|------|---------|
| `src/app/dashboard/tickets/[ticketId]/page.tsx` | Added `timeZone: 'Africa/Nairobi'` to formatDate and formatTime |
| `src/app/dashboard/tickets/page.tsx` | Added `timeZone: 'Africa/Nairobi'` to formatDate |

### Timezone Standard

All times in the IndabaX Kenya website should use:
- **Locale:** `'en-KE'` (Kenya)
- **Timezone:** `'Africa/Nairobi'` (East Africa Time - EAT)

---

## Issue #31: Progressive Form Saving

### Problem
When users refreshed the page in the middle of filling out an application form, all their responses were lost and they had to start over.

### Solution
Enabled localStorage draft saving that persists across page refreshes, complementing the existing server-side auto-save.

### How It Works

1. **Auto-save to localStorage:** Every time a user changes an answer, it's immediately saved to `localStorage` with a unique key

2. **Restore on page load:** When the page loads, FormRenderer checks localStorage for saved drafts and restores them

3. **"Draft restored" banner:** Users see a friendly notification with option to "Discard Draft"

4. **Clear on success:** When the form is successfully submitted, the localStorage draft is automatically cleared

### Draft Key Format

- **Event Registration:** `form-draft-{eventId}-{userId}`
- **Surveys:** `form-draft-survey-{token}`

### Files Modified

| File | Changes |
|------|---------|
| `src/app/events/[slug]/register/page.tsx` | Added `draftKey` prop and localStorage clearing on submit |
| `src/app/survey/[token]/page.tsx` | Added `draftKey` prop for surveys |

### User Experience

```
User Flow:
1. Start filling out registration form
2. Close browser or refresh page (accidentally or intentionally)
3. Return to the form later
4. See: "Draft restored. Your previous answers have been loaded."
5. Option to click "Discard Draft" to start fresh
6. Continue filling out the form from where they left off
7. Submit successfully → localStorage draft is cleared
```

### Code Example

```tsx
<FormRenderer
  template={template}
  questions={questions}
  initialResponses={initialResponses}
  onSubmit={handleSubmit}
  autoSave={true}
  autoSaveDelay={3000}
  onAutoSave={handleAutoSave}
  // Issue #31: Enable localStorage draft saving
  draftKey={event?.id && authUser?.id ? `${event.id}-${authUser.id}` : undefined}
/>
```

---

## Summary of All Commits

| Commit | Description |
|--------|-------------|
| `8fe1e64` | fix(Issue #22): Shorten application reference to max 15 chars, no hyphens |
| `1ba4276` | feat(Issue #28, #29): Check-in email template and timezone consistency |
| `53c8cbb` | feat(Issue #31): Progressive form saving with localStorage |

---

## Testing Checklist

### Issue #22 - Application Reference
- [ ] Submit a new application and verify email shows short reference (e.g., `APP125CD3CC0E71`)
- [ ] Check database email templates can use `{{application_reference}}`
- [ ] Verify format is consistent across all emails

### Issue #28 - Check-in Email
- [ ] Check in an attendee at an event
- [ ] Verify they receive the check-in confirmation email
- [ ] Verify email contains correct event details and check-in time

### Issue #29 - Timezone
- [ ] View ticket in user dashboard
- [ ] Compare time with admin check-in reports
- [ ] Verify times match (both should show EAT timezone)

### Issue #31 - Progressive Saving
- [ ] Start filling out an event registration form
- [ ] Refresh the page (hard refresh with Ctrl+Shift+R)
- [ ] Verify responses are restored
- [ ] Verify "Draft restored" banner appears
- [ ] Test "Discard Draft" button
- [ ] Submit form and verify draft is cleared

---

## Notes for Future Development

1. **Timezone Handling:** Always use `timeZone: 'Africa/Nairobi'` and locale `'en-KE'` for consistent time display

2. **Application References:** The shortened format (`APP` + 12 chars) provides 4,096^12 unique combinations, which is sufficient for any scale

3. **localStorage Drafts:** Draft keys should be unique per form/user combination to avoid conflicts

4. **Email Templates:** Both HTML and plain text versions should be maintained for accessibility and email client compatibility
