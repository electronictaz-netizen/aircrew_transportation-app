# Customer Portal Function URL Setup Guide

This guide provides step-by-step instructions for setting up the Customer Portal Lambda Function URL and configuring access code delivery via email/SMS.

---

## Overview

The Customer Portal requires:
1. **Function URL** for the `customerPortal` Lambda function (public access)
2. **Function URLs** for email and SMS services (for access code delivery)
3. **Environment variables** configured in AWS Amplify Console
4. **Frontend API URL** configured in your application

---

## Prerequisites

- ✅ Customer Portal code deployed to AWS Amplify
- ✅ Email service configured (`sendBookingEmail` Lambda)
- ✅ SMS service configured (`sendTelnyxSms` or `sendSms` Lambda)
- ✅ Access to AWS Lambda Console
- ✅ Access to AWS Amplify Console

---

## Step 1: Create Customer Portal Function URL

### Method 1: AWS Lambda Console (Recommended)

1. **Navigate to AWS Lambda Console**
   - Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
   - Select your AWS region (e.g., `us-east-1`)

2. **Find the Customer Portal Function**
   - Search for function name containing: `customerPortal`
   - Function name format: `[app-id]-[branch]-customerPortal-[hash]`
   - Example: `d1wxo3x0z5r1oq-main-branch-customerPortal-abc123`

3. **Create Function URL**
   - Click on the function
   - Go to **Configuration** tab
   - Click **Function URL** in the left sidebar
   - Click **Create function URL**

4. **Configure Function URL Settings**
   - **Auth type:** `NONE` (public access required)
   - **CORS:**
     - ✅ Enable CORS
     - **Allow origins:** `*` (or your specific domain: `https://onyxdispatch.us`)
     - **Allow methods:** `POST, OPTIONS`
     - **Allow headers:** `Content-Type`
     - **Expose headers:** (leave empty)
     - **Max age:** `86400` (24 hours)

5. **Create and Copy URL**
   - Click **Save**
   - Copy the **Function URL** (format: `https://[function-id].lambda-url.[region].on.aws/`)
   - Example: `https://abc123def456.lambda-url.us-east-1.on.aws/`

### Method 2: AWS CLI

```bash
# Get function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'customerPortal')].FunctionName" --output text

# Create Function URL
aws lambda create-function-url-config \
  --function-name [YOUR_FUNCTION_NAME] \
  --auth-type NONE \
  --cors '{"AllowOrigins": ["*"], "AllowMethods": ["POST", "OPTIONS"], "AllowHeaders": ["Content-Type"], "MaxAge": 86400}'

# Get Function URL
aws lambda get-function-url-config \
  --function-name [YOUR_FUNCTION_NAME]
```

---

## Step 2: Get Email Function URL

### For `sendBookingEmail` Function

1. **Find the Email Function**
   - In AWS Lambda Console, search for: `sendBookingEmail`
   - Function name: `[app-id]-[branch]-sendBookingEmail-[hash]`

2. **Get Function URL**
   - If Function URL doesn't exist, create it (same steps as above)
   - Copy the Function URL
   - Example: `https://xyz789ghi012.lambda-url.us-east-1.on.aws/`

**Note:** If you don't have a Function URL for `sendBookingEmail`, you can create one following the same steps as Step 1.

---

## Step 3: Get SMS Function URL

### Option A: Telnyx SMS (Recommended if configured)

1. **Find the Telnyx SMS Function**
   - Search for: `sendTelnyxSms`
   - Function name: `[app-id]-[branch]-sendTelnyxSms-[hash]`

2. **Get Function URL**
   - If Function URL doesn't exist, create it
   - Copy the Function URL

### Option B: AWS SMS (Fallback)

1. **Find the AWS SMS Function**
   - Search for: `sendSms`
   - Function name: `[app-id]-[branch]-sendSms-[hash]`

2. **Get Function URL**
   - If Function URL doesn't exist, create it
   - Copy the Function URL

**Note:** The Customer Portal will use Telnyx SMS if available, otherwise fall back to AWS SMS.

---

## Step 4: Configure Environment Variables

### In AWS Amplify Console

1. **Navigate to Amplify Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Select your app
   - Select your branch (e.g., `main`)

2. **Go to Environment Variables**
   - Click **App settings** → **Environment variables**

3. **Add Required Variables**

   Add these environment variables:

   ```
   CUSTOMER_PORTAL_FUNCTION_URL=https://[your-function-id].lambda-url.[region].on.aws/
   SEND_BOOKING_EMAIL_FUNCTION_URL=https://[your-email-function-id].lambda-url.[region].on.aws/
   SEND_TELNYX_SMS_FUNCTION_URL=https://[your-telnyx-sms-function-id].lambda-url.[region].on.aws/
   PORTAL_BASE_URL=https://onyxdispatch.us/portal
   ```

   **Optional (if using AWS SMS as fallback):**
   ```
   SEND_SMS_FUNCTION_URL=https://[your-aws-sms-function-id].lambda-url.[region].on.aws/
   ```

4. **Save Environment Variables**
   - Click **Save**
   - Redeploy your app if needed

### Verify Environment Variables

After deployment, verify the variables are set:

1. Go to AWS Lambda Console
2. Find `customerPortal` function
3. Go to **Configuration** → **Environment variables**
4. Verify all variables are present

