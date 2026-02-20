# Admin Frontend UI Implementation Plan

**Status:** In Progress
**Duration Estimate:** 8-10 hours
**Date:** October 23, 2025

---

## Overview

Build a comprehensive React-based admin dashboard using Next.js 14 App Router, integrating with all backend APIs we've built. The UI will use Bootstrap 5 (already in project) for styling to match the template design.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Bootstrap 5 + Custom CSS (already installed)
- **State Management:** React Context + hooks
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** Native fetch with async/await
- **File Uploads:** FormData API
- **Icons:** Bootstrap Icons or existing icon library

---

## Pages & Routes

```
/admin
├── /login                    # Login page (public)
├── /dashboard                # Dashboard with stats (protected)
├── /posts                    # Posts list (protected)
│   ├── /new                  # Create post
│   └── /[id]                 # Edit post
├── /events                   # Events list (protected)
│   ├── /new                  # Create event
│   └── /[id]                 # Edit event
├── /speakers                 # Speakers list (protected)
│   ├── /new                  # Create speaker
│   └── /[id]                 # Edit speaker
├── /sponsors                 # Sponsors list (protected)
│   ├── /new                  # Create sponsor
│   └── /[id]                 # Edit sponsor
├── /faqs                     # FAQs list (protected)
│   ├── /new                  # Create FAQ
│   └── /[id]                 # Edit FAQ
├── /gallery                  # Gallery photos (protected)
│   └── /new                  # Upload photo
├── /applications             # Applications list (protected)
│   └── /[id]                 # View/review application
├── /subscribers              # Subscribers list (protected)
└── /settings                 # Site settings (protected)
```

---

## Implementation Phases

### Phase 1: Foundation (1.5-2 hours)
1. Create admin layout with sidebar navigation
2. Set up authentication context
3. Create protected route wrapper
4. Build login page
5. Create shared components (Button, Input, Alert)

### Phase 2: Dashboard & Core Components (1.5-2 hours)
1. Dashboard page with stats
2. Data table component (reusable)
3. Form components (Input, Select, TextArea, FileUpload)
4. Modal component
5. Pagination component

### Phase 3: Content Management Pages (3-4 hours)
1. Posts management (list, create, edit, delete)
2. Events management (list, create, edit, delete)
3. Speakers management (list, create, edit, delete)
4. Sponsors management (list, create, edit, delete)
5. FAQs management (list, create, edit, delete)

### Phase 4: Special Features (1.5-2 hours)
1. Gallery management with bulk upload
2. Applications review interface
3. Subscribers list with export
4. Settings management

### Phase 5: Testing & Polish (1 hour)
1. Test all CRUD operations
2. Test file uploads
3. Test authentication flow
4. Responsive design check
5. Error handling verification

---

## File Structure

```
src/app/admin/
├── layout.tsx                # Admin layout with sidebar
├── login/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
├── posts/
│   ├── page.tsx              # List
│   ├── new/
│   │   └── page.tsx          # Create
│   └── [id]/
│       └── page.tsx          # Edit
├── events/
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── speakers/
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── sponsors/
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── faqs/
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   └── [id]/
│       └── page.tsx
├── gallery/
│   ├── page.tsx
│   └── new/
│       └── page.tsx
├── applications/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── subscribers/
│   └── page.tsx
└── settings/
    └── page.tsx

src/components/admin/
├── layout/
│   ├── AdminLayout.tsx       # Main layout wrapper
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Header.tsx            # Top header with user info
│   └── ProtectedRoute.tsx    # Auth guard
├── ui/
│   ├── Button.tsx            # Button component
│   ├── Input.tsx             # Input field
│   ├── Select.tsx            # Select dropdown
│   ├── TextArea.tsx          # Text area
│   ├── FileUpload.tsx        # File upload
│   ├── DataTable.tsx         # Reusable table
│   ├── Pagination.tsx        # Pagination
│   ├── Modal.tsx             # Modal dialog
│   ├── Alert.tsx             # Alert messages
│   └── Loading.tsx           # Loading spinner
└── forms/
    ├── PostForm.tsx          # Post create/edit form
    ├── EventForm.tsx         # Event create/edit form
    ├── SpeakerForm.tsx       # Speaker create/edit form
    ├── SponsorForm.tsx       # Sponsor create/edit form
    └── FaqForm.tsx           # FAQ create/edit form

src/contexts/
├── AuthContext.tsx           # Authentication state
└── ToastContext.tsx          # Toast notifications

src/hooks/
├── useAuth.ts                # Auth hook
├── useApi.ts                 # API fetch hook
└── useToast.ts               # Toast hook

src/lib/admin/
├── api-client.ts             # Admin API client
└── types.ts                  # Admin-specific types
```

---

## Key Features

### 1. Authentication
- Login form with validation
- Session management
- Auto-redirect on logout
- Protected routes
- Remember login state

### 2. Dashboard
- Total counts (posts, events, speakers, etc.)
- Recent applications
- Pending items count
- Quick actions

### 3. Data Tables
- Sortable columns
- Search/filter
- Pagination
- Bulk actions (optional)
- Row actions (edit, delete)

