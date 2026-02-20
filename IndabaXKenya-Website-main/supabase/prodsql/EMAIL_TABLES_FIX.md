# Email Tables Missing - Fix Applied

## Problem

**File:** `39_enhance_email_tables.sql`
**Error:**
```
ERROR: 42P01: relation "public.email_templates" does not exist
CONTEXT: SQL statement "ALTER TABLE public.email_templates ADD COLUMN description TEXT"
```

## Root Cause

The `email_templates` and `email_logs` tables creation SQL are missing from the production SQL files (`prodsql/` folder).

- ✅ Tables exist in dev migrations: `/supabase/migrations/20251120000000_registration_redesign.sql:405-459`
- ❌ NOT included in production file: `35_registration_redesign_phase1_to_5.sql`
- ❌ File 39 tries to ALTER tables that don't exist

## Solution

Created a new production SQL file: **`38b_create_email_tables.sql`**

This file:
1. Creates `email_templates` table with all base columns
2. Creates `email_logs` table with all base columns
3. Creates 7 indexes for performance
4. Enables Row Level Security (RLS)
5. Creates 5 RLS policies for access control
6. Adds updated_at trigger for email_templates
7. Adds documentation comments

## Tables Structure

### email_templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,

  -- Template details
  name VARCHAR(255),
  subject TEXT,
  body TEXT,  -- Rich HTML from QuillJS

  -- Configuration
  type VARCHAR(100),  -- 'verification', 'shortlist', 'approval', etc.
  is_reusable BOOLEAN,

  -- Variables
  variables TEXT[],  -- Available placeholders

  -- Ownership
  created_by UUID → user_profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### email_logs
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,

  -- Email details
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT,
  body TEXT,  -- Final HTML after variable replacement

  -- Status tracking
  status email_status,  -- pending | sent | delivered | failed | bounced
  error_message TEXT,
  attempts INTEGER,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

## Migration Order

The correct order is now:

1. **File 35:** `35_registration_redesign_phase1_to_5.sql`
   - Creates core tables

2. **File 35b:** `35b_create_tickets_table.sql`
   - Creates tickets table

3. **File 36:** `36_tickets_table_enhancements.sql`
   - Enhances tickets table

4. **File 37:** `37_reviewer_system.sql`
   - Creates reviewer system

5. **File 38:** `38_email_verification_tokens.sql`
   - Creates/enhances email_verification_tokens

6. **File 38b:** `38b_create_email_tables.sql` ⭐ **NEW FILE**
   - Creates email_templates and email_logs tables

7. **File 39:** `39_enhance_email_tables.sql`
   - Adds columns to email_templates and email_logs

## What File 39 Will Add

After file 38b creates the base tables, file 39 will add:

**To email_templates:**
- description TEXT
- category VARCHAR(100)
- is_system BOOLEAN

**To email_logs:**
- template_id UUID
- recipient_name VARCHAR(255)
- variables_used JSONB
- sent_by UUID
- event_id UUID
- registration_id UUID
- updated_at TIMESTAMPTZ

## Indexes Created

**File 38b (base indexes):**
- idx_email_templates_type
- idx_email_templates_created_by
- idx_email_templates_created_at
- idx_email_logs_to_email
- idx_email_logs_status
- idx_email_logs_created_at
- idx_email_logs_sent_at

**File 39 (additional indexes):**
- idx_email_templates_category
- idx_email_logs_template_id
- idx_email_logs_sent_by
- idx_email_logs_event_id
- idx_email_logs_registration_id
- idx_email_logs_recipient_email

## RLS Policies

**email_templates:**
1. Admins can manage email templates (ALL operations)
2. Authenticated users can view email templates (SELECT)

**email_logs:**
1. Admins can view all email logs (SELECT)
2. Service can insert email logs (INSERT)
3. Admins can update email logs (UPDATE)

## Verification

After running `38b_create_email_tables.sql`, verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('email_templates', 'email_logs');
-- Expected: Both tables

-- Check email_templates columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_templates'
ORDER BY ordinal_position;
-- Expected: 9 base columns

-- Check email_logs columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;
-- Expected: 11 base columns

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('email_templates', 'email_logs');
-- Expected: 7 indexes

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('email_templates', 'email_logs');
-- Expected: 5 policies
```

---

**Created:** 2025-12-14
**Status:** ✅ Fix applied
**Files Modified:** Added `38b_create_email_tables.sql`
