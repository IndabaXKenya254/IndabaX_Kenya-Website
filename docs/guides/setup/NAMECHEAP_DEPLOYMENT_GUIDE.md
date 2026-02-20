# Deploying IndabaX Kenya Website to Vercel with Namecheap Domain

## Overview

This guide shows how to deploy your Next.js application to Vercel (free) while keeping your Namecheap services for email and domain.

**Architecture:**
- **Hosting:** Vercel (free tier) - Hosts the Next.js application
- **Email/SMTP:** Namecheap (`server72.web-hosting.com:465`) - Unchanged
- **Domain:** Namecheap - Point to Vercel using DNS
- **Database:** Supabase - Unchanged

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd /home/de-coder/Documents/Side-Gigs/deeplearningindaba/indabax-kenya-website

# Initialize git repository
git init

# Create .gitignore (should already exist)
echo "node_modules
.next
.env.local
.env
*.log
.DS_Store
build-*.log" > .gitignore

# Initial commit
git add .
git commit -m "Initial commit - IndabaX Kenya website"
```

### 1.2 Push to GitHub

```bash
# Create a new repository on GitHub first
# Then connect it:
git remote add origin https://github.com/YOUR_USERNAME/indabax-kenya-website.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Sign up with GitHub (recommended for easy integration)
3. Authorize Vercel to access your GitHub repositories

### 2.2 Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repository: `indabax-kenya-website`
3. Configure project settings:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### 2.3 Add Environment Variables

In the Vercel project settings, add these environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pqndsvfoobctutaeyleq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Email Configuration (Namecheap SMTP)
SMTP_HOST=server72.web-hosting.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=accounts@deeplearningindabaxkenya.com
SMTP_PASS=X5Egh+][4*k$
SMTP_FROM=accounts@deeplearningindabaxkenya.com

# Application Email
SMTP_USER_APPLICATIONS=applications@deeplearningindabaxkenya.com
SMTP_PASS_APPLICATIONS=OMZ)HZw[QuZe
```

**⚠️ IMPORTANT:** Get the actual Supabase anon key from your `.env.local` file or Supabase dashboard.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://indabax-kenya-website.vercel.app`

---

## Step 3: Test the Deployment

### 3.1 Test Basic Functionality

Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ Navigation works
- ✅ API routes work (test contact form, newsletter subscription)
- ✅ Email sending works (using Namecheap SMTP)
- ✅ Admin panel login
- ✅ Database operations (Supabase)

### 3.2 Check Email Configuration

Test email sending:
1. Submit a contact form
2. Subscribe to newsletter
3. Check if emails are received
4. Verify emails are sent from `@deeplearningindabaxkenya.com`

---

## Step 4: Point Namecheap Domain to Vercel

### 4.1 Add Domain in Vercel

1. In Vercel project, go to **Settings** → **Domains**
2. Add your domain: `deeplearningindabaxkenya.com`
3. Vercel will show you DNS records to add

### 4.2 Configure Namecheap DNS

1. Log in to Namecheap account
2. Go to **Domain List** → Your domain → **Manage**
3. Go to **Advanced DNS** tab
4. Update DNS records:

**If using root domain (deeplearningindabaxkenya.com):**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**If using subdomain (www.deeplearningindabaxkenya.com):**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**For both:**
```
Type: A Record
Host: @
Value: 76.76.21.21

Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
```

### 4.3 Keep Email Records

**⚠️ IMPORTANT:** Do NOT delete these existing DNS records (needed for email):
- MX Records (Mail Exchange)
- TXT Records (SPF, DKIM)
- CNAME Records for email (mail, smtp, etc.)

These records ensure your Namecheap email continues working.

### 4.4 Wait for DNS Propagation

- DNS changes take 5 minutes to 48 hours to propagate
- Usually completes within 30 minutes
- Check status at: https://www.whatsmydns.net/

---

## Step 5: SSL Certificate (Automatic)

Vercel automatically provisions and manages SSL certificates for your domain:
- ✅ Free SSL/TLS certificate
- ✅ Auto-renewal
- ✅ HTTPS enforced by default

No action needed - this happens automatically once DNS is configured.

---

## Step 6: Continuous Deployment

Once set up, deployment is automatic:

1. **Make code changes** locally
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update homepage content"
   git push
   ```
3. **Vercel auto-deploys** your changes (2-3 minutes)
4. **Live site updates** automatically

---

## Deployment Checklist

Before going live, verify:

- [ ] All environment variables added to Vercel
- [ ] Supabase connection working (test database queries)
- [ ] Email sending working (test contact form)
- [ ] SMTP using Namecheap servers (check email headers)
- [ ] Domain DNS configured correctly
- [ ] SSL certificate active (https:// works)
- [ ] All pages load correctly
- [ ] Admin panel accessible
- [ ] API routes functioning
- [ ] Images loading from Supabase Storage
- [ ] Newsletter subscription working
- [ ] Contact form working

---

## Troubleshooting

### Build Fails on Vercel

**Error:** TypeScript errors
```bash
# Fix locally first:
npm run build
# Fix errors, then push again
```

### Email Not Sending

**Issue:** SMTP connection fails

1. Check environment variables in Vercel match `.env.local`
2. Verify Namecheap email accounts are active
3. Test SMTP credentials at: https://www.smtper.net/
4. Check Vercel function logs for errors

### Domain Not Connecting

**Issue:** DNS not resolving

1. Check DNS records are correct in Namecheap
2. Wait 30-60 minutes for propagation
3. Verify at: https://www.whatsmydns.net/
4. Check Vercel domain settings show "Valid Configuration"

### API Routes Return 404

**Issue:** API routes not found

1. Ensure `next.config.mjs` doesn't have `output: 'export'` enabled
2. Check API files are in `src/app/api/` directory
3. Redeploy from Vercel dashboard

---

## Cost Comparison

### Vercel Free Tier Limits
- ✅ 100 GB bandwidth/month (plenty for IndabaX site)
- ✅ 100 deployments/day
- ✅ Unlimited websites
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ No credit card required

### Namecheap Shared Hosting
- ❌ Does NOT support Node.js
- ❌ Cannot run Next.js API routes
- ❌ Would need VPS upgrade (~$10-30/month)

**Winner:** Vercel (free + better performance)

---

## Maintaining Namecheap Services

**What stays at Namecheap:**
- ✅ Domain registration and renewal
- ✅ Email hosting (`@deeplearningindabaxkenya.com`)
- ✅ SMTP servers
- ✅ DNS management

**Cost:** Only domain renewal (~$10-15/year)

---

## Next Steps

1. **Deploy to Vercel** (Steps 1-2)
2. **Test thoroughly** (Step 3)
3. **Point domain** (Step 4)
4. **Monitor for 48 hours** to ensure stability
5. **Set up analytics** (optional):
   - Vercel Analytics (free)
   - Google Analytics
   - Plausible Analytics

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Namecheap DNS:** https://www.namecheap.com/support/knowledgebase/category/10191/dns-and-domain-pointing/
- **Vercel Support:** https://vercel.com/support

---

## Emergency Rollback

If something goes wrong:

1. **Revert DNS in Namecheap** to old settings
2. **Pause deployment in Vercel** (Project Settings → General → Pause)
3. **Debug locally** before redeploying
4. **Check Vercel logs** for errors

---

**Ready to deploy?** Start with Step 1!
