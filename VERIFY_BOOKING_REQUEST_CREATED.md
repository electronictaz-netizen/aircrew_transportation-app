# Verify Booking Request Was Created

## Quick Check: Does the Booking Request Exist?

### Step 1: Check CloudWatch Logs

1. Go to **AWS CloudWatch** → **Log groups**
2. Find `/aws/lambda/publicBooking-{branch}-{app-id}`
3. Click on the most recent log stream
4. Look for log entries with "Booking request created"
5. Check the log output - it should show:
   ```
   Booking request created: {
     companyId: "...",
     requestId: "...",
     bookingCode: "GLS"
   }
   ```

**If you see this log:**
- ✅ Booking request was created successfully
- Note the `companyId` from the log

**If you DON'T see this log:**
- ❌ Booking request creation failed
- Check for error messages in the logs
- Look for "Error creating booking request" messages

### Step 2: Check DynamoDB

1. Go to **AWS DynamoDB** → **Tables**
2. Find `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
   - This is the table for API 3 (your active API)
3. Click **Explore table items**
4. Look for the booking request you just created
5. Check:
   - **Does it exist?** (If no, the Lambda failed to create it)
   - **What is the `companyId`?** (Note this value)
   - **What is the `status`?** (Should be "Pending")
   - **What is the `receivedAt`?** (Should be recent timestamp)

### Step 3: Compare Company IDs

1. **Get the companyId from Management Dashboard:**
   - Open browser console on the Management dashboard
   - Type: `window.location` or check the URL
   - Or check the `companyId` from the `useCompany()` hook (you can add a console.log temporarily)

2. **Compare with booking request:**
   - The `companyId` in the booking request (from DynamoDB)
   - Should match the `companyId` being queried (from Management dashboard)

**If they don't match:**
- The booking request belongs to a different company
- This is why the query returns empty array

**If they match:**
- The resolver might have an issue
- Or the booking request is in a different table

## Most Likely Issues

### Issue 1: Booking Request Not Created

**Symptoms:**
- No "Booking request created" log in CloudWatch
- No booking request in DynamoDB

**Possible causes:**
- Lambda function failed
- GraphQL mutation failed
- IAM permissions issue

**Fix:**
- Check CloudWatch logs for errors
- Verify Lambda has `PutItem` permission for BookingRequest table
- Check if `createBookingRequest` mutation exists in API 3

### Issue 2: Company ID Mismatch

**Symptoms:**
- Booking request exists in DynamoDB
- But `companyId` doesn't match what you're querying

**Possible causes:**
- You're viewing a different company in the dashboard
- Booking was created for a different company
- Admin override is selecting a different company

**Fix:**
- Verify which company you're logged into
- Check if you're using Admin mode and selected a different company
- Make sure the booking code matches the company you're viewing

### Issue 3: Booking Request in Wrong Table

**Symptoms:**
- Booking request exists but in a different table
- Query returns empty because it's looking in the wrong table

**Possible causes:**
- Booking request was created via a different API
- Lambda is using a different AppSync API than the frontend

**Fix:**
- Verify Lambda's `AMPLIFY_DATA_GRAPHQL_ENDPOINT` points to API 3
- Check which table the booking request is actually in
- Make sure frontend and Lambda use the same API

## Quick Test

**Test the query directly in AppSync Console:**

1. Go to **AWS AppSync** → API 3 (`ukoh7tgmwjbjdhnuirxugqx4ci`)
2. **Queries** tab
3. Sign in
4. Run:
```graphql
query {
  listBookingRequestsForCompany(companyId: "YOUR_COMPANY_ID_HERE") {
    id
    customerName
    customerEmail
    status
    companyId
  }
}
```

**Replace `YOUR_COMPANY_ID_HERE`** with:
- The `companyId` from the booking request in DynamoDB (if it exists)
- Or the `companyId` from your current company context

**Expected results:**
- If booking request exists with matching `companyId`: Should return the request
- If no matching requests: Returns `[]`
- If query doesn't exist: Returns error

## Next Steps Based on Results

**If booking request exists in DynamoDB:**
- Check if `companyId` matches
- Test the query in AppSync Console with that exact `companyId`
- If query works in AppSync but not in frontend, it's a frontend issue

**If booking request doesn't exist:**
- Check CloudWatch logs for creation errors
- Verify Lambda permissions
- Check if `createBookingRequest` mutation exists in API 3

**If companyId doesn't match:**
- Verify which company you're viewing in the dashboard
- Check if Admin mode is selecting a different company
- Ensure booking code matches the company you're querying
