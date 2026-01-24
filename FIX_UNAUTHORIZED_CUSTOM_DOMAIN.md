# Fix 401 Unauthorized on Custom Domain (onyxdispatch.us)

## Problem

Getting 401 Unauthorized errors when signing into `onyxdispatch.us/admin` with `support@tazsoftware.biz`, even though it works on the Amplify URL.

## Root Cause

The custom domain needs to be configured in:
1. **Cognito User Pool** - Callback URLs must include the custom domain
2. **AppSync API** - Authorization must be configured correctly
3. **Browser** - Cookies/tokens might be domain-specific

## Solution Steps

### Step 1: Update Cognito Callback URLs (CRITICAL)

This is the most common cause of authentication failures on custom domains.

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Click on **"User pools"**
3. Find and click on User Pool: **`us-east-1_9qfKiQtHV`**
4. Go to **"App integration"** tab
5. Find App client: **`14jfd7uoubk1ipsooe1349c5lk`**
6. Click **"Edit"**
7. Scroll to **"Hosted UI"** section (if using) or **"Allowed callback URLs"**
8. Under **"Allowed callback URLs"**, add:
   ```
   https://onyxdispatch.us
   https://onyxdispatch.us/
   https://onyxdispatch.us/*
   ```
9. Under **"Allowed sign-out URLs"**, add:
   ```
   https://onyxdispatch.us
   https://onyxdispatch.us/
   ```
10. Click **"Save changes"**

**Important:** Make sure BOTH the Amplify URL and custom domain are listed:
- `https://main.d1wxo3x0z5r1oq.amplifyapp.com`
- `https://onyxdispatch.us`

### Step 2: Verify AppSync API Authorization

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find API: **`klp7rzjva5c2bef2zjaygpod44`**
3. Click **"Settings"** → Scroll to **"Authorization"**
4. Verify:
   - **Default authorization mode**: "Amazon Cognito User Pool"
   - **User Pool ID**: `us-east-1_9qfKiQtHV`
5. If not configured, follow steps in `VERIFY_APPSYNC_COGNITO_AUTH.md`

### Step 3: Clear Browser Data

Authentication tokens might be cached for the wrong domain.

1. **Sign out** of the application
2. **Clear browser cache and cookies** for both domains:
   - `onyxdispatch.us`
   - `main.d1wxo3x0z5r1oq.amplifyapp.com`
3. **Close all browser tabs** with the app
4. **Open a new tab** and go to `https://onyxdispatch.us`
5. **Sign in** again with `support@tazsoftware.biz`

### Step 4: Check Browser Console

Open browser console (F12) and look for:

1. **Authentication errors:**
   ```
   ❌ Unauthorized
   ❌ Token expired
   ❌ Invalid token
   ```

2. **CORS errors:**
   ```
   Access-Control-Allow-Origin
   CORS policy
   ```

3. **Network tab:**
   - Check GraphQL requests
   - Look at request headers
   - Verify `authorization` header is present

### Step 5: Verify Token is Being Sent

In browser console, run:

```javascript
// Check if user is authenticated
import('aws-amplify/auth').then(async (auth) => {
  try {
    const user = await auth.getCurrentUser();
    const session = await auth.fetchAuthSession();
    console.log('User:', user);
    console.log('Session:', session);
    console.log('Tokens:', {
      idToken: session.tokens?.idToken ? 'Present' : 'Missing',
      accessToken: session.tokens?.accessToken ? 'Present' : 'Missing',
    });
  } catch (error) {
    console.error('Auth error:', error);
  }
});
```

### Step 6: Test Authentication Flow

1. Go to `https://onyxdispatch.us`
2. Open browser console (F12)
3. Try to sign in
4. Watch for:
   - Redirect to Cognito hosted UI (if configured)
   - Callback URL after sign-in
   - Token storage

## Common Issues

### Issue 1: Callback URL Mismatch

**Symptom:** Sign-in redirects fail or loop

**Fix:** Ensure Cognito callback URLs include `https://onyxdispatch.us`

### Issue 2: Token Not Persisting

**Symptom:** Signed in but immediately signed out

**Fix:** 
- Check browser cookie settings
- Ensure cookies are allowed for `onyxdispatch.us`
- Check if third-party cookies are blocked

### Issue 3: CORS Errors

**Symptom:** API calls fail with CORS errors

**Fix:**
- Update Lambda Function URL CORS to allow `https://onyxdispatch.us`
- Check AppSync CORS settings (if configured)

### Issue 4: Domain-Specific Cookies

**Symptom:** Works on Amplify URL but not custom domain

**Fix:**
- Clear cookies for both domains
- Sign in fresh on custom domain
- Cognito tokens are domain-specific

## Verification Checklist

- [ ] Cognito callback URLs include `https://onyxdispatch.us`
- [ ] Cognito sign-out URLs include `https://onyxdispatch.us`
- [ ] AppSync API has Cognito User Pool as default auth mode
- [ ] Browser cache cleared for both domains
- [ ] Signed out and signed back in on custom domain
- [ ] Browser console shows no authentication errors
- [ ] Network tab shows `authorization` header in GraphQL requests
- [ ] Tokens are present in session (check with console command)

## Still Not Working?

If you've completed all steps and still get 401 errors:

1. **Check CloudWatch Logs:**
   - AppSync API logs
   - Cognito logs
   - Look for authentication failures

2. **Verify User Pool Configuration:**
   - User account is confirmed
   - User account is not disabled
   - Email is verified (if required)

3. **Test with Different Browser:**
   - Try incognito/private mode
   - Try different browser
   - Rules out browser-specific issues

4. **Check Network Tab:**
   - Look at actual request/response
   - Check status codes
   - Verify headers

5. **Contact AWS Support:**
   - If AppSync API configuration seems correct
   - If Cognito is configured correctly
   - But still getting 401 errors

## Quick Test

After making changes:

1. **Sign out** completely
2. **Clear all browser data** for `onyxdispatch.us`
3. **Go to:** `https://onyxdispatch.us/admin`
4. **Sign in** with `support@tazsoftware.biz`
5. **Check browser console** for errors
6. **Try to load companies** or use "Restore GLS Access"

## Prevention

To prevent this in the future:

1. **Always add custom domain** to Cognito callback URLs when setting up
2. **Test on custom domain** after deployment
3. **Monitor CloudWatch logs** for authentication failures
4. **Document callback URLs** in your configuration
