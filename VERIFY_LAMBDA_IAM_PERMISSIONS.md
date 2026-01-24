# How to Verify Lambda Function IAM Permissions for GraphQL API

This guide explains how to verify that your Lambda function has the correct IAM permissions to access the Amplify GraphQL API.

## Overview

In Amplify Gen 2, functions defined in `backend.ts` should automatically receive IAM permissions to access the data resource. However, it's good to verify these permissions are correctly configured.

## Method 1: AWS Console (Recommended)

### Step 1: Find Your Lambda Function

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Select your Amplify app's region (e.g., `us-east-1`)
3. Search for your function name: `publicBooking-<branch>-<app-id>`
   - Example: `publicBooking-main-abc123def456`

### Step 2: Check the IAM Role

1. Click on your Lambda function
2. Go to the **Configuration** tab
3. Click on **Permissions** in the left sidebar
4. Under **Execution role**, click on the role name (e.g., `amplify-<app-id>-<branch>-<function-name>-<id>`)

### Step 3: Verify Permissions

1. In the IAM role page, click on the **Permissions** tab
2. You should see one or more policies attached. Look for policies that include:
   - **AppSync GraphQL permissions**: `appsync:GraphQL`
   - **AppSync API access**: Permission to access your specific GraphQL API

### Step 4: Check Policy Details

Click on a policy to see its JSON. You should see something like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "appsync:GraphQL"
      ],
      "Resource": [
        "arn:aws:appsync:us-east-1:ACCOUNT_ID:apis/API_ID/*"
      ]
    }
  ]
}
```

**Required Permissions:**
- `appsync:GraphQL` - Allows the function to execute GraphQL queries/mutations
- The resource ARN should match your GraphQL API ARN

## Method 2: AWS CLI

### Step 1: Get the Function Name

```bash
aws lambda list-functions --region us-east-1 --query "Functions[?contains(FunctionName, 'publicBooking')].FunctionName" --output text
```

### Step 2: Get the IAM Role ARN

```bash
FUNCTION_NAME="publicBooking-main-abc123def456"  # Replace with your actual function name
aws lambda get-function-configuration --function-name $FUNCTION_NAME --region us-east-1 --query "Role" --output text
```

### Step 3: Get the Role Name from ARN

The output will be an ARN like: `arn:aws:iam::ACCOUNT_ID:role/amplify-...`

Extract the role name (the part after the last `/`).

### Step 4: List Attached Policies

```bash
ROLE_NAME="amplify-abc123def456-main-publicBooking-xyz789"  # Replace with your actual role name
aws iam list-attached-role-policies --role-name $ROLE_NAME --region us-east-1
```

### Step 5: Get Policy Details

```bash
POLICY_ARN="arn:aws:iam::ACCOUNT_ID:policy/..."  # From previous command
aws iam get-policy-version --policy-arn $POLICY_ARN --version-id v1 --query "PolicyVersion.Document"
```

## Method 3: Check via CloudWatch Logs

If the function is failing with "No credentials" or permission errors, check CloudWatch logs:

1. Go to [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
2. Find the log group: `/aws/lambda/publicBooking-<branch>-<app-id>`
3. Look for errors related to:
   - `AccessDenied`
   - `UnauthorizedOperation`
   - `No credentials`

## What to Look For

### ✅ Correct Configuration

- IAM role is attached to the Lambda function
- Policy includes `appsync:GraphQL` action
- Resource ARN matches your GraphQL API ARN
- Policy allows access to `*` (all operations) or specific operations

### ❌ Common Issues

1. **No IAM Role Attached**
   - **Fix**: The function should automatically get a role in Amplify Gen 2. If not, check your `backend.ts` configuration.

2. **Missing AppSync Permissions**
   - **Fix**: Add a policy with `appsync:GraphQL` permission to the role.

3. **Wrong Resource ARN**
   - **Fix**: Ensure the policy resource ARN matches your GraphQL API ARN.

4. **Role Not in Same Account/Region**
   - **Fix**: Ensure the IAM role is in the same AWS account and region as your Lambda function.

## Manual Fix (If Needed)

If permissions are missing, you can add them manually:

### Option 1: Via AWS Console

1. Go to IAM Console → Roles
2. Find your Lambda function's role
3. Click **Add permissions** → **Create inline policy**
4. Use this JSON (replace `API_ID` with your actual API ID):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "appsync:GraphQL"
      ],
      "Resource": [
        "arn:aws:appsync:us-east-1:*:apis/*/*"
      ]
    }
  ]
}
```

### Option 2: Via Amplify Backend

If Amplify Gen 2 isn't automatically granting permissions, you can explicitly grant them in `amplify/backend.ts`:

```typescript
// Note: This is usually not needed as Amplify Gen 2 handles it automatically
// Only use if you're experiencing permission issues
backend.publicBooking.resources.cfnFunction.addToRolePolicy(
  new (await import('aws-cdk-lib/aws-iam')).PolicyStatement({
    effect: (await import('aws-cdk-lib/aws-iam')).Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [backend.data.resources.graphqlApi.arn + '/*'],
  })
);
```

**Note**: The above code uses dynamic imports which may not work. A better approach is to ensure the function is properly defined in `backend.ts` and let Amplify handle it automatically.

## Verify GraphQL API Authorization

Also verify that your GraphQL API is configured to accept IAM authentication:

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Select your API (should match your Amplify app)
3. Go to **Settings**
4. Under **Default authorization mode**, verify it includes **IAM** or **API_KEY**
5. For IAM, ensure the API is configured to accept IAM requests

## Testing Permissions

You can test if the permissions work by:

1. Invoking the Lambda function via the Function URL or test event
2. Checking CloudWatch logs for successful GraphQL queries
3. If you see "No credentials" errors, the IAM role might not be properly configured

## Next Steps

If permissions are correctly configured but you're still getting errors:

1. Check CloudWatch logs for detailed error messages
2. Verify the GraphQL endpoint URL is correct
3. Ensure the function is using IAM auth mode (`authMode: 'iam'`)
4. Check that the GraphQL API schema allows the operations you're trying to perform

## Additional Resources

- [AWS Lambda IAM Roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [AWS AppSync IAM Authentication](https://docs.aws.amazon.com/appsync/latest/devguide/security.html#aws-iam-authorization)
- [Amplify Gen 2 Function Permissions](https://docs.amplify.aws/react/build-a-backend/functions/authorization/)
