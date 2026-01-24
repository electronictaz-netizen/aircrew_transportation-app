# Fix CORS Duplicate Headers Error

## Problem

You're seeing this error:
```
The 'Access-Control-Allow-Origin' header contains multiple values '*, https://onyxdispatch.us', but only one is allowed.
```

This happens when the Lambda Function URL CORS configuration has multiple origins set, causing duplicate headers.

## Solution

### Step 1: Update Lambda Function URL CORS Configuration

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your function: `publicBooking-<environment>` (e.g., `publicBooking-main`)
3. Go to **Configuration** → **Function URL**
4. Click **Edit** on your existing Function URL
5. In the **CORS** section, update **Allow origins**:
   - **Option A (Recommended for production):** Use only `https://onyxdispatch.us`
   - **Option B (For development/testing):** Use only `*` (allows all origins)
   
   **⚠️ CRITICAL:** You must use ONLY ONE value. Do NOT enter both `*` and `https://onyxdispatch.us`.

6. Ensure other CORS settings are:
   - **Allow methods:** `GET, POST, OPTIONS`
   - **Allow headers:** `Content-Type`
   - **Expose headers:** (leave empty)
   - **Max age:** `3600`

7. Click **Save**

### Step 2: Verify the Fix

After saving:
1. Wait 1-2 minutes for changes to propagate
2. Try accessing the booking portal again
3. Check the browser console - the CORS error should be gone

### Step 3: If Still Having Issues

If you're still seeing the error:

1. **Check for multiple Function URLs:**
   - Make sure you only have ONE Function URL configured
   - Delete any duplicate Function URLs

2. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache completely

3. **Verify handler code:**
   - The handler should NOT set CORS headers (we removed them)
   - Only the Function URL should handle CORS

4. **Check CloudWatch Logs:**
   - Go to Lambda function → Monitor → View CloudWatch logs
   - Look for any errors that might indicate the issue

## Recommended Configuration

For production use with `onyxdispatch.us`:

```
Allow origins: https://onyxdispatch.us
Allow methods: GET, POST, OPTIONS
Allow headers: Content-Type
Expose headers: (empty)
Max age: 3600
```

## Why This Happens

Lambda Function URLs automatically add CORS headers based on your configuration. If the configuration has multiple origins (like both `*` and a specific domain), it tries to add both, causing duplicate headers which browsers reject.

The handler code has been updated to NOT set CORS headers, so only the Function URL configuration should handle CORS.
