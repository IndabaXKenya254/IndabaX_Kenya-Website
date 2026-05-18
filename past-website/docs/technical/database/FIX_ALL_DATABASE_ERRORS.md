# 🔧 FIX ALL DATABASE ERRORS - Complete Guide

You've encountered **3 database errors** that need to be fixed. This guide will help you fix them all in one go.

---

## 📋 ERRORS TO FIX

1. **Missing `ip_address` column** in `review_locks` table
2. **Wrong foreign key** - points to `registrations` instead of `form_responses`
3. **Permission denied** - cannot access `auth.users` table

---

## ✅ QUICK FIX (5 minutes)

Run all 3 migrations in Supabase SQL Editor.

---

### **Step 1:** Go to Supabase SQL Editor

🔗 https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/sql/new

---

### **Step 2:** Run Migration #1 - Add ip_address Column

**Copy & Paste:**

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- FIX #1: Add missing ip_address column
-- ═══════════════════════════════════════════════════════════════════════

-- Add the missing ip_address column
ALTER TABLE public.review_locks
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);

-- Add comment
COMMENT ON COLUMN public.review_locks.ip_address IS
'IP address of the admin who acquired the lock.
Used for audit trail and debugging.
Optional field, can be NULL.';

-- Verify the column exists
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_locks'
      AND column_name = 'ip_address'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✅ ip_address column added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add ip_address column';
  END IF;
END $$;
```

**Click "Run"** → Should see: `✅ ip_address column added successfully`

---

### **Step 3:** Run Migration #2 - Fix Foreign Key

**Copy & Paste:**

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- FIX #2: Fix foreign key constraint
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.review_locks
DROP CONSTRAINT IF EXISTS review_locks_registration_id_fkey;

-- Step 2: Add the correct foreign key constraint
-- registration_id should reference form_responses.id (not registrations.id)
ALTER TABLE public.review_locks
ADD CONSTRAINT review_locks_registration_id_fkey
  FOREIGN KEY (registration_id)
  REFERENCES public.form_responses(id)
  ON DELETE CASCADE;

-- Step 3: Verify the constraint is correct
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_referenced_table TEXT;
BEGIN
  -- Check if constraint exists and points to form_responses
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'review_locks'
        AND tc.constraint_name = 'review_locks_registration_id_fkey'
        AND ccu.table_name = 'form_responses'
    ),
    ccu.table_name
  INTO v_constraint_exists, v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'review_locks'
    AND tc.constraint_name = 'review_locks_registration_id_fkey'
  LIMIT 1;

  IF v_constraint_exists AND v_referenced_table = 'form_responses' THEN
    RAISE NOTICE '✅ Foreign key constraint fixed successfully';
    RAISE NOTICE '   review_locks.registration_id now references form_responses.id';
  ELSE
    RAISE WARNING '⚠️  Foreign key may not be correctly configured';
    RAISE WARNING '   Current reference: %', v_referenced_table;
  END IF;
END $$;
```

**Click "Run"** → Should see: `✅ Foreign key constraint fixed successfully`

---

### **Step 4:** Run Migration #3 - Fix Permissions

**Copy & Paste:**

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- FIX #3: Fix auth.users permission denied error
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Fix is_application_locked function
-- Drop ALL versions of the function (it may have multiple signatures)
DROP FUNCTION IF EXISTS is_application_locked(UUID);
DROP FUNCTION IF EXISTS is_application_locked(UUID, UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID);
DROP FUNCTION IF EXISTS is_application_locked(p_registration_id UUID, p_user_id UUID);

CREATE OR REPLACE FUNCTION is_application_locked(
  p_registration_id UUID
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by_user_id UUID,
  locked_by_email TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_owned_by_requester BOOLEAN
) AS $$
DECLARE
  p_user_id UUID := auth.uid();
BEGIN
  -- Cleanup expired locks first
  PERFORM cleanup_expired_locks();

  -- Return lock status with user info from user_profiles
  RETURN QUERY
  SELECT
    (rl.id IS NOT NULL) AS is_locked,
    rl.locked_by AS locked_by_user_id,
    up.email AS locked_by_email,
    rl.locked_at,
    rl.expires_at,
    (rl.locked_by = p_user_id) AS is_owned_by_requester
  FROM review_locks rl
  LEFT JOIN public.user_profiles up ON up.id = rl.locked_by
  WHERE rl.registration_id = p_registration_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_application_locked IS
'Checks if an application is currently locked.
Uses user_profiles table instead of auth.users for permissions.';

