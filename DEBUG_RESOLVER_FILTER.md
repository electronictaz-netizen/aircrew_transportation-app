# Debug Resolver Filter - Query Returns Empty

## The Problem

The query `listBookingRequestsForCompany` returns an empty array even though:
- ✅ 4 booking requests exist in DynamoDB
- ✅ All have `companyId: b5370862-2a4f-4f8a-9f84-174dea888e08`
- ✅ Query works (no errors, just empty result)

This means the **resolver filter isn't matching**.

## Step 1: Check CloudWatch Logs

1. Go to **AWS CloudWatch** → **Log groups**
2. Find: `/aws/appsync/apis/ukoh7tgmwjbjdhnuirxugqx4ci`
3. Look for recent log streams (should have timestamps around when you ran the query)
4. Search for: `listBookingRequestsForCompany`

**Look for:**
- How many items were scanned
- How many items matched the filter
- Any errors or warnings

## Step 2: Verify companyId Format in DynamoDB

1. Go to **DynamoDB** → `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
2. Open one of the booking requests (click on it)
3. Check the `companyId` attribute:
   - **Attribute name:** Should be exactly `companyId` (not `_companyId` or `companyId#S`)
   - **Type:** Should be `String (S)`
   - **Value:** Should be exactly `b5370862-2a4f-4f8a-9f84-174dea888e08`
   - **No extra spaces, quotes, or special characters**

## Step 3: Check Resolver Code

The current resolver uses:
```javascript
filter: {
  expression: 'companyId = :cid',
  expressionValues: { 
    ':cid': dynamoDbValue
  },
}
```

**Possible issues:**
1. The filter expression might need different syntax
2. The attribute name in DynamoDB might be different
3. The `util.dynamodb.toDynamoDB()` conversion might be creating the wrong format

## Step 4: Test Different Filter Approaches

If CloudWatch logs show items are being scanned but not matched, try:

### Option A: Use `contains` instead of `=`
```javascript
expression: 'contains(companyId, :cid)'
```

### Option B: Check if attribute name is different
- In DynamoDB, check if it's stored as `_companyId` or `companyId#S`
- Amplify might add prefixes/suffixes

### Option C: Use Query instead of Scan
If there's a GSI on `companyId`, we could use Query instead of Scan (more efficient and reliable).

## Step 5: Add Logging to Resolver

We removed logging earlier to fix syntax errors, but we can add simple logging back:

```javascript
export function request(ctx) {
  const companyId = ctx.args.companyId;
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  
  util.log('companyId:', companyId);
  util.log('dynamoDbValue:', dynamoDbValue);
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'companyId = :cid',
      expressionValues: { 
        ':cid': dynamoDbValue
      },
    },
    limit: 100,
  };
}

export function response(ctx) {
  util.log('Items scanned:', ctx.result.ScannedCount);
  util.log('Items matched:', ctx.result.Count);
  util.log('Items returned:', ctx.result.Items ? ctx.result.Items.length : 0);
  
  const items = ctx.result.Items || [];
  return items;
}
```

## Most Likely Issue

Based on Amplify Gen 2 behavior, the `companyId` in DynamoDB might be stored with a different attribute name or format. Common issues:

1. **Attribute name:** Might be `_companyId` instead of `companyId`
2. **Format:** Might include type information like `companyId#S`
3. **GSI:** The table might have a GSI on `companyId` that we should use instead of Scan

## Next Steps

1. **Check CloudWatch logs** - This will show us exactly what's happening
2. **Verify DynamoDB attribute name** - Make sure it's exactly `companyId`
3. **Check if there's a GSI** - We might be able to use Query instead of Scan
