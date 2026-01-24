# CORS Troubleshooting for Lambda Function URL

## Current Issue

The CORS error persists even after adding CORS headers to the handler. This usually means the Function URL CORS settings need to be configured in the AWS Console.

## Solution: Enable CORS in Lambda Function URL Settings

The Lambda handler code includes CORS headers, but you also need to enable CORS in the Function URL configuration:

### Step 1: Enable CORS in AWS Lambda Console

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your `sendInvitationEmail` function
3. Go to **Configuration** tab → **Function URL**
4. Click **Edit** on your Function URL
5. Under **CORS settings**, enable:
   - **Allow credentials**: No (unless you need cookies/auth headers)
   - **Allowed origins**: `https://main.d1wxo3x0z5r1oq.amplifyapp.com` (or `*` for all origins)
   - **Allowed methods**: `POST, OPTIONS`
   - **Allowed headers**: `Content-Type`
   - **Exposed headers**: (leave empty or add if needed)
   - **Max age**: `86400` (24 hours)
6. Click **Save**

### Step 2: Verify Handler Returns CORS Headers

The handler code should already include CORS headers. After enabling CORS in the Console, the preflight OPTIONS request should be handled automatically by AWS, and your handler will return CORS headers in the actual POST response.

### Step 3: Test Again

After enabling CORS in the Console:
1. Wait a few seconds for the changes to propagate
2. Try sending an invitation email again
3. Check the browser console - the CORS error should be gone

## Alternative: If CORS Still Doesn't Work

If CORS still fails after enabling it in the Console, you can try:

1. **Check the exact origin**: Make sure the allowed origin matches exactly (including `https://` and no trailing slash)
2. **Use wildcard temporarily**: Set allowed origins to `*` to test if it's an origin matching issue
3. **Check CloudWatch Logs**: Look at the Lambda function logs to see if OPTIONS requests are being received
4. **Verify Function URL is public**: Make sure the Function URL auth type is set to `NONE`

## Expected Behavior

Once CORS is properly configured:
- Browser sends OPTIONS preflight → AWS handles it automatically (if CORS enabled in Console)
- Browser sends POST request → Lambda handler returns response with CORS headers
- Browser allows the response → Email is sent via Postmark

## Quick Test

You can test the Function URL directly with curl:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://k3fu2mif2d4bnqsig4jrnifkey0zyleo.lambda-url.us-east-1.on.aws/ \
  -H "Origin: https://main.d1wxo3x0z5r1oq.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test POST
curl -X POST https://k3fu2mif2d4bnqsig4jrnifkey0zyleo.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://main.d1wxo3x0z5r1oq.amplifyapp.com" \
  -d '{"to":"test@onyxdispatch.us","companyName":"Test","role":"manager","signupUrl":"https://onyxdispatch.us"}' \
  -v
```

Look for `Access-Control-Allow-Origin` in the response headers.
