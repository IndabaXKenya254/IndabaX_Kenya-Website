# File Upload System Implementation Plan

**Status:** In Progress
**Duration Estimate:** 4-5 hours
**Date:** October 23, 2025

---

## Overview

Implement secure file upload endpoints for the admin panel, enabling image uploads to Supabase Storage with proper validation, size limits, and public URL generation.

---

## Architecture

```
Client → API Endpoint → Validation → Supabase Storage → Public URL
         ↓
    Admin Auth Check
```

### Storage Buckets (Already Created)
1. **event-images** (Public, 5MB limit)
2. **speaker-photos** (Public, 5MB limit)
3. **gallery-photos** (Public, 10MB limit)
4. **sponsor-logos** (Public, 2MB limit)
5. **post-images** (Public, 5MB limit)
6. **avatars** (Private, 2MB limit)
7. **documents** (Private, 10MB limit)

---

## Endpoints to Implement

### 1. Event Image Upload
```
POST /api/admin/upload/event-image
```
**Request:** multipart/form-data with 'file' field
**Bucket:** event-images
**Max Size:** 5 MB
**Allowed Types:** image/jpeg, image/png, image/webp
**Returns:** { url, path, size, type }

---

### 2. Speaker Photo Upload
```
POST /api/admin/upload/speaker-photo
```
**Request:** multipart/form-data with 'file' field
**Bucket:** speaker-photos
**Max Size:** 5 MB
**Allowed Types:** image/jpeg, image/png, image/webp
**Returns:** { url, path, size, type }

---

### 3. Gallery Photo Upload
```
POST /api/admin/upload/gallery-photo
```
**Request:** multipart/form-data with 'file' field
**Bucket:** gallery-photos
**Max Size:** 10 MB
**Allowed Types:** image/jpeg, image/png, image/webp
**Returns:** { url, path, size, type }

---

### 4. Sponsor Logo Upload
```
POST /api/admin/upload/sponsor-logo
```
**Request:** multipart/form-data with 'file' field
**Bucket:** sponsor-logos
**Max Size:** 2 MB
**Allowed Types:** image/svg+xml, image/png, image/webp
**Returns:** { url, path, size, type }

---

### 5. Post Image Upload
```
POST /api/admin/upload/post-image
```
**Request:** multipart/form-data with 'file' field
**Bucket:** post-images
**Max Size:** 5 MB
**Allowed Types:** image/jpeg, image/png, image/webp
**Returns:** { url, path, size, type }

---

### 6. Delete File
```
DELETE /api/admin/upload/[bucket]/[...path]
```
**Example:** DELETE /api/admin/upload/event-images/2025/event-123.jpg
**Returns:** { success: true, message }

---

## File Structure

```
lib/
  upload/
    ├── config.ts          # Upload configuration (limits, types)
    ├── validator.ts       # File validation logic
    ├── uploader.ts        # Supabase Storage upload logic
    └── utils.ts           # Helper functions (sanitize, generate path)

src/app/api/admin/upload/
  ├── event-image/
  │   └── route.ts
  ├── speaker-photo/
  │   └── route.ts
  ├── gallery-photo/
  │   └── route.ts
  ├── sponsor-logo/
  │   └── route.ts
  ├── post-image/
  │   └── route.ts
  └── [bucket]/
      └── [...path]/
          └── route.ts    # DELETE endpoint
```

---

## Implementation Steps

### Step 1: Upload Configuration (15 min)
Create `lib/upload/config.ts` with:
- Bucket configurations
- Max file sizes
- Allowed MIME types
- Upload path patterns

### Step 2: File Validator (30 min)
Create `lib/upload/validator.ts` with:
- File size validation
- MIME type validation
- File extension validation
- Filename sanitization

### Step 3: Upload Utility (45 min)
Create `lib/upload/uploader.ts` with:
- Supabase Storage upload
- Unique filename generation
- Public URL generation
- Error handling

### Step 4: Event Image Upload (20 min)
Implement `POST /api/admin/upload/event-image`

### Step 5: Speaker Photo Upload (15 min)
Implement `POST /api/admin/upload/speaker-photo`

