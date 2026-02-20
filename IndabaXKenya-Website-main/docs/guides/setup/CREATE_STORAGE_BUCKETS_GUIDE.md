# Creating Storage Buckets - Step by Step Guide

**Total Buckets:** 7

**Time Required:** ~10 minutes

**Method:** Supabase Dashboard (UI)

---

## 📋 BUCKETS TO CREATE

| Bucket Name | Type | Max Size | Allowed Types | Purpose |
|-------------|------|----------|---------------|---------|
| event-images | Public | 5 MB | JPG, PNG, WebP | Event featured images |
| speaker-photos | Public | 5 MB | JPG, PNG, WebP | Speaker profile photos |
| gallery-photos | Public | 10 MB | JPG, PNG, WebP | Gallery/memories photos |
| sponsor-logos | Public | 2 MB | SVG, PNG | Sponsor logos |
| team-photos | Public | 5 MB | JPG, PNG, WebP | Team member photos |
| post-images | Public | 5 MB | JPG, PNG, WebP | Blog post images |
| uploads | Private | 10 MB | PDF, Images, Text | CfP submissions (private) |

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Click on your project: **klnspdwlybpwkznzezzd**
3. Navigate to: **Storage** (left sidebar)

### Step 2: Create Each Bucket

For **each of the 7 buckets** listed above:

#### 2.1: Click "New bucket" Button

#### 2.2: Fill in Bucket Details

**Example for event-images:**
```
Name: event-images
Public bucket: ✅ ON (checked)
File size limit: 5242880 (5 MB in bytes)
Allowed MIME types: image/jpeg, image/png, image/webp
```

**Formula for MB to Bytes:**
- 2 MB = 2097152 bytes
- 5 MB = 5242880 bytes
- 10 MB = 10485760 bytes

#### 2.3: Click "Create bucket"

#### 2.4: Repeat for All 7 Buckets

---

## 📝 DETAILED CONFIGURATION FOR EACH BUCKET

### 1. event-images
```
Name: event-images
Public bucket: ✅ ON
File size limit: 5242880
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 2. speaker-photos
```
Name: speaker-photos
Public bucket: ✅ ON
File size limit: 5242880
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 3. gallery-photos
```
Name: gallery-photos
Public bucket: ✅ ON
File size limit: 10485760
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 4. sponsor-logos
```
Name: sponsor-logos
Public bucket: ✅ ON
File size limit: 2097152
Allowed MIME types: image/svg+xml, image/png
```

### 5. team-photos
```
Name: team-photos
Public bucket: ✅ ON
File size limit: 5242880
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 6. post-images
```
Name: post-images
Public bucket: ✅ ON
File size limit: 5242880
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 7. uploads (PRIVATE)
```
Name: uploads
Public bucket: ❌ OFF (unchecked)
File size limit: 10485760
Allowed MIME types: application/pdf, image/*, text/plain
```

**IMPORTANT:** uploads bucket is PRIVATE (for Call for Papers submissions)

---

## ✅ VALIDATION

After creating all buckets:

### 1. Count Buckets
In Supabase Dashboard → Storage, you should see **7 buckets** listed

### 2. Test Public Access

Open browser and try accessing a public bucket:
```
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/public/event-images/
```

**Expected:** Empty folder view (bucket exists but no files yet)

**Error (404):** Bucket doesn't exist - check name spelling

### 3. Test Private Access

Try accessing private bucket:
```
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/uploads/
```

**Expected:** 403 Forbidden or authentication required

### 4. Test Upload (Optional)

In Supabase Dashboard:
1. Click on **event-images** bucket
2. Click **Upload file**
3. Select a test image
4. Upload should succeed
5. Image should be visible and accessible

---

## 🔐 STORAGE POLICIES (ADVANCED)

Buckets use **Storage Policies** for access control. The default policies should work, but here's what they do:

### Public Buckets (6 buckets)
- ✅ Anyone can **read** (SELECT)
- ❌ Only authenticated admins can **upload** (INSERT)
- ❌ Only authenticated admins can **update** (UPDATE)
- ❌ Only authenticated admins can **delete** (DELETE)

### Private Bucket (uploads)
- ❌ Only authenticated admins can **read** (SELECT)
- ❌ Only authenticated admins can **upload** (INSERT)
- ❌ Only authenticated admins can **update** (UPDATE)
- ❌ Only authenticated admins can **delete** (DELETE)

**Note:** These policies will be refined when we create the upload API endpoint on Day 2.

---

## ❌ TROUBLESHOOTING

### Error: "Bucket name already exists"
**Solution:** Bucket was created before. Check Storage list. If it exists, skip creation.

### Error: "Invalid MIME type"
**Solution:** Check spelling. Use exact format: `image/jpeg` not `image/jpg`

### Can't find Storage in sidebar
**Solution:** Scroll down in left sidebar or use search (Cmd+K / Ctrl+K)

### Public bucket returns 404
**Solution:**
1. Check bucket name spelling
2. Verify "Public bucket" was enabled
3. Wait 1 minute for propagation
4. Try again

---

## 🎯 QUICK CHECKLIST

Create these 7 buckets:

- [ ] event-images (Public, 5MB, JPG/PNG/WebP)
- [ ] speaker-photos (Public, 5MB, JPG/PNG/WebP)
- [ ] gallery-photos (Public, 10MB, JPG/PNG/WebP)
- [ ] sponsor-logos (Public, 2MB, SVG/PNG)
- [ ] team-photos (Public, 5MB, JPG/PNG/WebP)
- [ ] post-images (Public, 5MB, JPG/PNG/WebP)
- [ ] uploads (PRIVATE, 10MB, PDF/Images/Text)

---

## 📊 VISUAL GUIDE

After completion, your Storage page should look like:

```
Storage
├── event-images         (Public)  ✅
├── speaker-photos       (Public)  ✅
├── gallery-photos       (Public)  ✅
├── sponsor-logos        (Public)  ✅
├── team-photos          (Public)  ✅
├── post-images          (Public)  ✅
└── uploads             (Private)  🔒
```

---

## 🔗 PUBLIC URLs FORMAT

After creation, public files will be accessible at:

```
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/public/{bucket-name}/{file-path}
```

**Examples:**
```
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/public/event-images/indabax-2026-banner.jpg
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/public/speaker-photos/jane-mwangi.png
https://klnspdwlybpwkznzezzd.supabase.co/storage/v1/object/public/sponsor-logos/deeplearning-ai.svg
```

---

## ✅ COMPLETION

Once all 7 buckets are created:

- [ ] All buckets visible in Storage dashboard
- [ ] Public buckets accessible via URL
- [ ] Private bucket returns 403/401
- [ ] Ready to move to next step (Create admin user)

---

**Ready to create buckets?** Open Supabase Dashboard → Storage and start creating!

**Estimated Time:** 10 minutes (5 minutes if you're fast)
**Difficulty:** Easy (point-and-click)
**Reversible:** Yes (can delete buckets anytime)
