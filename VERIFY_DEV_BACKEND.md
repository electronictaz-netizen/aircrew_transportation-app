# How to Verify Dev Backend Deployment

## ✅ Yes, Amplify Auto-Creates Branch-Specific Backends

When you push a new branch (like `dev`), Amplify automatically:
1. Detects the branch
2. Creates a separate backend environment for that branch
3. Deploys all Lambda functions, databases, auth, etc. with branch-specific names

This is configured in `amplify.yml`:
```yaml
- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

The `$AWS_BRANCH` variable means each branch gets its own backend!

## How to Verify Dev Backend Exists

### Method 1: Check AWS Lambda Console (Easiest)

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Look for functions with `-dev-` in their names

**Main branch functions** look like:
```
amplify-d1wxo3x0z5r1oq-main-12345678-auth-abcdef
amplify-d1wxo3x0z5r1oq-main-12345678-sendInvitationEmail-abcdef
```

**Dev branch functions** look like:
```
amplify-d1wxo3x0z5r1oq-dev-12345678-auth-abcdef
amplify-d1wxo3x0z5r1oq-dev-12345678-sendInvitationEmail-abcdef
```

✅ **If you see functions with `-dev-` in the name, dev backend is deployed!**

### Method 2: Check Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Click on the **`dev`** branch
4. Go to **"Backend environments"** tab
5. You should see:
   - Backend environment listed (e.g., `amplify-d1wxo3x0z5r1oq-dev-12345678`)
   - Status: "Available" or "Deployed"
   - Last deployment time

✅ **If you see a backend environment for dev, it's deployed!**

### Method 3: Check AWS CloudFormation

1. Go to [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
2. Look for stacks with `-dev-` in the name:
   - `amplify-d1wxo3x0z5r1oq-dev-12345678`
   - `amplify-d1wxo3x0z5r1oq-dev-12345678-auth`
   - `amplify-d1wxo3x0z5r1oq-dev-12345678-data`
   - etc.

✅ **If you see CloudFormation stacks for dev, backend is deployed!**

### Method 4: Check Amplify Backend Dashboard

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. In the left sidebar, click **"Backend environments"**
4. You should see:
   - `main` backend environment
   - `dev` backend environment (new!)

✅ **If you see both main and dev, both backends are deployed!**

## What Gets Created for Dev Backend?

When Amplify deploys a dev backend, it creates:

- ✅ **Lambda Functions** (with `-dev-` in name)
  - `sendInvitationEmail`
  - `stripeWebhook`
  - `stripeCheckout`
  - `stripePortal`
  - Auth functions

- ✅ **DynamoDB Tables** (separate from main)
  - All your data tables
  - Auth tables

- ✅ **Cognito User Pool** (separate from main)
  - Dev users are separate from production users

- ✅ **API Gateway** (if used)
- ✅ **IAM Roles & Policies**
- ✅ **CloudFormation Stacks**

## Important Notes

### Separate Data
- **Dev backend has its own database** - data is separate from production
- **Dev users are separate** - you'll need to create test users in dev
- **Dev Lambda functions are separate** - can have different environment variables

### Environment Variables
- Dev backend can have different environment variables than main
- Set them in: Amplify Console → App settings → Environment variables → Select `dev` branch

### Cost
- Dev backend uses AWS resources (small cost)
- You can delete dev backend if not needed (but keep the branch for code)

## Quick Verification Checklist

- [ ] Check Lambda Console for `-dev-` functions
- [ ] Check Amplify Console → Backend environments → See `dev` listed
- [ ] Check CloudFormation for `-dev-` stacks
- [ ] Verify dev branch shows "Deployed" status in Amplify

## If Dev Backend is NOT Deployed

If you don't see dev backend resources:

1. **Check Amplify Console** → `dev` branch → Check deployment status
2. **Check build logs** for errors
3. **Verify branch was pushed** to GitHub
4. **Wait a few minutes** - first deployment can take 5-10 minutes

## Next Steps After Verification

Once you confirm dev backend exists:

1. ✅ Get dev Lambda Function URL (for `sendInvitationEmail`)
2. ✅ Set `VITE_SEND_INVITATION_EMAIL_URL` in Amplify environment variables for dev branch
3. ✅ Test dev environment at dev URL
4. ✅ Create test users in dev Cognito (separate from production)
