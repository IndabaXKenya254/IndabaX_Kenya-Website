# Implementation Plan: Admin Management & Password Reset System

## Overview
Implement comprehensive password management for the IndabaX Kenya website including:
- Admin invite flow with custom password setup
- Forgot password functionality for all users
- Change password feature for admins

---

## Phase 1: Database Schema Updates

### 1.1 Create Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Create Admin Invite Tokens Table
```sql
CREATE TABLE admin_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 RLS Policies
- Password reset tokens: Allow insert for anon, select/update for authenticated users
- Admin invite tokens: Admin/super_admin can create, anyone can read by token

---

## Phase 2: API Routes

### 2.1 Password Reset APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |

### 2.2 Admin Invite APIs (Update Existing)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/admins` | POST | Create invite token + send email |
| `/api/auth/accept-invite` | GET | Validate invite token |
| `/api/auth/accept-invite` | POST | Set password + create account |

---

## Phase 3: Frontend Pages

### 3.1 New Pages to Create

| Page | Path | Purpose |
|------|------|---------|
| Forgot Password | `/forgot-password` | Request password reset email |
| Reset Password | `/reset-password` | Set new password with token |
| Accept Invite | `/accept-invite` | Admin sets password after invite |
| Admin Profile | `/admin/profile` | View profile + change password |

### 3.2 Components to Create

| Component | Purpose |
|-----------|---------|
| `ForgotPasswordForm` | Email input form for reset request |
| `ResetPasswordForm` | New password form with token |
| `AcceptInviteForm` | Password setup for invited admins |
| `ChangePasswordForm` | Current + new password form |
| `AdminProfilePage` | Profile view with password section |

---

## Phase 4: Email Templates

### 4.1 New Email Templates

1. **Password Reset Email**
   - Subject: "Reset Your Password - IndabaX Kenya"
   - Contains: Reset link with token, expiry notice (1 hour)

2. **Admin Invitation Email**
   - Subject: "You've Been Invited as Admin - IndabaX Kenya"
   - Contains: Accept link with token, role info, expiry (7 days)

3. **Password Changed Confirmation**
   - Subject: "Password Changed Successfully - IndabaX Kenya"
   - Contains: Confirmation, security notice

---

## Phase 5: Implementation Details

### 5.1 Forgot Password Flow
```
User clicks "Forgot password?" on login page
  → /forgot-password page loads
  → User enters email, submits
  → POST /api/auth/forgot-password
    → Check if email exists in auth.users
    → Generate secure token (crypto.randomUUID + hash)
    → Store in password_reset_tokens (1 hour expiry)
    → Send email via existing email system
  → Show success message (always, for security)
  → User clicks link in email
  → /reset-password?token=xxx page loads
  → GET validates token
  → User enters new password
  → POST /api/auth/reset-password
    → Validate token, check expiry
    → Update password via Supabase Admin API
    → Mark token as used
    → Send confirmation email
  → Redirect to login with success message
```

### 5.2 Admin Invite Flow
```
Super admin opens /admin/admins
  → Clicks "Invite Admin"
  → Enters email, selects role
  → POST /api/admin/admins
    → Generate secure invite token
    → Store in admin_invite_tokens (7 day expiry)
    → Send invitation email with custom template
  → Show success, admin listed as "Pending"
  → Invited user clicks email link
  → /accept-invite?token=xxx page loads
  → GET /api/auth/accept-invite validates token
  → User enters name, password
  → POST /api/auth/accept-invite
    → Create auth user with password
    → Create user_profile entry
    → Create admin_roles entry
    → Mark invite as accepted
    → Send welcome email
  → Redirect to /admin/login
```

### 5.3 Change Password Flow
```
Admin logged in, goes to /admin/profile
  → Clicks "Change Password"
  → Enters current password, new password, confirm
  → POST /api/auth/change-password
    → Verify current password
    → Validate new password strength
    → Update via Supabase Auth API
    → Send confirmation email
  → Show success message
```

---

## Phase 6: Security Considerations

1. **Token Security**
   - Use `crypto.randomUUID()` + SHA256 hash
   - Store hashed tokens, compare on validation
   - Short expiry: 1 hour for reset, 7 days for invite

2. **Rate Limiting**
   - Max 3 reset requests per email per hour
   - Max 5 invite attempts per admin per day

3. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
   - Cannot be same as email

4. **Logging**
   - Log all password reset attempts
   - Log admin invite creations and acceptances
   - Alert on suspicious activity

---

## File Structure

```
src/
├── app/
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   ├── accept-invite/
│   │   └── page.tsx
│   ├── admin/
│   │   └── profile/
│   │       └── page.tsx
│   └── api/
│       └── auth/
│           ├── forgot-password/
│           │   └── route.ts
│           ├── reset-password/
│           │   └── route.ts
│           ├── change-password/
│           │   └── route.ts
│           └── accept-invite/
│               └── route.ts
├── components/
│   └── Auth/
│       ├── ForgotPasswordForm.tsx
│       ├── ResetPasswordForm.tsx
│       ├── AcceptInviteForm.tsx
│       └── ChangePasswordForm.tsx
└── lib/
    └── email/
        └── templates.ts (update with new templates)

supabase/
└── migrations/
    └── 20251229_password_reset_system.sql
```

---

## Implementation Order

### Step 1: Database Migration
- Create `password_reset_tokens` table
- Create `admin_invite_tokens` table
- Add RLS policies
- Add indexes for performance

### Step 2: Email Templates
- Add password reset email template
- Add admin invitation email template
- Add password changed confirmation template

### Step 3: Forgot Password Feature
- Create `/api/auth/forgot-password` API
- Create `/api/auth/reset-password` API
- Create `/forgot-password` page
- Create `/reset-password` page

### Step 4: Admin Invite Feature
- Update `/api/admin/admins` POST to use custom tokens
- Create `/api/auth/accept-invite` API
- Create `/accept-invite` page
- Update admin list to show pending invites

### Step 5: Change Password Feature
- Create `/api/auth/change-password` API
- Create `/admin/profile` page with change password form

### Step 6: Testing & Cleanup
- Test all flows end-to-end
- Add error handling
- Update navigation links

---

## Dependencies

- Existing: `@supabase/supabase-js`, `nodemailer`, `crypto`
- No new dependencies required

---

## Estimated Files to Create/Modify

| Action | Count |
|--------|-------|
| New pages | 4 |
| New API routes | 4 |
| New components | 4 |
| New migration | 1 |
| Modified files | ~5 |
| **Total** | ~18 files |
