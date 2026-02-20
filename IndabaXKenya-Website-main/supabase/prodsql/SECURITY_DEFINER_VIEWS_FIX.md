# Security Definer Views Fix - Migration 48

**Date:** 2025-12-15
**Status:** ✅ Ready for Production
**Migration File:** `48_fix_security_definer_views.sql`
**Severity:** HIGH - Critical Security Vulnerability

## Problem Summary

Four database views were using `SECURITY DEFINER` which bypassed Row Level Security (RLS) policies:
- `event_registration_stats`
- `noai_faqs_categorized`
- `user_application_summary`
- `noai_active_events`

### Security Impact

**CRITICAL VULNERABILITY:**
- Views executed with creator's permissions instead of querying user's permissions
- RLS policies on underlying tables were completely bypassed
- Anonymous users could access sensitive data including:
  - User emails and personal information (PII)
  - Internal registration statistics
  - Organization details
  - Application status and notes

**Supabase Security Advisor Errors:**
```
ERROR: security_definer_view - View `public.event_registration_stats`
ERROR: security_definer_view - View `public.noai_faqs_categorized`
ERROR: security_definer_view - View `public.user_application_summary`
ERROR: security_definer_view - View `public.noai_active_events`
```

## Solution Implemented

### Changes Made

1. **Removed SECURITY DEFINER** from all 4 views
2. **Added SECURITY INVOKER** - Views now respect RLS policies
3. **Restricted Permissions** - Proper access control:
   - Public views: `SELECT` only for `anon` and `authenticated`
   - Admin views: `SELECT` only for `service_role`

### View Access Matrix

| View Name | Access Level | Roles | Data Type |
|-----------|-------------|-------|-----------|
| `noai_faqs_categorized` | PUBLIC | anon, authenticated | FAQ content |
| `noai_active_events` | PUBLIC | anon, authenticated | Event listings |
| `event_registration_stats` | ADMIN | service_role | Internal metrics |
| `user_application_summary` | ADMIN | service_role | PII, user data |

## Technical Details

### Before (VULNERABLE)
```sql
CREATE VIEW public.user_application_summary AS
SELECT ... -- Contains emails, names, etc.
-- Implicitly uses SECURITY DEFINER
-- Grants: anon, authenticated have SELECT, INSERT, UPDATE, DELETE
```

### After (SECURE)
```sql
CREATE VIEW public.user_application_summary
WITH (security_invoker = true) AS
SELECT ... -- Contains emails, names, etc.
-- Uses SECURITY INVOKER (respects RLS)
-- Grants: ONLY service_role has SELECT
```

## Deployment Instructions

### 1. Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Verify admin panel uses `service_role` key (not `anon` key)
- [ ] Verify frontend uses `anon` key for public views
- [ ] Review migration file: `48_fix_security_definer_views.sql`

### 2. Apply Migration

**Option A: Supabase Dashboard (Recommended)**
```bash
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of 48_fix_security_definer_views.sql
3. Paste and click "Run"
4. Verify success message
```

**Option B: psql Command Line**
```bash
psql "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres" \
  -f supabase/prodsql/48_fix_security_definer_views.sql
```

**Option C: Supabase CLI**
```bash
supabase db push --db-url "your-production-connection-string"
```

### 3. Post-Deployment Verification

Run these queries to verify success:

```sql
-- 1. Verify all views exist
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('event_registration_stats', 'noai_faqs_categorized',
                   'user_application_summary', 'noai_active_events');
-- Expected: 4 rows

-- 2. Verify permissions are correct
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_application_summary';
-- Expected: Only service_role with SELECT

-- 3. Test public access (with anon key)
SELECT COUNT(*) FROM noai_faqs_categorized;
-- Expected: Success (returns count)

-- 4. Test admin access (with service_role key)
SELECT COUNT(*) FROM user_application_summary;
-- Expected: Success (returns count)

-- 5. Run Supabase Security Advisors
-- Go to Dashboard → Database → Advisors
-- Expected: No SECURITY DEFINER errors
```

## Application Code Changes Required

### Admin Panel
Ensure admin panel uses `service_role` key for these queries:
- `event_registration_stats`
- `user_application_summary`

```typescript
// Example: Admin API route
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Must use service_role
)

// This will work for admins
const { data } = await supabaseAdmin
  .from('user_application_summary')
  .select('*')
```

### Public Frontend
Public views continue to work with `anon` key:
- `noai_faqs_categorized`
- `noai_active_events`

```typescript
// Example: Public component
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // anon key is fine
)

// This will work for public users
const { data } = await supabase
  .from('noai_active_events')
  .select('*')
```

## Rollback Plan

If issues occur, rollback by recreating views with SECURITY DEFINER:

```sql
-- EMERGENCY ROLLBACK ONLY
-- This restores the vulnerable state but allows time to debug

DROP VIEW IF EXISTS public.event_registration_stats;
CREATE VIEW public.event_registration_stats AS
SELECT ... -- (original definition)
-- Will use SECURITY DEFINER by default

-- Restore original permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registration_stats
  TO anon, authenticated, service_role;
```

**Note:** Only use rollback if application is broken. The vulnerable state should be temporary.

## Testing Checklist

### Development (Already Applied via MCP)
- [x] Migration executed successfully
- [x] All 4 views recreated
- [x] Security advisors show no errors
- [x] Permissions verified

### Production (To Be Done)
- [ ] Migration applied to production
- [ ] Admin panel can access admin views
- [ ] Public frontend can access public views
- [ ] Security advisors show no errors
- [ ] No application errors in logs

## Related Files

- Migration SQL: `48_fix_security_definer_views.sql`
- Previous Security Fix: `45_fix_security_advisories.sql`
- Views Created By: `47_noai_performance_indexes_and_views.sql`

## References

- [Supabase: Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL: CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## Success Criteria

✅ All 4 SECURITY DEFINER errors eliminated
✅ Views use SECURITY INVOKER (respect RLS)
✅ Public views accessible to anonymous users
✅ Admin views restricted to service_role only
✅ No application functionality broken
✅ Security advisors show green/clean