---

## Step 5: Configure Frontend API URL

### Update Frontend Environment Variable

1. **In AWS Amplify Console**
   - Go to **App settings** → **Environment variables**
   - Add or update:
     ```
     VITE_CUSTOMER_PORTAL_API_URL=https://[your-customer-portal-function-url]
     ```

2. **Or in Local Development**
   - Create/update `.env.local`:
     ```
     VITE_CUSTOMER_PORTAL_API_URL=https://[your-customer-portal-function-url]
     ```

3. **Rebuild Frontend**
   - The frontend will use this URL to call the Customer Portal API

---

## Step 6: Test the Setup

### Test Access Code Delivery

1. **Access Customer Portal**
   - Navigate to: `https://onyxdispatch.us/portal/[BOOKING_CODE]`
   - Enter a customer email or phone number

2. **Verify Email/SMS Delivery**
   - Check customer's email inbox (and spam folder)
   - Check customer's phone for SMS
   - Access code should be delivered within seconds

3. **Test Login Flow**
   - Enter the access code
   - Verify successful login
   - Verify trips are displayed

### Test API Directly

You can test the Function URL directly using `curl`:

```bash
# Test findCustomer
curl -X POST https://[your-function-url] \
  -H "Content-Type: application/json" \
  -d '{
    "action": "findCustomer",
    "companyId": "[your-company-id]",
    "email": "test@example.com"
  }'
```

Expected response:
```json
{
  "success": true,
  "customerId": "[customer-id]",
  "message": "Access code sent to your email. Please check your inbox."
}
```

---

## CORS Configuration

### If You Encounter CORS Errors

1. **Check Function URL CORS Settings**
   - Go to Lambda Console → Function → Configuration → Function URL
   - Verify CORS is enabled
   - Verify allowed origins include your domain

2. **Update CORS Settings**
   - **Allow origins:** `https://onyxdispatch.us` (or `*` for testing)
   - **Allow methods:** `POST, OPTIONS`
   - **Allow headers:** `Content-Type`
   - **Max age:** `86400`

3. **Test Again**
   - Clear browser cache
   - Try accessing portal again

---

## Troubleshooting

### Access Code Not Received

**Check Email:**
1. Verify `SEND_BOOKING_EMAIL_FUNCTION_URL` is set correctly
2. Check Lambda CloudWatch logs for `sendBookingEmail` function
3. Verify email service (SendGrid/Postmark) is configured
4. Check spam/junk folder

**Check SMS:**
1. Verify `SEND_TELNYX_SMS_FUNCTION_URL` or `SEND_SMS_FUNCTION_URL` is set
2. Check Lambda CloudWatch logs for SMS function
3. Verify Telnyx/AWS SMS is configured correctly
4. Verify phone number format (E.164)

### Function URL Not Working

1. **Verify Function URL exists**
   - Check Lambda Console → Configuration → Function URL
   - Verify URL is active

2. **Check IAM Permissions**
   - Verify `customerPortal` function has AppSync permissions
   - Check CloudWatch logs for permission errors

3. **Check Environment Variables**
   - Verify all required env vars are set
   - Check for typos in URLs

### CORS Errors

1. **Enable CORS in Function URL settings**
2. **Verify allowed origins**
3. **Check browser console for specific CORS error**
4. **Verify preflight (OPTIONS) requests are handled**

---

## Security Considerations

### Function URL Security

- ✅ **Auth type:** `NONE` is required for public customer access
- ✅ **CORS:** Restrict to your domain in production (`https://onyxdispatch.us`)
- ✅ **Rate limiting:** Consider adding rate limiting for production
- ✅ **Input validation:** All inputs are validated in the handler

### Access Code Security

- ✅ **Single-use:** Access codes are cleared after successful login
- ✅ **Time-limited:** Consider adding expiration (future enhancement)
- ✅ **Not exposed:** Access codes are never returned in API responses
- ✅ **Secure delivery:** Codes are sent via email/SMS only

---

## Production Checklist

Before going to production:

- [ ] Customer Portal Function URL created and tested
- [ ] Email Function URL configured and tested
- [ ] SMS Function URL configured and tested
- [ ] All environment variables set in Amplify Console
- [ ] Frontend `VITE_CUSTOMER_PORTAL_API_URL` configured
- [ ] CORS restricted to production domain
- [ ] Access code delivery tested (email and SMS)
- [ ] Login flow tested end-to-end
- [ ] CloudWatch logs reviewed for errors
- [ ] Error handling verified

---

## Support

If you encounter issues:

1. **Check CloudWatch Logs**
   - Lambda Console → Function → Monitor → View logs
   - Look for errors in `customerPortal`, `sendBookingEmail`, `sendTelnyxSms`

2. **Verify Configuration**
   - Double-check all Function URLs
   - Verify environment variables are set
   - Check CORS settings

3. **Test Components Individually**
   - Test email function directly
   - Test SMS function directly
   - Test customer portal function directly

---

## Related Documentation

- [Customer Portal Admin Guide](./CUSTOMER_PORTAL_ADMIN_GUIDE.md)
- [Email Function URL Setup](./EMAIL_FUNCTION_URL_SETUP.md)
- [Telnyx SMS Setup](./TELNYX_SMS_SETUP.md)

---

**Last Updated:** January 28, 2026
