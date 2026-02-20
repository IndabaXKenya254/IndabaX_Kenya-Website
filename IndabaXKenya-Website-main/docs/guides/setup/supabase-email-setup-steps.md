# Supabase Email Configuration - Step-by-Step Guide

**Project:** IndabaX Kenya
**Supabase Project:** klnspdwlybpwkznzezzd
**Purpose:** Configure email verification for user registration

---

## Step 1: Access Supabase Dashboard

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Sign in with your Supabase account
3. Select project: **klnspdwlybpwkznzezzd** (IndabaX Kenya)
4. You should see the project dashboard

✅ **Checkpoint:** You're in the IndabaX Kenya project dashboard

---

## Step 2: Navigate to Authentication Settings

1. In the left sidebar, click **"Authentication"**
2. You'll see several tabs at the top
3. We'll configure multiple sections

✅ **Checkpoint:** You're in the Authentication section

---

## Step 3: Configure Email Provider

### 3A: Enable Email Authentication

1. Click on **"Providers"** tab
2. Find **"Email"** in the list
3. Make sure it's **ENABLED** (toggle should be ON/green)
4. Click **"Save"** if you made changes

### 3B: Enable Email Confirmations

1. Still in the **"Providers" → "Email"** section
2. Look for **"Confirm email"** setting
3. **Toggle it ON** (this requires users to verify email before login)
4. **IMPORTANT:** This is critical for security!
5. Click **"Save"**

✅ **Checkpoint:** Email provider enabled, email confirmations required

---

## Step 4: Configure SMTP (Optional but Recommended)

**Default:** Supabase uses their own email service (free tier has limits)
**Recommended:** Use your custom SMTP for production

### 4A: Access SMTP Settings

1. Click on **"Settings"** (gear icon) in the left sidebar
2. Click **"Auth"** under Project Settings
3. Scroll down to find **"SMTP Settings"** section

### 4B: Option 1 - Use Supabase Default (For Testing)

- **Skip this step for now**
- Supabase will send emails from their servers
- Good for testing, but has rate limits
- Emails might go to spam

### 4C: Option 2 - Use Custom SMTP (Recommended for Production)

Fill in these details:

**SMTP Configuration:**
```
Enable Custom SMTP: ON
Host: server72.web-hosting.com
Port Number: 465
Username: accounts@deeplearningindabaxkenya.com
Password: X5Egh+][4*k$
Sender Email: accounts@deeplearningindabaxkenya.com
Sender Name: IndabaX Kenya
```

**Important Settings:**
- **Enable SSL:** YES (Port 465 requires SSL)
- **TLS:** Leave as default

Click **"Save"** after entering all details

### 4D: Test SMTP Connection

1. After saving, look for a **"Send test email"** button
2. Enter your email address
3. Click send
4. Check your inbox (and spam folder)
5. If email arrives, SMTP is working!

✅ **Checkpoint:** SMTP configured (or using Supabase default for testing)

---

## Step 5: Customize Email Templates

### 5A: Access Email Templates

1. Go back to **"Authentication"** in the left sidebar
2. Click on **"Email Templates"** tab
3. You'll see several templates:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### 5B: Customize "Confirm Signup" Template

1. Click on **"Confirm signup"**
2. You'll see Subject and Body fields

**Subject:** Replace with:
```
Verify your email - IndabaX Kenya
```

**Body:** Replace entire content with this HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to IndabaX Kenya!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Verify Your Email Address</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for creating an account with IndabaX Kenya. To complete your registration and access your account, please verify your email address by clicking the button below:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 5px; font-size: 16px; font-weight: 600;">Verify Email Address</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 4px; word-break: break-all; color: #667eea; font-size: 13px;">
                {{ .ConfirmationURL }}
              </p>

              <div style="margin: 30px 0; padding: 15px; background-color: #fff9e6; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⏰ This link will expire in 24 hours.</strong>
                </p>
              </div>

              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you did not create an account with IndabaX Kenya, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                &copy; 2025 IndabaX Kenya. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 13px;">
                East Africa's premier AI & Machine Learning conference
              </p>
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 12px;">
                <a href="https://indabaxkenya.org" style="color: #667eea; text-decoration: none;">Visit Website</a> |
                <a href="https://indabaxkenya.org/contact" style="color: #667eea; text-decoration: none;">Contact Us</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

3. Click **"Save"** to save the template

✅ **Checkpoint:** Email template customized with professional design

---

## Step 6: Configure URL Settings

### 6A: Access URL Configuration

1. Go to **"Settings"** (gear icon) in left sidebar
2. Click **"Auth"** under Project Settings
3. Find **"URL Configuration"** section

### 6B: Set Site URL

**Site URL:** (This is your main app URL)
```
http://localhost:3000
```

**For Production (later):**
```
https://your-production-domain.com
```

### 6C: Add Redirect URLs

In the **"Redirect URLs"** field, add these URLs (one per line):

```
http://localhost:3000/verify-email
http://localhost:3000/dashboard
http://localhost:3000/login
http://localhost:3000/*
```

**For Production (add later):**
```
https://your-production-domain.com/verify-email
https://your-production-domain.com/dashboard
https://your-production-domain.com/login
https://your-production-domain.com/*
```

