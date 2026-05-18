# Phase 2: Authentication Extension - Implementation Plan

**Project:** IndabaX Kenya - Registration System Redesign
**Phase:** User Authentication Extension
**Started:** 2025-11-20
**Status:** In Progress
**Duration:** 1 week (7 days)

---

## Overview

**Goal:** Enable user registration, email verification, and dashboard access for all users (not just admins).

**Current State:**
- ✅ Supabase Auth configured for admin-only login
- ✅ Middleware for session management exists
- ✅ User profiles table created in Phase 1
- ✅ Login/logout/session endpoints exist (admin-only)

**What's Being Added:**
- User registration with email/password
- Email verification flow
- User-facing login page
- User dashboard with event discovery
- Enhanced route protection middleware
- Email service configuration

---

## Implementation Breakdown

### Day 1-2: User Registration

#### API Routes

**File:** `src/app/api/auth/register/route.ts`
- Validate input (email, password, name, optional: organization, phone)
- Create Supabase Auth user with email verification
- Create user_profile record in database
- Send verification email (Supabase handles this)
- Return success or error response

**Validation Schema:**
```typescript
{
  email: string (valid email, lowercase)
  password: string (min 8 chars, 1 uppercase, 1 number, 1 special char)
  name: string (min 2 chars)
  organization: string (optional)
  phone: string (optional, valid format)
}
```

#### Frontend Components

**File:** `src/app/(auth)/signup/page.tsx`
- Registration page with form

**File:** `src/components/auth/SignupForm.tsx`
- Email input with validation
- Password input with strength indicator
- Confirm password input
- Name input (required)
- Organization input (optional)
- Phone input (optional)
- Terms & conditions checkbox
- Submit button with loading state
- Link to login page

---

### Day 3-4: Email Verification

#### Email Service Setup

**File:** `lib/email/config.ts`
- SMTP configuration
- Email credentials
- Server: server72.web-hosting.com:465
- Accounts: accounts@deeplearningindabaxkenya.com, applications@deeplearningindabaxkenya.com

**File:** `lib/email/templates.ts`
- Verification email HTML template
- Welcome email template
- Password reset email template

**Note:** Supabase Auth handles email verification automatically. We just need to configure:
- Supabase Dashboard > Authentication > Email Templates
- Customize verification email
- Set redirect URL to /verify-email

#### Verification Pages

**File:** `src/app/(auth)/verify-email/page.tsx`
- Check for verification token in URL
- Display verification status
- Show success message or error
- Redirect to login after success

---

### Day 5: User Login Enhancement

#### Pages

**File:** `src/app/(auth)/login/page.tsx`
- Unified login page for both admin and regular users
- Email/password form
- "Forgot password" link
- "Don't have an account? Sign up" link

**File:** `src/components/auth/LoginForm.tsx`
- Email input
- Password input
- "Show password" toggle
- Submit button with loading state
- Error message display

#### Logic

- After successful login, check user role:
  - If admin (from admin_roles table) → redirect to /admin/dashboard
  - If regular user → redirect to /dashboard

---

### Day 6: User Dashboard

#### Pages

**File:** `src/app/(dashboard)/dashboard/page.tsx`
- Main dashboard layout
- Protected route (requires authentication)

