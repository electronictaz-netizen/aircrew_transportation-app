# SSL Certificate Setup for tazsoftware.biz

## Issue: SSL Certificate Error After DNS Update

You're seeing "Your connection is not private" because the domain is now correctly pointing to your hosting, but the SSL certificate needs to be installed/configured.

## Step 1: Install SSL Certificate in GoDaddy

### Option A: Free SSL via cPanel (Recommended)

1. **Log into cPanel**
   - Go to your GoDaddy hosting control panel
   - Open **cPanel**

2. **Find SSL/TLS Section**
   - Look for **SSL/TLS Status** or **SSL/TLS Manager**
   - Click on it

3. **Install AutoSSL (Free)**
   - Look for **AutoSSL** or **Let's Encrypt** option
   - Select your domain: `tazsoftware.biz`
   - Click **Run AutoSSL** or **Install**
   - Wait 5-10 minutes for certificate to be issued

4. **Verify Installation**
   - After installation, wait 5-10 minutes
   - Visit: `https://tazsoftware.biz`
   - Should now work with SSL

### Option B: GoDaddy SSL Certificate

If you have a GoDaddy SSL certificate:

1. **In cPanel → SSL/TLS Manager**
2. **Click "Manage SSL Sites"**
3. **Select domain:** `tazsoftware.biz`
4. **Paste your certificate details:**
   - Certificate (CRT)
   - Private Key (KEY)
   - Certificate Authority Bundle (CABUNDLE)
5. **Click "Install Certificate"**

## Step 2: Force HTTPS Redirect

After SSL is installed, set up automatic HTTPS redirect:

1. **In cPanel → File Manager**
2. **Go to `public_html` directory**
3. **Create or edit `.htaccess` file:**
   - If it doesn't exist, create a new file named `.htaccess`
   - Add this code:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```
4. **Save the file**

This will automatically redirect all HTTP traffic to HTTPS.

## Step 3: Wait for Propagation

- SSL certificate installation: 5-10 minutes
- DNS propagation: 5-30 minutes
- **Total wait time:** Up to 30 minutes

## Temporary Workaround (Testing Only)

While waiting for SSL:

1. **Test with HTTP (not secure):**
   - Visit: `http://tazsoftware.biz` (without 's')
   - This should show your site (but browser will warn it's not secure)
   - **Only use this to verify the site is working**

2. **Chrome will show "Not Secure" warning**
   - This is expected until SSL is installed
   - Don't enter sensitive information on HTTP

## Step 4: Verify SSL is Working

After SSL installation:

1. **Visit:** `https://tazsoftware.biz`
2. **Check for padlock icon** in browser address bar
3. **Click padlock** → Should show "Connection is secure"
4. **Test all pages:**
   - `https://tazsoftware.biz`
   - `https://tazsoftware.biz/index.html`

## Common Issues

### Issue 1: AutoSSL Not Available

**Solution:**
- Some GoDaddy plans don't include free SSL
- You may need to purchase an SSL certificate
- Or upgrade to a plan that includes SSL

### Issue 2: Certificate Not Installing

**Solution:**
- Ensure DNS is fully propagated (check with https://www.whatsmydns.net)
- Wait 10-15 minutes and try again
- Contact GoDaddy support if it still fails

### Issue 3: Mixed Content Warnings

**Solution:**
- Ensure all links in your HTML use `https://`
- Check `index.html` for any `http://` links
- Update them to `https://`

### Issue 4: Certificate for Wrong Domain

**Solution:**
- Remove old certificate
- Install new certificate for `tazsoftware.biz`
- Wait for propagation

## Quick Checklist

- [ ] DNS A record updated and propagated
- [ ] SSL certificate installed in cPanel
- [ ] Waited 5-10 minutes after SSL installation
- [ ] `.htaccess` file created for HTTPS redirect
- [ ] Tested `https://tazsoftware.biz` (with padlock)
- [ ] All links in HTML use `https://`

## Contact GoDaddy Support

If SSL installation fails:

1. **Contact GoDaddy Support**
2. **Tell them:**
   - Domain: `tazsoftware.biz`
   - You need SSL certificate installed
   - You've updated DNS and files are in `public_html`
3. **They can:**
   - Install SSL certificate for you
   - Verify hosting configuration
   - Troubleshoot any issues

## Expected Timeline

- **DNS Update:** 5-30 minutes
- **SSL Installation:** 5-10 minutes
- **Full Setup:** 30-60 minutes total

After SSL is installed, your site will be fully secure and accessible at `https://tazsoftware.biz`!