-- 2. Fix applications_with_locks view
DROP VIEW IF EXISTS applications_with_locks CASCADE;

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
FROM form_responses fr
LEFT JOIN review_locks rl
  ON rl.registration_id = fr.id
  AND rl.expires_at > NOW()
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by;

COMMENT ON VIEW applications_with_locks IS
'Applications with their current lock status.
Uses user_profiles table instead of auth.users for permissions.';

-- Grant access to authenticated users
GRANT SELECT ON applications_with_locks TO authenticated;

-- 3. Verify the fix
DO $$
DECLARE
  v_function_exists BOOLEAN;
  v_view_exists BOOLEAN;
BEGIN
  -- Check if function was recreated
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_application_locked'
  ) INTO v_function_exists;

  -- Check if view was recreated
  SELECT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'applications_with_locks'
  ) INTO v_view_exists;

  IF v_function_exists AND v_view_exists THEN
    RAISE NOTICE '✅ Auth permissions fix applied successfully';
    RAISE NOTICE '   - is_application_locked() now uses user_profiles';
    RAISE NOTICE '   - applications_with_locks view now uses user_profiles';
  ELSE
    RAISE WARNING '⚠️  Fix may not be complete';
    RAISE WARNING '   Function exists: %', v_function_exists;
    RAISE WARNING '   View exists: %', v_view_exists;
  END IF;
END $$;
```

**Click "Run"** → Should see: `✅ Auth permissions fix applied successfully`

---

### **Step 5:** Restart Dev Server

```bash
# Press Ctrl+C in terminal to stop server
npm run dev
```

**Refresh browser → All errors should be fixed!** ✅

---

## 🎯 WHAT WAS FIXED

### Error #1: Missing Column
**Before:**
```sql
-- review_locks table missing ip_address column
```
**After:**
```sql
-- review_locks table now has:
ip_address VARCHAR(50)  ✅
```

---

### Error #2: Wrong Foreign Key
**Before:**
```sql
-- ❌ WRONG - references non-existent table
FOREIGN KEY (registration_id) REFERENCES registrations(id)
```
**After:**
```sql
-- ✅ CORRECT - references form_responses
FOREIGN KEY (registration_id) REFERENCES form_responses(id)
```

---

### Error #3: Permission Denied
**Before:**
```sql
-- ❌ Cannot access auth.users (permission denied)
LEFT JOIN auth.users u ON u.id = rl.locked_by
```
**After:**
```sql
-- ✅ Use user_profiles instead (accessible)
LEFT JOIN public.user_profiles up ON up.id = rl.locked_by
```

---

## 📂 MIGRATION FILES CREATED

All 3 migrations are properly stored:

1. `supabase/migrations/20251121140000_fix_review_locks_add_ip_address.sql`
2. `supabase/migrations/20251121141000_fix_review_locks_foreign_key.sql`
3. `supabase/migrations/20251121142000_fix_auth_users_permissions.sql`

---

## ✅ VERIFY IT WORKED

### Test 1: Check Table Schema
**Run in Supabase:**
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'review_locks'
ORDER BY ordinal_position;
```

**Expected columns:**
```
id              | uuid
registration_id | uuid
locked_by       | uuid
locked_at       | timestamp with time zone
expires_at      | timestamp with time zone
created_at      | timestamp with time zone
ip_address      | character varying (50)   ← Should exist now ✅
```

---

### Test 2: Check Foreign Key
**Run in Supabase:**
```sql
SELECT
  tc.constraint_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'review_locks'
  AND tc.constraint_type = 'FOREIGN KEY';
```

**Expected:**
```
review_locks_registration_id_fkey | form_responses | id  ← Should reference form_responses ✅
```

---

### Test 3: Test Lock Acquisition
**Test in browser:**
1. Go to: http://localhost:3000/admin/applications
2. Click on any application
3. Lock should be acquired automatically
4. No errors in console ✅

---

## 🚀 NEXT STEPS

After all fixes are applied:
1. ✅ Test single shortlist from application detail page
2. ✅ Test bulk shortlist from applications list
3. ✅ Verify lock acquisition and release works
4. ✅ Check that locked applications show lock status

---

## 🆘 TROUBLESHOOTING

### If you still see errors:

**Check user_profiles table exists:**
```sql
SELECT * FROM user_profiles LIMIT 1;
```

**If table doesn't exist, create it:**
```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Check if you're logged in:**
```sql
SELECT auth.uid();  -- Should return your user ID, not NULL
```

---

**Run all 3 SQL migrations above and your Phase 5 lock system will be fully functional!** 🎉
