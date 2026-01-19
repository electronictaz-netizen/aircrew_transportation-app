# Deployment Guide: Onyx Transportation App

This guide provides step-by-step instructions for deploying the Onyx Transportation App to AWS Amplify Gen 2.

## Prerequisites Checklist

- [ ] AWS Account created and active
- [ ] GitHub account with a repository created
- [ ] Node.js 18.x or higher installed
- [ ] Git installed and configured
- [ ] Flight Status API key (optional, for flight status features)

## Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### 1.1 Initialize Git Repository

```bash
# Navigate to project directory
cd "Aircrew transportation app"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Onyx Transportation App"
```

#### 1.2 Push to GitHub

```bash
# Create a new repository on GitHub (via web interface)
# Then add it as remote and push

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### Phase 2: Set Up AWS Amplify

#### 2.1 Access AWS Amplify Console

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Search for "Amplify" in the services search bar
3. Click on "AWS Amplify"

#### 2.2 Create New App

1. Click the **"New app"** button
2. Select **"Host web app"**
3. Choose **"GitHub"** as your source provider
4. Click **"Continue"**

#### 2.3 Authorize GitHub

1. Click **"Authorize use of GitHub"**
2. You'll be redirected to GitHub
3. Authorize AWS Amplify to access your repositories
4. Select the repositories you want to grant access to (or all repositories)
5. Click **"Install & Authorize"**

#### 2.4 Connect Repository

1. Select your repository: `YOUR_REPO_NAME`
2. Select the branch: `main` (or your default branch)
3. Click **"Next"**

#### 2.5 Configure Build Settings

Amplify should auto-detect the build settings from `amplify.yml`. Verify:

- **App name**: `aircrew-transportation` (or your preferred name)
- **Environment name**: `main` (or `production`)
- **Build settings**: Should show:
  ```yaml
  version: 1
  backend:
    phases:
      build:
        commands:
          - npm ci
          - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
  frontend:
    phases:
      preBuild:
        commands:
          - npm ci
      build:
        commands:
          - npm run build
  ```

If the build settings are not auto-detected, you can manually add them or use the `amplify.yml` file.

#### 2.6 Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Wait for the deployment to complete (this may take 5-10 minutes)

### Phase 3: Configure Backend Resources

#### 3.1 Access Backend Environment

1. In Amplify Console, click on your app
2. Navigate to **"Backend environments"** in the left sidebar
3. Click on your environment (e.g., `main`)

#### 3.2 Verify Backend Resources

The following resources should be automatically created:

- **Authentication (Cognito)**: User pool for authentication
- **Data (AppSync + DynamoDB)**: GraphQL API and database tables

#### 3.3 Update Amplify Outputs

1. After the first deployment, Amplify will generate `amplify_outputs.json`
2. This file should be committed to your repository
3. The file contains configuration for connecting your frontend to the backend

**Important**: If `amplify_outputs.json` is not automatically updated, you may need to:

```bash
# Pull the latest from your repository
git pull origin main

# Or manually download from Amplify Console
# Go to App settings > General > Download amplify_outputs.json
```

### Phase 4: Configure Environment Variables

#### 4.1 Add Flight Status API Key (Optional)

1. In Amplify Console, go to your app
2. Navigate to **"Environment variables"** in the left sidebar
3. Click **"Manage variables"**
4. Add a new variable:
   - **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: Your API key from AviationStack or another provider
5. Click **"Save"**
6. **Redeploy** your app for changes to take effect

#### 4.2 Other Environment Variables

You can add other environment variables as needed:
- `AWS_REGION`: Override default AWS region (default: us-east-1)
- Any other variables your app needs

### Phase 5: Test Your Deployment

#### 5.1 Access Your App

1. After deployment completes, you'll see a URL like:
   `https://main.xxxxx.amplifyapp.com`
2. Click on the URL to open your app

#### 5.2 Initial Setup

1. **Create an Account**:
   - Click "Create account"
   - Enter your email and password
   - Verify your email (check your inbox)

2. **Add a Driver**:
   - Sign in to your app
   - Go to Management Dashboard
   - Click "Manage Drivers"
   - Add a driver with your email address (important for driver dashboard access)

