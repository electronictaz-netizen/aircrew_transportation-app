# Dev Branch Setup - Quick Start

## ✅ Git Branch Created

The `dev` branch has been created and pushed to GitHub. You're currently on the `dev` branch.

## Next Steps: Configure in AWS Amplify

### 1. Add Dev Branch in Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app: **aircrew-transportation-app** (or your app name)
3. In the left sidebar, click **"App settings"** → **"General"**
4. Scroll down to **"Branch management"** section
5. Click **"Add branch"** button
6. Enter branch name: `dev`
7. Click **"Save"**

### 2. Configure Dev Branch Backend

1. Go back to main Amplify app page
2. You should now see both `main` and `dev` branches listed
3. Click on the **`dev`** branch
4. Go to **"Backend environments"** tab
5. Click **"Create backend environment"** (or **"Manage backend"** if it exists)
6. This creates a separate backend for dev (recommended) OR you can use the same backend

**Recommendation**: Create a separate backend environment for dev to avoid affecting production data.

### 3. Set Environment Variables for Dev Branch

1. In Amplify Console, go to **"App settings"** → **"Environment variables"**
2. Make sure you're viewing the **`dev`** branch (use branch selector at top)
3. Add/update these variables:

#### Required Variables for Dev:
```
VITE_SEND_INVITATION_EMAIL_URL=<dev-lambda-function-url>
SENDGRID_API_KEY=<your-sendgrid-key> (or POSTMARK_API_KEY)
EMAIL_FROM=noreply@onyxdispatch.us
```

#### Optional (for testing):
- Use test email addresses for notifications
- Consider using a separate SendGrid test server if available

### 4. Get Dev Lambda Function URL

After the dev branch deploys:

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find the function: `amplify-d1wxo3x0z5r1oq-dev-*-sendInvitationEmail-*`
   - Note the `-dev-` in the name (different from main)
3. Go to **"Configuration"** → **"Function URL"**
4. If not created, click **"Create function URL"**
5. Copy the Function URL
6. Add it to Amplify environment variables as `VITE_SEND_INVITATION_EMAIL_URL`

### 5. Verify Deployment

1. After Amplify detects the dev branch, it will auto-deploy
2. Wait for deployment to complete (check the dev branch in Amplify Console)
3. You'll get a dev URL like: `https://dev.d1wxo3x0z5r1oq.amplifyapp.com`
4. Test the dev environment to ensure everything works

## Branch Workflow

### Working on Dev Branch

```bash
# Make sure you're on dev
git checkout dev

# Make changes, test locally
npm run dev

# Commit and push to dev
git add .
git commit -m "Your changes"
git push origin dev

# Amplify will auto-deploy dev branch
# Test at dev URL
```

### Merging to Production

```bash
# Switch to main
git checkout main

# Merge dev into main
git merge dev

# Push to main (deploys to production)
git push origin main
```

## Current Status

- ✅ `dev` branch created
- ✅ `dev` branch pushed to GitHub
- ⏳ **Next**: Configure in Amplify Console (steps above)
- ⏳ **Next**: Set environment variables for dev
- ⏳ **Next**: Get dev Lambda Function URL

## Quick Commands

```bash
# Switch to dev branch
git checkout dev

# Switch to main branch
git checkout main

# See current branch
git branch

# See all branches
git branch -a
```

## Notes

- **Dev branch** = Staging/testing environment
- **Main branch** = Production environment
- Always test in dev before merging to main
- Dev and main can have different environment variables
- Dev backend can be separate from production (recommended)
