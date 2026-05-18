# Supabase Email Configuration Guide

**Project:** IndabaX Kenya - Registration System Redesign
**Phase:** Phase 2 - Authentication Extension
**Purpose:** Configure email verification for user registration

---

## Overview

Supabase provides built-in email authentication with customizable email templates. This guide walks through configuring email verification for the registration system.

---

## Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: `klnspdwlybpwkznzezzd`
3. Navigate to: **Authentication** → **Email Templates**

---

## Step 2: Configure Email Settings

### SMTP Settings (Optional - Use Custom Email Server)

**Location:** Authentication → Settings → SMTP Settings

If you want to use your custom email server:
- **Host:** server72.web-hosting.com
- **Port:** 465
- **Username:** accounts@deeplearningindabaxkenya.com
- **Password:** X5Egh+][4*k$
- **Sender Email:** accounts@deeplearningindabaxkenya.com
- **Sender Name:** IndabaX Kenya

**Note:** By default, Supabase uses their own email service. Custom SMTP is optional but recommended for production.

---

## Step 3: Customize Email Templates

### Confirm Signup Template

**Location:** Authentication → Email Templates → Confirm signup

**Subject:**
```
Verify your email - IndabaX Kenya
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to IndabaX Kenya!</h1>
  </div>
  <div class="content">
    <h2>Verify Your Email Address</h2>
    <p>Thank you for creating an account with IndabaX Kenya. To complete your registration, please verify your email address by clicking the button below:</p>

    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>

    <p><strong>This link will expire in 24 hours.</strong></p>

    <p>If you did not create an account, please ignore this email.</p>

    <div class="footer">
      <p>&copy; 2025 IndabaX Kenya. All rights reserved.</p>
      <p>East Africa's premier AI & Machine Learning conference</p>
    </div>
  </div>
</body>
</html>
```

---

### Magic Link Template (Optional)

**Location:** Authentication → Email Templates → Magic Link

**Subject:**
```
Your magic link - IndabaX Kenya
```

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>IndabaX Kenya</h1>
  </div>
  <div class="content">
    <h2>Sign in to your account</h2>
    <p>Click the button below to sign in to your IndabaX Kenya account:</p>

    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Sign In</a>
    </div>

    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this email, please ignore it.</p>
  </div>
</body>
</html>
```

---

## Step 4: Configure Redirect URLs

**Location:** Authentication → URL Configuration

**Site URL:**
```
http://localhost:3000
```
(Change to production URL when deploying)

**Redirect URLs (Add these):**
```
http://localhost:3000/verify-email
http://localhost:3000/dashboard
http://localhost:3000/login
https://your-production-domain.com/verify-email
https://your-production-domain.com/dashboard
https://your-production-domain.com/login
```

---

## Step 5: Enable Email Confirmation

**Location:** Authentication → Providers → Email

**Settings:**
- ✅ Enable email provider
- ✅ Enable email confirmations (Require email verification before login)
- ⚠️ Disable if not using email confirmation (Keep ENABLED for security)

**Confirmation settings:**
- Confirmation method: Email
- Email template: Confirm signup (customized above)
- Redirect URL: {{ .SiteURL }}/verify-email

---

## Step 6: Test Email Configuration

### Test with Registration API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

**Expected:**
1. User created in Supabase Auth
2. Email sent to test@example.com
3. Email contains verification link
4. Clicking link redirects to /verify-email
5. Account verified

---

## Step 7: Email Template Variables

Supabase provides these template variables:

- `{{ .ConfirmationURL }}` - Verification link
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email
- `{{ .RedirectTo }}` - Redirect URL after confirmation

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP settings** - Ensure credentials are correct
2. **Check spam folder** - Emails might be marked as spam
3. **Verify email provider is enabled** - Authentication → Providers → Email
4. **Check Supabase logs** - Dashboard → Logs → Auth Logs

### Verification Link Not Working

1. **Check redirect URLs** - Must be whitelisted in URL Configuration
2. **Check link expiration** - Links expire after 24 hours
3. **Check console for errors** - Browser console on /verify-email page

### User Can't Login After Verification

1. **Check email_confirmed_at** - Should be set in auth.users table
2. **Check session** - User might need to login again after verification
3. **Clear cookies** - Try clearing browser cookies

---

## Production Checklist

Before going to production:

- [ ] Configure custom SMTP server (recommended)
- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Test email delivery to multiple email providers (Gmail, Outlook, etc.)
- [ ] Check spam score of emails (use mail-tester.com)
- [ ] Set up email monitoring/logging
- [ ] Configure SPF, DKIM, DMARC records for custom domain
- [ ] Test entire registration → verification → login flow

---

## Additional Configuration

### Password Reset Email

**Location:** Authentication → Email Templates → Reset password

Similar customization as signup confirmation.

### Invite User Email

**Location:** Authentication → Email Templates → Invite user

For when admins invite users to the platform.

---

## Next Steps

After configuring Supabase email:

1. Test registration flow with real email
2. Verify email delivery
3. Test verification link
4. Test login after verification
5. Move to building user dashboard

---

**End of Supabase Email Configuration Guide**