### 4. Forms
- Validation with Zod
- Error messages
- File upload with preview
- Rich text editor (for content)
- Auto-save drafts (optional)

### 5. File Uploads
- Drag & drop
- Image preview
- Upload progress
- Size validation
- Type validation

---

## Design Specifications

### Colors (Bootstrap + Custom)
- **Primary:** `#1a5490` (IndabaX blue)
- **Success:** `#28a745`
- **Danger:** `#dc3545`
- **Warning:** `#ffc107`
- **Info:** `#17a2b8`
- **Dark:** `#343a40`
- **Light:** `#f8f9fa`

### Typography
- **Font Family:** Poppins (or existing template font)
- **Headings:** Bold, larger sizes
- **Body:** Regular, 14-16px

### Layout
- **Sidebar Width:** 250px (desktop)
- **Header Height:** 60px
- **Content Padding:** 20-30px
- **Card Shadows:** Subtle, Bootstrap default

### Components
- **Buttons:** Bootstrap btn classes
- **Forms:** Bootstrap form-control
- **Tables:** Bootstrap table classes
- **Modals:** Bootstrap modal
- **Alerts:** Bootstrap alert

---

## API Integration

All API calls will use the admin API client with:
- Cookie-based authentication
- Error handling
- Loading states
- Success/error notifications

### Example API Client

```typescript
// lib/admin/api-client.ts

export const adminApi = {
  // Posts
  getPosts: (params) => fetch('/api/admin/posts?' + new URLSearchParams(params)),
  getPost: (id) => fetch(`/api/admin/posts/${id}`),
  createPost: (data) => fetch('/api/admin/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id, data) => fetch(`/api/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePost: (id) => fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (params) => fetch('/api/admin/events?' + new URLSearchParams(params)),
  // ... etc

  // File uploads
  uploadEventImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch('/api/admin/upload/event-image', { method: 'POST', body: formData })
  },
}
```

---

## Responsive Design

### Desktop (> 992px)
- Sidebar visible
- Full layout
- Multi-column forms

### Tablet (768px - 991px)
- Collapsible sidebar
- Adjusted spacing
- Single-column forms

### Mobile (< 768px)
- Hidden sidebar (menu icon)
- Stacked layout
- Touch-friendly buttons
- Simplified tables

---

## Error Handling

### API Errors
- Display error messages in toast
- Highlight form fields with errors
- Provide retry options
- Log errors to console

### Validation Errors
- Inline field errors
- Form-level errors
- Prevent submission

### Network Errors
- Detect offline state
- Show connection error
- Queue actions (optional)

---

## Performance

- Lazy load pages
- Debounce search inputs
- Paginate large lists
- Cache API responses (optional)
- Optimize images
- Code splitting

---

## Security

- ✅ Protected routes (redirect to login)
- ✅ Cookie-based auth (httpOnly)
- ✅ CSRF protection (Supabase handles)
- ✅ Input validation
- ✅ XSS prevention (React escaping)
- ✅ File upload validation

---

## Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Protected route redirect
- [ ] Session persistence

### Posts Management
- [ ] List posts
- [ ] Search/filter posts
- [ ] Create post
- [ ] Upload featured image
- [ ] Edit post
- [ ] Delete post
- [ ] Publish/unpublish

### Events Management
- [ ] List events
- [ ] Create event
- [ ] Upload event image
- [ ] Edit event
- [ ] Delete event

### Speakers Management
- [ ] List speakers
- [ ] Create speaker
- [ ] Upload photo
- [ ] Edit speaker
- [ ] Delete speaker

### Sponsors Management
- [ ] List sponsors
- [ ] Create sponsor
- [ ] Upload logo (SVG support)
- [ ] Edit sponsor
- [ ] Delete sponsor

### FAQs Management
- [ ] List FAQs
- [ ] Create FAQ
- [ ] Edit FAQ
- [ ] Delete FAQ

### Gallery Management
- [ ] List photos
- [ ] Upload photos
- [ ] Delete photos

### Applications Review
- [ ] List applications
- [ ] View application details
- [ ] Update status
- [ ] Add notes

### Subscribers
- [ ] List subscribers
- [ ] Export to CSV

### Settings
- [ ] View settings
- [ ] Update settings

---

## Implementation Strategy

### Start Simple
1. Build basic layout and login first
2. Create one complete CRUD flow (posts)
3. Extract reusable components
4. Apply pattern to other content types
5. Add polish and features

### Iterative Approach
- Get basic functionality working first
- Add styling and polish later
- Test each feature as you build
- Refactor as patterns emerge

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 1.5-2h | Layout, auth, login |
| Phase 2: Core Components | 1.5-2h | Dashboard, tables, forms |
| Phase 3: Content Management | 3-4h | All CRUD pages |
| Phase 4: Special Features | 1.5-2h | Gallery, applications, etc. |
| Phase 5: Testing & Polish | 1h | Final testing |
| **TOTAL** | **8-10h** | Complete admin UI |

---

**Ready to build!** Let's start with Phase 1: Foundation. 🚀