3. **Create a Test Trip**:
   - Click "New Trip"
   - Fill in the form
   - Assign the driver you just created
   - Save the trip

4. **Test Driver Dashboard**:
   - Sign out
   - Sign in with the driver's email
   - Go to Driver View
   - You should see the assigned trip
   - Test the "Record Pickup" and "Record Dropoff" buttons

### Phase 6: Set Up Custom Domain (Optional)

#### 6.1 Add Custom Domain

1. In Amplify Console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain name (e.g., `transportation.yourcompany.com`)
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning (may take a few minutes)

#### 6.2 Configure DNS

1. Add the CNAME record provided by Amplify to your DNS provider
2. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Continuous Deployment

Once set up, Amplify will automatically:

- **Deploy on every push** to your connected branch
- **Run build and tests** before deployment
- **Provide preview deployments** for pull requests (if configured)

### Manual Redeploy

To manually trigger a redeploy:

1. Go to Amplify Console
2. Click on your app
3. Click **"Redeploy this version"** or push a new commit

## Monitoring and Logs

### View Build Logs

1. In Amplify Console, go to your app
2. Click on a deployment
3. View build logs for any errors

### View Application Logs

1. Go to **"Monitoring"** in the left sidebar
2. View CloudWatch logs for backend errors
3. Use browser DevTools for frontend errors

### Set Up Alerts

1. Go to **"Monitoring"** → **"Alerts"**
2. Configure alerts for:
   - Build failures
   - Deployment failures
   - High error rates

## Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors

**Solution**:
1. Check Node.js version in build settings (should be 18.x or higher)
2. Verify `package.json` has all required dependencies
3. Check build logs for specific error messages

### Authentication Not Working

**Issue**: Users can't sign in or sign up

**Solution**:
1. Check Cognito User Pool in AWS Console
2. Verify email verification settings
3. Check IAM permissions for Amplify

### Data Not Loading

**Issue**: Trips or drivers not showing up

**Solution**:
1. Check AppSync API in AWS Console
2. Verify DynamoDB tables are created
3. Check browser console for errors
4. Verify `amplify_outputs.json` is up to date

### Flight Status Not Working

**Issue**: Flight status shows "Unknown" or "Checking..."

**Solution**:
1. Verify `VITE_FLIGHT_API_KEY` is set in environment variables
2. Check API key is valid and has remaining quota
3. Check browser console for API errors
4. Verify flight number format (e.g., AA1234)

## Rollback Deployment

If you need to rollback to a previous version:

1. Go to Amplify Console
2. Click on your app
3. Go to **"Deployments"**
4. Find the previous successful deployment
5. Click **"Redeploy this version"**

## Cost Considerations

### Free Tier

AWS Amplify offers a free tier that includes:
- 1,000 build minutes per month
- 15 GB storage
- 5 GB served per month

### Estimated Costs (Beyond Free Tier)

- **Build minutes**: $0.01 per build minute
- **Hosting**: $0.15 per GB served
- **Backend (Cognito)**: Free for up to 50,000 MAU
- **Backend (AppSync)**: $4.00 per million requests
- **Backend (DynamoDB)**: Pay per use (very low for small apps)

For a small to medium application, costs should be minimal.

## Security Best Practices

1. **Never commit secrets**: Use environment variables for API keys
2. **Enable MFA**: For AWS account access
3. **Use IAM roles**: Limit permissions to what's needed
4. **Enable CloudWatch**: Monitor for suspicious activity
5. **Regular updates**: Keep dependencies updated

## Next Steps

After successful deployment:

1. **Set up monitoring**: Configure CloudWatch alarms
2. **Set up backups**: Configure DynamoDB backups if needed
3. **Set up CI/CD**: Configure branch-based deployments
4. **Add custom domain**: Set up your custom domain
5. **Scale as needed**: Monitor usage and scale resources

## Support

For issues or questions:

1. Check AWS Amplify documentation
2. Review AWS Amplify forums
3. Check GitHub issues for similar problems
4. Contact AWS Support (if you have a support plan)

---

**Congratulations!** Your Onyx Transportation App should now be live and accessible via the provided Amplify URL.
