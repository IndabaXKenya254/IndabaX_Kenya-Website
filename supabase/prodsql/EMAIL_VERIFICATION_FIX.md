# Email Verification Tokens - user_id Column Fix

## Problem

**File:** `38_email_verification_tokens.sql`
**Error:**
```
ERROR: 42703: column "user_id" does not exist
```

## Root Cause Analysis

### What the Database Actually Has (via MCP):
```sql
email_verification_tokens columns:
✅ id, user_id, token, email, expires_at, verified_at, created_at
```

### What File 35 Creates:
```sql
-- File 35 line 260-267 (WRONG - missing user_id)
CREATE TABLE email_verification_tokens (
  id, email, token, expires_at, verified_at, created_at
  ❌ NO user_id column
);
```

### What File 38 Expected:
```sql
-- File 38 (CORRECT - has user_id)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id, user_id, token, email, expires_at, verified_at, created_at
  ✅ Has user_id column
);
```

### The Conflict:
1. File 35 creates table WITHOUT `user_id`
2. File 38 uses `CREATE TABLE IF NOT EXISTS` (skipped because table exists)
3. File 38 tries to create RLS policies using `user_id` column
4. **ERROR:** Column doesn't exist!

## Solution Applied

Modified **`38_email_verification_tokens.sql`** to:

### 1. Handle Existing Table
```sql
-- Accepts table created by file 35
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id, email, token, expires_at, verified_at, created_at
);
```

### 2. Add user_id Column Conditionally
```sql
-- Add user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_verification_tokens'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.email_verification_tokens
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
```

### 3. Updated RLS Policies
```sql
-- Added backwards compatibility for NULL user_id
USING (auth.uid() = user_id OR user_id IS NULL);
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

Also added `DROP POLICY IF EXISTS` to prevent errors if policies already exist.

## Verification

After running the fixed file 38:

```sql
-- Check user_id column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'email_verification_tokens'
  AND column_name = 'user_id';
-- Expected: user_id

-- Check all columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_verification_tokens'
ORDER BY ordinal_position;
-- Expected: id, user_id, email, token, expires_at, verified_at, created_at

-- Check RLS policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'email_verification_tokens';
-- Expected: 3 policies
```

## Why This Happened

The production SQL files (`prodsql/`) were created by consolidating multiple dev migrations. During consolidation:
- File 35 included a basic `email_verification_tokens` table (without user_id)
- File 38 expected to create the full version (with user_id)
- The two files conflicted

## Comparison with Dev Database

**Dev migrations:** ✅ Correct structure with user_id
**Prod file 35:** ❌ Missing user_id
**Prod file 38:** ✅ Now handles both cases (adds user_id if missing)

## Files Modified

1. ✅ `38_email_verification_tokens.sql`
   - Added conditional ALTER TABLE to add user_id
   - Added DROP POLICY IF EXISTS for safety
   - Updated RLS policies to handle NULL user_id

---

**Created:** 2025-12-14
**Status:** ✅ Fix applied
**Impact:** Medium - Email verification system now works correctly