Click **"Save"**

✅ **Checkpoint:** URLs configured for local development

---

## Step 7: Configure Email Template Redirect

1. Go back to **"Authentication"** → **"Email Templates"**
2. Click on **"Confirm signup"** template again
3. Look for **"Redirect URL"** field at the bottom
4. Set it to:
   ```
   {{ .SiteURL }}/verify-email
   ```
5. Click **"Save"**

This ensures users are redirected to your verify-email page after clicking the link.

✅ **Checkpoint:** Redirect URL configured

---

## Step 8: Verify Settings Summary

Before testing, let's verify all settings:

**Email Provider:**
- ✅ Email provider: ENABLED
- ✅ Confirm email: ENABLED (required)

**SMTP Settings:**
- ✅ Custom SMTP configured OR using Supabase default

**Email Template:**
- ✅ "Confirm signup" customized with professional HTML
- ✅ Subject updated
- ✅ Redirect URL set to {{ .SiteURL }}/verify-email

**URLs:**
- ✅ Site URL: http://localhost:3000
- ✅ Redirect URLs: Added for verify-email, dashboard, login

---

## Step 9: Test Email Sending

### 9A: Using Registration API

Open your terminal and run:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

Replace `your-test-email@gmail.com` with your actual email.

### 9B: Using the Registration Form

1. Start your dev server: `npm run dev`
2. Go to: `http://localhost:3000/register`
3. Fill out the form with your email
4. Submit
5. You should see success message

### 9C: Check Your Email

1. Check your inbox (the email you registered with)
2. **Check spam/junk folder** if not in inbox
3. You should receive an email with subject: "Verify your email - IndabaX Kenya"
4. Email should have:
   - Purple gradient header
   - "Verify Email Address" button
   - Copy-paste link option
   - Professional footer

### 9D: Test Verification Link

1. Click the **"Verify Email Address"** button in the email
2. You should be redirected to: `http://localhost:3000/verify-email`
3. The page should show:
   - "Verifying your email..." (briefly)
   - Then "Email Verified!" with success message
   - Auto-redirect to dashboard after 2 seconds

✅ **Checkpoint:** Email received and verification works!

---

## Step 10: Test Complete Flow

### Full Registration Flow Test:

1. **Register:**
   - Go to `/register`
   - Fill form with NEW email (not previously used)
   - Submit → Success message

2. **Check Email:**
   - Check inbox/spam
   - Receive verification email
   - Email looks professional

3. **Verify:**
   - Click verification link
   - Redirected to `/verify-email`
   - See success message

4. **Login:**
   - Go to `/login`
   - Enter email + password
   - Login successful
   - Redirected to `/dashboard`

5. **Dashboard:**
   - Dashboard loads
   - Shows your name
   - Stats cards visible
   - "No Registrations Yet" message (expected for new user)

✅ **Checkpoint:** Complete flow works end-to-end!

---

## Troubleshooting

### Email Not Received

**Check:**
1. Spam/junk folder
2. Email address is correct
3. SMTP settings are correct
4. Supabase email logs: Authentication → Logs → Auth Logs

**Fix:**
- If using custom SMTP, verify credentials
- If using Supabase default, check rate limits
- Try with different email provider (Gmail, Outlook)

### Verification Link Not Working

**Check:**
1. Link hasn't expired (24 hours)
2. Redirect URLs include `/verify-email`
3. Dev server is running on port 3000
4. Browser console for errors

**Fix:**
- Copy full URL from email and paste in browser
- Check Site URL matches your dev server
- Verify redirect URLs saved correctly

### User Can't Login After Verification

**Check:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. Check `email_confirmed_at` column - should have timestamp
4. If NULL, verification didn't work

**Fix:**
- Manually verify user in dashboard (click user → Verify Email)
- Try verification link again
- Check auth logs for errors

### Redirect Goes to Wrong URL

**Check:**
- Site URL in settings
- Redirect URLs list
- Email template redirect URL

**Fix:**
- Ensure Site URL is `http://localhost:3000` (no trailing slash)
- Ensure redirect URLs include `/verify-email`

---

## Production Checklist (For Later)

When deploying to production:

- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Verify custom SMTP works with production
- [ ] Test email delivery to multiple providers (Gmail, Outlook, Yahoo)
- [ ] Check spam score: https://mail-tester.com
- [ ] Set up SPF, DKIM, DMARC records for custom domain
- [ ] Update email template links (website, contact us)
- [ ] Set up email monitoring/logging
- [ ] Test entire flow on production

---

## Summary

**What We Configured:**
1. ✅ Email provider enabled with confirmations required
2. ✅ Custom SMTP configured (or using Supabase default)
3. ✅ Professional email verification template
4. ✅ Site URL and redirect URLs
5. ✅ Email template redirect URL
6. ✅ Tested email sending
7. ✅ Verified complete registration flow

**Your email verification is now LIVE!** 🎉

---

**Next Steps:**
- Test with multiple email addresses
- Monitor email deliverability
- Consider adding custom domain for emails
- Move to Phase 3: Form Builder Integration

---

**End of Supabase Email Setup Guide**
