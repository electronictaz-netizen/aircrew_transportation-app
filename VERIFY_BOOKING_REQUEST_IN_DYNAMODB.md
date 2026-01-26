# Verify Booking Request in DynamoDB

## Step 1: Check if Booking Request Exists

Based on CloudWatch logs, the booking request was created with:
- **requestId**: `acf272b0-4bff-4817-9ecd-99d6457d7a83`
- **companyId**: `b5370862-2a4f-4f8a-9f84-174dea888e08` (GLS Transportation)

### In DynamoDB Console:

1. Go to **AWS DynamoDB** → **Tables**
2. Find table: `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
   - This is the table for API 3 (your active API)
3. Click **Explore table items**
4. Search for the booking request:
   - **Option A**: Search by `id` = `acf272b0-4bff-4817-9ecd-99d6457d7a83`
   - **Option B**: Scan the table and look for recent items

### What to Check:

1. **Does the booking request exist?**
   - ✅ If YES: Continue to Step 2
   - ❌ If NO: The GraphQL mutation failed silently. Check CloudWatch logs for errors.

2. **What is the `companyId` value?**
   - Should be: `b5370862-2a4f-4f8a-9f84-174dea888e08`
   - Note the exact value (including any spaces, case differences)

3. **What is the `companyId` type in DynamoDB?**
   - Should be a **String** (S) type
   - Check the attribute type in DynamoDB console

## Step 2: Check AppSync Resolver Logs

The resolver now has enhanced logging. Check CloudWatch logs:

1. Go to **AWS CloudWatch** → **Log groups**
2. Find log group: `/aws/appsync/apis/ukoh7tgmwjbjdhnuirxugqx4ci`
3. Look for recent log streams (should have timestamps around when you query)
4. Search for: `listBookingRequestsForCompany`

### What to Look For:

```
=== listBookingRequestsForCompany REQUEST ===
companyId (raw): b5370862-2a4f-4f8a-9f84-174dea888e08
companyId (DynamoDB format): {"S":"b5370862-2a4f-4f8a-9f84-174dea888e08"}
=== listBookingRequestsForCompany RESPONSE ===
Scan result: {"Count":0,"ScannedCount":X,"ItemsCount":0}
```

**Key Questions:**
- What is `ScannedCount`? (How many items were scanned)
- What is `Count`? (How many matched the filter)
- If `ScannedCount > 0` but `Count = 0`: The filter isn't matching

## Step 3: Compare Company IDs

### From Management Dashboard:
1. Open browser console
2. Navigate to **Booking Requests** tab (this triggers the query)
3. Look for log: `[ManagementDashboard] Loading booking requests for companyId: ...`
4. Note the exact `companyId` value

### From Booking Request (DynamoDB):
- Note the exact `companyId` from the booking request item

### Compare:
- **If they match exactly**: The resolver filter should work. Check AppSync logs for why it's not matching.
- **If they don't match**: This is the problem! The dashboard is querying a different company.

## Step 4: Test Query Directly in AppSync Console

1. Go to **AWS AppSync** → API 3 (`ukoh7tgmwjbjdhnuirxugqx4ci`)
2. Click **Queries** tab
3. Sign in with your Cognito credentials
4. Run this query:

```graphql
query {
  listBookingRequestsForCompany(companyId: "b5370862-2a4f-4f8a-9f84-174dea888e08") {
    id
    customerName
    customerEmail
    status
    companyId
    receivedAt
  }
}
```

**Expected Results:**
- ✅ If booking request exists: Should return the booking request
- ❌ If empty array: Check AppSync CloudWatch logs for resolver execution
- ❌ If error: Check error message

## Common Issues

### Issue 1: Booking Request Not in DynamoDB
**Symptom**: Booking request doesn't exist in DynamoDB despite CloudWatch log saying it was created.

**Possible Causes:**
- GraphQL mutation returned success but didn't actually create the item
- IAM permissions issue (Lambda can't write to DynamoDB)
- Wrong table (booking request in a different table)

**Fix:**
- Check CloudWatch logs for GraphQL mutation errors
- Verify Lambda has `PutItem` permission for BookingRequest table
- Check if booking request is in a different table (e.g., from a different API)

### Issue 2: Company ID Mismatch
**Symptom**: Booking request exists but `companyId` doesn't match what dashboard is querying.

**Possible Causes:**
- Admin mode selected a different company
- User is viewing a different company
- Company context resolved to wrong company

**Fix:**
- Verify which company you're viewing in the dashboard
- Check if Admin mode is active and which company is selected
- Ensure you're viewing GLS Transportation (companyId: `b5370862-2a4f-4f8a-9f84-174dea888e08`)

### Issue 3: Resolver Filter Not Matching
**Symptom**: Booking request exists with correct `companyId`, but resolver returns empty array.

**Possible Causes:**
- Filter expression syntax issue
- DynamoDB attribute type mismatch (e.g., String vs Binary)
- Case sensitivity issue

**Fix:**
- Check AppSync CloudWatch logs for resolver execution
- Verify `companyId` attribute type in DynamoDB (should be String)
- Check if `companyId` has any whitespace or special characters

## Next Steps

After completing these steps, you should know:
1. ✅ Does the booking request exist?
2. ✅ What is its `companyId`?
3. ✅ What `companyId` is the dashboard querying?
4. ✅ What does the resolver log show?

Share these findings to continue troubleshooting!
