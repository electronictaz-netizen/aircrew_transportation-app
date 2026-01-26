# Debug Filter Issue - Step by Step

## Step 1: Verify Attribute Name in DynamoDB

The filter uses `companyId`, but DynamoDB might store it differently.

1. Go to **AWS DynamoDB** → **Tables** → `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
2. Click **Explore table items**
3. Click on one of the booking requests to view its details
4. **Check the exact attribute name:**
   - Is it `companyId`?
   - Or `_companyId`?
   - Or something else?
   - **Note the exact name and type**

## Step 2: Check Attribute Value Format

1. In the same booking request item, check the `companyId` value:
   - **Type:** Should be `String (S)`
   - **Value:** Should be exactly `b5370862-2a4f-4f8a-9f84-174dea888e08`
   - **No extra spaces, quotes, or characters**

## Step 3: Test Query in AppSync Console

1. Go to **AWS AppSync** → **APIs** → `ukoh7tgmwjbjdhnuirxugqx4ci` (amplifyData)
2. Click **Queries** tab
3. **Sign in** (select "Amazon Cognito User Pool" and login)
4. Run:
```graphql
query {
  listBookingRequestsForCompany(companyId: "b5370862-2a4f-4f8a-9f84-174dea888e08") {
    id
    customerName
    companyId
  }
}
```

**Result:** Should still return empty array (we know this, but confirming)

## Step 4: Check for GSI (Global Secondary Index)

Amplify might have created a GSI on `companyId` that we should use instead of Scan.

1. Go to **DynamoDB** → `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
2. Click **Indexes** tab
3. **Look for a GSI with `companyId` as the partition key**
4. If one exists, note its name (e.g., `gsi-companyId` or `BookingRequestByCompanyId`)

**If GSI exists:** We should use `Query` instead of `Scan` (more efficient and reliable)

## Step 5: Check CloudWatch Logs (If Available)

1. Go to **AWS CloudWatch** → **Log groups**
2. Find: `/aws/appsync/apis/ukoh7tgmwjbjdhnuirxugqx4ci`
3. Look for recent log streams
4. Search for: `listBookingRequestsForCompany`

**Note:** We removed logging, so there might not be logs. But check anyway.

## Step 6: Test Different Filter Expressions

If the attribute name is correct but filter still doesn't work, we might need to try:

### Option A: Check if attribute has a prefix
- Try `_companyId` instead of `companyId`
- Try `companyId#S` (Amplify sometimes adds type suffix)

### Option B: Use different filter syntax
- Current: `companyId = :cid`
- Try: `attribute_exists(companyId) AND companyId = :cid`
- Try: `contains(companyId, :cid)` (if it's a string)

### Option C: Check if we need to use Query with GSI
- If a GSI exists on `companyId`, use `Query` instead of `Scan`
- Query is more efficient and reliable for filtering

## Most Likely Fix

Based on Amplify Gen 2 behavior, the most likely issue is:

1. **GSI exists:** Amplify automatically creates GSIs for `belongsTo` relationships
2. **We should use Query:** Instead of Scan with filter, use Query on the GSI
3. **Attribute name:** Should be `companyId`, but verify in DynamoDB

## Next Steps After Checking

Once you've checked:
1. **Attribute name in DynamoDB** - Share what you find
2. **If GSI exists** - Share the GSI name
3. **Test result** - Confirm query still returns empty

Then I can update the resolver to use the correct approach (Query with GSI or fix the filter expression).
