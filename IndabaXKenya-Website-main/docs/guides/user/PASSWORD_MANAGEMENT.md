# Password Management System

## Overview

This system handles:
- Admin invitations with temporary passwords
- Forgot password for all users
- Change password for logged-in users

---

## 1. Admin Invitation Flow

### How It Works

1. **Super admin invites new admin** via `/admin/admins`
2. **System generates temporary password** (e.g., `Apple-Tiger-Moon-42!`)
3. **Email sent** to new admin with credentials
4. **New admin logs in** with temporary password
5. **Forced to change password** before accessing admin panel
6. **After changing** - full access granted

### Email Sent

- **From:** accounts@deeplearningindabaxkenya.com
- **Subject:** You've Been Invited as Administrator - IndabaX Kenya
- **Contains:** Email, temporary password, login link

---

## 2. Forgot Password Flow

### How It Works

1. **User clicks** "Forgot password?" on login page
2. **Enters email** on `/forgot-password`
3. **Receives email** with reset link (valid 1 hour)
4. **Clicks link** → goes to `/reset-password`
5. **Enters new password** (must meet requirements)
6. **Password updated** → redirected to login

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%&*)

### Security Features

- Token expires in 1 hour
- Token can only be used once
- Rate limited: 3 requests per email per hour
- Response doesn't reveal if email exists

---

## 3. Change Password Flow

### How It Works

1. **Admin goes to** `/admin/profile`
2. **Clicks** "Change Password"
3. **Enters** current password + new password
4. **Password updated** → confirmation email sent

---

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Forgot Password | `/forgot-password` | Request reset link |
| Reset Password | `/reset-password?token=xxx` | Set new password |
| Admin Profile | `/admin/profile` | View profile, change password |
| Admin Users | `/admin/admins` | Invite/manage admins |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Send reset email |
| `/api/auth/reset-password` | GET | Validate token |
| `/api/auth/reset-password` | POST | Reset password |
| `/api/auth/change-password` | POST | Change password |
| `/api/admin/admins` | POST | Invite new admin |

---

## Database Tables

### password_reset_tokens

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| email | VARCHAR | User's email |
| token | VARCHAR | Reset token (unique) |
| expires_at | TIMESTAMP | Expiry time (1 hour) |
| used_at | TIMESTAMP | When token was used |
| created_at | TIMESTAMP | Creation time |

### admin_roles.must_change_password

| Column | Type | Description |
|--------|------|-------------|
| must_change_password | BOOLEAN | Force password change on login |

---

## Email Templates

| Template | Trigger | From Account |
|----------|---------|--------------|
| Admin Invitation | New admin invited | accounts@ |
| Password Reset | Forgot password request | accounts@ |
| Password Changed | Password successfully changed | accounts@ |

---

## Quick Reference

### For Admins

- **Invite new admin:** Admin Panel → Admin Users → Invite Admin
- **Change your password:** Admin Panel → My Profile → Change Password

### For Users

- **Forgot password:** Login page → Forgot password? → Enter email
- **Reset password:** Click link in email → Enter new password

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Didn't receive reset email | Check spam folder, wait 5 mins, try again |
| Reset link expired | Request new link (valid 1 hour only) |
| "Invalid token" error | Link already used or expired, request new one |
| Can't access admin panel | Must change password first if newly invited |
| Password rejected | Ensure it meets all 5 requirements |

---

## Files

```
src/
├── app/
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── admin/profile/page.tsx
│   └── api/auth/
│       ├── forgot-password/route.ts
│       ├── reset-password/route.ts
│       └── change-password/route.ts
└── lib/email/index.ts (email templates)

supabase/migrations/
└── 20251229_password_management.sql
```
