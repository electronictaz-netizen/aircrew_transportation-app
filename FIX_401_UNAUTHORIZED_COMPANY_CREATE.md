# Fix 401 Unauthorized When Creating Companies

## Problem

Getting `401 Unauthorized` errors when trying to create companies, even though you're logged in as an admin.

## Root Cause

The AppSync GraphQL API is not recognizing your Cognito User Pool authentication tokens. This can happen if:

1. **Tokens are expired** - Cognito tokens expire after a period of time
2. **AppSync API not configured with Cognito User Pool** - The API might not have the correct auth mode
3. **User Pool mismatch** - The User Pool ID in `amplify_outputs.json` doesn't match what AppSync expects

## Solutions

### Solution 1: Refresh Authentication (Try This First)

1. **Sign out** of the application
2. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Sign back in** with your admin account (`support@tazsoftware.biz`)
4. **Try creating a company again**

This will refresh your authentication tokens.

### Solution 2: Verify AppSync API Configuration

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find the API with ID: `klp7rzjva5c2bef2zjaygpod44`
3. Click on **Settings** → **Authorization**
4. Verify that **Amazon Cognito User Pool** is listed as an authorization type
5. Check that the **User Pool ID** matches: `us-east-1_9qfKiQtHV`
6. If it's missing or incorrect:
   - Click **Add authorization type**
   - Select **Amazon Cognito User Pool**
   - Select the correct User Pool: `us-east-1_9qfKiQtHV`
   - Set it as the **Default authorization mode**

### Solution 3: Verify amplify_outputs.json

Check that `amplify_outputs.json` has the correct values:

```json
{
  "version": "1",
  "auth": {
    "user_pool_id": "us-east-1_9qfKiQtHV",
    "user_pool_client_id": "14jfd7uoubk1ipsooe1349c5lk",
    "identity_pool_id": "us-east-1:db76f378-9fb1-4bb8-9b38-d4b34ab7f145",
    "aws_region": "us-east-1"
  },
  "data": {
    "aws_region": "us-east-1",
    "url": "https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql",
    "api_key": null
  }
}
```

### Solution 4: Check Cognito User Pool Configuration

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Find User Pool: `us-east-1_9qfKiQtHV`
3. Verify your user account exists and is **Confirmed**
4. Check that the **App client** `14jfd7uoubk1ipsooe1349c5lk` exists
5. Verify the App client has the correct settings:
   - **Allowed OAuth flows**: Authorization code grant, Implicit grant
   - **Allowed OAuth scopes**: openid, email, profile
   - **Allowed callback URLs**: Should include your app URL

### Solution 5: Use the Restore GLS Access Button

Instead of creating a new company, try using the **"Restore GLS Access"** button in the Admin Dashboard:

1. Go to `/admin`
2. Click **"Restore GLS Access"** button
3. This will find or create the GLS company and link your account

### Solution 6: Run the Migration Script

If the GLS company should already exist, run the migration script:

```bash
cd "Aircrew transportation app"
npx ts-node scripts/migrateToMultiTenant.ts
```

Or the restore script:

```bash
npx ts-node scripts/restoreGLSAccess.ts
```

## Debugging

### Check Authentication Status

Open browser console (F12) and run:

```javascript
// Check if user is authenticated
import('aws-amplify/auth').then(async (auth) => {
  try {
    const user = await auth.getCurrentUser();
    console.log('✅ Authenticated:', user);
  } catch (error) {
    console.error('❌ Not authenticated:', error);
  }
});
```

### Check GraphQL Request Headers

1. Open browser **Network tab** (F12)
2. Find a failed GraphQL request
3. Check the **Request Headers**
4. Look for `authorization` header - it should start with `Bearer eyJ...`
5. If missing or invalid, authentication is not working

### Verify Token Validity

The authorization header should contain a JWT token. You can decode it at [jwt.io](https://jwt.io) to check:
- **exp** (expiration) - should be in the future
- **iss** (issuer) - should match your Cognito User Pool
- **token_use** - should be "id" or "access"

## Common Issues

### Issue: "Token expired"
**Fix**: Sign out and sign back in

### Issue: "User pool not found"
**Fix**: Verify User Pool ID in `amplify_outputs.json` matches AWS Console

### Issue: "Invalid token"
**Fix**: Clear browser cache and sign in again

### Issue: "Not authorized"
**Fix**: Check AppSync API authorization configuration (Solution 2)

## Still Not Working?

If none of these solutions work:

1. **Check CloudWatch Logs** for the AppSync API to see detailed error messages
2. **Verify IAM permissions** - Your Cognito User Pool might need additional permissions
3. **Contact AWS Support** if the AppSync API configuration seems incorrect

## Prevention

To prevent this in the future:

1. **Set up token refresh** - Amplify should automatically refresh tokens, but ensure it's configured
2. **Monitor token expiration** - Set up alerts for authentication failures
3. **Use the correct API** - Always use `klp7rzjva5c2bef2zjaygpod44` (Cognito User Pools), not `ucwy5mmmyrh2rjz6hhkolzwnke` (API_KEY)
