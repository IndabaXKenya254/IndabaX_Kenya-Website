# Security Advisories Fix Guide

**Date:** December 11, 2025
**Status:** Migration Ready for Approval

## Summary

This guide addresses the security advisories flagged by Supabase's database linter.

## Issues Identified

### ERROR Level (Critical)
- ✅ **2 SECURITY DEFINER views** - Fixed in migration
  - `applications_with_locks`
  - `reviewer_stats`

### WARN Level
- ✅ **19 functions with mutable search_path** - Fixed in migration
- ✅ **1 extension in public schema** (`pg_trgm`) - Fixed in migration
- ⚠️  **Leaked password protection disabled** - Requires manual dashboard setting

---

## Migration File

**File:** `/supabase/migrations/20251211000000_fix_security_advisories.sql`

### What It Fixes

#### 1. SECURITY DEFINER Views → SECURITY INVOKER

**Problem:** Views that reference `auth.users` are automatically created with `SECURITY DEFINER`, which bypasses RLS (Row Level Security) and executes with the view creator's permissions instead of the querying user's permissions.

**Fix:** Recreated both views with `WITH (security_invoker=true)` option:
- `applications_with_locks` - Now uses `user_profiles` instead of `auth.users`
- `reviewer_stats` - Already using `user_profiles`, just added SECURITY INVOKER

**Impact:** Views will now respect RLS policies and user permissions.

---

#### 2. Function Search Path Protection

**Problem:** Functions without a fixed `search_path` are vulnerable to search path injection attacks, where malicious users can manipulate the schema search order.

**Fix:** Set explicit `search_path = public, auth` (or just `public` for non-auth functions) on all 19 functions:

**Ticketing Functions:**
- `check_in_ticket(uuid)`
- `lookup_ticket_by_qr(text)`

**Review Lock Functions:**
- `cleanup_expired_locks()`
- `acquire_review_lock(uuid, uuid)`
- `release_review_lock(uuid)`
- `is_application_locked(uuid)`
- `get_reviewer_workload(uuid)`
- `update_reviewer_assignment_count()`

**Role Check Functions:**
- `get_user_role()`
- `is_reviewer()`
- `is_admin()`

**Token Generation:**
- `generate_resume_token(uuid)`

**Trigger Functions:**
- `update_venues_updated_at()`
- `handle_new_user()`
- `update_updated_at_column()`
- `log_application_activity()`
- `trigger_log_status_change()`
- `trigger_log_notes_update()`

**Impact:** Protects against search path injection attacks.

---

#### 3. Extension Schema Migration

**Problem:** The `pg_trgm` extension is installed in the `public` schema, which is a security risk (allows public access).

**Fix:**
1. Creates `extensions` schema if it doesn't exist
2. Moves `pg_trgm` to the `extensions` schema
3. Grants necessary permissions to `authenticated` and `anon` roles

**Impact:** Better security isolation for extensions.

---

## How to Apply This Fix

### Step 1: Review the Migration

Read the migration file to understand what changes will be made:
```bash
cat supabase/migrations/20251211000000_fix_security_advisories.sql
```

### Step 2: Apply Using MCP (Development)

**I need your approval to execute this migration using Supabase MCP.**

The migration will:
- ✅ Recreate 2 views with SECURITY INVOKER
- ✅ Set search_path on 19 functions
- ✅ Move pg_trgm extension to extensions schema
- ✅ Run verification queries to confirm fixes

**May I proceed with executing this migration using MCP?**

### Step 3: Enable Leaked Password Protection (Manual)

This **cannot** be done via SQL migration. You must:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/klnspdwlybpwkznzezzd/auth/policies)
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Password Settings** section
4. Find **"Leaked Password Protection"**
5. Toggle it **ON**

**What it does:** Checks user passwords against the HaveIBeenPwned.org database to prevent use of compromised passwords.

---

## Verification

After applying the migration, you can verify the fixes by running:

```sql
-- Check for SECURITY DEFINER views
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('applications_with_locks', 'reviewer_stats')
  AND definition LIKE '%security_definer%';
-- Should return 0 rows

-- Check functions with mutable search_path
SELECT p.proname, pg_proc_config(p.oid) as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('check_in_ticket', 'lookup_ticket_by_qr', 'cleanup_expired_locks')
-- Should show search_path configuration

-- Check pg_trgm extension schema
SELECT n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pg_trgm';
-- Should return 'extensions', not 'public'
```

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback by:

```sql
-- Rollback views to SECURITY DEFINER
DROP VIEW IF EXISTS applications_with_locks CASCADE;
-- (Use original CREATE VIEW statements from 20251121040000_phase5_review_system.sql)

-- Rollback extension schema
ALTER EXTENSION pg_trgm SET SCHEMA public;

-- Rollback function search paths
ALTER FUNCTION check_in_ticket(uuid) RESET search_path;
-- (Repeat for all functions)
```

---

## Next Steps

1. ✅ **Review migration file** - Ensure you understand all changes
2. ⏳ **Approve MCP execution** - Give permission to run the migration
3. ⏳ **Enable leaked password protection** - Manual dashboard setting
4. ⏳ **Verify fixes** - Run verification queries
5. ⏳ **Re-run Supabase advisor** - Confirm all issues are resolved

---

## References

- [Supabase Database Linter: Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Supabase Database Linter: Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase Database Linter: Extension in Public Schema](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Supabase Auth: Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
