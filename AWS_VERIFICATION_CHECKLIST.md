# AWS Verification Checklist

This document provides a comprehensive checklist to verify your AWS setup is correct. Follow these checks in order to identify and resolve any configuration issues.

## Prerequisites

- AWS Console access with appropriate permissions
- AWS CLI configured (optional, for some checks)
- Access to CloudWatch Logs

---

## 1. AppSync API Configuration

### 1.1 Verify AppSync API Exists and Get API ID

**AWS Console:**
1. Go to **AWS AppSync** → **APIs**
2. Find your API (should match your Amplify app)
3. Note the **API ID** (e.g., `ukoh7tgmwjbjdhnuirxugqx4ci`)
4. Click on the API to view details

**What to check:**
- ✅ API exists and is in `Available` status
- ✅ API ID matches what your backend is deploying to
- ✅ Region is correct (e.g., `us-east-1`)

**Expected API ID:**
- Your deployed frontend should use the same API ID as your backend
- Check `amplify_outputs.json` in your deployed app vs. local config
- **Issue:** If frontend uses `klp7rzjva5c2bef2zjaygpod44` but backend deploys to `ukoh7tgmwjbjdhnuirxugqx4ci`, there's a mismatch

### 1.2 Verify Custom Query Exists

**AWS Console:**
1. In AppSync API → **Schema** tab
2. Search for `listBookingRequestsForCompany` in the schema
3. Verify it exists in the `Query` type

**GraphQL Query Test:**
```graphql
query TestQuery {
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
  }
}
```

**What to check:**
- ✅ `listBookingRequestsForCompany` appears in the schema
- ✅ It accepts `companyId: ID!` argument
- ✅ Returns `[BookingRequest]`

**If missing:**
- Backend deployment may have failed
- Check CloudFormation stack status (see section 6)

### 1.3 Verify Authorization Modes

**AWS Console:**
1. In AppSync API → **Settings** tab
2. Check **Authorization modes**

**What to check:**
- ✅ **Amazon Cognito User Pool** is enabled (for authenticated users)
- ✅ **AWS IAM** is enabled (for Lambda functions like `publicBooking`)
- ✅ Default authorization type is set correctly

---

## 2. Lambda Function: publicBooking

### 2.1 Verify Function Exists

**AWS Console:**
1. Go to **AWS Lambda** → **Functions**
2. Search for `publicBooking` or filter by your Amplify app name
3. Click on the function

**What to check:**
- ✅ Function exists and is in `Active` state
- ✅ Runtime is correct (e.g., `Node.js 20.x`)
- ✅ Handler is set correctly (e.g., `index.handler`)

### 2.2 Verify Environment Variables

**AWS Console:**
1. In Lambda function → **Configuration** → **Environment variables**

**Required variables:**
- ✅ `AMPLIFY_DATA_GRAPHQL_ENDPOINT` - Should be your AppSync API URL (e.g., `https://ukoh7tgmwjbjdhnuirxugqx4ci.appsync-api.us-east-1.amazonaws.com/graphql`)
- ✅ `AMPLIFY_DATA_REGION` - Should match your AppSync region (e.g., `us-east-1`)
- ✅ `COMPANY_TABLE_NAME` - Should be the DynamoDB table name for Company (e.g., `Company-xxxxx`)

**What to check:**
- ✅ All three variables are present
- ✅ `AMPLIFY_DATA_GRAPHQL_ENDPOINT` matches your AppSync API URL (from section 1.1)
- ✅ `COMPANY_TABLE_NAME` is not empty

**If `COMPANY_TABLE_NAME` is missing:**
- The backend deployment may have failed to set it
- Check CloudFormation stack (section 6)
- You may need to manually set it (see troubleshooting)

### 2.3 Verify IAM Permissions

**AWS Console:**
1. In Lambda function → **Configuration** → **Permissions**
2. Click on the **Execution role** name
3. In IAM → **Permissions** tab → **Permissions policies**

