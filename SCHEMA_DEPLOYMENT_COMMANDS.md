# Schema Deployment Commands

## Automatic Deployment (Recommended - Already Happening)

**Your schema deploys automatically via CI/CD when you push to git.**

Since you've already pushed the code, your CI/CD pipeline (configured in `amplify.yml`) will automatically:
1. Deploy the schema using: `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`
2. Build and deploy your frontend

**No manual command needed** - just wait for the deployment to complete in your Amplify console.

## Manual Deployment Options

### Option 1: Local Development (Sandbox)

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# Deploy schema to sandbox environment
npx ampx sandbox

# Or deploy once without watch mode
npx ampx sandbox --once
```

**Requirements:**
- AWS credentials configured (`npx ampx configure profile`)
- For local development/testing only

### Option 2: Production (CI/CD Pipeline)

The production deployment happens automatically via your `amplify.yml` file when you push to git.

**Command used in CI/CD:**
```bash
npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

**Note:** This uses environment variables set by Amplify CI/CD:
- `$AWS_BRANCH` - Your git branch name
- `$AWS_APP_ID` - Your Amplify app ID

You **cannot run this manually** - it requires these environment variables that are only available in the CI/CD pipeline.

## Current Status

✅ **Code is pushed to git** - Your latest changes including the Company model authorization fix are in git

⏳ **CI/CD is deploying** - Your pipeline will automatically deploy the schema

📊 **Check Amplify Console** - Monitor deployment progress there

## Summary

- **For production:** No command needed - CI/CD handles it automatically
- **For local testing:** `npx ampx sandbox` (requires AWS credentials)
- **Your current situation:** Wait for CI/CD to complete (check Amplify console)
