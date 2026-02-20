# Reviewer System Column Reference Fix

## Problem

**File:** `37_reviewer_system.sql`
**Error:**
```
ERROR: 42703: column reg.registered_at does not exist
LINE 57: THEN EXTRACT(EPOCH FROM (reg.reviewed_at - reg.registered_at)) / 3600
```

## Root Cause

The `reviewer_stats` view (line 45-65) was trying to calculate average review hours using a column `reg.registered_at` that doesn't exist in the `registrations` table.

### Registrations Table Columns (from file 35):

✅ Has:
- `created_at` - When registration was created
- `updated_at` - When registration was last updated
- `reviewed_at` - When registration was reviewed
- `shortlisted_at` - When registration was shortlisted
- `approved_at` - When registration was approved
- `rejected_at` - When registration was rejected

❌ Does NOT have:
- `registered_at` - This column doesn't exist

## Solution Applied

**Line 57 changed from:**
```sql
THEN EXTRACT(EPOCH FROM (reg.reviewed_at - reg.registered_at)) / 3600
```

**To:**
```sql
THEN EXTRACT(EPOCH FROM (reg.reviewed_at - reg.created_at)) / 3600
```

### Logic:
- `created_at` represents when the registration was first created (i.e., when they registered)
- The calculation now correctly computes: `review_time = reviewed_at - created_at`
- This gives the time (in hours) from registration to review

## What This View Does

The `reviewer_stats` view aggregates reviewer performance metrics:

```sql
reviewer_stats:
  - reviewer_id, reviewer_name, reviewer_email
  - total_reviews (count of reviews)
  - total_shortlists (count of shortlists)
  - total_accepted (count of approved)
  - total_rejected (count of rejected)
  - avg_review_hours (average time to review) ⭐ FIXED
  - last_review_at (timestamp of last review)
```

## Verification

After running the fixed file 37, verify:

```sql
-- Check view exists
SELECT EXISTS (
  SELECT FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'reviewer_stats'
);
-- Expected: true

-- Test view (should work without errors)
SELECT * FROM reviewer_stats LIMIT 5;

-- Check reviewer_assignments table
SELECT COUNT(*) FROM reviewer_assignments;
-- Expected: 0 (empty initially)
```

## Files Modified

- ✅ `37_reviewer_system.sql` - Line 57: Changed `registered_at` to `created_at`

---

**Created:** 2025-12-14
**Status:** ✅ Fix applied
**Impact:** Low - View calculation corrected
