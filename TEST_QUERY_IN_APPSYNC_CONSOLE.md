# Test Query Directly in AppSync Console

## Step 1: Test the Query

1. Go to **AWS AppSync** → **APIs** → `ukoh7tgmwjbjdhnuirxugqx4ci` (amplifyData)
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

## Expected Results

### If Query Returns the 4 Booking Requests:
✅ **The resolver is working!** The issue is with the frontend or how it's calling the query.

### If Query Returns Empty Array:
❌ **The resolver filter isn't matching.** Possible causes:
1. The `companyId` format in DynamoDB doesn't match what we're querying
2. The filter expression isn't working correctly
3. The Scan operation isn't finding the items

## Step 2: Check CloudWatch Logs

If the query returns empty, check the resolver logs:

1. Go to **AWS CloudWatch** → **Log groups**
2. Find: `/aws/appsync/apis/ukoh7tgmwjbjdhnuirxugqx4ci`
3. Look for recent log streams
4. Check logs for `listBookingRequestsForCompany`

**Look for:**
- How many items were scanned
- How many items matched the filter
- Any errors

## Step 3: Verify companyId Format in DynamoDB

1. Go to **DynamoDB** → `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
2. Open one of the booking requests
3. Check the `companyId` attribute:
   - **Type:** Should be `String (S)`
   - **Value:** Should be exactly `b5370862-2a4f-4f8a-9f84-174dea888e08`
   - **No extra spaces or characters**

## Step 4: Test with Different Filter

If the query still returns empty, the issue might be with the Scan filter. The resolver uses:

```javascript
filter: {
  expression: 'companyId = :cid',
  expressionValues: { 
    ':cid': dynamoDbValue
  },
}
```

**Possible issues:**
1. The filter expression syntax might need to be different
2. The DynamoDB attribute name might be different (e.g., `_companyId` or `companyId#S`)
3. The Scan might need to use a different approach

## Next Steps Based on Results

**If query works in AppSync Console:**
- The resolver is correct
- The issue is with the frontend configuration or how it's calling the query
- Check browser console for errors
- Verify the frontend is using the correct API

**If query doesn't work in AppSync Console:**
- The resolver needs to be fixed
- Check CloudWatch logs for details
- Verify the `companyId` format in DynamoDB matches what we're querying
- Consider using a GSI (Global Secondary Index) on `companyId` instead of Scan with filter