**Required permissions:**
- ✅ `appsync:GraphQL` - To query AppSync API
- ✅ `dynamodb:Scan` - To scan Company table (fallback)
- ✅ `dynamodb:Query` - To query DynamoDB tables
- ✅ `dynamodb:GetItem` - To read items from DynamoDB
- ✅ `dynamodb:PutItem` - To create booking requests

**What to check:**
- ✅ Execution role has a policy that includes these permissions
- ✅ Policy is attached to the role
- ✅ No explicit denies that would block access

**Common policy name:**
- Look for a policy like `amplify-{app-id}-{branch}-{env}-publicBooking-{hash}`

### 2.4 Verify Function URL (if used)

**AWS Console:**
1. In Lambda function → **Configuration** → **Function URL**
2. Check if a Function URL exists

**What to check:**
- ✅ Function URL is configured (if your frontend uses it)
- ✅ Auth type is set correctly (e.g., `AWS_IAM` or `NONE`)
- ✅ CORS is configured if needed
- ✅ URL matches `VITE_BOOKING_API_URL` in your frontend environment

**If missing:**
- Create a Function URL manually or redeploy backend
- See `PUBLIC_BOOKING_LAMBDA_SETUP.md` for instructions

---

## 3. DynamoDB Tables

### 3.1 Verify Company Table Exists

**AWS Console:**
1. Go to **AWS DynamoDB** → **Tables**
2. Search for `Company` or filter by table name pattern
3. Click on the table

**What to check:**
- ✅ Table exists
- ✅ Table status is `Active`
- ✅ Table name matches `COMPANY_TABLE_NAME` in Lambda (section 2.2)

### 3.2 Verify Company Data

**AWS Console:**
1. In DynamoDB table → **Explore table items**
2. Scan or query items
3. Look for companies with `bookingEnabled = true`

**What to check:**
- ✅ Companies exist in the table
- ✅ Companies have `bookingEnabled` field set to `true` (or `1` in DynamoDB format)
- ✅ Companies have `bookingCode` field set (not null/empty)
- ✅ `bookingCode` values are unique

**Query example (in DynamoDB Console):**
- Filter: `bookingEnabled = true`
- Check that `bookingCode` is not null for enabled companies

**Common issues:**
- Companies may have `bookingEnabled: false` or `null`
- Companies may have `bookingCode: null` or empty string
- This prevents the booking portal from finding them

### 3.3 Verify BookingRequest Table Exists

**AWS Console:**
1. Go to **AWS DynamoDB** → **Tables**
2. Search for `BookingRequest` table
3. Verify it exists and is `Active`

**What to check:**
- ✅ Table exists
- ✅ Table has `companyId` as a partition key (or GSI)
- ✅ Table has `receivedAt` field (if schema was updated)

---

## 4. CloudWatch Logs

### 4.1 Check publicBooking Lambda Logs

**AWS Console:**
1. Go to **AWS CloudWatch** → **Log groups**
2. Search for `/aws/lambda/` and your function name (e.g., `publicBooking`)
3. Click on the most recent log stream

**What to look for:**
- ✅ Recent log entries (within last hour/day)
- ✅ No `ENOTFOUND` errors for AppSync endpoint
- ✅ Diagnostic logs from `getCompanyByCode` function:
  - `"Attempting DynamoDB fallback for booking code: {code}"`
  - `"COMPANY_TABLE_NAME: {table-name}"`
  - `"DynamoDB scan found {count} items"`
  - `"Found {count} companies with bookingEnabled=true"`
  - `"Match found via DynamoDB fallback: {company-id}"` or `"No match found"`

**If logs show:**
- `COMPANY_TABLE_NAME: undefined` → Environment variable not set (section 2.2)
- `DynamoDB scan found 0 items` → Table name is wrong or table is empty
- `No match found` → Check that companies have correct `bookingCode` and `bookingEnabled` (section 3.2)

### 4.2 Check for Errors

**AWS Console:**
1. In CloudWatch Logs → Filter logs by `ERROR` or `Exception`
2. Review error messages

**Common errors:**
- `getaddrinfo ENOTFOUND` → AppSync endpoint is wrong (section 2.2)
- `AccessDeniedException` → IAM permissions issue (section 2.3)
- `ResourceNotFoundException` → Table name is wrong (section 2.2, 3.1)

