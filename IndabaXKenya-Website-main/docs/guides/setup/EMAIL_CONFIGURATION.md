# Email Configuration

## Overview

The IndabaX Kenya website uses two separate email accounts for different purposes:

### 1. Applications Email (`applications@deeplearningindabaxkenya.com`)

**Use for:**
- Event registration confirmations
- Event application notifications
- Participant communications
- Event-related emails

**Environment Variables:**
```env
SMTP_APPLICATIONS_USER=applications@deeplearningindabaxkenya.com
SMTP_APPLICATIONS_PASS=OMZ)HZw[QuZe
SMTP_APPLICATIONS_FROM_NAME="IndabaX Kenya - Applications"
SMTP_APPLICATIONS_FROM_EMAIL=applications@deeplearningindabaxkenya.com
```

### 2. Accounts Email (`accounts@deeplearningindabaxkenya.com`)

**Use for:**
- User account registration
- Password reset emails
- System notifications
- Admin communications
- General account-related emails

**Environment Variables:**
```env
SMTP_ACCOUNTS_USER=accounts@deeplearningindabaxkenya.com
SMTP_ACCOUNTS_PASS=X5Egh+][4*k$
SMTP_ACCOUNTS_FROM_NAME="IndabaX Kenya - Accounts"
SMTP_ACCOUNTS_FROM_EMAIL=accounts@deeplearningindabaxkenya.com
```

## SMTP Configuration

**Server:** `server72.web-hosting.com`
**Port:** `465` (SSL/TLS)
**Security:** SSL/TLS enabled

## Implementation

### Email Sender Module (`lib/email/sender.ts`)

The email sender module provides two transporter functions:

1. **`createApplicationsTransporter()`** - For event-related emails
2. **`createAccountsTransporter()`** - For account-related emails

### Current Functions

#### `sendRegistrationConfirmation(email, data)`
- **Uses:** Applications email
- **Purpose:** Send event registration confirmation
- **Features:**
  - Professional HTML email template
  - Event details (date, location, registration ID)
  - Plain text fallback
  - "View Event Details" button

#### `sendResumeLink(email, eventTitle, resumeUrl)` _(Placeholder)_
- **Uses:** Applications email
- **Purpose:** Send resume link for incomplete registrations

### Future Email Functions to Implement

**Using Applications Email:**
- Application status updates (accepted/rejected)
- Event reminders
- Schedule updates
- Ticket delivery

**Using Accounts Email:**
- Welcome emails (new user registration)
- Email verification
- Password reset
- Account security notifications
- Admin alerts

## Testing Email Sending

To test email sending in development:

1. Ensure `.env.local` has correct SMTP credentials
2. Submit an event registration form while logged in
3. Check server logs for email sending status
4. Check recipient inbox for confirmation email

## Troubleshooting

### Email Not Sending

1. **Check environment variables:**
   ```bash
   grep SMTP .env.local
   ```

2. **Check server logs for errors:**
   - Look for `📧 Sending registration confirmation email`
   - Look for `✅ Email sent successfully` or `❌ Email sending error`

3. **Common issues:**
   - Incorrect SMTP credentials
   - Firewall blocking port 465
   - Invalid recipient email address
   - SMTP server temporarily unavailable

### Email Going to Spam

If emails are going to spam folder:

1. Add sender email to contacts/safe senders
2. Check SPF/DKIM records for domain
3. Ensure email content isn't triggering spam filters
4. Consider using email authentication (SPF, DKIM, DMARC)

## Security Notes

⚠️ **Important:**
- NEVER commit `.env.local` to git
- Keep SMTP passwords secure
- Rotate passwords regularly
- Use environment variables for all sensitive data
- Monitor email sending logs for suspicious activity

## Email Templates

All email templates use:
- IndabaX Kenya branding
- Professional gradient header
- Responsive design
- Both HTML and plain text versions
- Proper encoding (UTF-8)

### Customizing Templates

Email templates are defined in `lib/email/sender.ts`. To customize:

1. Edit HTML template in the function
2. Update plain text version to match
3. Test on multiple email clients
4. Ensure mobile responsiveness
