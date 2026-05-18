# Vercel Domain Configuration with Namecheap DNS

## Current Situation
- Domain: `deeplearningindabaxkenya.com`
- DNS Management: Namecheap cPanel (keep it here for email)
- Hosting: Vercel (for website)
- Email: Namecheap SMTP (must keep working)

---

## Step-by-Step Instructions

### Step 1: Configure Vercel to Use External DNS

1. **Go to Vercel Dashboard** → Your Project → **Domains**
2. **Find your domain:** `deeplearningindabaxkenya.com`
3. **Look for the verification status** - it should show what DNS records are needed

**Vercel will show you one of these options:**

#### Option A: Nameserver Method (DON'T USE - will break email)
- Uses Vercel nameservers: ns1.vercel-dns.com, ns2.vercel-dns.com
- ❌ We're NOT using this method

#### Option B: DNS Records Method (USE THIS)
- Add specific A and CNAME records
- ✅ This keeps your email working

4. **Look for a button or link** that says:
   - "Use different method"
   - "Configure externally"
   - "Add DNS records instead"

5. **Select the DNS Records method** (not nameservers)

---

### Step 2: Get the Correct DNS Records from Vercel

After selecting "DNS Records method", Vercel will show you:

**For root domain (deeplearningindabaxkenya.com):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Take note of these values** - you'll need them for cPanel.

---

### Step 3: Update DNS Records in Namecheap cPanel

Go to your **cPanel** → **Zone Editor** → **deeplearningindabaxkenya.com**

#### A. Update Root Domain A Record

**Find this existing record:**
```
Name: deeplearningindabaxkenya.com.
Type: A
Value: 198.54.116.91  ← Old Namecheap hosting IP
TTL: 14400
```

**Click "Edit" and change to:**
```
Name: deeplearningindabaxkenya.com. (leave as is)
Type: A (leave as is)
Value: 76.76.21.21  ← NEW Vercel IP
TTL: 14400 (or change to 3600 for faster updates)
```

**Save the change.**

---

#### B. Update www CNAME Record

**Find this existing record:**
```
Name: www.deeplearningindabaxkenya.com.
Type: CNAME
Value: deeplearningindabaxkenya.com  ← Old target
TTL: 14400
```

**Click "Edit" and change to:**
```
Name: www.deeplearningindabaxkenya.com. (leave as is)
Type: CNAME (leave as is)
Value: cname.vercel-dns.com  ← NEW Vercel CNAME
TTL: 14400 (or change to 3600 for faster updates)
```

**Save the change.**

---

#### C. ⚠️ CRITICAL: DO NOT TOUCH THESE RECORDS

These records are essential for email - leave them exactly as they are:

**Email Records (DO NOT MODIFY):**
- ✅ MX Record: `mail.deeplearningindabaxkenya.com` (Priority: 0)
- ✅ A Record: `mail.deeplearningindabaxkenya.com` → `198.54.116.91`
- ✅ TXT Record: SPF `v=spf1 +a +mx +ip4:198.54.114.91...`
- ✅ TXT Record: DKIM `default._domainkey.deeplearningindabaxkenya.com`
- ✅ TXT Record: DMARC `_dmarc.deeplearningindabaxkenya.com`

**Email Subdomains (DO NOT MODIFY):**
- ✅ webmail.deeplearningindabaxkenya.com
- ✅ autodiscover.deeplearningindabaxkenya.com
- ✅ autoconfig.deeplearningindabaxkenya.com
- ✅ All SRV records (_autodiscover, _caldav, _carddav, etc.)

**Other Subdomains (Can Remove if Not Using):**
- cpanel.deeplearningindabaxkenya.com
- whm.deeplearningindabaxkenya.com
- webdisk.deeplearningindabaxkenya.com
- cpcalendars.deeplearningindabaxkenya.com
- cpcontacts.deeplearningindabaxkenya.com

These are cPanel-specific and won't be needed with Vercel, but leaving them won't hurt.

---

### Step 4: Verify DNS Changes

#### Check DNS Propagation

Use online tools to check if changes are live:

**Tool 1: DNS Checker**
- Go to: https://dnschecker.org/
- Enter: `deeplearningindabaxkenya.com`
- Select: A Record
- Should show: `76.76.21.21` globally

**Tool 2: Command Line (if you have terminal access)**
```bash
# Check A record
dig +short deeplearningindabaxkenya.com

# Should return: 76.76.21.21

# Check CNAME record for www
dig +short www.deeplearningindabaxkenya.com

# Should return: cname.vercel-dns.com
```

**Expected Timeline:**
- 5-30 minutes: Most regions updated
- 1-2 hours: Full global propagation
- Up to 24 hours: Maximum (rare)

---

### Step 5: Verify Domain in Vercel

Once DNS has propagated:

