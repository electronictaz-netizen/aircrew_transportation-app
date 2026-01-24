# Custom Domain Configuration Guide

## Overview

This guide explains how to configure your application to use only the custom domain (`onyxdispatch.us`) and hide the default Amplify URL (`main.d1wxo3x0z5r1oq.amplifyapp.com`) from end users.

## Current Status

- **Custom Domain**: `https://onyxdispatch.us` ✅
- **Default Amplify URL**: `https://main.d1wxo3x0z5r1oq.amplifyapp.com` ❌ (should be hidden)

## Configuration Steps

### 1. AWS Amplify Console - Custom Domain Setup

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to **App settings** → **Domain management**
4. Verify custom domain is configured:
   - Domain: `onyxdispatch.us`
   - Subdomain: `www.onyxdispatch.us` (optional)
   - SSL Certificate: Should be automatically provisioned

### 2. Hide Default Amplify URL (Recommended Methods)

#### Option A: Redirect Default URL to Custom Domain (Recommended)

**In AWS Amplify Console:**

1. Go to **App settings** → **Rewrites and redirects**
2. Add a redirect rule:
   ```
   Source: https://main.d1wxo3x0z5r1oq.amplifyapp.com/<*>
   Target: https://onyxdispatch.us/<*>
   Type: 301 (Permanent Redirect)
   Country code: (leave empty)
   ```

This will automatically redirect anyone accessing the Amplify URL to your custom domain.

#### Option B: Block Access to Default URL

**Note:** This is more complex and may break Amplify's internal services. Option A is recommended.

If you need to block access entirely:

1. Use AWS WAF (Web Application Firewall) to block requests to the Amplify URL
2. Or use CloudFront in front of Amplify with access restrictions

### 3. Update Code References

All hardcoded Amplify URLs have been updated to use:
- `window.location.origin` (when in browser)
- `https://onyxdispatch.us` (as fallback)
- Environment variable `VITE_APP_URL` (if set)

**Files Updated:**
- `src/utils/sendInvitationEmail.ts`
- `src/utils/invitationEmail.ts`
- `marketing-website/script.js`

### 4. Environment Variables (Optional)

You can set an environment variable for the app URL:

**In Amplify Console:**
1. Go to **App settings** → **Environment variables**
2. Add:
   - Key: `VITE_APP_URL`
   - Value: `https://onyxdispatch.us`

**In `.env` file (for local development):**
```
VITE_APP_URL=https://onyxdispatch.us
```

### 5. Update Marketing Website Links

The marketing website files need to be updated manually:

**Files to update:**
- `marketing-website/index.html`
- `marketing-website/subscription-guide.html`
- `marketing-website/terms-of-service.html`
- `marketing-website/privacy-policy.html`

**Search and replace:**
- Find: `https://main.d1wxo3x0z5r1oq.amplifyapp.com`
- Replace: `https://onyxdispatch.us`

### 6. CORS Configuration

Ensure all CORS settings use the custom domain:

#### Lambda Function URLs

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. For each function with a Function URL:
   - Click on **Configuration** → **Function URL**
   - Under **CORS**, set:
     - **Allow origins**: `https://onyxdispatch.us`
     - **NOT** `*` or the Amplify URL

#### AppSync API (if applicable)

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Select your API
3. Check CORS settings (if configured)
4. Ensure only `https://onyxdispatch.us` is allowed

### 7. Cognito OAuth Callback URLs

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Select User Pool: `us-east-1_9qfKiQtHV`
3. Go to **App integration** → **App client settings**
4. Under **Callback URLs**, ensure:
   - `https://onyxdispatch.us`
   - `https://onyxdispatch.us/*`
   - Remove any Amplify URL callbacks if present

### 8. Stripe Configuration (if using)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Settings** → **Webhooks**
3. Update webhook endpoints to use `https://onyxdispatch.us`
4. **Settings** → **Checkout settings**
5. Ensure redirect URLs use `https://onyxdispatch.us`

### 9. Email Links

All email links should use the custom domain. The code has been updated to use `window.location.origin` which will automatically use the correct domain.

### 10. SEO and Canonical URLs

Add canonical URL meta tags to prevent duplicate content:

**In your main HTML file:**
```html
<link rel="canonical" href="https://onyxdispatch.us" />
```

## Verification Checklist

- [ ] Custom domain is configured in Amplify Console
- [ ] Redirect rule is set up (Option A) or access is blocked (Option B)
- [ ] All code references updated (done automatically)
- [ ] Marketing website links updated
- [ ] CORS settings use custom domain only
- [ ] Cognito callback URLs use custom domain
- [ ] Stripe webhooks/redirects use custom domain
- [ ] Test: Accessing Amplify URL redirects to custom domain
- [ ] Test: All links in app use custom domain
- [ ] Test: Email links work with custom domain

## Testing

1. **Test Redirect:**
   - Visit: `https://main.d1wxo3x0z5r1oq.amplifyapp.com`
   - Should redirect to: `https://onyxdispatch.us`

2. **Test Custom Domain:**
   - Visit: `https://onyxdispatch.us`
   - Should load normally without redirects

3. **Test Email Links:**
   - Check invitation emails
   - Links should point to `https://onyxdispatch.us`

4. **Test CORS:**
   - Open browser console on `https://onyxdispatch.us`
   - Check for CORS errors
   - All API calls should succeed

## Troubleshooting

### Issue: Amplify URL Still Accessible

**Solution:** Ensure redirect rule is configured in Amplify Console (Step 2, Option A)

### Issue: CORS Errors on Custom Domain

**Solution:** Update CORS settings in Lambda Function URLs and AppSync to allow `https://onyxdispatch.us`

### Issue: Email Links Use Wrong Domain

**Solution:** The code uses `window.location.origin`, which should automatically use the correct domain. If issues persist, check environment variable `VITE_APP_URL`

### Issue: Marketing Website Still Shows Amplify URL

**Solution:** Manually update marketing website HTML files (Step 5)

## Security Considerations

1. **HTTPS Only:** Ensure SSL certificate is valid for custom domain
2. **HSTS:** Consider enabling HTTP Strict Transport Security
3. **Content Security Policy:** Update CSP headers to allow only custom domain
4. **OAuth Redirects:** Only allow custom domain in OAuth callback URLs

## Maintenance

- Periodically check that redirect rules are still active
- Monitor for any new code that might reference the Amplify URL
- Update documentation when adding new features that generate URLs

## Notes

- The default Amplify URL cannot be completely deleted (it's required by Amplify)
- The best approach is to redirect it to your custom domain
- All user-facing areas should only reference the custom domain
- Internal/development use of the Amplify URL is acceptable
