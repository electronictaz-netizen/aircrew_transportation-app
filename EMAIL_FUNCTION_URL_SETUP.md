# Email Function URL Setup Guide

## Problem

The app is falling back to mailto links because the Lambda Function URL isn't configured in the frontend environment variables.

## Solution

After deploying the backend with the Function URL, you need to:

1. **Get the Function URL** from AWS Lambda Console
2. **Set it as an environment variable** in Amplify Console for your frontend

## Step-by-Step Instructions

### Step 1: Get the Function URL

After your backend deploys, get the Function URL using one of these methods:

#### Method 1: AWS Lambda Console (Easiest)

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your function: Look for `sendInvitationEmail` (it will have a name like `[app-id]-[branch]-sendInvitationEmail-[hash]`)
3. Click on the function
4. Go to **Configuration** tab → **Function URL**
5. If you see a URL, **copy it** (it looks like `https://[id].lambda-url.[region].on.aws/`)
6. If you don't see a Function URL, it should be created automatically by the backend configuration. If not, click **Create function URL**:
   - Auth type: **NONE**
   - CORS: Enable
   - Click **Save**

#### Method 2: AWS CLI

```bash
aws lambda get-function-url-config \
  --function-name [your-function-name]
```

#### Method 3: Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Go to **Backend** → **Functions**
4. Find `sendInvitationEmail`
5. The Function URL should be displayed there

### Step 2: Set Environment Variable in Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Click **Manage variables**
5. Add a new variable:
   - **Key**: `VITE_SEND_INVITATION_EMAIL_URL`
   - **Value**: The Function URL you copied (e.g., `https://abc123.lambda-url.us-east-1.on.aws/`)
6. **Save**
7. **Redeploy your frontend** (or wait for the next automatic deployment)

### Step 3: Verify It's Working

1. After the frontend redeploys, try sending an invitation email from your app
2. Check the browser console (F12) for any errors
3. The email should be sent via Postmark (not mailto) if configured correctly

## Troubleshooting

### Still Using Mailto?

1. **Check environment variable is set**:
   - In Amplify Console → Environment variables, verify `VITE_SEND_INVITATION_EMAIL_URL` exists
   - Make sure there are no typos in the variable name

2. **Check Function URL is correct**:
   - The URL should end with `/` (or the code will add it)
   - Test the URL directly: `curl -X POST [your-function-url] -H "Content-Type: application/json" -d '{"to":"test@example.com","companyName":"Test","signupUrl":"https://example.com"}'`

3. **Check browser console**:
   - Open browser DevTools (F12)
   - Look for errors when sending invitation
   - Check Network tab to see if the Lambda is being called

4. **Check Lambda logs**:
   - Go to AWS Lambda Console → Your function → Monitor → Logs
   - Look for errors (especially `POSTMARK_API_KEY` missing)

5. **Verify POSTMARK_API_KEY is set**:
   - In Lambda Console → Configuration → Environment variables
   - Make sure `POSTMARK_API_KEY` is set with your Postmark Server API Token

## Environment Variables Summary

### Frontend (Amplify Console → Environment Variables)
- `VITE_SEND_INVITATION_EMAIL_URL` = Your Lambda Function URL

### Backend Lambda (Lambda Console → Environment Variables)
- `POSTMARK_API_KEY` = Your Postmark Server API Token
- `POSTMARK_FROM_EMAIL` = `noreply@onyxdispatch.us` (optional, has default)

## Testing the Function URL Directly

You can test if the Lambda is working by calling it directly:

```bash
curl -X POST https://[your-function-url] \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "companyName": "Test Company",
    "role": "manager",
    "signupUrl": "https://example.com/signup"
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "..."
}
```

If you get an error about `POSTMARK_API_KEY`, make sure it's set in the Lambda environment variables.
