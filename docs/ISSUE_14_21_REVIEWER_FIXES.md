# Issue #14 & #21 - Reviewer System Fixes

**Date:** 2026-02-12
**Issues Addressed:**
- Issue #14: Retain reviewer records after event deletion
- Issue #21: Reviewer/Applicant portal switch not working

---

## Problem Summary

### Issue #14: Reviewer Data Loss on Event Deletion
When an event was deleted, all reviewer records for that event were CASCADE deleted from the `reviewers` table. This caused:
- Reviewers to disappear from the admin reviewers list
- Loss of reviewer assignment history
- Users with `role='reviewer'` in `user_profiles` having no corresponding entry in `reviewers` table

**Example:** `kelvingithu09@gmail.com` had `role='reviewer'` but wasn't visible in `/admin/reviewers` because their event assignment was deleted.

### Issue #21: Switch to Applicant Not Working
The "Switch to Applicant" button in the reviewer portal sidebar wasn't working because:
- The `/api/user/reviewer-status` API only checked the `reviewers` table
- If a reviewer's assignment was deleted, they weren't recognized as a reviewer
- The button didn't verify if the reviewer actually had applicant data (form_responses)

---

## Solution Implementation

### 1. Database Migration: Prevent Data Loss

**File:** `supabase/migrations/20260212000000_fix_reviewer_event_cascade.sql`

**Changes:**
```sql
-- Made event_id nullable
ALTER TABLE public.reviewers
ALTER COLUMN event_id DROP NOT NULL;

-- Changed ON DELETE CASCADE to ON DELETE SET NULL
ALTER TABLE public.reviewers
ADD CONSTRAINT reviewers_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE SET NULL;

-- Updated unique constraint to handle NULL event_id
CREATE UNIQUE INDEX idx_unique_reviewer_event
ON public.reviewers(user_id, event_id)
WHERE event_id IS NOT NULL;
```

**Result:** When events are deleted, reviewer records are preserved with `event_id = NULL` (unassigned status).

---

### 2. Admin Reviewers Page Updates

**File:** `src/app/admin/reviewers/page.tsx`

**Changes:**

#### a) Show All Reviewers (Including Unassigned)
```typescript
// Fetch reviewers from the reviewers table
const { data: reviewersData } = await supabase
  .from('reviewers')
  .select(`*, user_profiles:user_id (id, name, email), events:event_id (id, title, slug)`)

// Also fetch users with role='reviewer' who may not have assignments
const { data: unassignedReviewers } = await supabase
  .from('user_profiles')
  .select('id, name, email, role, created_at')
  .eq('role', 'reviewer')

// Create synthetic entries for unassigned reviewers
const unassignedReviewerEntries = unassignedReviewers
  .filter(up => !assignedUserIds.has(up.id))
  .map(up => ({
    id: `unassigned-${up.id}`,
    user_id: up.id,
    event_id: null,
    // ... default permissions
  }))

// Combine both lists
setReviewers([...reviewersData, ...unassignedReviewerEntries])
```

#### b) Added "Unassigned" Filter Option
```typescript
// Filter dropdown now includes:
<option value="all">All Events</option>
<option value="unassigned">Unassigned Reviewers</option>
{events.map(event => (
  <option key={event.id} value={event.id}>{event.title}</option>
))}

// Filter logic updated:
if (eventFilter === 'unassigned') return reviewers.filter(r => r.event_id === null)
```

#### c) Visual Indicator for Unassigned Reviewers
```typescript
// Event column shows yellow badge for unassigned
<span className={`badge ${hasEvent ? 'bg-info' : 'bg-warning text-dark'}`}>
  {hasEvent ? event.title : 'Unassigned'}
</span>
```

#### d) Show All Events (Not Just Upcoming)
Changed event query to show all events for reviewer management, not just upcoming ones.

---

### 3. Reviewer Status API Updates

**File:** `src/app/api/user/reviewer-status/route.ts`

**Changes:**
```typescript
// Check BOTH reviewers table AND user_profiles.role
const [
  { data: assignment },      // Check reviewers table
  { data: userProfile },     // Check user_profiles.role
  { data: formResponses }    // Check if user has applicant data
] = await Promise.all([
  adminSupabase.from('reviewers').select('id').eq('user_id', user.id).maybeSingle(),
  adminSupabase.from('user_profiles').select('id, role').eq('id', user.id).single(),
  adminSupabase.from('form_responses').select('id').eq('user_id', user.id).maybeSingle()
])

// User is a reviewer if they have assignment OR role='reviewer'
const isReviewer = !!assignment || userProfile?.role === 'reviewer'
const hasApplicantData = !!formResponses

return NextResponse.json({
  success: true,
  isReviewer,
  hasApplicantData,
  hasReviewerAssignment: !!assignment,
  profileRole: userProfile?.role,
})
```

