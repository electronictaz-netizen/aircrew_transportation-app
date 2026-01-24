# How to Identify the Correct GraphQL API

You have **two GraphQL APIs** in AppSync, both named "amplifyData". Here's how to identify which one is correct:

## The Two APIs

### API 1:
- **HTTP Endpoint**: `https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql`
- **API ID**: `rrohmt3z6bai3nwm4lqaff...` (truncated)

### API 2:
- **HTTP Endpoint**: `https://ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql`
- **API ID**: `ukoh7tgmwjbjdhnuirxugq...` (truncated)

## How to Identify the Correct One

### Method 1: Check Lambda Environment Variable (Easiest)

1. Go to **AWS Lambda Console**
2. Find your `publicBooking` function
3. Go to **Configuration** → **Environment variables**
4. Check the value of `AMPLIFY_DATA_GRAPHQL_ENDPOINT`
5. Match it to one of the two endpoints above

**The one that matches is the correct one.**

### Method 2: Check CloudWatch Logs

From your recent logs, we've been seeing:
- API ID: `ukoh7tgmwjbjdhnuirxugqx4ci`

This matches **API 2**, so that's likely the one being used.

### Method 3: Check by Branch/Environment

If you have both `main` and `dev` branches:
- **Main branch** might use one API
- **Dev branch** might use the other API

Check which branch you're currently deploying to.

### Method 4: Check AppSync API Details

1. Click on each API name in AppSync console
2. Go to **Settings** tab
3. Check the **Created** date or **Last modified** date
4. The more recent one is likely the active one
5. Check if one has more recent activity in **Queries** or **Metrics**

## Most Likely Answer

Based on the CloudWatch logs showing API ID `ukoh7tgmwjbjdhnuirxugqx4ci`, **API 2** is likely the correct one:

**Correct Endpoint:**
```
https://ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql
```

**Full API ID:** `ukoh7tgmwjbjdhnuirxugqx4ci` (you can see the full ID by clicking on the API in AppSync)

## Verify in Lambda

To be 100% sure, check your Lambda function's environment variable:

1. AWS Lambda Console → `publicBooking` function
2. Configuration → Environment variables
3. Look at `AMPLIFY_DATA_GRAPHQL_ENDPOINT`

It should match one of the two endpoints. If it doesn't match either, or if it's set to a function URL, that's the problem.

## If You Have Two Branches

If you're using both `main` and `dev` branches:
- Each branch might have its own GraphQL API
- Check the environment variable in the Lambda function for each branch
- The `main` branch Lambda should use the production API
- The `dev` branch Lambda should use the dev/test API

## Next Steps

1. **Verify** which endpoint is currently set in your Lambda function
2. **Update** it if it's wrong (should be one of the two GraphQL endpoints, not a function URL)
3. **Test** the booking portal to confirm it works
