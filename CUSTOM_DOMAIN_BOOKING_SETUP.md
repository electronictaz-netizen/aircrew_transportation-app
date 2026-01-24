# Custom Domain Setup for Booking Portal

## Overview

The booking portal can use your custom domain (e.g., `onyxdispatch.us`) instead of the default Amplify URL. This provides a more professional appearance and better branding.

## Configuration

### Step 1: Set Environment Variable

Add the `VITE_BOOKING_DOMAIN` environment variable in AWS Amplify Console:

1. Go to **Amplify Console** → Your App → **Environment variables**
2. Select your branch (`main` for production, `dev` for staging)
3. Add new variable:
   - **Key:** `VITE_BOOKING_DOMAIN`
   - **Value:** `onyxdispatch.us` (or `https://onyxdispatch.us`)

### Step 2: Configure Custom Domain in Amplify

If you haven't already set up your custom domain:

1. Go to **Amplify Console** → Your App → **Domain Management**
2. Click **Add domain**
3. Enter: `onyxdispatch.us`
4. Follow the DNS verification steps
5. Wait for SSL certificate provisioning (5-30 minutes)

### Step 3: Verify DNS Configuration

Ensure your DNS is configured correctly:

**Option A: Root Domain**
```
Type: A or CNAME
Name: @ (or onyxdispatch.us)
Value: [Amplify CloudFront distribution]
```

**Option B: Subdomain (if using subdomain)**
```
Type: A or CNAME
Name: www (or your subdomain)
Value: [Amplify CloudFront distribution]
```

## How It Works

### Without Custom Domain (Default)
- Booking URLs use current origin: `https://main.xxxxx.amplifyapp.com/booking/ACME123`
- Works automatically, no configuration needed

### With Custom Domain
- Booking URLs use your domain: `https://onyxdispatch.us/booking/ACME123`
- Requires `VITE_BOOKING_DOMAIN` environment variable
- Falls back to current origin if not set

## Environment Variable Format

You can set the domain in two ways:

**Option 1: Domain only (recommended)**
```
VITE_BOOKING_DOMAIN=onyxdispatch.us
```
The system will automatically add `https://`

**Option 2: Full URL**
```
VITE_BOOKING_DOMAIN=https://onyxdispatch.us
```
Use this if you need to specify the protocol explicitly

## Testing

After setting the environment variable:

1. **Redeploy your app** (Amplify will automatically redeploy when env vars change)
2. **Go to Company Management** → Booking Portal Settings
3. **Verify the booking URL** shows: `https://onyxdispatch.us/booking/YOURCODE`
4. **Test the booking portal** by visiting the URL

## Important Notes

1. **DNS Propagation:** DNS changes can take 24-48 hours to propagate globally
2. **SSL Certificate:** Amplify automatically provisions SSL certificates for custom domains
3. **Both Formats Work:** The booking portal will work with both your custom domain and the Amplify URL
4. **Fallback:** If `VITE_BOOKING_DOMAIN` is not set, it uses the current origin (works for both dev and production)

## Troubleshooting

### Booking URL Still Shows Amplify Domain
- Verify `VITE_BOOKING_DOMAIN` is set in Amplify Console
- Check that you selected the correct branch
- Redeploy the app after setting the variable
- Clear browser cache

### Custom Domain Not Resolving
- Check DNS configuration in your domain registrar
- Verify DNS records point to Amplify CloudFront
- Wait for DNS propagation (can take up to 48 hours)
- Use `dig onyxdispatch.us` or `nslookup onyxdispatch.us` to check DNS

### SSL Certificate Issues
- Check Amplify Console → Domain Management for certificate status
- Ensure DNS verification is complete
- Wait for certificate provisioning (5-30 minutes)

## Example Configuration

### Production (main branch)
```
VITE_BOOKING_DOMAIN=onyxdispatch.us
```

### Staging (dev branch)
```
VITE_BOOKING_DOMAIN=onyxdispatch.us
```
(Can use same domain or a subdomain like `dev.onyxdispatch.us`)

## Benefits

✅ **Professional Appearance:** Customers see your branded domain
✅ **Better SEO:** Custom domain improves search engine rankings
✅ **Brand Consistency:** Matches your company's website domain
✅ **Easier to Share:** Simpler, more memorable URLs
✅ **Trust:** Customers trust custom domains more than generic Amplify URLs