### Step 6: Gallery Photo Upload (15 min)
Implement `POST /api/admin/upload/gallery-photo`

### Step 7: Sponsor Logo Upload (15 min)
Implement `POST /api/admin/upload/sponsor-logo`

### Step 8: Post Image Upload (15 min)
Implement `POST /api/admin/upload/post-image`

### Step 9: Delete Endpoint (30 min)
Implement `DELETE /api/admin/upload/[bucket]/[...path]`

### Step 10: Testing (45 min)
- Test each upload endpoint
- Test file size limits
- Test invalid file types
- Test delete endpoint
- Verify URLs are accessible

---

## Validation Rules

### File Size Limits
```typescript
const MAX_SIZES = {
  'event-images': 5 * 1024 * 1024,      // 5 MB
  'speaker-photos': 5 * 1024 * 1024,    // 5 MB
  'gallery-photos': 10 * 1024 * 1024,   // 10 MB
  'sponsor-logos': 2 * 1024 * 1024,     // 2 MB
  'post-images': 5 * 1024 * 1024,       // 5 MB
}
```

### Allowed MIME Types
```typescript
const ALLOWED_TYPES = {
  'event-images': ['image/jpeg', 'image/png', 'image/webp'],
  'speaker-photos': ['image/jpeg', 'image/png', 'image/webp'],
  'gallery-photos': ['image/jpeg', 'image/png', 'image/webp'],
  'sponsor-logos': ['image/svg+xml', 'image/png', 'image/webp'],
  'post-images': ['image/jpeg', 'image/png', 'image/webp'],
}
```

---

## File Path Pattern

```
{bucket}/{year}/{month}/{timestamp}-{sanitized-name}.{ext}

Examples:
- event-images/2025/10/1729701234567-indabax-banner.jpg
- speaker-photos/2025/10/1729701234567-dr-jane-doe.png
- gallery-photos/2024/11/1729701234567-conference-day1.jpg
```

---

## Security Considerations

1. ✅ **Authentication Required** - All endpoints require admin auth
2. ✅ **File Size Limits** - Prevent large file uploads
3. ✅ **MIME Type Validation** - Only allow image types
4. ✅ **Filename Sanitization** - Remove special characters
5. ✅ **Unique Filenames** - Timestamp prefix to avoid collisions
6. ✅ **Public Buckets** - Images accessible via public URL
7. ✅ **Delete Protection** - Only admins can delete files

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/event-images/2025/10/123.jpg",
    "path": "2025/10/1729701234567-banner.jpg",
    "filename": "1729701234567-banner.jpg",
    "size": 245678,
    "type": "image/jpeg",
    "bucket": "event-images"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds maximum allowed (5 MB)"
  }
}
```

---

## Testing Checklist

- [ ] Upload valid image to event-images
- [ ] Upload valid image to speaker-photos
- [ ] Upload valid image to gallery-photos
- [ ] Upload valid SVG to sponsor-logos
- [ ] Upload valid image to post-images
- [ ] Try uploading file > max size (should fail)
- [ ] Try uploading invalid MIME type (should fail)
- [ ] Verify URLs are publicly accessible
- [ ] Delete uploaded file (should succeed)
- [ ] Try deleting non-existent file (should fail gracefully)
- [ ] Try uploading without authentication (should fail)

---

## Next Steps After Completion

1. **Update Documentation** - Add upload endpoints to API docs
2. **Admin UI Integration** - Add file upload components to admin forms
3. **Image Optimization** (Optional) - Add image resizing/compression
4. **CDN Integration** (Optional) - Add Cloudflare/CloudFront

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Upload configuration | 15 min |
| File validator | 30 min |
| Upload utility | 45 min |
| Event image endpoint | 20 min |
| Speaker photo endpoint | 15 min |
| Gallery photo endpoint | 15 min |
| Sponsor logo endpoint | 15 min |
| Post image endpoint | 15 min |
| Delete endpoint | 30 min |
| Testing | 45 min |
| Documentation | 15 min |
| **TOTAL** | **4h 15min** |

---

**Ready to implement!** 🚀
