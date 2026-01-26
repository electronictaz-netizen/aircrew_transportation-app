# Troubleshoot: Booking Requests Not Showing

## The Problem

- Booking portal loads and works ✅
- Booking request is submitted successfully ✅
- But booking requests don't appear in the Management dashboard "Booking Requests" view ❌

## Current Status

- **Frontend is using:** API 3 (`ucwy5mmmyrh2rjz6hhkolzwnke`) ✅
- **Query being called:** `listBookingRequestsForCompany` ✅
- **GraphQL response:** 200 OK (but we need to see the actual response body)

## Step 1: Check the GraphQL Response

The network request shows `200 OK`, but we need to see what data is actually returned:

1. **In browser DevTools:**
   - Go to **Network** tab
   - Find the GraphQL request to `ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql`
   - Click on it → **Response** tab
   - Check what the response body contains

**Look for:**
- `"data": { "listBookingRequestsForCompany": [...] }` → Query exists and returned data
- `"data": { "listBookingRequestsForCompany": null }` → Query exists but returned null
- `"errors": [...]` → Query failed or doesn't exist

## Step 2: Verify Custom Query Exists in API 3

1. Go to **AWS AppSync** → APIs
2. Click on API 3 (`ukoh7tgmwjbjdhnuirxugqx4ci`)
3. Go to **Schema** tab
4. Search for `listBookingRequestsForCompany`
5. Verify it exists in the Query type

**If it doesn't exist:**
- The backend needs to be redeployed
- The custom query wasn't deployed to API 3

## Step 3: Verify Booking Request Was Created

1. Go to **AWS DynamoDB** → Tables
2. Find the `BookingRequest` table (should be `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`)
3. **Explore table items**
4. Look for the booking request you just created
5. Check:
   - Does it exist?
   - What is the `companyId`?
   - Does the `companyId` match the company you're viewing in the dashboard?

## Step 4: Check the Resolver

The custom query uses an AppSync JavaScript resolver. Verify it's working:

1. Go to **AWS AppSync** → API 3
2. **Schema** tab → Find `listBookingRequestsForCompany`
3. Click on it → View resolver
4. Check the resolver code matches `amplify/data/list-booking-requests-by-company.js`

**Expected resolver:**
- Operation: `Scan`
- Filter: `companyId = :cid`
- Data source: `BookingRequest` table

## Step 5: Test the Query Directly

### Option A: Test in AppSync Console

1. Go to **AWS AppSync** → API 3
2. **Queries** tab
3. Sign in with a test user
4. Run this query:

```graphql
query TestBookingRequests {
  listBookingRequestsForCompany(companyId: "YOUR_COMPANY_ID") {
    id
    customerName
    customerEmail
    status
    companyId
    receivedAt
  }
}
```

**Replace `YOUR_COMPANY_ID`** with the actual company ID (from the Management dashboard URL or company context)

**Expected:**
- Should return an array of booking requests
- If it returns `[]`, the query works but no requests match
- If it errors, the query might not exist or the resolver has issues

### Option B: Check Browser Console

1. Open browser DevTools → **Console** tab
2. Look for any errors when loading booking requests
3. Check if `loadBookingRequests` function logged anything

## Common Issues

### Issue 1: Query Doesn't Exist in API 3

**Symptoms:**
- GraphQL response has errors like "Field 'listBookingRequestsForCompany' is undefined"
- Query doesn't appear in AppSync schema

**Fix:**
1. Redeploy backend: `npx ampx pipeline-deploy` (or push to trigger CI/CD)
2. Verify the query appears in API 3's schema after deployment

### Issue 2: Company ID Mismatch

**Symptoms:**
- Booking request exists in DynamoDB
- But has a different `companyId` than the one you're viewing

**Fix:**
1. Verify which company you're logged into
2. Check the booking request's `companyId` in DynamoDB
3. Make sure they match

### Issue 3: Resolver Not Working

**Symptoms:**
- Query exists but returns empty array
- Or returns an error

**Fix:**
1. Check CloudWatch logs for the resolver
2. Verify the resolver code is correct
3. Check that the DynamoDB table name matches

### Issue 4: Booking Request Not Created

**Symptoms:**
- No booking request in DynamoDB
- Lambda function might have failed

**Fix:**
1. Check CloudWatch logs for `publicBooking` Lambda
2. Look for errors when creating the booking request
3. Verify the Lambda has permissions to create items in BookingRequest table

## Quick Diagnostic Steps

1. **Check GraphQL response body** (most important)
   - What does the actual response contain?
   - Is there an error message?

2. **Verify booking request exists in DynamoDB**
   - Go to DynamoDB → BookingRequest table
   - Find the request you just created
   - Note the `companyId`

3. **Test the query in AppSync Console**
   - Use the same `companyId` from the booking request
   - See if the query returns the request

4. **Check browser console**
   - Any JavaScript errors?
   - What does `loadBookingRequests` log?

## What to Share for Further Help

If the issue persists, share:

1. **GraphQL response body** (from Network tab → Response)
2. **Browser console errors** (if any)
3. **Whether booking request exists in DynamoDB** (and its `companyId`)
4. **Result of testing the query in AppSync Console**

This will help identify if it's:
- A query/resolver issue
- A data issue (wrong companyId)
- A frontend issue (not processing the response correctly)
