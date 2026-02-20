# Storage Buckets Setup Guide

**Project:** IndabaX Kenya - Registration System Redesign
**Date:** 2025-11-20

---

## Why Manual Creation?

Storage buckets in Supabase must be created via the Dashboard (not SQL) because the `storage.buckets` table is owned by the `supabase_storage_admin` role, which has restricted access.

**Error if created via SQL:**
```
ERROR: 42501: must be owner of table buckets
```

---

## Step-by-Step Instructions

### 1. Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **klnspdwlybpwkznzezzd**
3. Navigate to: **Storage** (in left sidebar)

---

### 2. Create Bucket: `tickets`

**Purpose:** Store generated PDF tickets for approved users

1. Click: **"New bucket"** or **"Create a new bucket"**
2. Enter details:
   - **Name:** `tickets`
   - **Public bucket:** NO (keep private)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `application/pdf`
3. Click: **"Create bucket"**

**Storage Path Format:**
```
tickets/[eventId]/[ticketId].pdf
```

**Example:**
```
tickets/abc123-event-uuid/xyz789-ticket-uuid.pdf
```

---

### 3. Create Bucket: `form-uploads`

**Purpose:** Store user file uploads from dynamic forms (resume, cover letter, etc.)

1. Click: **"New bucket"**
2. Enter details:
   - **Name:** `form-uploads`
   - **Public bucket:** NO (keep private)
   - **File size limit:** 10 MB
   - **Allowed MIME types:**
     - `application/pdf`
     - `image/*` (jpg, png, etc.)
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx)
     - `text/plain`
3. Click: **"Create bucket"**

**Storage Path Format:**
```
form-uploads/[userId]/[responseId]/[filename]
```

**Example:**
```
form-uploads/user123/response456/resume.pdf
```

---

### 4. Create Bucket: `papers`

**Purpose:** Store research paper submissions (PDF only)

1. Click: **"New bucket"**
2. Enter details:
   - **Name:** `papers`
   - **Public bucket:** NO (keep private)
   - **File size limit:** 20 MB (papers can be larger)
   - **Allowed MIME types:** `application/pdf`
3. Click: **"Create bucket"**

**Storage Path Format:**
```
papers/[eventId]/[paperId].pdf
papers/[eventId]/[paperId]/supplementary-[n].pdf
```

**Example:**
```
papers/abc123-event-uuid/xyz789-paper-uuid.pdf
papers/abc123-event-uuid/xyz789-paper-uuid/supplementary-1.pdf
```

---

## Verification Checklist

After creating all buckets:

- [ ] `tickets` bucket created (private, 10MB, PDF only)
- [ ] `form-uploads` bucket created (private, 10MB, multiple types)
- [ ] `papers` bucket created (private, 20MB, PDF only)
- [ ] All buckets show as "Private" (not public)
- [ ] All buckets visible in Storage dashboard

---

## Storage Policies (Already Created via Migration)

The SQL migration already created the storage policies. These policies control who can access files:

### Tickets Bucket Policies
- **Users can view own tickets** - Users can only see their own tickets
- **System can upload tickets** - Server-side code can generate tickets
- **Admins can view all tickets** - Admins can see any ticket

### Form Uploads Bucket Policies
- **Users can view own uploads** - Users can only see their own uploads
- **Users can upload files** - Users can upload to their own folder
- **Admins can view all uploads** - Admins can see any upload

### Papers Bucket Policies
- **Users can view own papers** - Users can only see their own papers
- **Users can upload papers** - Users can upload to their own folder
- **Admins can view all papers** - Admins can see any paper

**These policies are enforced at the database level via Row Level Security (RLS).**

---

## Testing Storage

After migration is complete, you can test storage access:

### Test 1: Upload a Test File

```typescript
// Example code (run in browser console after auth)
const { data, error } = await supabase.storage
  .from('tickets')
  .upload('test/sample.pdf', pdfFile);

console.log(data, error);
```

### Test 2: Verify Policies

1. Try to upload as authenticated user → Should succeed
2. Try to view another user's file → Should fail
3. Login as admin → Should see all files

---

## Troubleshooting

### Bucket Creation Fails

**Error:** "Bucket name already exists"
- **Solution:** The bucket was already created. Check Storage dashboard.

### Cannot Upload Files

**Error:** "new row violates row-level security policy"
- **Solution:** Ensure storage policies were created by migration. Check Supabase SQL Editor → Storage → Policies.

### Files Not Accessible

**Error:** "403 Forbidden"
- **Solution:**
  1. Verify user is authenticated
  2. Check file path matches policy rules (userId must be in path)
  3. Verify bucket is private (public buckets bypass policies)

---

## Migration Integration

The storage policies created by the migration (Section 9) will automatically apply once the buckets exist. No additional configuration needed.

**Migration File:** `supabase/migrations/20251120000000_registration_redesign.sql`
**Section 9:** Storage Policies (lines ~1115-1183)

---

## Next Steps

After creating all storage buckets:

1. ✅ Buckets created manually via Dashboard
2. ⏳ Run SQL migration (creates tables, policies, etc.)
3. ⏳ Verify storage policies are active
4. ⏳ Test file upload/download in development

---

**Setup Guide Complete**