**File:** `src/components/dashboard/UserDashboard.tsx`
- Welcome section with user's name
- Past Events section (user's completed registrations)
- Available Events section (open events)
- Quick actions (edit profile, view tickets)

#### API Endpoints (may need new ones)

**File:** `src/app/api/user/registrations/route.ts`
- GET - Fetch user's registrations
- Filter by status

**File:** `src/app/api/user/profile/route.ts`
- GET - Get current user profile
- PATCH - Update profile

---

### Day 7: Middleware Enhancement

#### Route Protection

**File:** `src/middleware.ts` (update)
- Add logic to protect `/dashboard/*` routes (authenticated users only)
- Keep existing `/admin/*` protection (admin role required)
- Add `/reviewer/*` protection (reviewer role required - for future)
- Redirect unauthenticated users to `/login`

**File:** `lib/auth/helpers.ts` (new)
- `getCurrentUser()` - Get authenticated user
- `isAdmin()` - Check if user has admin role
- `isReviewer()` - Check if user is reviewer
- `requireAuth()` - Throw error if not authenticated
- `requireAdmin()` - Throw error if not admin

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.ts
│       │   └── reset-password/
│       │       └── route.ts
│       │
│       └── user/
│           ├── profile/
│           │   └── route.ts
│           └── registrations/
│               └── route.ts
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── PasswordInput.tsx
│   │   └── AuthLayout.tsx
│   │
│   └── dashboard/
│       ├── UserDashboard.tsx
│       ├── EventsList.tsx
│       ├── RegistrationCard.tsx
│       └── ProfileCard.tsx
│
└── lib/
    ├── auth/
    │   ├── helpers.ts
    │   └── validation.ts
    │
    └── email/
        ├── config.ts
        ├── templates.ts
        └── send.ts
```

---

## Validation Rules

### Registration

```typescript
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  organization: z.string().optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

---

## API Specifications

### POST /api/auth/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "organization": "University of Nairobi",
  "phone": "+254712345678"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered"
  }
}
```

---

### GET /api/user/profile

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organization": "University of Nairobi",
    "phone": "+254712345678",
    "role": "applicant",
    "created_at": "2025-11-20T10:00:00Z"
  }
}
```

---

### GET /api/user/registrations

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event": {
        "id": "uuid",
        "title": "IndabaX Kenya 2026",
        "start_date": "2026-03-15",
        "end_date": "2026-03-17"
      },
      "status": "approved",
      "registered_at": "2025-11-20T10:00:00Z"
    }
  ]
}
```

---

## Testing Checklist

### User Registration
- [ ] Register with valid data → Success
- [ ] Register with existing email → Error shown
- [ ] Register with weak password → Validation error
- [ ] Register without accepting terms → Error
- [ ] Verification email sent → Check inbox

### Email Verification
- [ ] Click verification link → Account verified
- [ ] Try invalid token → Error shown
- [ ] Try expired token → Error shown

### User Login
- [ ] Login with verified account → Success, redirect to dashboard
- [ ] Login with unverified account → Error, prompt to verify
- [ ] Login with wrong password → Error shown
- [ ] Login as admin → Redirect to admin dashboard

### User Dashboard
- [ ] Dashboard loads after login
- [ ] Shows user's name correctly
- [ ] Shows available events
- [ ] Shows past registrations (if any)
- [ ] Profile link works

### Route Protection
- [ ] Access /dashboard without login → Redirect to /login
- [ ] Access /admin without admin role → Redirect to /403
- [ ] Login as user → Can access /dashboard
- [ ] Login as admin → Can access /admin

---

## Acceptance Criteria

Phase 2 is complete when:

- [ ] Users can register with email/password
- [ ] Verification email sent automatically
- [ ] Email verification link works
- [ ] Users can login after verification
- [ ] Dashboard shows correctly for authenticated users
- [ ] Middleware protects routes appropriately
- [ ] Admin login still works (not broken)
- [ ] Password strength validation enforced
- [ ] Error messages clear and helpful
- [ ] Loading states shown during async operations
- [ ] All forms use React Hook Form + Zod validation
- [ ] Responsive design on mobile and desktop

---

## Dependencies

**Already Installed:**
- @supabase/supabase-js
- @supabase/ssr
- react-hook-form
- zod
- @hookform/resolvers

**May Need:**
- nodemailer (if custom emails needed beyond Supabase)
- @types/nodemailer

---

## Next Phase

**Phase 3: Form Builder Integration**
- Google Forms-like template builder
- 15 question types
- Drag-and-drop interface
- Form preview
- Admin template management

---

**End of Phase 2 Implementation Plan**
