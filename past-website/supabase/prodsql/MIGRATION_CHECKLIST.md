# Production Migration Checklist
**For Manual Production Deployment**

Use this checklist when deploying to production Supabase.

---

## 📋 Pre-Deployment

- [ ] Backup production database
- [ ] Review all migration files (01-11)
- [ ] Verify production Supabase project credentials
- [ ] Read UPDATE_SUMMARY.md for context

---

## 🚀 Migration Execution

Execute these migrations **in sequence** via Supabase Dashboard → SQL Editor:

### Core Schema (01-04)
- [ ] **01_initial_schema.sql** - Base database schema, tables, functions
- [ ] **02_fix_rls_policies.sql** - RLS policies for public forms
- [ ] **03_add_unique_constraints.sql** - Prevent duplicate submissions
- [ ] **04_fix_admin_roles_rls.sql** - Fix admin authentication

### Storage & Photos (05-06)
- [ ] **05_setup_storage_buckets.sql** ✨ **CRITICAL** - Storage buckets for uploads
- [ ] **06_update_photos_schema.sql** - Gallery photo schema

### Schema Enhancements (07-09)
- [ ] **07_phase1_add_missing_columns.sql** - Additional table columns
- [ ] **08_phase2_tag_system.sql** - Event & post tagging
- [ ] **09_phase3_relationships.sql** - Expertise & relationships

### Final Fixes (10-11)
- [ ] **10_fix_migration_issues_final.sql** - Data consistency fixes
- [ ] **11_add_schedule_speakers_table.sql** ✨ **CRITICAL** - Schedule management

---

## ✅ Post-Migration Verification

Run these verification queries:

```sql
-- 1. Count tables (should be ~18-20)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Verify storage buckets exist
SELECT name FROM storage.buckets;

-- 3. Check RLS enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 4. Verify schedule_speakers table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schedule_speakers';
```

Or use: `verification.sql` for comprehensive checks

---

## 🧪 Functional Testing

Test these features after migration:

### Public Features
- [ ] Form submissions (applications, contact, subscribe)
- [ ] View events, speakers, FAQs, sponsors
- [ ] Gallery photo viewing

### Admin Panel
- [ ] Admin login
- [ ] Schedule management (create, edit, delete)
- [ ] Image uploads (events, speakers, gallery)
- [ ] Tag management
- [ ] Expertise management

---

## ⚠️ Critical Dependencies

**DO NOT SKIP THESE:**

- **Migration 05** (storage buckets) → Required for ALL image uploads
- **Migration 11** (schedule_speakers) → Required for schedule management API

If skipped:
- ❌ Image upload features will fail
- ❌ Schedule page will show "Database table not found" error

---

## 🔄 Rollback Instructions

If issues occur:

1. **Restore from backup** (safest option)
2. **Manual rollback**: Each migration has DROP/rollback statements in comments
3. **Contact development team** for assistance

---

## 📝 Success Criteria

Deployment is successful when:

✅ All 11 migrations executed without errors  
✅ All tables created and RLS enabled  
✅ Storage buckets exist and accessible  
✅ schedule_speakers table exists  
✅ Admin can login and manage content  
✅ Public forms work (anonymous submission)  
✅ Image uploads work in admin panel  
✅ Schedule management works without errors  

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for error details
2. Review migration file comments
3. Check UPDATE_SUMMARY.md for context
4. Verify environment variables
5. Contact development team

---

**Total Migrations**: 11  
**Estimated Time**: 10-15 minutes  
**Risk Level**: Low (all tested in development)  
**Last Updated**: October 23, 2025
