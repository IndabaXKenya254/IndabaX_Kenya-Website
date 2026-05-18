# Production Setup Guide

**Date Created:** December 15, 2025
**Purpose:** Complete guide for switching from development to production environment

---

## Overview

This guide covers:
1. Local environment configuration for production
2. MCP configuration for production database
3. Testing locally with production data
4. Deploying to Vercel with production credentials

---

## 1. Environment Configuration (✅ COMPLETED)

### Development Project (OLD)
- **Project Ref:** `klnspdwlybpwkznzezzd`
- **URL:** https://klnspdwlybpwkznzezzd.supabase.co
- **Backup File:** `.env.local.dev-backup-20251215-181812`

### Production Project (NEW - ACTIVE)
- **Project Ref:** `pqndsvfoobctutaeyleq`
- **URL:** https://pqndsvfoobctutaeyleq.supabase.co
- **Environment File:** `.env.local`

### Current .env.local Configuration
```env
# Supabase Configuration (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://pqndsvfoobctutaeyleq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbmRzdmZvb2JjdHV0YWV5bGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzgwMTMsImV4cCI6MjA3NTkxNDAxM30.Fhul0QnVAF-1RlSnoRdEnwmQRx8URTpHAYQJ4_Hpwe0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbmRzdmZvb2JjdHV0YWV5bGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMzODAxMywiZXhwIjoyMDc1OTE0MDEzfQ.L22aw13Ys9EMXnnQDmHqfLEMtCCCdAsvRoFLiJ3oQUs

# SMTP Configuration (Unchanged - Production emails)
SMTP_HOST=server72.web-hosting.com
SMTP_PORT=465
SMTP_SECURE=true

# Email Accounts (Unchanged)
SMTP_APPLICATIONS_USER=applications@deeplearningindabaxkenya.com
SMTP_APPLICATIONS_PASS=OMZ)HZw[QuZe
SMTP_ACCOUNTS_USER=accounts@deeplearningindabaxkenya.com
SMTP_ACCOUNTS_PASS=X5Egh+][4*k$

# Site Configuration (Unchanged)
NEXT_PUBLIC_SITE_URL=https://deeplearningindabaxkenya.com
```

---

## 2. MCP Configuration (⚠️ REQUIRES MANUAL SETUP)

The Supabase MCP server is currently configured for the **development** project. It needs to be reconfigured for production.

### Option A: Project-Scoped MCP (Recommended)

Run this command from the project root:

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Add Supabase MCP for production project
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=pqndsvfoobctutaeyleq&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
```

This will create a project-specific MCP configuration that only applies when working in this directory.

### Option B: Global MCP Configuration

Edit: `/home/de-coder/.config/Claude/claude_desktop_config.json`

Add the Supabase MCP server:

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["@sethdouglasford/mcp-figma@latest"]
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=pqndsvfoobctutaeyleq&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
    }
  }
}
```

**Note:** This will make MCP always use production, even for other projects.

### Verify MCP Connection

After configuring, restart Claude Code and verify:

```bash
# Check project URL via MCP
# Should return: https://pqndsvfoobctutaeyleq.supabase.co
```

---

## 3. Testing Locally with Production

### Start Development Server

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website
npm run dev
```

The app will now connect to the **production** Supabase database.

### Test Checklist

Before deploying to Vercel, test these features locally:

- [ ] **Public Pages**
  - [ ] Homepage loads
  - [ ] Events page shows production events
  - [ ] Speakers page displays correctly
  - [ ] Gallery loads production photos
  - [ ] News/posts page works

- [ ] **Authentication**
  - [ ] Login with production admin account
  - [ ] Email verification works with production SMTP

- [ ] **Admin Panel**
  - [ ] Dashboard loads production data
  - [ ] Can view/edit events
  - [ ] Can manage speakers
  - [ ] Application review works
  - [ ] Email templates load

- [ ] **Database Operations**
  - [ ] Read operations work
  - [ ] Write operations work (test on non-critical data)
  - [ ] RLS policies are enforced

### Important Testing Notes

1. **Data Safety:** You're now working with production data. Be careful with:
   - Deleting records
   - Bulk operations
   - Status changes on applications

2. **Email Testing:** Emails will send to real addresses from production SMTP. Use test emails or disable email sending during testing.

3. **Backup:** The development backup is saved at:
   ```
   .env.local.dev-backup-20251215-181812
   ```

---

## 4. Vercel Deployment

### A. Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add/update these variables for **Production**, **Preview**, and **Development**:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://pqndsvfoobctutaeyleq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbmRzdmZvb2JjdHV0YWV5bGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzgwMTMsImV4cCI6MjA3NTkxNDAxM30.Fhul0QnVAF-1RlSnoRdEnwmQRx8URTpHAYQJ4_Hpwe0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbmRzdmZvb2JjdHV0YWV5bGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMzODAxMywiZXhwIjoyMDc1OTE0MDEzfQ.L22aw13Ys9EMXnnQDmHqfLEMtCCCdAsvRoFLiJ3oQUs

# SMTP Configuration
SMTP_HOST=server72.web-hosting.com
SMTP_PORT=465
SMTP_SECURE=true

# Email Accounts
SMTP_APPLICATIONS_USER=applications@deeplearningindabaxkenya.com
SMTP_APPLICATIONS_PASS=OMZ)HZw[QuZe
SMTP_APPLICATIONS_FROM_NAME=IndabaX Kenya - Applications
SMTP_APPLICATIONS_FROM_EMAIL=applications@deeplearningindabaxkenya.com

SMTP_ACCOUNTS_USER=accounts@deeplearningindabaxkenya.com
SMTP_ACCOUNTS_PASS=X5Egh+][4*k$
SMTP_ACCOUNTS_FROM_NAME=IndabaX Kenya - Accounts
SMTP_ACCOUNTS_FROM_EMAIL=accounts@deeplearningindabaxkenya.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://deeplearningindabaxkenya.com
```

