# Fixing AutoSSL Errors for System Subdomains

## Issue: AutoSSL Errors on System Subdomains

You're seeing errors for these subdomains:
- `webmail.tazsoftware.biz`
- `cpcontacts.tazsoftware.biz`
- `cpcalendars.tazsoftware.biz`
- `autodiscover.tazsoftware.biz`

**Good news:** These errors typically **don't affect your main domain** (`tazsoftware.biz`). These are system subdomains that may not need SSL certificates.

## Understanding These Subdomains

### What They Are:

1. **webmail.tazsoftware.biz** - GoDaddy webmail interface
2. **cpcontacts.tazsoftware.biz** - cPanel contacts/address book
3. **cpcalendars.tazsoftware.biz** - cPanel calendar feature
4. **autodiscover.tazsoftware.biz** - Email autodiscovery (for Outlook, etc.)

### Why They're Failing:

- These subdomains may not have DNS records pointing to your hosting
- They may not be configured in your hosting account
- They're optional system features that don't need SSL
- AutoSSL tries to secure everything, but these don't need certificates

## Solution 1: Exclude Subdomains from AutoSSL (Recommended)

### In cPanel:

1. **Go to SSL/TLS Status** or **AutoSSL**
2. **Look for "Exclude Domains" or "Skip Domains" option**
3. **Add these subdomains to the exclusion list:**
   - `webmail.tazsoftware.biz`
   - `cpcontacts.tazsoftware.biz`
   - `cpcalendars.tazsoftware.biz`
   - `autodiscover.tazsoftware.biz`
4. **Save changes**

This will prevent AutoSSL from trying to secure them.

## Solution 2: Ignore the Errors (Simplest)

**If your main domain (`tazsoftware.biz`) SSL is working:**

- You can safely ignore these subdomain errors
- They don't affect your main website
- Your visitors won't see these errors
- Only you see them in the AutoSSL report

**To verify main domain is working:**
1. Visit: `https://tazsoftware.biz`
2. Check for padlock icon in browser
3. If it works, you're good to go!

## Solution 3: Add DNS Records (If Needed)

If you actually need these subdomains to work:

### For webmail:

1. **In GoDaddy DNS settings:**
   - Add CNAME record:
     - **Name:** `webmail`
     - **Points to:** `webmail.secureserver.net` (or your hosting provider's webmail server)
   - **TTL:** `600`

2. **Then AutoSSL can secure it**

### For autodiscover (Email):

1. **In GoDaddy DNS settings:**
   - Add CNAME record:
     - **Name:** `autodiscover`
     - **Points to:** `autodiscover.secureserver.net` (or your email provider)
   - **TTL:** `600`

### For cpcontacts and cpcalendars:

- These are internal cPanel features
- Usually don't need public DNS records
- Best to exclude them from AutoSSL

## Solution 4: Disable Unused Features

If you don't use these features:

1. **In cPanel:**
   - Look for feature toggles or settings
   - Disable unused features (contacts, calendars)
   - This may reduce AutoSSL attempts

## Verify Main Domain SSL is Working

**Most important:** Check that your main domain SSL is working:

1. **Visit:** `https://tazsoftware.biz`
2. **Check browser address bar:**
   - Should show padlock icon 🔒
   - Should say "Connection is secure"
   - No security warnings

3. **If main domain works:**
   - ✅ You're all set!
   - Subdomain errors can be ignored or excluded

## Quick Checklist

- [ ] Main domain (`tazsoftware.biz`) SSL is working ✅
- [ ] Padlock icon shows in browser ✅
- [ ] No security warnings on main site ✅
- [ ] Subdomain errors are just in AutoSSL report (not affecting visitors)
- [ ] Optionally excluded subdomains from AutoSSL

## Recommended Action

**For most users, the best approach is:**

1. **Verify main domain SSL works** (`https://tazsoftware.biz`)
2. **If it works, ignore the subdomain errors** - they don't affect your site
3. **Optionally exclude them from AutoSSL** to clean up the report

## Contact GoDaddy Support (If Needed)

If you want these subdomains to work:

1. **Contact GoDaddy Support**
2. **Ask them to:**
   - Set up DNS records for the subdomains you need
   - Or exclude them from AutoSSL if not needed
3. **They can help configure:** webmail, autodiscover, etc.

## Summary

**These subdomain SSL errors are normal and usually harmless.** As long as your main domain (`tazsoftware.biz`) has a valid SSL certificate and shows the padlock icon, your website is secure and working correctly. The subdomain errors are just AutoSSL trying to secure optional system features that may not be configured.

**Focus on:** Making sure `https://tazsoftware.biz` works with a valid certificate. That's what your visitors will see!