---

### 4. Dashboard Layout Portal Switch Updates

**File:** `src/components/dashboard/DashboardLayout.tsx`

**Changes:**

#### a) Added State for Applicant Data
```typescript
const [hasReviewerAccess, setHasReviewerAccess] = useState(false)
const [hasApplicantData, setHasApplicantData] = useState(false)
```

#### b) Updated useEffect to Check Both
```typescript
useEffect(() => {
  if (user?.role === 'applicant' || user?.role === 'reviewer') {
    fetch('/api/user/reviewer-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.isReviewer) setHasReviewerAccess(true)
          if (data.hasApplicantData) setHasApplicantData(true)
        }
      })
  }
}, [user?.role])
```

#### c) Updated Button Conditions
```typescript
{/* Show "Switch to Reviewer" for applicants who have reviewer access */}
{hasReviewerAccess && user?.role === 'applicant' && (
  <Link href="/reviewer/dashboard">Switch to Reviewer</Link>
)}

{/* Show "Switch to Applicant" for reviewers who have applicant data */}
{hasApplicantData && user?.role === 'reviewer' && (
  <Link href="/dashboard">Switch to Applicant</Link>
)}
```

---

## Data Fix Applied

Re-added `kelvingithu09@gmail.com` to the reviewers table as an unassigned reviewer:

```sql
INSERT INTO reviewers (user_id, event_id, permissions, added_by)
VALUES (
  '260ccffa-41de-41af-b792-d8ccd2600667',  -- kelvingithu09@gmail.com
  NULL,  -- Unassigned
  '{"canViewApplications": true, ...}'::jsonb,
  '9b56cb61-1c8c-43f6-9731-862e58b8cbc3'   -- admin
);
```

---

## Testing Checklist

### Admin Reviewers Page (`/admin/reviewers`)
- [ ] All reviewers visible including unassigned ones
- [ ] `kelvingithu09@gmail.com` appears in the list
- [ ] "Unassigned Reviewers" filter works
- [ ] Unassigned reviewers show yellow "Unassigned" badge
- [ ] Can assign unassigned reviewers to events
- [ ] Can edit permissions for unassigned reviewers

### Portal Switch (Reviewer Role)
- [ ] Login as `kelvingithu09@gmail.com` (Password: `Kel@dead-1ubb`)
- [ ] Navigate to reviewer dashboard
- [ ] "Switch to Applicant" button visible in sidebar
- [ ] Clicking button navigates to `/dashboard`
- [ ] Applicant dashboard loads with their application data

### Portal Switch (Applicant Role)
- [ ] Login as an applicant who is also a reviewer
- [ ] "Switch to Reviewer" button visible in sidebar
- [ ] Clicking button navigates to `/reviewer/dashboard`

### Data Retention
- [ ] Delete a test event
- [ ] Verify reviewer records are preserved with `event_id = NULL`
- [ ] Verify deleted event's reviewers appear as "Unassigned"

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/admin/reviewers/page.tsx` | Show all reviewers, unassigned filter, visual indicators |
| `src/app/api/user/reviewer-status/route.ts` | Check both sources, add hasApplicantData |
| `src/components/dashboard/DashboardLayout.tsx` | Portal switch logic fixes |
| `supabase/migrations/20260212000000_fix_reviewer_event_cascade.sql` | Database migration (new file) |

---

## Related Issues

- **Issue #14:** Retain reviewer records after event deletion - **FIXED**
- **Issue #21:** Reviewer/Applicant portal switch - **FIXED**
- **Issue #24:** Permissions not taking effect on reviewer side - Related, may need separate testing

---

## Notes

1. **Global Reviewers:** The "Add Reviewer" modal already supports adding global reviewers (assigned to all events). This functionality was already implemented.

2. **Unassigned vs Global:**
   - **Unassigned:** Reviewer with `event_id = NULL` (no event assignment)
   - **Global:** Reviewer assigned to ALL events (multiple entries in reviewers table)

3. **Role Management:** When a reviewer loses all their event assignments, they remain a reviewer (role preserved in user_profiles). Admins can reassign them to new events.