---

## 5. Cognito User Pool

### 5.1 Verify User Pool Exists

**AWS Console:**
1. Go to **Amazon Cognito** → **User pools**
2. Find your user pool (should match Amplify app)
3. Click on it

**What to check:**
- ✅ User pool exists and is `Active`
- ✅ User pool ID matches what your frontend uses

### 5.2 Verify App Client Configuration

**AWS Console:**
1. In User Pool → **App integration** → **App clients**
2. Click on your app client

**What to check:**
- ✅ App client exists
- ✅ **Callback URLs** include your frontend URL (e.g., `https://onyxdispatch.us`)
- ✅ **Sign-out URLs** include your frontend URL
- ✅ **Allowed OAuth flows** are configured correctly

**Common issue:**
- If callback URLs don't include your custom domain, authentication will fail

---

## 6. CloudFormation Stack Status

### 6.1 Verify Backend Stack is Deployed

**AWS Console:**
1. Go to **AWS CloudFormation** → **Stacks**
2. Search for stacks with `amplify-{app-id}-{branch}` pattern
3. Find the main backend stack (e.g., `amplify-d1wxo3x0z5r1oq-main-branch-{hash}`)

**What to check:**
- ✅ Stack status is `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- ✅ No `UPDATE_ROLLBACK_COMPLETE` or `ROLLBACK_COMPLETE` status
- ✅ All resources show `CREATE_COMPLETE` or `UPDATE_COMPLETE`

**If stack is in `UPDATE_ROLLBACK_COMPLETE`:**
- Deployment failed
- Check **Events** tab for the error
- Common error: `Resource already exists` → Need to delete conflicting resource or rename

### 6.2 Check Nested Stacks

**AWS Console:**
1. In main stack → **Stack resources** tab
2. Look for nested stacks (e.g., `amplify-{app-id}-{branch}-data-{hash}`)

**What to check:**
- ✅ All nested stacks are `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- ✅ No nested stacks in `ROLLBACK` or `FAILED` state

**Common nested stack:**
- `amplify-{app-id}-{branch}-data-{hash}` - Contains AppSync API and DynamoDB tables
- `amplify-{app-id}-{branch}-publicBooking-{hash}` - Contains Lambda function

---

## 7. Amplify Console - Backend Build Status

### 7.1 Verify Latest Backend Build

**AWS Console:**
1. Go to **AWS Amplify** → **App** → Your app
2. Click on **Backend environments** or **Backend**
3. Check the latest build/deployment

**What to check:**
- ✅ Latest backend build status is `Succeeded`
- ✅ No failed builds
- ✅ Build completed recently (within last deployment)

**If build failed:**
- Check build logs for errors
- Common issues:
  - Missing environment variables
  - CloudFormation errors (see section 6)
  - Dependency installation failures

### 7.2 Verify Frontend Build Uses Correct Backend

**AWS Console:**
1. In Amplify → **App** → **Hosting**
2. Check the latest frontend build
3. View build logs or artifacts

**What to check:**
- ✅ Frontend build includes `amplify_outputs.json`
- ✅ `amplify_outputs.json` has correct `data.url` (AppSync API URL)
- ✅ API URL matches the backend API (section 1.1)

**To verify:**
- Download build artifacts and check `amplify_outputs.json`
- Or check the deployed app's `amplify_outputs.json` (if accessible)

---

## 8. Quick Verification Tests

### 8.1 Test AppSync API Directly

**Using AWS Console:**
1. Go to AppSync API → **Queries** tab
2. Sign in with a test user (if needed)
3. Try querying:

```graphql
query TestCompany {
  listCompanies {
    items {
      id
      name
      bookingEnabled
      bookingCode
    }
  }
}
```

**What to check:**
- ✅ Query executes successfully
- ✅ Returns companies with `bookingEnabled: true`
- ✅ Companies have non-null `bookingCode`

### 8.2 Test Lambda Function

**Using AWS Console:**
1. Go to Lambda → `publicBooking` function
2. **Test** tab → Create a test event:

```json
{
  "action": "getCompany",
  "code": "GLS"
}
```

3. Execute test

**What to check:**
- ✅ Function executes without errors
- ✅ Returns company data if code exists
- ✅ Returns appropriate error if code doesn't exist
- ✅ Check CloudWatch logs for diagnostic output (section 4.1)

### 8.3 Test Function URL (if used)

**Using curl or browser:**
```bash
curl -X POST https://{function-url-id}.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action":"getCompany","code":"GLS"}'
```

**What to check:**
- ✅ Returns 200 status
- ✅ Returns JSON response with company data
- ✅ CORS headers are present (if calling from browser)

---

## 9. Common Issues and Fixes

### Issue: API ID Mismatch

**Symptoms:**
- Frontend uses different AppSync API than backend
- Queries fail with "Field undefined" errors

**Fix:**
1. Identify which API the frontend should use (check deployed `amplify_outputs.json`)
2. Ensure backend deploys to the same API
3. If using multiple Amplify apps, verify app IDs match

### Issue: COMPANY_TABLE_NAME Not Set

**Symptoms:**
- Lambda logs show `COMPANY_TABLE_NAME: undefined`
- DynamoDB fallback doesn't work

**Fix:**
1. Check `amplify/backend.ts` - verify table name is being set
2. Redeploy backend
3. If still missing, manually set in Lambda environment variables (temporary fix)

### Issue: Companies Not Found by Booking Code

**Symptoms:**
- Booking portal can't find companies even though they're enabled
- Lambda logs show "No match found"

**Fix:**
1. Verify companies have `bookingEnabled: true` in DynamoDB (section 3.2)
2. Verify companies have non-null `bookingCode` in DynamoDB
3. Check that `bookingCode` matches what's being searched (case-sensitive)
4. Review Lambda logs for diagnostic output (section 4.1)

### Issue: IAM Permissions Missing

**Symptoms:**
- Lambda logs show `AccessDeniedException`
- AppSync queries fail from Lambda

**Fix:**
1. Check Lambda execution role permissions (section 2.3)
2. Verify policy includes `appsync:GraphQL` and DynamoDB permissions
3. Redeploy backend to regenerate IAM policies

### Issue: Custom Query Not Deployed

**Symptoms:**
- `listBookingRequestsForCompany` is undefined in AppSync
- Frontend gets "Field undefined" error

**Fix:**
1. Check CloudFormation stack status (section 6)
2. Verify query exists in `amplify/data/resource.ts`
3. Redeploy backend
4. Check AppSync schema (section 1.2)

---

## 10. Summary Checklist

Use this quick checklist to verify everything:

- [ ] AppSync API exists and is active
- [ ] AppSync API ID matches frontend configuration
- [ ] Custom query `listBookingRequestsForCompany` exists in schema
- [ ] Lambda function `publicBooking` exists
- [ ] Lambda has all 3 required environment variables set
- [ ] Lambda execution role has correct IAM permissions
- [ ] DynamoDB Company table exists
- [ ] Companies in table have `bookingEnabled: true` and non-null `bookingCode`
- [ ] CloudWatch logs show no errors
- [ ] CloudFormation stack is `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- [ ] Amplify backend build succeeded
- [ ] Frontend `amplify_outputs.json` matches backend API

---

## Next Steps

After completing these checks:

1. **If all checks pass:** Your setup is correct. If issues persist, check application code or frontend configuration.

2. **If checks fail:** 
   - Note which sections failed
   - Review the "Common Issues and Fixes" section
   - Redeploy backend if needed
   - Check CloudWatch logs for detailed error messages

3. **For specific issues:**
   - Company lookup: Focus on sections 2.2, 3.2, and 4.1
   - API mismatch: Focus on sections 1.1 and 7.2
   - Permissions: Focus on sections 2.3 and 4.2

---

## Additional Resources

- `PUBLIC_BOOKING_LAMBDA_SETUP.md` - Detailed setup instructions
- AWS AppSync Documentation
- AWS Lambda Documentation
- AWS Amplify Gen 2 Documentation
