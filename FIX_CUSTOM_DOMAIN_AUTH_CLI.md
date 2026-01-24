# Fix Custom Domain Authentication with AWS CLI

## Problem

AppSync authorization is correct, but still getting 401 Unauthorized on `onyxdispatch.us`. This is likely due to Cognito callback URLs not including the custom domain.

## Solution: Update Cognito Callback URLs via AWS CLI

Since the Cognito console doesn't show callback URL fields for Amplify-managed app clients, use AWS CLI.

### Step 1: Check Current Settings

First, see what's currently configured:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs,AllowedOAuthFlows:AllowedOAuthFlows,AllowedOAuthScopes:AllowedOAuthScopes}' \
  --output json
```

### Step 2: Update Callback URLs

Run this command to add your custom domain:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --callback-urls "https://onyxdispatch.us" "https://onyxdispatch.us/" "https://onyxdispatch.us/*" "https://main.d1wxo3x0z5r1oq.amplifyapp.com" "https://main.d1wxo3x0z5r1oq.amplifyapp.com/" \
  --logout-urls "https://onyxdispatch.us" "https://onyxdispatch.us/" "https://main.d1wxo3x0z5r1oq.amplifyapp.com" "https://main.d1wxo3x0z5r1oq.amplifyapp.com/"
```

### Step 3: Enable OAuth Flows (if needed)

If OAuth flows aren't enabled, run:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --allowed-o-auth-flows "implicit" "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client
```

### Step 4: Verify Changes

Check that the update worked:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_9qfKiQtHV \
  --client-id 14jfd7uoubk1ipsooe1349c5lk \
  --region us-east-1 \
  --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs}' \
  --output json
```

You should see `https://onyxdispatch.us` in the CallbackURLs array.

### Step 5: Test Authentication

After updating:

1. **Sign out** completely from the app
2. **Clear browser cache and cookies** for both domains:
   - `onyxdispatch.us`
   - `main.d1wxo3x0z5r1oq.amplifyapp.com`
3. **Close all browser tabs** with the app
4. **Open a new tab** and go to `https://onyxdispatch.us/admin`
5. **Sign in** with `support@tazsoftware.biz`
6. **Check browser console** (F12) for errors

## Alternative: If You Don't Have AWS CLI

If you don't have AWS CLI installed, you can:

1. **Install AWS CLI:**
   ```bash
   # Windows (using PowerShell)
   winget install Amazon.AWSCLI
   
   # Or download from: https://aws.amazon.com/cli/
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, region (us-east-1), and output format (json)

3. **Then run the commands above**

## If Callback URLs Don't Fix It

If updating callback URLs doesn't solve the 401 errors, check:

### 1. Token Storage Issues

Cookies might not be working on the custom domain. Check browser console:

```javascript
// In browser console on onyxdispatch.us
document.cookie
```

Look for Cognito-related cookies. If none exist, cookies might be blocked.

### 2. CORS Issues

Check browser console for CORS errors. If present, update Lambda Function URL CORS settings to allow `https://onyxdispatch.us`.

### 3. Network Tab Inspection

1. Open browser DevTools → Network tab
2. Try to sign in
3. Look for GraphQL requests
4. Check the request headers - is there an `authorization` header?
5. Check the response - what's the actual error message?

### 4. CloudWatch Logs

Check AppSync API logs in CloudWatch:
1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Log groups → Find AppSync API logs
3. Look for authentication failures around the time you tried to sign in

## Quick Test Script

Run this in browser console on `onyxdispatch.us` after signing in:

```javascript
import('aws-amplify/auth').then(async (auth) => {
  try {
    const user = await auth.getCurrentUser();
    const session = await auth.fetchAuthSession();
    console.log('✅ User authenticated:', user.userId);
    console.log('✅ Tokens present:', {
      idToken: !!session.tokens?.idToken,
      accessToken: !!session.tokens?.accessToken,
    });
    
    // Try to make a GraphQL request
    const { generateClient } = await import('aws-amplify/data');
    const client = generateClient();
    const { data, errors } = await client.models.Company.list();
    console.log('✅ GraphQL request successful:', data?.length || 0, 'companies');
  } catch (error) {
    console.error('❌ Error:', error);
  }
});
```

This will tell you:
- If authentication is working
- If tokens are present
- If GraphQL requests work

## Expected Output After Fix

After updating callback URLs and testing:

- ✅ Can sign in on `onyxdispatch.us`
- ✅ No 401 errors in console
- ✅ Can access `/admin` page
- ✅ Can load companies or use "Restore GLS Access"
- ✅ GraphQL requests succeed

## Still Not Working?

If callback URLs are updated but you still get 401 errors:

1. **Check CloudWatch Logs** for detailed error messages
2. **Verify token expiration** - tokens might be expiring too quickly
3. **Check browser security settings** - third-party cookies might be blocked
4. **Try different browser** - rules out browser-specific issues
5. **Check Amplify configuration** - ensure `amplify_outputs.json` is correct
