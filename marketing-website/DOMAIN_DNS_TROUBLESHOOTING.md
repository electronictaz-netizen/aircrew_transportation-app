# Domain DNS Troubleshooting for tazsoftware.biz

## Issue: Domain Still Shows GoDaddy Free Website

If your domain is still showing the original GoDaddy free website after uploading files to `public_html`, the domain is likely pointing to a different hosting location.

## Step 1: Check Domain DNS Settings

### In GoDaddy Domain Manager:

1. **Go to GoDaddy Domain Manager**
   - Log into GoDaddy
   - Go to **My Products** → **Domains**
   - Find `tazsoftware.biz`
   - Click **DNS** or **Manage DNS**

2. **Check A Record**
   - Look for an **A Record** pointing to:
     - Your hosting IP address (should be provided by GoDaddy hosting)
     - OR a different IP address (this is the problem!)

3. **Check CNAME Records**
   - Look for any CNAME records
   - If you see `www` pointing to something like `parked-domain.godaddy.com` or `freehosting.godaddy.com`, that's the issue

## Step 2: Verify Hosting Account

### Check if Domain is Connected to Hosting:

1. **In GoDaddy Hosting Control Panel:**
   - Go to **Web Hosting** → Your hosting plan
   - Look for **Domains** or **Addon Domains** section
   - Verify `tazsoftware.biz` is listed and connected

2. **If domain is NOT connected:**
   - You need to add it as the primary domain or as an addon domain
   - GoDaddy hosting should have an option to "Add Domain" or "Set Primary Domain"

## Step 3: Update DNS Records

### Correct DNS Configuration:

**A Record (for root domain):**
- **Name/Host:** `@` or blank
- **Type:** `A`
- **Value/Points to:** Your hosting IP address (get this from GoDaddy hosting settings)
- **TTL:** `600` or `1 hour`

**CNAME Record (for www subdomain):**
- **Name/Host:** `www`
- **Type:** `CNAME`
- **Value/Points to:** `tazsoftware.biz` (or your hosting domain)
- **TTL:** `600` or `1 hour`

### How to Get Your Hosting IP Address:

1. **In GoDaddy Hosting Control Panel:**
   - Go to **Settings** or **Account Details**
   - Look for **Server IP Address** or **Dedicated IP**
   - Copy this IP address

2. **Or check cPanel:**
   - In cPanel, look at the **Server Information** section
   - Find **Shared IP Address** or **Dedicated IP Address**

## Step 4: Common Issues and Solutions

### Issue 1: Domain Pointing to GoDaddy Parking

**Symptom:** Shows "This domain is parked" or GoDaddy default page

**Solution:**
- In DNS settings, remove any A records pointing to GoDaddy parking IPs
- Add A record pointing to your hosting IP address

### Issue 2: Domain Not Connected to Hosting

**Symptom:** Files in `public_html` but domain shows different site

**Solution:**
1. In hosting control panel, go to **Domains** section
2. Click **Add Domain** or **Set Primary Domain**
3. Enter `tazsoftware.biz`
4. Wait for DNS propagation (5-30 minutes)

### Issue 3: Wrong Directory Structure

**Symptom:** Domain works but shows old site

**Solution:**
- Verify files are in `public_html` (not a subdirectory)
- Check if hosting uses different directory (some use `www` or `httpdocs`)

### Issue 4: DNS Propagation Delay

**Symptom:** Changes made but still showing old site

**Solution:**
- Wait 5-30 minutes for DNS to propagate
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Use DNS checker: https://www.whatsmydns.net/#A/tazsoftware.biz

## Step 5: Verify Configuration

### Test DNS Resolution:

1. **Check current DNS:**
   - Visit: https://www.whatsmydns.net/#A/tazsoftware.biz
   - See what IP address the domain is pointing to
   - Compare with your hosting IP address

2. **Check hosting IP:**
   - In cPanel, check **Server Information**
   - Note the IP address
   - This should match the A record

### Test Direct IP Access:

1. **Get your hosting IP address** from cPanel
2. **Try accessing:** `http://[YOUR-IP-ADDRESS]`
3. **If this shows your new site**, DNS is the issue
4. **If this shows old site**, the files are in the wrong location

## Step 6: Contact GoDaddy Support

If none of the above works:

1. **Contact GoDaddy Support:**
   - Phone: Available in your GoDaddy account
   - Chat: Available in GoDaddy dashboard
   - Ask them to:
     - Verify domain is connected to hosting
     - Check DNS records are correct
     - Confirm which directory the domain is pointing to

2. **Provide them:**
   - Domain: `tazsoftware.biz`
   - Hosting account details
   - That you've uploaded files to `public_html`

## Quick Checklist

- [ ] DNS A record points to hosting IP (not GoDaddy parking)
- [ ] Domain is added/connected in hosting control panel
- [ ] Files are in `public_html` directory
- [ ] No conflicting `home.html` or other default files
- [ ] Waited 5-30 minutes for DNS propagation
- [ ] Cleared browser cache and DNS cache
- [ ] Verified hosting IP matches DNS A record

## Alternative: Use Subdomain for Testing

If main domain is taking too long:

1. **Create subdomain:** `www.tazsoftware.biz` or `app.tazsoftware.biz`
2. **Point it to same hosting**
3. **Test if subdomain shows your new site**
4. **If subdomain works**, main domain DNS needs updating
5. **If subdomain doesn't work**, hosting configuration issue
