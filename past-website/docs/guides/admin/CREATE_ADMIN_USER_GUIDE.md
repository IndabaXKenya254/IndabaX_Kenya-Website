# Creating First Admin User - Step by Step Guide

**Purpose:** Create the first admin user for the admin panel

**Time Required:** ~5 minutes

**Method:** Supabase Dashboard (Auth UI) + SQL

---

## 🎯 WHAT YOU'LL CREATE

- **Email:** admin@indabaxkenya.org (or your preferred email)
- **Role:** super_admin
- **Permissions:** Full access to all admin features
- **Password:** Strong password (12+ characters)

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Click on your project: **klnspdwlybpwkznzezzd**
3. Navigate to: **Authentication** → **Users** (left sidebar)

### Step 2: Create User via Auth UI

#### 2.1: Click "Add user" Dropdown

You'll see two options:
- **Create new user** ← Choose this
- Invite via email

#### 2.2: Select "Create new user"

#### 2.3: Fill in User Details

```
Email: admin@indabaxkenya.org
Password: [Generate strong password]
Auto Confirm User: ✅ ON (checked)
```

**Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example: `IndabaX2026!Admin#Secure`

**IMPORTANT:** Save this password securely! You'll need it to login.

#### 2.4: Click "Create user"

Wait for success message.

### Step 3: Copy User UUID

After user is created:

1. You'll see the new user in the users table
2. Click on the user row to expand details
3. Find the **user ID** (UUID format like: `550e8400-e29b-41d4-a716-446655440000`)
4. **Copy this UUID** - you'll need it for the next step

**TIP:** Click the copy icon next to the UUID to copy it to clipboard

### Step 4: Add User to admin_roles Table

#### 4.1: Go to SQL Editor

Navigate to: **SQL Editor** (left sidebar)

#### 4.2: Run Admin Role Insert

Create a new query and paste:

```sql
INSERT INTO public.admin_roles (user_id, role, permissions)
VALUES ('66078613-da1c-47b7-ae8f-d9395da181ef', 'super_admin', '{}');
```

**Replace** `PASTE_USER_UUID_HERE` with the actual UUID you copied in Step 3.

**Example:**
```sql
INSERT INTO public.admin_roles (user_id, role, permissions)
VALUES ('66078613-da1c-47b7-ae8f-d9395da181ef', 'super_admin', '{}');
```

#### 4.3: Click "RUN"

You should see: `Success. 1 rows affected.`

---

## ✅ VALIDATION

Verify the admin user was created correctly:

### 1. Check User Exists in Auth
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@indabaxkenya.org';
```

**Expected:** 1 row with your email and UUID

### 2. Check Admin Role Assigned
```sql
SELECT ar.role, u.email
FROM public.admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
WHERE u.email = 'admin@indabaxkenya.org';
```

**Expected:** 1 row showing `super_admin` role

### 3. Test is_admin() Function (as admin)

**Note:** This test won't work until you actually login, but the function should exist:

```sql
-- Just verify function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'is_admin'
  AND routine_schema = 'public';
```

**Expected:** 1 row showing `is_admin`

---

## 🔐 SAVE CREDENTIALS SECURELY

**IMPORTANT:** Document these credentials in a secure location:

```
Admin User Credentials
======================
Email: admin@indabaxkenya.org
Password: [your password]
UUID: [user uuid]
Role: super_admin
Created: [date]
```

**Where to save:**
- Password manager (1Password, LastPass, Bitwarden)
- Secure notes (encrypted)
- **NOT** in git or public files
- **NOT** in plain text on your computer

**Share with client:**
- Use secure channel (encrypted email, password manager share)
- Don't send password via regular email or Slack

---

## 🧪 TEST LOGIN (Optional - Day 6)

You can test the login once we create the admin login page (Day 6).

For now, just verify the user exists and has the correct role.

---

## 👥 CREATING ADDITIONAL ADMIN USERS (Future)

When you need to add more admins later:

### Regular Admin (Limited Permissions)
```sql
INSERT INTO public.admin_roles (user_id, role, permissions)
VALUES ('user-uuid-here', 'admin', '{
  "can_delete": false,
  "can_export": true,
  "can_manage_users": false
}');
```

### Super Admin (Full Permissions)
```sql
INSERT INTO public.admin_roles (user_id, role, permissions)
VALUES ('user-uuid-here', 'super_admin', '{}');
```

**Note:** Always create the user in Auth → Users first, then add role.

---

## ❌ TROUBLESHOOTING

### Error: "User with this email already exists"
**Solution:**
1. Check if user was created in previous attempt
2. Go to Authentication → Users
3. Find the existing user
4. Use their UUID to add admin role

### Error: "violates foreign key constraint"
**Solution:**
1. User UUID doesn't exist in auth.users
2. Double-check UUID is correct
3. Verify user exists: `SELECT id FROM auth.users WHERE email = 'admin@indabaxkenya.org'`

### Error: "duplicate key value violates unique constraint"
**Solution:**
1. Admin role already exists for this user
2. Check: `SELECT * FROM admin_roles WHERE user_id = 'uuid'`
3. If exists, skip insert step

### Can't login later
**Solution:**
1. Verify email is confirmed: Check `email_confirmed_at` in auth.users
2. Reset password via Auth UI if forgotten
3. Check admin_roles table has entry for this user

---

## 🎯 CHECKLIST

- [ ] User created in Authentication → Users
- [ ] Email: admin@indabaxkenya.org (or your email)
- [ ] Password: Strong password saved securely
- [ ] Auto Confirm User: Enabled
- [ ] User UUID copied
- [ ] Admin role inserted into admin_roles table
- [ ] Role set to: super_admin
- [ ] Validation queries confirm user and role exist
- [ ] Credentials saved in secure location

---

## 📊 EXPECTED OUTCOME

After completion, you should have:

| Item | Value | Status |
|------|-------|--------|
| Auth User | admin@indabaxkenya.org | ⏳ |
| User UUID | 550e8400-... | ⏳ |
| Email Confirmed | Yes | ⏳ |
| Admin Role | super_admin | ⏳ |
| Can Login | Yes (after Day 6) | ⏳ |

---

## 🔒 SECURITY NOTES

1. **Strong Password:** Use a password manager to generate secure passwords
2. **2FA (Future):** Consider enabling 2FA in Supabase Auth settings
3. **Regular Rotation:** Change admin password every 90 days
4. **Audit Trail:** Admin actions will be logged (reviewed_by, updated_by fields)
5. **Principle of Least Privilege:** Create regular "admin" users for most tasks, reserve "super_admin" for critical operations

---

## 🎯 NEXT STEPS

Once admin user is created:

1. ✅ Mark "Create admin user" as complete
2. ➡️ Move to: Validate entire database setup
3. ➡️ Then: Test RLS policies
4. ➡️ Finally: Day 1 complete!

---

**Ready to create admin user?** Open Supabase Dashboard → Authentication → Users!

**Estimated Time:** 5 minutes
**Difficulty:** Easy (mostly point-and-click)
**Critical:** Yes (needed for admin panel access)
