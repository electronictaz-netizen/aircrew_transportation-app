# Cleanup Multiple Lambda Functions

## Your Current Lambda Functions

Based on what you're seeing, you have 4 functions with "booking" in the name:

1. **`amplify-d1wxo3x0z5r1oq-de-publicBookinglambda48251-jpTUhg36wuhe`**
   - **Branch:** `de` (dev/development)
   - **Last modified:** 2 days ago
   - **Status:** Likely stale/unused

2. **`amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte91bm6`** ✅
   - **Branch:** `ma` (main/master)
   - **Last modified:** 1 hour ago
   - **Status:** **This is your active function** (matches recent deployments)

3. **`amplify-aircrewtransporta-listBookingRequestslambd-m4QqNvg2b5BS`**
   - **App:** Different Amplify app (`aircrewtransporta`)
   - **Function:** `listBookingRequests` (this was deleted/replaced)
   - **Last modified:** 11 hours ago
   - **Status:** Stale - this function was replaced with AppSync JS resolver

4. **`amplify-aircrewtransporta-publicBookinglambda48251-WwKKSxq8dN9C`**
   - **App:** Different Amplify app (`aircrewtransporta`)
   - **Last modified:** 11 hours ago
   - **Status:** Possibly from old deployment or different project

## Which Function is Correct?

**✅ The correct function is:** `amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte91bm6`

**Why:**
- Modified 1 hour ago (matches your recent commits)
- Belongs to `main` branch (your production branch)
- App ID `d1wxo3x0z5r1oq` matches your current Amplify app

## Is the Dev Branch Causing Issues?

**Short answer: No, but it can cause confusion.**

The dev branch function exists independently and won't interfere with your main branch function **unless:**
- Your frontend/backend is accidentally configured to use the dev branch
- You're testing in dev but expecting main branch behavior
- There's confusion about which environment you're working in

**However:** Having multiple environments is normal and useful for:
- Testing changes before deploying to production
- Having separate data/stacks for dev vs. production

## How to Verify Which Function is Active

### Method 1: Check Your Frontend Configuration

1. Check your deployed frontend's `amplify_outputs.json`
2. Look for Function URL or Lambda ARN references
3. Match it to one of the Lambda functions

### Method 2: Check CloudFormation Stack

1. Go to **AWS CloudFormation** → Stacks
2. Find your main branch stack: `amplify-d1wxo3x0z5r1oq-main-branch-{hash}`
3. Go to **Resources** tab
4. Search for `AWS::Lambda::Function`
5. The Physical ID will match your active Lambda function name

### Method 3: Check Lambda Environment Variables

1. Click on each Lambda function
2. Go to **Configuration** → **Environment variables**
3. Check `AMPLIFY_DATA_GRAPHQL_ENDPOINT`
4. The one pointing to your active AppSync API (`ukoh7tgmwjbjdhnuirxugqx4ci`) is correct

## Safe Cleanup Strategy

### ⚠️ **IMPORTANT: Do NOT delete functions that are actively used!**

### Step 1: Identify Active Functions

**Keep these:**
- ✅ `amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte91bm6` (main branch - active)
- ✅ `amplify-d1wxo3x0z5r1oq-de-publicBookinglambda48251-jpTUhg36wuhe` (dev branch - if you use it)

**Can delete these:**
- ❌ `amplify-aircrewtransporta-listBookingRequestslambd-m4QqNvg2b5BS` (replaced with AppSync resolver)
- ❌ `amplify-aircrewtransporta-publicBookinglambda48251-WwKKSxq8dN9C` (different app, likely unused)

### Step 2: Verify Before Deleting

**Before deleting any function:**

1. **Check CloudFormation stacks:**
   - Go to **CloudFormation** → Stacks
   - Search for stacks containing the function name
   - If a stack references it, **DO NOT DELETE** (CloudFormation manages it)

2. **Check if it's referenced:**
   - Search for the function ARN in your codebase
   - Check if any other services reference it
   - Check Function URLs or API Gateway integrations

3. **Check last invocation:**
   - In Lambda Console, check **Monitor** tab
   - Look at **Invocations** graph
   - If it's been invoked recently, it might be in use

