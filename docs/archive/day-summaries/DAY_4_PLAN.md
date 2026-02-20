# Day 4 Plan - Admin Panel Backend

## Objective
Build secure admin authentication and protected API endpoints for content management.

## Architecture Overview

### Authentication Flow
```
1. Admin logs in → POST /api/auth/login
2. Supabase creates session (stored in cookies)
3. Middleware validates session on protected routes
4. Admin can access /api/admin/* endpoints
5. Admin logs out → POST /api/auth/logout
```

### Middleware Protection
- All `/api/admin/*` routes require authentication
- Middleware checks:
  1. Valid Supabase session exists
  2. User exists in `admin_roles` table
  3. User has appropriate role (admin or super_admin)

## API Endpoints to Build

### 🔐 Authentication (Public)
```
POST   /api/auth/login       - Admin login with email/password
POST   /api/auth/logout      - Admin logout (clear session)
GET    /api/auth/session     - Check current session status
```

### 📝 Applications Management (Protected)
```
GET    /api/admin/applications           - List all applications with filters
GET    /api/admin/applications/[id]      - Get single application
PATCH  /api/admin/applications/[id]      - Update status/notes
DELETE /api/admin/applications/[id]      - Delete application
```

### 📰 Posts Management (Protected)
```
GET    /api/admin/posts                  - List all posts (including drafts)
GET    /api/admin/posts/[id]             - Get single post
POST   /api/admin/posts                  - Create new post
PATCH  /api/admin/posts/[id]             - Update post
DELETE /api/admin/posts/[id]             - Delete post
```

### 🎤 Events Management (Protected)
```
GET    /api/admin/events                 - List all events
GET    /api/admin/events/[id]            - Get single event
POST   /api/admin/events                 - Create event
PATCH  /api/admin/events/[id]            - Update event
DELETE /api/admin/events/[id]            - Delete event
```

### 👥 Speakers Management (Protected)
```
GET    /api/admin/speakers               - List all speakers
GET    /api/admin/speakers/[id]          - Get single speaker
POST   /api/admin/speakers               - Create speaker
PATCH  /api/admin/speakers/[id]          - Update speaker
DELETE /api/admin/speakers/[id]          - Delete speaker
```

### 💰 Sponsors Management (Protected)
```
GET    /api/admin/sponsors               - List all sponsors
POST   /api/admin/sponsors               - Create sponsor
PATCH  /api/admin/sponsors/[id]          - Update sponsor
DELETE /api/admin/sponsors/[id]          - Delete sponsor
```

### ❓ FAQs Management (Protected)
```
GET    /api/admin/faqs                   - List all FAQs
POST   /api/admin/faqs                   - Create FAQ
PATCH  /api/admin/faqs/[id]              - Update FAQ
DELETE /api/admin/faqs/[id]              - Delete FAQ
```

### 📸 Gallery Management (Protected)
```
GET    /api/admin/gallery                - List all photos
POST   /api/admin/gallery                - Upload photo
PATCH  /api/admin/gallery/[id]           - Update photo metadata
DELETE /api/admin/gallery/[id]           - Delete photo
```

### 📧 Subscribers Management (Protected)
```
GET    /api/admin/subscribers            - List all subscribers
GET    /api/admin/subscribers/export     - Export to CSV
DELETE /api/admin/subscribers/[id]       - Delete subscriber
```

### ⚙️ Settings Management (Protected)
```
GET    /api/admin/settings               - Get all settings
PATCH  /api/admin/settings/[key]         - Update setting
```

### 📤 File Upload (Protected)
```
POST   /api/admin/upload/event-image     - Upload event image
POST   /api/admin/upload/speaker-photo   - Upload speaker photo
POST   /api/admin/upload/gallery-photo   - Upload gallery photo
POST   /api/admin/upload/sponsor-logo    - Upload sponsor logo
POST   /api/admin/upload/post-image      - Upload post image
```

## Implementation Order (Day 4)

### Phase 1: Authentication (Priority 1) ✅
1. Create admin middleware (`lib/middleware/admin.ts`)
2. POST /api/auth/login
3. POST /api/auth/logout
4. GET /api/auth/session
5. Test authentication flow

