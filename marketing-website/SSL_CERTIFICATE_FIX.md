# Fixing SSL Certificate Error (ERR_CERT_AUTHORITY_INVALID)

## Issue: SSL Certificate Installed But Still Getting Error

The error `NET::ERR_CERT_AUTHORITY_INVALID` with HSTS means Chrome is rejecting the certificate. This usually happens when:

1. Certificate hasn't fully propagated yet
2. Certificate is for wrong domain
3. Certificate chain is incomplete
4. Browser cache is showing old certificate

## Step 1: Wait and Retry

**AutoSSL certificates can take 10-30 minutes to fully activate:**

1. **Wait 15-30 minutes** after installation
2. **Clear browser cache completely:**
   - Chrome: `Ctrl+Shift+Delete` → Clear browsing data → All time
   - Or use Incognito mode: `Ctrl+Shift+N`
3. **Try again:** `https://tazsoftware.biz`

## Step 2: Verify Certificate in cPanel

1. **Go to cPanel → SSL/TLS Status**
2. **Check certificate status for `tazsoftware.biz`:**
   - Should show "Active" or "Valid"
   - Check expiration date (should be future date)
   - Verify it's for the correct domain

3. **If certificate shows as invalid:**
   - Delete the certificate
   - Re-run AutoSSL
   - Wait 15-30 minutes

## Step 3: Clear HSTS Cache in Chrome

**HSTS (HTTP Strict Transport Security) is forcing HTTPS but certificate is invalid:**

### Method 1: Clear HSTS for Domain

1. **In Chrome, type in address bar:**
   ```
   chrome://net-internals/#hsts
   ```

2. **Scroll down to "Delete domain security policies"**

3. **Enter:** `tazsoftware.biz`

4. **Click "Delete"**

5. **Close and reopen Chrome**

6. **Try:** `https://tazsoftware.biz` again

### Method 2: Use Incognito Mode

1. **Open Chrome Incognito:** `Ctrl+Shift+N`
2. **Visit:** `https://tazsoftware.biz`
3. **If it works in Incognito**, it's a cache issue

## Step 4: Check Certificate Details

1. **In Chrome, click the padlock icon** (even if it shows error)
2. **Click "Certificate" or "Connection is not secure"**
3. **Check:**
   - **Issued to:** Should be `tazsoftware.biz`
   - **Issued by:** Should be a valid CA (Let's Encrypt, GoDaddy, etc.)
   - **Valid from/to:** Should include today's date

4. **If certificate is for wrong domain:**
   - Delete certificate in cPanel
   - Re-install AutoSSL
   - Wait 15-30 minutes

## Step 5: Force Certificate Regeneration

If certificate is still invalid after waiting:

1. **In cPanel → SSL/TLS Status**
2. **Find `tazsoftware.biz` certificate**
3. **Delete it** (if option available)
4. **Go to AutoSSL**
5. **Re-run AutoSSL for `tazsoftware.biz`**
6. **Wait 15-30 minutes**
7. **Clear browser cache and HSTS**
8. **Test again**

## Step 6: Check for Certificate Chain Issues

Sometimes the certificate is valid but the chain is incomplete:

1. **In cPanel → SSL/TLS Manager**
2. **Click "Manage SSL Sites"**
3. **Select `tazsoftware.biz`**
4. **Verify all fields are filled:**
   - Certificate (CRT)
   - Private Key (KEY)
   - Certificate Authority Bundle (CABUNDLE) - **This is important!**

5. **If CABUNDLE is missing:**
   - AutoSSL should include it automatically
   - If not, you may need to manually add the chain

## Step 7: Test with Different Browser

1. **Try Firefox or Edge:**
   - Visit: `https://tazsoftware.biz`
   - If it works in other browsers, it's a Chrome-specific issue
   - Clear Chrome cache and HSTS as above

## Step 8: Check DNS Propagation

1. **Verify DNS is fully propagated:**
   - Visit: https://www.whatsmydns.net/#A/tazsoftware.biz
   - All locations should show same IP

2. **If DNS is still propagating:**
   - Wait for full propagation (up to 48 hours)
   - SSL certificate needs stable DNS

## Step 9: Contact GoDaddy Support

If none of the above works:

1. **Contact GoDaddy Support**
2. **Tell them:**
   - Domain: `tazsoftware.biz`
   - Error: `NET::ERR_CERT_AUTHORITY_INVALID`
   - AutoSSL was installed but certificate is invalid
   - You've cleared browser cache and HSTS

3. **They can:**
   - Verify certificate installation
   - Check certificate chain
   - Re-issue certificate if needed
   - Troubleshoot hosting configuration

## Quick Fix Checklist

- [ ] Waited 15-30 minutes after AutoSSL installation
- [ ] Cleared browser cache completely
- [ ] Cleared HSTS for domain in Chrome
- [ ] Verified certificate is active in cPanel
- [ ] Checked certificate is for correct domain
- [ ] Tested in Incognito mode
- [ ] Tested in different browser
- [ ] Verified DNS is fully propagated

## Temporary Workaround

While fixing SSL, you can test the site with HTTP:

1. **Visit:** `http://tazsoftware.biz` (without 's')
2. **Browser will show "Not Secure"** - this is expected
3. **Site should load** - confirms files are working
4. **Once SSL is fixed**, HTTPS will work

## Most Common Solution

**90% of the time, this fixes it:**

1. **Clear HSTS in Chrome:** `chrome://net-internals/#hsts` → Delete `tazsoftware.biz`
2. **Wait 15-30 minutes** after AutoSSL installation
3. **Use Incognito mode** to test
4. **If still not working**, regenerate certificate in cPanel

The certificate is likely valid but Chrome's HSTS cache is blocking it. Clearing HSTS usually resolves this.