### Step 3: Delete Safely

**Option A: Delete via CloudFormation (Recommended)**

If the function is managed by CloudFormation:

1. Go to **CloudFormation** → Stacks
2. Find the stack that created the function
3. Delete the entire stack (this will clean up all resources)
4. **Warning:** Only do this if you're sure the stack/environment is no longer needed

**Option B: Delete via Lambda Console (If Not Managed by CloudFormation)**

1. Go to **AWS Lambda** → Functions
2. Select the function
3. Click **Delete**
4. Confirm deletion

**⚠️ Warning:** If the function is managed by CloudFormation, deleting it manually will cause the stack to be in an inconsistent state. CloudFormation will try to recreate it or mark the stack as failed.

## Recommended Approach: Keep Both Main and Dev

**Best practice:** Keep both main and dev branch functions:

- **Main branch function:** For production
- **Dev branch function:** For testing/development

This allows you to:
- Test changes in dev without affecting production
- Have separate data/environments
- Deploy to production only when ready

## If You Want to Clean Up Completely

### Scenario: You Only Use Main Branch

If you don't use the dev branch and want to clean it up:

1. **Delete the dev branch in Amplify Console:**
   - Go to **AWS Amplify** → Your app
   - Go to **Backend environments**
   - Find the `dev` branch environment
   - Delete it (this will delete all associated resources including the Lambda)

2. **Delete the old `aircrewtransporta` functions:**
   - These appear to be from a different/old project
   - Verify they're not in use
   - Delete via Lambda Console if not managed by CloudFormation

### Scenario: You Want to Rebuild Everything

**⚠️ This is destructive and will delete all data!**

1. **Delete all CloudFormation stacks:**
   - Go to **CloudFormation** → Stacks
   - Delete stacks for both main and dev branches
   - This will delete all resources (Lambdas, AppSync APIs, DynamoDB tables, etc.)

2. **Delete remaining Lambda functions:**
   - Any functions not deleted by CloudFormation
   - Delete via Lambda Console

3. **Redeploy:**
   - Push to your repository
   - Amplify will create fresh resources

**⚠️ WARNING:** This will delete all your data! Only do this if you're okay with starting fresh.

## Quick Verification Checklist

Before deleting anything:

- [ ] Identified which function is active (main branch, modified 1 hour ago)
- [ ] Checked CloudFormation stacks to see which functions are managed
- [ ] Verified no other services reference the functions you want to delete
- [ ] Confirmed you don't need the dev branch environment
- [ ] Backed up any important data (if deleting everything)

## Recommended Action Plan

**For now, keep it simple:**

1. ✅ **Use the main branch function** (`amplify-d1wxo3x0z5r1oq-ma-...`)
2. ✅ **Keep the dev branch function** (useful for testing)
3. ❌ **Delete the `aircrewtransporta` functions** (if confirmed unused)
4. ❌ **Delete the `listBookingRequests` function** (replaced with AppSync resolver)

This gives you a clean setup without risking your production environment.

## How to Delete the Old Functions

### Delete `listBookingRequests` Function

1. Go to **AWS Lambda** → Functions
2. Find `amplify-aircrewtransporta-listBookingRequestslambd-m4QqNvg2b5BS`
3. Click on it → **Delete** button
4. Confirm deletion

**Why safe:** This function was replaced with an AppSync JavaScript resolver, so it's no longer needed.

### Delete `aircrewtransporta-publicBooking` Function

1. **First, verify it's not in use:**
   - Check CloudFormation stacks for references
   - Check if any Function URLs point to it
   - Check last invocation time

2. **If safe to delete:**
   - Go to **AWS Lambda** → Functions
   - Find `amplify-aircrewtransporta-publicBookinglambda48251-WwKKSxq8dN9C`
   - Click on it → **Delete** button
   - Confirm deletion

## After Cleanup

After cleaning up, you should have:
- ✅ 1 main branch `publicBooking` function (active)
- ✅ 1 dev branch `publicBooking` function (for testing, optional)
- ❌ No old/unused functions

This keeps your Lambda console clean and reduces confusion.
