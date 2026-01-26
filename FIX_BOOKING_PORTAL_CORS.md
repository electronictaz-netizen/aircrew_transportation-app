# Fix Booking Portal CORS Error

## The Error

```
Access to fetch at 'https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/' 
from origin 'https://onyxdispatch.us' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Also seeing:** `403 Forbidden`

## Root Cause

The Lambda Function URL for `publicBooking` doesn't have CORS configured, or the CORS configuration doesn't include `https://onyxdispatch.us` as an allowed origin.

## Solution: Configure CORS in Lambda Function URL

### Step 1: Find the Correct Lambda Function

1. Go to **AWS Lambda** → **Functions**
2. Find the **main branch** `publicBooking` function:
   - Look for: `amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte91bm6`
   - Or search for: `publicBooking` and filter by "ma-" (main branch)
3. Click on the function

### Step 2: Open Function URL Configuration

1. In the Lambda function → **Configuration** tab
2. Click **Function URL** in the left sidebar
3. You should see your Function URL: `https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/`
4. Click **Edit** button

### Step 3: Configure CORS Settings

**Auth type:** Should be `NONE` (for public access)

**CORS section:**
1. **Enable CORS** (check the box or toggle)

2. **Allow origins:**
   ```
   https://onyxdispatch.us
   ```
   ⚠️ **Important:**
   - Use exactly `https://onyxdispatch.us` (no trailing slash)
   - If you have multiple domains, add them on separate lines:
     ```
     https://onyxdispatch.us
     https://www.onyxdispatch.us
     https://app.onyxdispatch.us
     ```
   - **Do NOT use `*`** (wildcard) unless you want to allow all origins (less secure)

3. **Allow methods:**
   ```
   POST, GET
   ```
   (OPTIONS is handled automatically by Lambda Function URLs)

4. **Allow headers:**
   ```
   Content-Type
   ```
   ⚠️ **Critical:** Type exactly `Content-Type` (capital C, capital T, hyphen)
   - Case-sensitive
   - Must be exactly as shown

5. **Expose headers:**
   (Leave empty)

6. **Max age:**
   ```
   86400
   ```
   (24 hours in seconds)

### Step 4: Save and Verify

1. Click **Save** at the bottom
2. Wait 10-30 seconds for changes to propagate
3. Test the booking portal again

### Step 5: Test

1. Open your booking portal: `https://onyxdispatch.us/booking/GLS`
2. Open browser DevTools → **Console**
3. The CORS error should be gone
4. Check **Network** tab - the request should succeed (200 status)

## If You Still Get 403 Forbidden

A 403 error can mean:

1. **CORS is configured but origin doesn't match:**
   - Double-check the allowed origin is exactly `https://onyxdispatch.us`
   - Check for typos or extra spaces

2. **Function URL auth type is wrong:**
   - Should be `NONE` for public access
   - If it's `AWS_IAM`, change it to `NONE`

3. **Lambda function has an error:**
   - Check CloudWatch logs for the function
   - Look for errors in the handler code

## Verify CORS is Working

### Test with curl:

```bash
curl -X OPTIONS https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/ \
  -H "Origin: https://onyxdispatch.us" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected response headers:**
```
Access-Control-Allow-Origin: https://onyxdispatch.us
Access-Control-Allow-Methods: POST, GET
Access-Control-Allow-Headers: Content-Type
```

### Test actual request:

```bash
curl -X POST https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/ \
  -H "Origin: https://onyxdispatch.us" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCompany","code":"GLS"}' \
  -v
```

**Expected:** 200 status with company data, and `Access-Control-Allow-Origin: https://onyxdispatch.us` header

## Common Issues

### Issue: CORS still not working after configuration

**Possible causes:**
1. Changes haven't propagated (wait 30 seconds)
2. Browser cache (hard refresh: Ctrl+Shift+R)
3. Wrong origin in allowed list (check for typos)
4. Multiple Function URLs (delete duplicates)

**Fix:**
1. Wait 1 minute and try again
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Double-check the allowed origin matches exactly
4. Verify you're editing the correct Function URL

### Issue: 403 Forbidden persists

**Check:**
1. Function URL auth type is `NONE`
2. Lambda function code doesn't have errors (check CloudWatch logs)
3. IAM permissions are correct (should be fine if function works)

### Issue: Multiple Function URLs

If you see multiple Function URLs for the same function:
1. Delete all but one
2. Use the one from the main branch function
3. Update `VITE_BOOKING_API_URL` in Amplify environment variables

## After Fixing CORS

Once CORS is configured correctly:

1. ✅ Booking portal should load without CORS errors
2. ✅ Company lookup should work
3. ✅ Booking submission should work
4. ✅ No 403 errors

## Quick Checklist

- [ ] Found the correct Lambda function (main branch, `ma-publicBooking`)
- [ ] Opened Function URL configuration
- [ ] Enabled CORS
- [ ] Added `https://onyxdispatch.us` to allowed origins
- [ ] Set allowed methods to `POST, GET`
- [ ] Set allowed headers to `Content-Type`
- [ ] Saved changes
- [ ] Waited 30 seconds
- [ ] Tested booking portal
- [ ] Verified no CORS errors in console

## Next Steps

After fixing CORS:

1. Test the booking portal with different booking codes
2. Verify booking requests can be created
3. Check that the booking portal loads company information correctly
4. Update `VITE_BOOKING_API_URL` if the Function URL changed
