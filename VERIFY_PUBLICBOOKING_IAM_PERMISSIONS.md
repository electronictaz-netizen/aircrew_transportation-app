# Verify publicBooking Lambda IAM Permissions

## What Was Added

I've added explicit IAM permissions to the `publicBooking` Lambda function in `amplify/backend.ts`:

1. **AppSync GraphQL permissions** - Allows the Lambda to query the AppSync API
2. **DynamoDB permissions** - Allows Scan, Query, GetItem, and PutItem operations

## Required Permissions

The `publicBooking` Lambda needs these permissions:

- ✅ `appsync:GraphQL` - To query AppSync API with IAM authentication
- ✅ `dynamodb:Scan` - To scan Company table (fallback mechanism)
- ✅ `dynamodb:Query` - To query DynamoDB tables
- ✅ `dynamodb:GetItem` - To read items from DynamoDB
- ✅ `dynamodb:PutItem` - To create booking requests

## How to Verify After Deployment

### Step 1: Find the Lambda Function

1. Go to **AWS Lambda** → **Functions**
2. Search for `publicBooking` or filter by your Amplify app name
3. Click on the function

### Step 2: Check the Execution Role

1. In Lambda function → **Configuration** → **Permissions**
2. Click on the **Execution role** name (e.g., `amplify-{app-id}-{branch}-publicBooking-{hash}`)
3. This opens the IAM role in a new tab

### Step 3: Verify Permissions

In the IAM role page:

1. Go to **Permissions** tab
2. You should see policies attached. Look for:
   - A policy with `AllowAppSyncGraphQL` (SID)
   - A policy with `AllowDynamoDBOperations` (SID)
   - Or policies that include these permissions

### Step 4: Check Policy Details

Click on each policy to view its JSON. You should see:

**Policy 1: AppSync GraphQL**
```json
{
  "Sid": "AllowAppSyncGraphQL",
  "Effect": "Allow",
  "Action": [
    "appsync:GraphQL"
  ],
  "Resource": [
    "arn:aws:appsync:us-east-1:ACCOUNT_ID:apis/API_ID/*"
  ]
}
```

**Policy 2: DynamoDB Operations**
```json
{
  "Sid": "AllowDynamoDBOperations",
  "Effect": "Allow",
  "Action": [
    "dynamodb:Scan",
    "dynamodb:Query",
    "dynamodb:GetItem",
    "dynamodb:PutItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/Company-*",
    "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/BookingRequest-*"
  ]
}
```

## If Permissions Are Missing

### Option 1: Redeploy Backend (Recommended)

The permissions are defined in `amplify/backend.ts`. After you commit and push:

1. The backend build will run
2. CloudFormation will update the Lambda's IAM role
3. Permissions should be added automatically

**To trigger:**
```bash
git add amplify/backend.ts
git commit -m "Add explicit IAM permissions for publicBooking Lambda"
git push
```

### Option 2: Manually Add Permissions (Temporary Fix)

If you need to fix it immediately without redeploying:

1. Go to **IAM** → **Roles**
2. Find the `publicBooking` Lambda's execution role
3. Click **Add permissions** → **Create inline policy**
4. Use **JSON** editor and paste:

**For AppSync:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppSyncGraphQL",
      "Effect": "Allow",
      "Action": [
        "appsync:GraphQL"
      ],
      "Resource": [
        "arn:aws:appsync:us-east-1:YOUR_ACCOUNT_ID:apis/ukoh7tgmwjbjdhnuirxugqx4ci/*"
      ]
    }
  ]
}
```

**For DynamoDB:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDynamoDBOperations",
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/Company-*",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/BookingRequest-*"
      ]
    }
  ]
}
```

**Replace:**
- `YOUR_ACCOUNT_ID` - Your AWS account ID (visible in top right of AWS Console)
- `ukoh7tgmwjbjdhnuirxugqx4ci` - Your AppSync API ID (from Lambda environment variable `AMPLIFY_DATA_GRAPHQL_ENDPOINT`)

## Verify Permissions Are Working

### Test 1: Check CloudWatch Logs

1. Go to **CloudWatch** → **Log groups**
2. Find `/aws/lambda/publicBooking-{branch}-{app-id}`
3. Look for recent invocations
4. Check for errors like:
   - `AccessDeniedException` → Missing permissions
   - `UnauthorizedOperation` → Missing permissions
   - If no errors, permissions are likely working

### Test 2: Test the Lambda Function

1. Go to **Lambda** → `publicBooking` function
2. **Test** tab → Create test event:
```json
{
  "action": "getCompany",
  "code": "GLS"
}
```
3. Execute test
4. Check results:
   - ✅ Success → Permissions are working
   - ❌ AccessDenied error → Permissions missing

## Common Issues

### Issue: Permissions Not Showing After Deployment

**Possible causes:**
1. Backend build didn't complete successfully
2. CloudFormation stack update failed
3. Permissions were added but IAM console hasn't refreshed

**Fix:**
1. Check CloudFormation stack status
2. Wait a few minutes and refresh IAM console
3. Check CloudWatch logs for deployment errors

### Issue: "AccessDenied" Errors in Lambda

**Possible causes:**
1. Permissions not deployed yet
2. Wrong API ID in AppSync resource ARN
3. Wrong table names in DynamoDB resource ARN

**Fix:**
1. Verify API ID matches `AMPLIFY_DATA_GRAPHQL_ENDPOINT` env var
2. Verify table names match actual DynamoDB table names
3. Check IAM role has the policies attached

## After Verification

Once you confirm the permissions are present:

1. ✅ Test the booking portal functionality
2. ✅ Verify booking requests can be created
3. ✅ Check that DynamoDB fallback works (if AppSync query fails)

## Next Steps

1. **Commit and push** the `amplify/backend.ts` changes
2. **Wait for backend build** to complete
3. **Verify permissions** using the steps above
4. **Test the booking portal** to ensure everything works
