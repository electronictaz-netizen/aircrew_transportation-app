# Development Workflow & Branching Strategy

## Recommended Approach: **Both Local Testing + Dev Branch**

For a production-ready application, you should use **both**:
1. **Local testing** for quick iteration and development
2. **Dev/staging branch** for integration testing and pre-production validation

## Why Both?

### Local Testing (`npm run dev`)
✅ **Fast feedback** - See changes instantly  
✅ **No deployment wait** - Test immediately  
✅ **Cost-free** - No AWS resources used  
✅ **Perfect for**: UI changes, component development, quick fixes

❌ **Limitations**: 
- Frontend only (backend Lambda functions need deployment)
- No real AWS environment testing
- Can't test email sending, real database operations, etc.

### Dev Branch (Staging Environment)
✅ **Full integration testing** - Real AWS backend, database, Lambda functions  
✅ **Production-like environment** - Catches deployment issues early  
✅ **Team testing** - Others can test without local setup  
✅ **Perfect for**: Backend changes, email functionality, database migrations, full feature testing

❌ **Limitations**:
- Slower (requires deployment)
- Uses AWS resources (small cost)

## Recommended Branch Strategy

```
main (production) ← Deploy only tested, stable code
  ↑
dev (staging) ← Test integration, backend features
  ↑
feature branches ← Individual features (optional)
```

### Setup Steps

#### 1. Create Dev Branch

```bash
# Create and switch to dev branch
git checkout -b dev

# Push dev branch to GitHub
git push -u origin dev
```

#### 2. Configure Amplify for Dev Branch

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Go to **App settings** → **General**
4. Under **Branch management**, click **Add branch**
5. Branch name: `dev`
6. Configure:
   - **Backend environment**: Create new (separate from production)
   - **Environment variables**: Copy from main, adjust as needed
   - **Build settings**: Uses same `amplify.yml` (good!)

#### 3. Set Up Environment Variables for Dev

In Amplify Console → **App settings** → **Environment variables**:

**For `dev` branch:**
- Use test email addresses
- Use separate Postmark/SendGrid test server (if available)
- Use dev database (or same, but be careful)

**For `main` branch:**
- Production email addresses
- Production API keys
- Production database

## Development Workflow

### Daily Development (Small Changes)

```bash
# 1. Make changes locally
# Edit files...

# 2. Test locally
npm run dev

# 3. If frontend-only and looks good, commit to dev
git add .
git commit -m "Add feature X"
git push origin dev

# 4. Test in dev environment (Amplify auto-deploys)
# Wait for deployment, test at dev URL

# 5. If good, merge to main
git checkout main
git merge dev
git push origin main
```

### Feature Development (Larger Changes)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop and test locally
npm run dev
# Test, iterate...

# 3. Commit to feature branch
git add .
git commit -m "Implement new feature"
git push origin feature/new-feature

# 4. Merge to dev for integration testing
git checkout dev
git merge feature/new-feature
git push origin dev

# 5. Test in dev environment
# Full integration test with real backend

# 6. Merge to main when ready
git checkout main
git merge dev
git push origin main
```

## Local Development Setup

### Running Locally

```bash
# Install dependencies
npm install

# Start local dev server (frontend only)
npm run dev

# The app will run on http://localhost:5173 (or similar)
# Note: Backend (Lambda, database) still uses AWS
```

### Testing Backend Changes Locally

For Lambda function changes, you have two options:

1. **Quick test in dev branch** (recommended)
   - Push to dev branch
   - Amplify auto-deploys
   - Test at dev URL

2. **Local Lambda testing** (advanced)
   - Use `amplify sandbox` (if available in your setup)
   - Or test directly in AWS Lambda console

## Best Practices

### ✅ DO

- **Test locally first** for UI/frontend changes
- **Use dev branch** for backend changes and integration testing
- **Merge dev → main** only after testing in dev environment
- **Keep main stable** - only merge tested code
- **Use descriptive commit messages**
- **Test email functionality** in dev before main

### ❌ DON'T

- **Don't push untested code to main**
- **Don't skip dev branch** for backend changes
- **Don't test production features** on main without dev testing first
- **Don't forget to update environment variables** for dev branch

## Current Status

You currently have:
- ✅ Local dev server (`npm run dev`)
- ✅ Main branch connected to production
- ❌ No dev/staging branch yet

## Recommended Next Steps

1. **Create dev branch** (commands above)
2. **Configure Amplify** for dev branch deployment
3. **Set up dev environment variables** (test emails, etc.)
4. **Test workflow**: Make a small change → test locally → push to dev → test → merge to main

## Environment Variable Management

### Dev Branch Variables
- `VITE_SEND_INVITATION_EMAIL_URL`: Dev Lambda Function URL
- `POSTMARK_API_KEY` or `SENDGRID_API_KEY`: Test server key (if available)
- Test email addresses for notifications

### Main Branch Variables
- `VITE_SEND_INVITATION_EMAIL_URL`: Production Lambda Function URL
- `POSTMARK_API_KEY` or `SENDGRID_API_KEY`: Production key
- Production email addresses

## Quick Reference

```bash
# Create dev branch
git checkout -b dev
git push -u origin dev

# Daily workflow
npm run dev                    # Test locally
git add . && git commit -m "..." && git push origin dev  # Deploy to dev
# Test at dev URL, then:
git checkout main && git merge dev && git push origin main  # Deploy to prod

# Switch branches
git checkout dev              # Work on dev
git checkout main             # Work on main
```

## Questions?

- **"Can I test everything locally?"** - Frontend yes, backend needs deployment
- **"Do I need a dev branch?"** - Highly recommended for production apps
- **"What if I make a mistake on main?"** - Revert the commit or create a hotfix branch
- **"How do I test email sending?"** - Use dev branch with test email addresses