1. **Go back to Vercel Dashboard** → Domains
2. **Refresh the page**
3. Domain status should change to:
   - ✅ "Valid Configuration"
   - ✅ "DNS Configured"

4. **SSL Certificate will auto-provision:**
   - Vercel automatically issues Let's Encrypt SSL
   - Takes 5-10 minutes after DNS verification
   - No action needed from you

---

### Step 6: Test Your Website

Once domain shows as verified:

**Test these URLs:**
```
https://deeplearningindabaxkenya.com  ← Should load your site
https://www.deeplearningindabaxkenya.com  ← Should also work
http://deeplearningindabaxkenya.com  ← Should redirect to https
```

**Test functionality:**
- [ ] Homepage loads correctly
- [ ] All pages accessible
- [ ] Images loading from Supabase
- [ ] API routes working (test contact form)
- [ ] Admin panel accessible
- [ ] Email sending working (Namecheap SMTP)

---

## Troubleshooting

### Domain Still Shows "Unverified"

**Issue:** DNS hasn't propagated yet

**Solution:**
1. Wait 30-60 minutes
2. Check DNS propagation at dnschecker.org
3. Verify A record points to `76.76.21.21`
4. Verify CNAME points to `cname.vercel-dns.com`

---

### SSL Certificate Not Issuing

**Issue:** Vercel can't provision SSL

**Common causes:**
1. DNS not fully propagated (wait longer)
2. Domain not verified yet (check Vercel dashboard)
3. CAA records blocking Let's Encrypt

**Solution:**
1. Check if you have a CAA record in cPanel:
   ```
   deeplearningindabaxkenya.com.    14400    CAA    0 issue "letsencrypt.org"
   ```
2. If it exists and says something other than "letsencrypt.org", edit it
3. Or delete the CAA record entirely (it's optional)

---

### Website Shows "404: Not Found"

**Issue:** Deployment not set up correctly in Vercel

**Solution:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Check if you have a successful deployment
3. If no deployments, you need to connect your GitHub repo first
4. Follow deployment guide in `NAMECHEAP_DEPLOYMENT_GUIDE.md`

---

### Email Stopped Working

**Issue:** Accidentally changed email DNS records

**Solution:**
1. Go back to cPanel Zone Editor
2. Compare your records to the original list (above)
3. Restore any MX, mail.*, or email-related records
4. Wait 30 minutes for DNS to propagate

**If you need help, the original records should be:**
```
MX: mail.deeplearningindabaxkenya.com (Priority: 0)
A (mail): 198.54.116.91
SPF: v=spf1 +a +mx +ip4:198.54.114.91 +ip4:198.54.116.91 include:spf.web-hosting.com ~all
```

---

## DNS Records Summary

### Records to CHANGE:
| Name | Type | Old Value | New Value |
|------|------|-----------|-----------|
| deeplearningindabaxkenya.com | A | 198.54.116.91 | 76.76.21.21 |
| www.deeplearningindabaxkenya.com | CNAME | deeplearningindabaxkenya.com | cname.vercel-dns.com |

### Records to KEEP (Email - DO NOT TOUCH):
| Name | Type | Value |
|------|------|-------|
| deeplearningindabaxkenya.com | MX | mail.deeplearningindabaxkenya.com |
| mail.deeplearningindabaxkenya.com | A | 198.54.116.91 |
| deeplearningindabaxkenya.com | TXT | SPF record |
| default._domainkey... | TXT | DKIM record |
| _dmarc... | TXT | DMARC record |
| webmail, autodiscover, etc. | A | 198.54.116.91 |
| All _caldav, _carddav, etc. | SRV | Various |

---

## Quick Checklist

**Before you start:**
- [ ] Have access to Namecheap cPanel
- [ ] Have access to Vercel dashboard
- [ ] Understand which records to change vs. keep

**DNS Changes:**
- [ ] Changed A record to 76.76.21.21
- [ ] Changed www CNAME to cname.vercel-dns.com
- [ ] Did NOT touch any email-related records
- [ ] Saved all changes

**Verification:**
- [ ] Waited 30-60 minutes for DNS propagation
- [ ] Checked DNS propagation at dnschecker.org
- [ ] Domain shows as verified in Vercel
- [ ] SSL certificate issued automatically
- [ ] Website accessible via https://

**Testing:**
- [ ] Website loads correctly
- [ ] All pages working
- [ ] Email sending still works
- [ ] Contact form submits successfully
- [ ] Admin panel accessible

---

## Need Help?

**DNS Propagation Check:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

**Vercel Support:**
- https://vercel.com/support
- Documentation: https://vercel.com/docs/concepts/projects/domains

**Namecheap Support:**
- https://www.namecheap.com/support/
- LiveChat available in cPanel

---

**Estimated Total Time:** 30-60 minutes (mostly waiting for DNS propagation)

**Next Steps:** Once verified, proceed with deployment from GitHub → Vercel
