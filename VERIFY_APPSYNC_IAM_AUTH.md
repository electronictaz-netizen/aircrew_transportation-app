# How to Verify AppSync IAM Authentication is Enabled

## Understanding Auth Modes

AppSync APIs can have **multiple authentication modes** enabled simultaneously:
- **Primary auth mode**: The default mode (shown in the API list)
- **Additional auth modes**: Can be enabled alongside the primary mode

For your Lambda function to work, the GraphQL API needs to have **IAM authentication enabled** (it can be primary or secondary).

## How to Check if IAM Auth is Enabled

### Method 1: AppSync Console

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Click on the API you want to check (the one with API ID `ukoh7tgmwjbjdhnuirxugqx4ci`)
3. Go to the **Settings** tab
4. Look for **Authorization modes** or **Default authorization mode**
5. You should see:
   - **Default authorization mode**: Might show `API_KEY` or `AMAZON_COGNITO_USER_POOLS`
   - **Additional authorization types**: Should list `AWS_IAM` if IAM is enabled

### Method 2: Check Authorization Configuration

1. In the AppSync API, go to **Settings**
2. Scroll to **Authorization** section
3. You should see all enabled auth modes listed
4. **AWS_IAM** should be listed if IAM auth is enabled

## What You Should See

### ✅ Correct Configuration (IAM Enabled)

The API should have:
- **Default authorization mode**: Can be `API_KEY`, `AMAZON_COGNITO_USER_POOLS`, or `AWS_IAM`
- **Additional authorization types**: Should include `AWS_IAM` (if not the default)

### ❌ Problem: IAM Not Enabled

If IAM is not enabled:
- The Lambda function will get authentication errors
- You'll see errors like "Unauthorized" or "Access denied"

## How to Enable IAM Auth (If Not Enabled)

### Option 1: Via AppSync Console

1. Go to your AppSync API
2. Go to **Settings** tab
3. Click **Edit** on the Authorization section
4. Under **Additional authorization types**, check **AWS_IAM**
5. Click **Save**

### Option 2: Via Amplify Data Resource

In Amplify Gen 2, IAM auth should be automatically enabled when you use `authorizationModes` in your data resource. Check `amplify/data/resource.ts`:

```typescript
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // IAM should be automatically available for Lambda functions
  },
});
```

In Amplify Gen 2, Lambda functions automatically get IAM permissions, and IAM auth should be available even if it's not the default mode.

## For Your Specific Case

Looking at your AppSync console:
- **API 1**: Primary auth mode is `AMAZON_COGNITO_USER_POOLS`
- **API 2**: Primary auth mode is `API_KEY`

**Both APIs can still support IAM authentication** even if it's not the primary mode. The Lambda function will use IAM auth mode explicitly when making requests.

## Verify IAM Auth is Working

To test if IAM auth is working:

1. Check CloudWatch logs for your Lambda function
2. If you see "Unauthorized" or "Access denied" errors, IAM might not be enabled
3. If requests succeed, IAM auth is working correctly

## Next Steps

1. **Check** if IAM auth is enabled on the API (API 2 with ID `ukoh7tgmwjbjdhnuirxugqx4ci`)
2. **Enable it** if it's not enabled (via AppSync Console)
3. **Test** the Lambda function again

The primary auth mode being `API_KEY` is fine - as long as IAM is also enabled as an additional auth type, your Lambda function will be able to authenticate.
