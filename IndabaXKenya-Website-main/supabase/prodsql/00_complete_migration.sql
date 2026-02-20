-- ═══════════════════════════════════════════════════════════════════════
-- COMPLETE PRODUCTION MIGRATION - INDABAX KENYA WEBSITE
-- ═══════════════════════════════════════════════════════════════════════
-- This file combines all migrations in the correct order
-- Run this ONLY on a fresh database - it includes the initial schema
--
-- Alternative: Run individual files 01, 02, 03 in order
-- ═══════════════════════════════════════════════════════════════════════

-- NOTE: This file includes the complete initial schema from 01_initial_schema.sql
--       followed by the fixes from 02_fix_rls_policies.sql and 03_add_unique_constraints.sql
--
-- For production deployment:
-- Option A: Run this single file
-- Option B: Run 01_initial_schema.sql, then 02_fix_rls_policies.sql, then 03_add_unique_constraints.sql
--
-- DO NOT run this if you've already run 01_initial_schema.sql

\echo 'Starting complete migration...'

-- ============================================================================
-- STEP 1: INCLUDE INITIAL SCHEMA
-- ============================================================================
-- See 01_initial_schema.sql for the complete initial schema
-- (This file should be appended with the contents of 01_initial_schema.sql)

\echo 'ERROR: This file is a template. Please use one of these options:'
\echo 'Option A: Run individual migrations in order (01, 02, 03)'
\echo 'Option B: Manually concatenate 01_initial_schema.sql + 02_fix_rls_policies.sql + 03_add_unique_constraints.sql'
\echo ''
\echo 'Recommended: Use Option A (individual migrations) for better error tracking'

-- To create the complete migration, run this command in bash:
-- cat 01_initial_schema.sql 02_fix_rls_policies.sql 03_add_unique_constraints.sql > 00_complete_migration.sql
