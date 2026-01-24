# Configure Cognito Callback URLs for Amplify App

## Problem

You're using an Amplify-generated Cognito User Pool app client, and you can't find callback URL settings in the Cognito console.

## Why This Happens

Amplify Gen 2 manages some Cognito settings automatically. The callback URLs might be:
1. Auto-configured by Amplify
2. Managed in Amplify Console (not Cognito Console)
3. Need Hosted UI enabled to see the fields

## Solution Options

### Option 1: Enable Hosted UI to See Callback URLs (Recommended)

Even if you're not using Cognito Hosted UI, enabling it will reveal the callback URL fields:

1. **On the "Edit app client information" page** (where you are now):
   - Scroll down past "Authentication flow session duration"
   - Look for a section called **"Hosted UI"** or **"OAuth 2.0"**
   - If you don't see it, it might be on a different tab

2. **Check other tabs:**
   - Look for tabs at the top of the page (like "Attribute permissions", "Login pages", etc.)
   - One of these might have OAuth/Hosted UI settings

3. **If Hosted UI section exists:**
   - Check the box to **"Enable Hosted UI"**
   - This will show:
     - Allowed callback URLs
     - Allowed sign-out URLs
   - Add your custom domain there

### Option 2: Use AWS CLI to Check/Update Callback URLs

If you can't find the UI settings, use AWS CLI:

**1. Check current callback URLs:**
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1
```

Look for `CallbackURLs` and `LogoutURLs` in the output.

**2. Update callback URLs:**
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --callback-urls "https://onyxdispatch.us" "https://onyxdispatch.us/" "https://onyxdispatch.us/*" "https://main.d1wxo3x0z5r1oq.amplifyapp.com" "https://main.d1wxo3x0z5r1oq.amplifyapp.com/" \
  --logout-urls "https://onyxdispatch.us" "https://onyxdispatch.us/" "https://main.d1wxo3x0z5r1oq.amplifyapp.com" "https://main.d1wxo3x0z5r1oq.amplifyapp.com/"
```

**3. Enable OAuth flows (if needed):**
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --allowed-o-auth-flows "implicit" "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client
```

### Option 3: Check Amplify Console

Since this is an Amplify-managed app client, check Amplify Console:

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Look for any Cognito-related environment variables
5. Go to **App settings** → **Authentication**
6. Check if there are callback URL settings there

### Option 4: Navigate to App Integration Tab

Try a different navigation path:

1. **Go back to User Pool overview:**
   - Click on the User Pool name in the breadcrumb
   - Or use the left sidebar → click on the User Pool name

2. **Click "App integration" tab** (at the top, not in sidebar)

3. **In the App integration page:**
   - Look for **"Domain"** section
   - Look for **"App client settings"** section
   - The callback URLs might be shown/editable there

4. **Or click "Edit" on the App Client** from this page
   - This might show different options than the direct edit page

## What to Look For

The callback URL fields might be labeled as:
- **Allowed callback URLs**
- **Callback URLs**
- **Redirect URIs**
- **OAuth 2.0 callback URLs**
- **Sign-in redirect URIs**

## Quick Test: Check Current Settings

Run this AWS CLI command to see what's currently configured:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs,AllowedOAuthFlows:AllowedOAuthFlows,AllowedOAuthScopes:AllowedOAuthScopes}' \
  --output json
```

This will show you:
- Current callback URLs (if any)
- Current logout URLs (if any)
- OAuth flows enabled
- OAuth scopes enabled

## If Nothing Works: Alternative Approach

If you can't configure callback URLs directly, the issue might be that Amplify's authentication doesn't use Cognito Hosted UI. Instead, it uses direct authentication.

In this case, the 401 errors might be due to:
1. **AppSync API authorization** not configured correctly (see `VERIFY_APPSYNC_COGNITO_AUTH.md`)
2. **Token storage** issues (cookies not working on custom domain)
3. **CORS** issues with the custom domain

Try these steps:
1. Verify AppSync API has Cognito User Pool as default auth mode
2. Clear browser cache and cookies
3. Sign out and sign back in on the custom domain
4. Check browser console for specific error messages

## Next Steps

1. **Try Option 2 (AWS CLI)** - This is the most reliable way to update the settings
2. **Check AppSync authorization** - This might be the actual issue
3. **Test authentication flow** - See if tokens are being generated correctly

Let me know what the AWS CLI command shows, and we can proceed from there.
