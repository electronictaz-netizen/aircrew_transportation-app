# Fix Company Booking Settings Not Persisting

## Problem

The CloudWatch logs show that "Test Bed Company" has `bookingEnabled: null` and `bookingCode: null` in DynamoDB, even though you may have tried to set them in the UI. This prevents the booking portal from finding the company.

## Root Cause

The company settings update (`Company.update`) may not have persisted to DynamoDB. This can happen if:
1. The GraphQL mutation succeeded but didn't write to DynamoDB
2. The update was made to a different company record
3. There's a data sync issue

## Solution: Verify and Fix in AWS Console

### Step 1: Verify Current State in DynamoDB

1. Go to **AWS DynamoDB** → **Tables**
2. Find the `Company` table (e.g., `Company-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`)
3. Click **Explore table items**
4. Search for "Test Bed Company" or filter by company name
5. Check the item's attributes:
   - Look for `bookingEnabled` - should be `true` (or `1` in DynamoDB boolean format)
   - Look for `bookingCode` - should be `"TEST"` (string value)

**What you'll likely see:**
- `bookingEnabled` is missing or `null`
- `bookingCode` is missing or `null`

### Step 2: Update Directly in DynamoDB (Quick Fix)

**Option A: Using AWS Console**

1. In DynamoDB → **Explore table items**
2. Find the "Test Bed Company" item
3. Click **Edit item**
4. Add or update:
   - **Attribute name:** `bookingEnabled`
   - **Type:** `Boolean`
   - **Value:** `true`
5. Add or update:
   - **Attribute name:** `bookingCode`
   - **Type:** `String`
   - **Value:** `TEST`
6. Click **Save changes**

**Option B: Using AWS CLI**

```bash
aws dynamodb update-item \
  --table-name "Company-ukoh7tgmwjbjdhnuirxugqx4ci-NONE" \
  --key '{"id":{"S":"<company-id>"}}' \
  --update-expression "SET bookingEnabled = :be, bookingCode = :bc" \
  --expression-attribute-values '{":be":{"BOOL":true},":bc":{"S":"TEST"}}' \
  --region us-east-1
```

Replace `<company-id>` with the actual company ID from DynamoDB.

### Step 3: Verify the Update

1. Refresh the DynamoDB item view
2. Confirm `bookingEnabled` is `true` and `bookingCode` is `"TEST"`
3. Test the booking portal again with code `TEST`

### Step 4: Test via Lambda

1. Go to **AWS Lambda** → `publicBooking` function
2. **Test** tab → Create test event:
```json
{
  "action": "getCompany",
  "code": "TEST"
}
```
3. Execute test
4. Check CloudWatch logs - should now show:
   - `matched: true`
   - Company data returned

## Alternative: Fix via UI (If Update Persists)

If you prefer to use the UI:

1. Go to your app → Company Management
2. Find "Test Bed Company"
3. Enable booking portal
4. Set booking code to `TEST`
5. **Save**
6. **Verify in DynamoDB** (Step 1) that the values were saved
7. If not saved, use Step 2 (direct DynamoDB update)

## Why This Happens

The `Company.update` mutation in AppSync may succeed (return 200) but fail to write to DynamoDB if:
- There's an authorization issue (though unlikely if mutation succeeds)
- There's a resolver issue
- The update input doesn't include all required fields
- There's a race condition or caching issue

## Prevention

After fixing, monitor:
1. **CloudWatch Logs** - Check for any errors during company updates
2. **DynamoDB** - Periodically verify that updates persist
3. **UI Feedback** - Ensure success toasts appear (currently missing per previous issues)

## Verification Checklist

After fixing, verify:

- [ ] DynamoDB shows `bookingEnabled: true` for "Test Bed Company"
- [ ] DynamoDB shows `bookingCode: "TEST"` for "Test Bed Company"
- [ ] Lambda test with code `TEST` returns company data
- [ ] Booking portal at `/booking/TEST` loads correctly
- [ ] CloudWatch logs show `matched: true` for code `TEST`

## Next Steps

1. Fix "Test Bed Company" using Step 2 above
2. Check other companies ("test company") that may have the same issue
3. Investigate why `Company.update` isn't persisting (check AppSync resolvers, IAM permissions)
4. Add better error handling in the UI to detect when updates don't persist
