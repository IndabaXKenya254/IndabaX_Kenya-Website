# FIX: Add Missing ip_address Column

**Error:** `column "ip_address" of relation "review_locks" does not exist`

**Issue:** The `review_locks` table exists but is missing the `ip_address` column.

**Solution:** Run the fix migration in Supabase.

---

## QUICK FIX (1 minute):

### **Step 1:** Open the migration file

**Location:**
```
/home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website/supabase/migrations/20251121140000_fix_review_locks_add_ip_address.sql
```

**Or view it:**
```bash
cat supabase/migrations/20251121140000_fix_review_locks_add_ip_address.sql
```

---

### **Step 2:** Run in Supabase SQL Editor

1. **Go to:** https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/sql/new

2. **Copy & Paste** this SQL:

```sql
-- Add the missing ip_address column
ALTER TABLE public.review_locks
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);

-- Add comment
COMMENT ON COLUMN public.review_locks.ip_address IS
'IP address of the admin who acquired the lock.
Used for audit trail and debugging.
Optional field, can be NULL.';

-- Verify it worked
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

3. **Click "Run"**

4. **Should see:** `✅ ip_address column added successfully`

---

### **Step 3:** Restart dev server

```bash
# Press Ctrl+C in terminal
npm run dev
```

**Refresh browser → Error fixed!** ✅

---

## WHY THIS HAPPENED:

The `review_locks` table was created with a different schema than expected. The main Phase 5 migration (`20251121040000_phase5_review_system.sql`) includes the `ip_address` column, but your table was created without it (possibly from an earlier manual creation or partial migration).

This fix migration adds the missing column.

---

## VERIFY IT WORKED:

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
locked_by      | uuid
locked_at      | timestamp with time zone
expires_at     | timestamp with time zone
created_at     | timestamp with time zone
ip_address     | character varying (50)   ← Should now exist
```

---

## MIGRATION FILE LOCATION:

✅ **Properly stored in:**
```
supabase/migrations/20251121140000_fix_review_locks_add_ip_address.sql
```

This follows the standard migration naming convention:
- `YYYYMMDDHHMMSS` timestamp
- Descriptive name
- `.sql` extension

All future migrations should also be stored in `supabase/migrations/` folder.

---

**Run the SQL above and your lock system will work!** 🚀