### Phase 2: Applications Management (Priority 1) ✅
- Most critical for admin to review registrations and CFP submissions
- GET /api/admin/applications
- GET /api/admin/applications/[id]
- PATCH /api/admin/applications/[id]

### Phase 3: Content Management (Priority 2)
**Start with Posts (most common)**
- POST /api/admin/posts
- PATCH /api/admin/posts/[id]
- DELETE /api/admin/posts/[id]

**Then Events**
- POST /api/admin/events
- PATCH /api/admin/events/[id]

### Phase 4: Other Management (Priority 3)
- Speakers endpoints
- Sponsors endpoints
- FAQs endpoints
- Gallery endpoints
- Subscribers endpoints
- Settings endpoints

### Phase 5: File Upload (Priority 2)
- Will be needed for posts, events, speakers, gallery
- Implement Supabase Storage upload
- Image optimization/validation

## Technical Decisions

### Authentication Strategy
- Use Supabase Auth (built-in)
- Cookie-based sessions (via @supabase/ssr)
- Middleware validates on every admin request
- No JWT handling needed (Supabase handles it)

### Authorization Levels
```typescript
type AdminRole = 'admin' | 'super_admin'

Permissions:
- admin: Can create/edit content, review applications
- super_admin: All admin permissions + manage other admins, delete data
```

### Error Handling
- 401 Unauthorized - No session or invalid session
- 403 Forbidden - Valid session but not an admin
- Standard validation/database errors from Day 3

### Validation
- Reuse existing Zod schemas where possible
- Create new schemas for admin-specific operations
- Validate file uploads (type, size, dimensions)

## Database Considerations

### Existing Tables
- ✅ admin_roles (user_id, role, email)
- ✅ applications (for review)
- ✅ All content tables already exist

### No New Migrations Needed
- Day 1 schema has everything we need
- Just need to implement the API logic

## File Structure

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── session/route.ts
└── admin/
    ├── applications/
    │   ├── route.ts              (GET list)
    │   └── [id]/route.ts         (GET/PATCH/DELETE)
    ├── posts/
    │   ├── route.ts              (GET/POST)
    │   └── [id]/route.ts         (GET/PATCH/DELETE)
    ├── events/
    │   ├── route.ts              (GET/POST)
    │   └── [id]/route.ts         (GET/PATCH/DELETE)
    ├── speakers/
    ├── sponsors/
    ├── faqs/
    ├── gallery/
    ├── subscribers/
    ├── settings/
    └── upload/
        ├── event-image/route.ts
        ├── speaker-photo/route.ts
        └── ...

lib/
├── middleware/
│   └── admin.ts                  (Admin auth middleware)
└── validations/
    └── admin.ts                  (Admin-specific Zod schemas)
```

## Testing Plan

### Authentication Tests
- ✅ Login with valid admin credentials
- ✅ Login with invalid credentials (should fail)
- ✅ Access protected route without session (should fail)
- ✅ Access protected route with valid session (should work)
- ✅ Logout and verify session cleared

### Authorization Tests
- ✅ Admin can access admin routes
- ✅ Non-admin cannot access admin routes
- ✅ Unauthenticated user cannot access admin routes

### CRUD Tests (per resource)
- ✅ Create new item
- ✅ Read item
- ✅ Update item
- ✅ Delete item
- ✅ Validation errors handled properly

## Day 4 Success Criteria

By end of Day 4, we should have:
- ✅ Admin login/logout working
- ✅ Session management with cookies
- ✅ Protected admin routes
- ✅ Applications management (review, update status)
- ✅ At least 2-3 content management endpoints (posts, events)
- ✅ All endpoints tested with Insomnia
- ✅ Proper error handling
- ✅ Code committed and documented

## Notes

- **Security First**: Every admin endpoint must verify authentication
- **Audit Trail**: Consider logging admin actions (future enhancement)
- **Rate Limiting**: Consider adding for login endpoint (future enhancement)
- **File Uploads**: Use Supabase Storage, not filesystem
- **No Frontend Yet**: Day 4 is backend only, frontend in Day 5-7
