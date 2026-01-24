# Verify AppSync Cognito User Pool Authorization

## Problem

Getting 401 Unauthorized errors even though the schema is configured with `userPool` as the default authorization mode.

## Solution: Check AppSync API Authorization Settings

The AppSync API needs to have Cognito User Pool configured as an authorization mode. Here's how to verify and fix it:

### Step 1: Navigate to AppSync API Settings

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find and click on the API with ID: **`klp7rzjva5c2bef2zjaygpod44`**
   - You can search for it or look for the API named "amplifyData" (based on the tags)
3. In the left sidebar, click on **"Settings"**
4. Scroll down to the **"Authorization"** section

### Step 2: Verify Cognito User Pool is Configured

You should see a section showing authorization modes. Look for:

- **Default authorization mode**: Should be "Amazon Cognito User Pool"
- **Authorization types**: Should list "Amazon Cognito User Pool" with User Pool ID: `us-east-1_9qfKiQtHV`

### Step 3: If Cognito User Pool is Missing

If you don't see "Amazon Cognito User Pool" listed:

1. Click **"Add authorization type"** or **"Edit"** button
2. Select **"Amazon Cognito User Pool"**
3. Choose the User Pool: **`us-east-1_9qfKiQtHV`**
4. **Important**: Set it as the **"Default authorization mode"**
5. Click **"Save"**

### Step 4: Verify User Pool Configuration

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Click on **"User pools"**
3. Find User Pool: **`us-east-1_9qfKiQtHV`**
4. Click on it to open details
5. Go to **"App integration"** tab
6. Verify the **App client ID**: `14jfd7uoubk1ipsooe1349c5lk` exists
7. Check that OAuth settings are configured:
   - **Allowed OAuth flows**: Authorization code grant, Implicit grant
   - **Allowed OAuth scopes**: openid, email, profile
   - **Allowed callback URLs**: Should include your app URL

### Step 5: Test After Configuration

After updating the AppSync API authorization:

1. **Sign out** of your application
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Sign back in** with `support@tazsoftware.biz`
4. Try creating a company or using "Restore GLS Access"

## Alternative: Check via AWS CLI

If you have AWS CLI configured, you can check the API authorization:

```bash
aws appsync get-graphql-api --api-id klp7rzjva5c2bef2zjaygpod44 --region us-east-1
```

Look for the `additionalAuthenticationProviders` and `authenticationType` fields in the response.

## Expected Configuration

Your AppSync API should have:

```json
{
  "authenticationType": "AMAZON_COGNITO_USER_POOLS",
  "userPoolConfig": {
    "userPoolId": "us-east-1_9qfKiQtHV",
    "awsRegion": "us-east-1"
  }
}
```

## Still Not Working?

If Cognito User Pool is configured but you still get 401 errors:

1. **Check CloudWatch Logs** for the AppSync API to see detailed error messages
2. **Verify the User Pool ID** in AppSync matches exactly: `us-east-1_9qfKiQtHV`
3. **Check IAM permissions** - The Cognito User Pool might need additional permissions
4. **Try redeploying** the backend: `npx ampx sandbox` or via CI/CD

## Important Notes

- The AppSync API **must** have Cognito User Pool as the **default** authorization mode
- The User Pool ID in AppSync **must match** the one in `amplify_outputs.json`
- After changing authorization settings, you may need to wait a few minutes for changes to propagate
