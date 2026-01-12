# Build Error Fix: package-lock.json Missing

## Problem
AWS Amplify build was failing with:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Solution Applied
Updated `amplify.yml` to use `npm install` instead of `npm ci`. This will work immediately.

## Better Solution (Recommended)
For better dependency reproducibility, generate and commit a `package-lock.json` file:

### Steps:

1. **Generate package-lock.json locally:**
   ```bash
   cd "Aircrew transportation app"
   npm install
   ```
   This will create `package-lock.json` in your project directory.

2. **Commit the lock file:**
   ```bash
   git add package-lock.json
   git commit -m "Add package-lock.json for reproducible builds"
   git push
   ```

3. **Update amplify.yml back to use npm ci (optional but recommended):**
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

## Why package-lock.json?
- **Reproducible builds**: Ensures everyone (and CI/CD) uses the exact same dependency versions
- **Faster builds**: `npm ci` is faster than `npm install` in CI environments
- **Security**: Locks dependency versions to prevent unexpected updates

## Current Status
✅ Build should now work with `npm install`
⚠️ Consider generating `package-lock.json` for better practices
