# How to Verify and Set the Correct GraphQL Endpoint

## What the Environment Variable Should Be

The `AMPLIFY_DATA_GRAPHQL_ENDPOINT` environment variable in your Lambda function should be the **AppSync GraphQL API endpoint**, not a function URL.

### Correct Format:
```
https://{api-id}.appsync-api.{region}.amazonaws.com/graphql
```

### Example:
```
https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql
```

## How to Get the Correct Endpoint

### Method 1: From AWS AppSync Console

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find your API (should be named "amplifyData" or match your Amplify app)
3. Click on the API name to open it
4. Go to the **Settings** tab
5. Look for **GraphQL endpoint** or **API URL**
6. Copy the full URL (should end with `/graphql`)

### Method 2: From API List

1. In the AppSync console, look at the **HTTP Endpoint** column
2. Click the clipboard icon next to the endpoint
3. This copies the full endpoint URL

### Method 3: Construct from API ID

If you have the API ID (visible in the AppSync console), construct it:
```
https://{api-id}.appsync-api.{region}.amazonaws.com/graphql
```

For example, if your API ID is `ukoh7tgmwjbjdhnuirxugqx4ci` and region is `us-east-1`:
```
https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql
```

## How to Set It in Lambda

### Option 1: Let Amplify Set It Automatically (Recommended)

The `backend.ts` file should automatically set this during deployment. After deploying, check:

1. Go to AWS Lambda Console
2. Find your `publicBooking` function
3. Go to **Configuration** → **Environment variables**
4. Verify `AMPLIFY_DATA_GRAPHQL_ENDPOINT` is set correctly

### Option 2: Manually Set It

If the automatic setting isn't working:

1. Go to AWS Lambda Console
2. Find your `publicBooking` function
3. Go to **Configuration** → **Environment variables**
4. Click **Edit**
5. Find or add `AMPLIFY_DATA_GRAPHQL_ENDPOINT`
6. Set the value to the full GraphQL endpoint URL from AppSync
7. Click **Save**

## How to Verify It's Correct

The endpoint should:
- ✅ Start with `https://`
- ✅ Contain `.appsync-api.`
- ✅ End with `/graphql`
- ✅ NOT be a function URL (no `.lambda-url.` in it)
- ✅ NOT be a generic AWS URL

### Correct Examples:
```
✅ https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql
✅ https://abc123def456.appsync-api.us-east-1.amazonaws.com/graphql
```

### Incorrect Examples:
```
❌ https://xyz789.lambda-url.us-east-1.on.aws/  (This is a function URL, not GraphQL)
❌ https://api.example.com/graphql  (Wrong format)
❌ ukoh7tgmwjbjdhnuirxugqx4ci  (Just the API ID, not the full URL)
```

## Troubleshooting

### If the endpoint is a function URL:
- The `backend.ts` code might not be working correctly
- Check the deployment logs for errors
- Manually set it using Option 2 above

### If the endpoint is missing:
- Check that `backend.ts` includes the `addEnvironment` call
- Redeploy the backend
- Manually set it using Option 2 above

### If DNS resolution fails:
- Verify the endpoint URL is correct
- Check that the API ID matches what's in AppSync
- Ensure the region is correct (usually `us-east-1`)

## Current Status

Based on your AppSync console, you should have:
- **API ID**: `ukoh7tgmwjbjdhnuirxugqx4ci` (truncated in console, full ID should be visible when you click the API)
- **Region**: `us-east-1` (or whatever region your Amplify app is in)
- **Endpoint**: `https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql`

Make sure the Lambda function's `AMPLIFY_DATA_GRAPHQL_ENDPOINT` environment variable matches this format exactly.
