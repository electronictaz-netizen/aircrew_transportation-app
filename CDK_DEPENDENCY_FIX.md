# CDK Dependency Fix

## Problem
Build was failing with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'aws-cdk-lib' imported from 
@aws-amplify/backend-cli/lib/seed-policy-generation/generate_seed_policy_template.js
```

## Root Cause
The `@aws-amplify/backend-cli` package requires `aws-cdk-lib` as a peer dependency, but it wasn't explicitly listed in `package.json`. When npm installs dependencies, peer dependencies are not automatically installed unless they're explicitly declared.

## Solution Applied

Added the missing CDK dependencies to `package.json`:

```json
"aws-cdk-lib": "^2.140.0",
"constructs": "^10.3.0"
```

## Why These Versions?

- **aws-cdk-lib@^2.140.0**: Latest stable version compatible with AWS Amplify Gen 2
- **constructs@^10.3.0**: Required peer dependency for aws-cdk-lib v2

## Next Steps

1. **Commit the changes:**
   ```bash
   git add package.json
   git commit -m "Add missing aws-cdk-lib and constructs dependencies"
   git push
   ```

2. **Redeploy in AWS Amplify:**
   - The build should now succeed
   - Monitor the build logs to confirm

## Verification

After deployment, verify:
- ✅ Build completes successfully
- ✅ Backend resources are created
- ✅ No CDK-related errors in logs

## Additional Notes

- These are backend dependencies used by Amplify Gen 2 for infrastructure provisioning
- They're only needed during the build process, not at runtime
- The versions are compatible with AWS Amplify Gen 2 requirements
