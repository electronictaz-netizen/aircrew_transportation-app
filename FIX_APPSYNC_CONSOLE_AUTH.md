# Fix 401 Unauthorized in AppSync Console

## The Problem

You're getting "Request failed with status code 401" when testing the query in AppSync Console. This means you need to authenticate.

## Step 1: Sign In to AppSync Console

1. In the **AppSync Console** → **Queries** tab
2. Look for the **Authorization** section (usually at the top or side)
3. You should see options like:
   - **Amazon Cognito User Pool**
   - **API Key**
   - **AWS IAM**

4. **Select "Amazon Cognito User Pool"**
5. Click **Login with User Pools** or similar button
6. Sign in with your Cognito credentials (the same ones you use for the Management dashboard)

## Step 2: Verify Authorization Mode

The `listBookingRequestsForCompany` query requires authentication:

```typescript
.authorization((allow) => [allow.authenticated()])
```

This means you **must** be signed in with Cognito User Pool credentials.

## Step 3: Alternative - Test with API Key (If Available)

If you have an API Key configured:

1. In AppSync Console → **Queries** tab
2. Select **API Key** as the authorization mode
3. Enter your API key
4. Try the query again

**Note:** API Key might not work if the query only allows `authenticated()` users.

## Step 4: Check if Query Works After Sign-In

Once you're signed in:

1. Run the query:
```graphql
query {
  listBookingRequestsForCompany(companyId: "b5370862-2a4f-4f8a-9f84-174dea888e08") {
    id
    customerName
    customerEmail
    status
    companyId
  }
}
```

2. **If it works:** ✅ The resolver is correct! The issue might be with frontend authentication or how it's calling the query.

3. **If it still returns empty:** ❌ The resolver filter isn't matching. We need to check CloudWatch logs.

## Step 5: Verify Frontend Authentication

If the query works in AppSync Console but not in the frontend:

1. **Check browser console** for authentication errors
2. **Verify the user is signed in** in the Management dashboard
3. **Check the GraphQL request headers** in Network tab:
   - Should have `authorization` header with Cognito token
   - Should not be missing or expired

## Quick Test

**In AppSync Console:**
1. Make sure you're signed in (check the top right corner)
2. Select **Amazon Cognito User Pool** as authorization mode
3. Run the query

**If you can't sign in:**
- You might need to use the same Cognito User Pool that the app uses
- Check which User Pool ID the app is using (from `amplify_outputs.json`)
