# Troubleshooting Lambda 500 Error for Booking Portal

## Problem

The booking portal Lambda function is returning a 500 Internal Server Error when trying to fetch company data.

## Common Causes

### 1. Missing GraphQL Endpoint Configuration

The Lambda function needs the GraphQL API endpoint to be configured. Check:

1. **Go to AWS Lambda Console** → Your function → **Configuration** → **Environment variables**
2. Look for `AMPLIFY_DATA_GRAPHQL_ENDPOINT`
3. If missing, you need to add it manually or ensure Amplify is setting it

### 2. IAM Permissions

The Lambda execution role needs permissions to access AppSync/GraphQL API:

1. **Go to AWS Lambda Console** → Your function → **Configuration** → **Permissions**
2. Click on the execution role
3. Verify it has a policy with `appsync:GraphQL` permissions
4. If missing, Amplify should add this automatically, but you may need to redeploy

### 3. Check CloudWatch Logs

The most important step is to check the actual error:

1. **Go to AWS Lambda Console** → Your function → **Monitor** → **View CloudWatch logs**
2. Look for the most recent log entries
3. The error message will tell you exactly what's wrong

Common errors you might see:
- `Cannot find module` - Missing dependencies
- `Access denied` - IAM permissions issue
- `GraphQL endpoint not configured` - Missing endpoint configuration
- `Network error` - Connectivity issue

## Solution Steps

### Step 1: Check CloudWatch Logs

This is the most important step. The logs will show the exact error.

### Step 2: Verify Environment Variables

The Lambda function needs these environment variables (should be set automatically by Amplify):

- `AMPLIFY_DATA_GRAPHQL_ENDPOINT` - The GraphQL API endpoint URL
- `AWS_REGION` or `AMPLIFY_DATA_REGION` - AWS region (usually `us-east-1`)

If these are missing, you can find them in:
- **Amplify Console** → Your App → **Backend environments** → **Data** → GraphQL endpoint

### Step 3: Verify IAM Permissions

1. Go to Lambda function → **Configuration** → **Permissions**
2. Click the execution role
3. Check if there's a policy allowing `appsync:GraphQL` actions
4. If missing, you may need to add it manually or redeploy

### Step 4: Redeploy the Function

After making changes:

1. Commit and push your code
2. Wait for Amplify to redeploy
3. Test again

## Quick Fix: Manual Environment Variable Setup

If Amplify isn't setting the environment variables automatically:

1. **Get the GraphQL Endpoint:**
   - Go to **Amplify Console** → Your App → **Backend environments**
   - Find the GraphQL endpoint URL

2. **Add to Lambda:**
   - Go to **Lambda Console** → Your function → **Configuration** → **Environment variables**
   - Add: `AMPLIFY_DATA_GRAPHQL_ENDPOINT` = `[your-graphql-endpoint-url]`
   - Add: `AWS_REGION` = `us-east-1` (or your region)

3. **Save and test**

## Testing

After fixing, test the booking portal:
1. Visit `https://onyxdispatch.us/booking/YOURCODE`
2. Check browser console for errors
3. Check CloudWatch logs for Lambda errors

## Still Having Issues?

If you're still seeing 500 errors after checking CloudWatch logs:

1. Share the error message from CloudWatch logs
2. Verify the GraphQL endpoint is correct
3. Check that the company has `bookingEnabled: true` and a valid `bookingCode`
4. Ensure the Lambda function was deployed successfully
