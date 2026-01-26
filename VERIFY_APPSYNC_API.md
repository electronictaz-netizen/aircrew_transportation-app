# How to Verify Which AppSync API is Correct

You have 3 AppSync APIs in your AWS account. This guide will help you identify which one is the correct one for your application.

## The Three APIs You See

1. **API 1:** `f3dw3v4i2ndnrirlmrlucidzh4`
   - HTTP Endpoint: `https://qft7xoddfrfp7gslj5t5alhjaa.appsync-api.us-east-1.amazonaws.com/graphql`
   - Primary auth: `AMAZON_COGNITO_USER_POOLS`

2. **API 2:** `rrohmt3z6bai3nwm4lqaffp`
   - HTTP Endpoint: `https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql`
   - Primary auth: `AMAZON_COGNITO_USER_POOLS`

3. **API 3:** `ukoh7tgmwjbjdhnuirxugqx4ci`
   - HTTP Endpoint: `https://ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql`
   - Primary auth: `API_KEY`

## How to Verify the Correct API

### Method 1: Check Your Deployed Frontend (Most Important)

**This tells you which API your users are actually using.**

1. **Option A: Check deployed app's amplify_outputs.json**
   - Visit your deployed app (e.g., `https://onyxdispatch.us`)
   - Open browser DevTools → Network tab
   - Look for any GraphQL requests
   - The URL will show the API ID in the domain
   - Or try: `https://onyxdispatch.us/amplify_outputs.json` (if accessible)

2. **Option B: Check Amplify Console build artifacts**
   - Go to **AWS Amplify** → Your app → **Hosting**
   - Click on the latest build
   - Download build artifacts
   - Extract and open `amplify_outputs.json`
   - Look for `data.url` - it will contain the API ID

**Expected format:**
```json
{
  "data": {
    "url": "https://{API_ID}.appsync-api.us-east-1.amazonaws.com/graphql",
    "aws_region": "us-east-1"
  }
}
```

**What to look for:**
- Extract the API ID from the URL
- Match it to one of your 3 APIs

### Method 2: Check Backend CloudFormation Stack

**This tells you which API your backend is deploying to.**

1. Go to **AWS CloudFormation** → **Stacks**
2. Find your main backend stack (e.g., `amplify-d1wxo3x0z5r1oq-main-branch-{hash}`)
3. Click on the stack → **Resources** tab
4. Look for a resource of type `AWS::AppSync::GraphQLApi`
5. Click on the resource → **Physical ID** will show the API ID

**Or:**
1. In the stack → **Outputs** tab
2. Look for an output containing "GraphQLApiId" or "GraphQLAPIId"
3. The value will be the API ID

### Method 3: Check Lambda Function Environment Variables

**This tells you which API your Lambda functions are using.**

1. Go to **AWS Lambda** → Functions
2. Find `publicBooking` function
3. Click on it → **Configuration** → **Environment variables**
4. Look for `AMPLIFY_DATA_GRAPHQL_ENDPOINT`
5. The URL will contain the API ID

**Example:**
```
AMPLIFY_DATA_GRAPHQL_ENDPOINT = https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql
```

### Method 4: Check for Custom Query

**This verifies which API has your custom query deployed.**

1. For each of the 3 APIs:
   - Click on the API name
   - Go to **Schema** tab
   - Search for `listBookingRequestsForCompany`
   - If found, this is likely your active API

2. **Or use GraphQL introspection:**
   - Go to **Queries** tab in AppSync Console
   - Run this query:
   ```graphql
   query {
     __schema {
       queryType {
         fields {
           name
         }
       }
     }
   }
   ```
   - Look for `listBookingRequestsForCompany` in the results

### Method 5: Check DynamoDB Table Names

**This matches APIs to their data sources.**

1. Go to **AWS DynamoDB** → **Tables**
2. Look for tables like:
   - `Company-{API_ID}-NONE`
   - `BookingRequest-{API_ID}-NONE`
3. The API ID in the table name tells you which API created it

**Example:**
- If you see `Company-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`, then API 3 is the one with your data

## Expected Results

Based on previous troubleshooting:

- **Backend deploys to:** `ukoh7tgmwjbjdhnuirxugqx4ci` (API 3)
- **Frontend might be using:** `klp7rzjva5c2bef2zjaygpod44` (API 2's endpoint)
- **Local config shows:** `qft7xoddfrfp7gslj5t5alhjaa` (API 1's endpoint)

## What to Do Based on Results

### If Frontend and Backend Use Different APIs:

**This is the problem!** Your frontend is calling a different API than your backend updates.

**Solution:**
1. Check which Amplify app your frontend is connected to
2. Ensure the backend build phase runs and generates `amplify_outputs.json`
3. Verify the frontend build uses the `amplify_outputs.json` from the backend build
4. Redeploy both frontend and backend

### If All Point to the Same API:

**Good!** But verify:
1. The API has `listBookingRequestsForCompany` query
2. The API has both Cognito User Pool and IAM auth modes enabled
3. The API's DynamoDB tables contain your data

### If You Find Multiple APIs with Your Data:

**You may have multiple environments:**
- One might be for `main` branch
- One might be for a different branch
- One might be an old/stale API

**Solution:**
1. Check CloudFormation stacks to see which branch/environment each API belongs to
2. Delete unused APIs to avoid confusion
3. Ensure CI/CD deploys to the correct API for each branch

## Quick Verification Checklist

- [ ] Check deployed frontend's `amplify_outputs.json` → API ID: `________`
- [ ] Check backend CloudFormation stack → API ID: `________`
- [ ] Check `publicBooking` Lambda env var → API ID: `________`
- [ ] Check which API has `listBookingRequestsForCompany` → API ID: `________`
- [ ] Check DynamoDB table names → API ID: `________`

**If all 5 match:** ✅ You're using the correct API  
**If any differ:** ⚠️ You have a mismatch that needs to be fixed

## Next Steps After Verification

1. **If there's a mismatch:**
   - Document which API each component uses
   - Determine which API should be the "source of truth"
   - Update configurations to point to the correct API

2. **If all match:**
   - Verify the API has all required queries and mutations
   - Check authorization modes are correct
   - Test that the booking portal works with this API

3. **Clean up:**
   - Delete any unused/stale APIs
   - Update documentation with the correct API ID
   - Ensure team members know which API to use
