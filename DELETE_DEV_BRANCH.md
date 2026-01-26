# Delete Dev Branch Environment

## Overview

This guide will help you safely delete the dev branch environment in AWS Amplify, which will automatically clean up all associated resources including:
- Lambda functions
- AppSync APIs
- DynamoDB tables
- CloudFormation stacks
- Other AWS resources

## Step-by-Step Instructions

### Step 1: Verify What Will Be Deleted

Before deleting, let's confirm what resources belong to the dev branch:

1. **Go to AWS Amplify Console:**
   - Navigate to **AWS Amplify** → Your app (`d1wxo3x0z5r1oq`)
   - Click on your app

2. **Check Backend Environments:**
   - Go to **Backend environments** in the left sidebar
   - You should see:
     - `main` branch (keep this)
     - `dev` branch (this is what we'll delete)

3. **Note the resources:**
   - The dev branch has its own:
     - Lambda function: `amplify-d1wxo3x0z5r1oq-de-publicBookinglambda48251-jpTUhg36wuhe`
     - AppSync API (if separate)
     - DynamoDB tables (if separate)
     - CloudFormation stack

### Step 2: Delete Dev Branch in Amplify Console

1. **In Amplify Console:**
   - Go to **Backend environments**
   - Find the `dev` branch environment
   - Click on it

2. **Delete the environment:**
   - Look for a **Delete** or **Remove** button
   - Click it
   - Confirm the deletion

   **OR**

   If there's no delete button in the environment view:
   - Go to **App settings** → **General**
   - Look for branch management
   - Or go to **Hosting** → find the dev branch → delete it

### Step 3: Alternative - Delete via CloudFormation

If you can't find the delete option in Amplify Console:

1. **Go to AWS CloudFormation:**
   - Navigate to **CloudFormation** → **Stacks**
   - Filter/search for: `amplify-d1wxo3x0z5r1oq-dev` or `amplify-d1wxo3x0z5r1oq-de-`

2. **Identify dev branch stacks:**
   - Look for stacks with `dev` or `de` in the name
   - These are typically:
     - `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}`
     - `amplify-d1wxo3x0z5r1oq-de-{resource}-{hash}`

3. **Delete the stacks:**
   - Select each dev branch stack
   - Click **Delete**
   - Confirm deletion
   - Wait for deletion to complete (this may take several minutes)

### Step 4: Verify Deletion

After deletion:

1. **Check Lambda functions:**
   - Go to **AWS Lambda** → Functions
   - Search for `de-publicBooking` or `dev-publicBooking`
   - The function should be gone

2. **Check CloudFormation:**
   - Go to **CloudFormation** → Stacks
   - Search for `dev` or `de`
   - No dev branch stacks should remain

3. **Check Amplify Console:**
   - Go to **Backend environments**
   - Only `main` branch should remain

## What Gets Deleted

When you delete the dev branch environment:

✅ **Will be deleted:**
- Lambda function: `amplify-d1wxo3x0z5r1oq-de-publicBookinglambda48251-jpTUhg36wuhe`
- CloudFormation stacks for dev branch
- AppSync API (if dev had its own separate API)
- DynamoDB tables (if dev had its own separate tables)
- IAM roles and policies for dev branch
- Other AWS resources created for dev branch

✅ **Will NOT be deleted:**
- Main branch Lambda: `amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte91bm6`
- Main branch CloudFormation stacks
- Main branch AppSync API
- Main branch DynamoDB tables
- Your production data

## Important Notes

⚠️ **Before deleting:**
- Make sure you don't have any important data in the dev environment
- Verify you're not using the dev branch for anything important
- Check that your main branch is working correctly

⚠️ **After deleting:**
- The dev branch Lambda function will be removed
- If you push to a `dev` branch in the future, Amplify will create a new environment
- You can always recreate the dev environment later if needed

## Quick Command Reference

If you prefer using AWS CLI:

```bash
# List dev branch stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query "StackSummaries[?contains(StackName, 'dev') || contains(StackName, 'de-')].StackName" \
  --output table

# Delete a specific stack (replace STACK_NAME)
aws cloudformation delete-stack --stack-name STACK_NAME

# Check deletion status
aws cloudformation describe-stacks \
  --stack-name STACK_NAME \
  --query "Stacks[0].StackStatus" \
  --output text
```

## Troubleshooting

### Issue: Can't find delete option in Amplify Console

**Solution:**
- Use CloudFormation to delete the stacks directly
- Or contact AWS Support if you need help

### Issue: Stack deletion fails

**Possible causes:**
- Resources are still in use
- Dependencies prevent deletion
- Permissions issue

**Solution:**
1. Check CloudFormation **Events** tab for error details
2. Manually delete resources that are blocking (if safe)
3. Retry stack deletion

### Issue: Lambda function still exists after stack deletion

**Solution:**
- Manually delete the Lambda function via Lambda Console
- This can happen if the function wasn't properly managed by CloudFormation

## After Deletion

Once the dev branch is deleted:

1. ✅ You'll only have the main branch environment
2. ✅ Your Lambda console will be cleaner (one less function)
3. ✅ Less confusion about which environment to use
4. ✅ All resources will be for production/main branch only

## Next Steps

After successfully deleting the dev branch:

1. Verify main branch is working correctly
2. Test your booking portal
3. Consider deleting the old `aircrewtransporta` functions if they're still there
4. Update any documentation that references the dev branch
