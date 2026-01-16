# Deploy Schema - Quick Guide

## ✅ Automatic Deployment (Recommended)

**Your schema is being deployed automatically right now!**

Since you just pushed the code to the `main` branch, AWS Amplify CI/CD is automatically deploying your schema changes.

### Check Deployment Status

1. **Go to AWS Amplify Console:**
   - Visit: https://console.aws.amazon.com/amplify/
   - Select your app
   - Click on the "Deployments" tab
   - Look for the latest deployment (should show "Deploying" or "Succeeded")

2. **What to Look For:**
   - ✅ Backend phase: Should show "Deploying" or "Succeeded"
   - ✅ Frontend phase: Will deploy after backend completes
   - ⏱️ Total time: Usually 5-8 minutes

### Schema Changes Being Deployed

- `startLocationLat` - GPS latitude when trip starts
- `startLocationLng` - GPS longitude when trip starts  
- `completeLocationLat` - GPS latitude when trip completes
- `completeLocationLng` - GPS longitude when trip completes

## Manual Deployment (If Needed)

If you need to deploy manually for testing or if automatic deployment fails:

### Option 1: Sandbox (Local Development)

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# First time setup (if not already done)
npx ampx configure profile

# Deploy to sandbox
npx ampx sandbox
```

**Note:** Sandbox is for local development only. Production uses CI/CD.

### Option 2: Check CI/CD Status

The automatic deployment uses:
```bash
npx ampx pipeline-deploy --branch main --app-id $AWS_APP_ID
```

This runs automatically in your CI/CD pipeline. You cannot run this manually as it requires environment variables only available in the pipeline.

## Verify Deployment

After deployment completes:

1. **In Amplify Console:**
   - Go to Backend → Data
   - View the Trip model
   - Verify GPS fields are listed

2. **In Your App:**
   - Log in as a driver
   - Click "Record Pickup" on a trip
   - Check that GPS location is captured
   - Verify coordinates appear in trip card

## Troubleshooting

**If deployment fails:**
1. Check Amplify console build logs
2. Look for specific error messages
3. Common issues:
   - Schema syntax errors
   - Missing dependencies
   - AWS credential issues (should be automatic)

**If schema fields don't appear:**
1. Wait a few minutes for propagation
2. Hard refresh the browser (Ctrl+Shift+R)
3. Clear browser cache
4. Check Amplify console for deployment status

---

**Current Status:** Check your AWS Amplify Console to see real-time deployment progress.
