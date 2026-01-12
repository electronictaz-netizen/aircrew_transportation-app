# Dependency Conflict Fix

## Problem
Build was failing with:
```
npm error @aws-amplify/ui-react@"^6.0.0" from the root project
npm error Fix the upstream dependency conflict, or retry
```

## Solution Applied

### 1. Updated package.json
Changed `@aws-amplify/ui-react` from `^6.0.0` to `^5.2.0` for better compatibility with AWS Amplify Gen 2.

### 2. Updated amplify.yml
Added `--legacy-peer-deps` flag to npm install commands to handle any remaining peer dependency conflicts.

## Changes Made

**package.json:**
```json
"@aws-amplify/ui-react": "^5.2.0"  // Changed from ^6.0.0
```

**amplify.yml:**
```yaml
- npm install --legacy-peer-deps  // Added --legacy-peer-deps flag
```

## Why This Works

1. **Version Compatibility**: `@aws-amplify/ui-react@^5.2.0` is more stable and compatible with AWS Amplify Gen 2
2. **Legacy Peer Deps**: The `--legacy-peer-deps` flag tells npm to use the npm v4-v6 peer dependency resolution algorithm, which is more lenient

## Next Steps

1. **Commit the changes:**
   ```bash
   git add package.json amplify.yml
   git commit -m "Fix dependency conflicts: downgrade ui-react and add legacy-peer-deps"
   git push
   ```

2. **Redeploy in AWS Amplify:**
   - The build should now succeed
   - Monitor the build logs to confirm

## Alternative Solution (If Still Failing)

If you still encounter issues, you can try:

1. **Use exact versions instead of ranges:**
   ```json
   "@aws-amplify/ui-react": "5.2.0"
   ```

2. **Update all Amplify packages to latest compatible versions:**
   ```bash
   npm install @aws-amplify/ui-react@latest --legacy-peer-deps
   ```

3. **Check for updates:**
   ```bash
   npm outdated
   npm update --legacy-peer-deps
   ```

## Verification

After deployment, verify:
- ✅ Build completes successfully
- ✅ Application loads without errors
- ✅ Authentication works
- ✅ UI components render correctly