### B. Deploy to Vercel

#### Option 1: Deploy via Git (Recommended)

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Switch to production Supabase database (pqndsvfoobctutaeyleq)"

# Push to main branch (triggers Vercel deployment)
git push origin main
```

#### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

### C. Post-Deployment Verification

After deployment completes:

1. **Visit Production Site:** https://deeplearningindabaxkenya.com
2. **Check Deployment Logs:** Review Vercel deployment logs for errors
3. **Test Critical Flows:**
   - [ ] Homepage loads
   - [ ] Admin login works
   - [ ] Database reads work
   - [ ] Forms submit correctly
   - [ ] Emails send successfully

4. **Monitor Supabase:**
   - Check API logs: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/logs/api-logs
   - Check Postgres logs: https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq/logs/postgres-logs

---

## 5. Rollback Plan

If something goes wrong, here's how to rollback:

### A. Rollback Local Environment

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Restore development environment
cp .env.local.dev-backup-20251215-181812 .env.local

# Restart dev server
npm run dev
```

### B. Rollback Vercel Deployment

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

### C. Rollback MCP Configuration

If using project-scoped MCP:
```bash
claude mcp remove --scope project supabase
```

If using global MCP, remove the `supabase` entry from:
```
/home/de-coder/.config/Claude/claude_desktop_config.json
```

---

## 6. Database Migration Status

### Development Database Schema
The development database (`klnspdwlybpwkznzezzd`) has the full schema including:
- All tables (events, speakers, posts, registrations, etc.)
- RLS policies
- Functions and triggers
- Email templates
- Form templates

### Production Database Status
**⚠️ IMPORTANT:** Verify that the production database has:
- [ ] All required migrations applied
- [ ] RLS policies configured
- [ ] Storage buckets created
- [ ] Required seed data (if any)

To check production database status:
```bash
# List migrations (via MCP after reconfiguring)
# Check tables exist
# Verify RLS policies
```

If production is missing migrations, you'll need to:
1. Export schema from development
2. Apply to production (via Supabase dashboard or MCP)

---

## 7. Security Checklist

Before going live:

- [ ] **Environment Variables**
  - [ ] All secrets are in Vercel env vars, not in code
  - [ ] `.env.local` is in `.gitignore`
  - [ ] No credentials committed to git

- [ ] **Supabase Security**
  - [ ] RLS policies enabled on all tables
  - [ ] Service role key only used server-side
  - [ ] Anon key used for client-side
  - [ ] API rate limiting configured

- [ ] **Email Security**
  - [ ] SMTP credentials secure
  - [ ] Email verification enabled
  - [ ] SPF/DKIM records configured for domain

- [ ] **Admin Access**
  - [ ] Admin accounts have strong passwords
  - [ ] Admin roles properly configured
  - [ ] 2FA enabled for admin accounts (if available)

---

## 8. Monitoring & Maintenance

### Supabase Monitoring
- **Dashboard:** https://supabase.com/dashboard/project/pqndsvfoobctutaeyleq
- **API Logs:** Monitor for errors and performance issues
- **Postgres Logs:** Check for slow queries
- **Storage Usage:** Monitor storage growth

### Vercel Monitoring
- **Dashboard:** https://vercel.com/dashboard
- **Analytics:** Track page views and performance
- **Error Logs:** Monitor runtime errors
- **Build Logs:** Check for build issues

### Regular Maintenance
- Weekly: Review error logs
- Monthly: Check database performance
- Quarterly: Rotate credentials
- As needed: Apply security updates

---

## 9. Contact & Support

### Key Resources
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Project Repo:** [Your git repo URL]

### Project References
- **Development Project:** klnspdwlybpwkznzezzd
- **Production Project:** pqndsvfoobctutaeyleq
- **Domain:** deeplearningindabaxkenya.com

---

## Summary of Changes

### ✅ Completed
1. Backed up development `.env.local`
2. Updated `.env.local` with production Supabase credentials
3. Verified local connection to production database
4. Created comprehensive deployment guide

### ⚠️ Requires Manual Action
1. **Update MCP Configuration:** Follow Section 2 to reconfigure MCP for production
2. **Test Locally:** Complete the testing checklist in Section 3
3. **Deploy to Vercel:** Follow Section 4 for deployment
4. **Verify Production:** Complete post-deployment verification

---

**Next Steps:**
1. Update MCP configuration (Section 2)
2. Test thoroughly locally (Section 3)
3. Deploy to Vercel (Section 4)
4. Monitor and verify (Section 8)
