# Fix CORS Error: Content-Type Not Allowed

## The Error
```
Access to fetch at 'https://...lambda-url...' from origin '...' has been blocked by CORS policy: 
Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response.
```

## Important Note

**Lambda Function URLs automatically add CORS headers** when CORS is configured in the AWS Console. The handler code should NOT include CORS headers, as this causes duplicate header errors.

## The Fix (AWS Lambda Console)

### Step 1: Open Function URL Settings
1. Go to **AWS Lambda Console**: https://console.aws.amazon.com/lambda/
2. Find your function: `stripeCheckout` (search for it or look for the function with your Function URL)
3. Click on the function name
4. Go to **Configuration** tab
5. Click **Function URL** in the left sidebar

### Step 2: Edit CORS Configuration
1. Click **Edit** button
2. Scroll down to **CORS** section
3. Configure these settings:

   **Allow origins:**
   ```
   https://main.d1wxo3x0z5r1oq.amplifyapp.com
   https://www.onyxdispatch.us
   https://onyxdispatch.us
   https://app.onyxdispatch.us
   ```
   ⚠️ **IMPORTANT**: 
   - Use specific domains (recommended for security) OR `*` (allows all)
   - Do NOT use both `*` and specific domains together
   - If you have multiple domains, list them all (as shown above)
   - The handler code should NOT send CORS headers (Lambda Function URLs handle this automatically)

   **Allow methods:**
   ```
   POST, GET
   ```
   (OPTIONS is handled automatically - you don't need to add it)

   **Allow headers:**
   ```
   Content-Type
   ```
   ⚠️ **CRITICAL**: Type `Content-Type` exactly as shown (capital C, capital T, hyphen)
   - This is case-sensitive
   - Must be exactly `Content-Type`
   - Don't add extra spaces

   **Expose headers:**
   (Leave empty)

   **Max age:**
   ```
   86400
   ```

### Step 3: Save
1. Click **Save** at the bottom of the page
2. Wait 10-30 seconds for changes to propagate

### Step 4: Test
1. Go back to your app
2. Try upgrading a subscription again
3. Check browser console - the CORS error should be gone

## Troubleshooting

### Still Getting CORS Error?

1. **Double-check Allow headers:**
   - Make sure `Content-Type` is typed exactly (no typos)
   - Try typing it manually instead of copy-paste
   - Make sure there are no extra spaces before/after

2. **Verify it saved:**
   - After clicking Save, refresh the page
   - Check that `Content-Type` is still in Allow headers

3. **Wait longer:**
   - CORS changes can take 30-60 seconds to propagate
   - Try again after waiting

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use incognito/private browsing mode

5. **Check both functions:**
   - Do the same for `stripePortal` function if you're using it
   - Both need CORS configured

## Alternative: Allow All Headers (Less Secure)

If you're still having issues, you can temporarily allow all headers:

**Allow headers:**
```
*
```

This is less secure but will work. You can tighten it later once everything is working.

## Verify CORS is Working

After configuring, test with curl:

```bash
curl -X OPTIONS https://your-function-url.lambda-url.us-east-1.on.aws \
  -H "Origin: https://main.d1wxo3x0z5r1oq.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

You should see CORS headers in the response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET
Access-Control-Allow-Headers: Content-Type
```

## Still Need Help?

If it's still not working after following these steps:
1. Check CloudWatch logs for the function
2. Verify the Function URL is active and accessible
3. Make sure you're editing the correct function (the one matching your Function URL)
