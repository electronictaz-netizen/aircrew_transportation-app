# Fix 401 Unauthorized Error - Wrong GraphQL API

## Problem

The frontend is getting **401 Unauthorized** errors because it's trying to access the wrong GraphQL API:
- **Wrong API**: `ucwy5mmmyrh2rjz6hhkolzwnke` (API_KEY auth mode)
- **Correct API**: `klp7rzjva5c2bef2zjaygpod44` (AMAZON_COGNITO_USER_POOLS auth mode)

## Root Cause

The `amplify_outputs.json` file has placeholder values instead of the actual GraphQL endpoint. The frontend needs to use the API that supports Cognito User Pools authentication.

## Solution

### Option 1: Regenerate amplify_outputs.json (Recommended)

1. **Deploy the backend** to ensure Amplify generates the correct outputs:
   ```bash
   npx ampx sandbox
   ```
   Or if using CI/CD:
   ```bash
   npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
   ```

2. **Check the generated file**: After deployment, `amplify_outputs.json` should be automatically updated with the correct values.

3. **Verify the endpoint**: The `data.url` in `amplify_outputs.json` should be:
   ```
   https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql
   ```

### Option 2: Manually Update amplify_outputs.json (Temporary Fix)

If you need a quick fix, you can manually update `amplify_outputs.json`:

1. **Get your User Pool ID and Client ID** from AWS Cognito Console
2. **Get your Identity Pool ID** from AWS Cognito Identity Pools
3. **Update the file**:

```json
{
  "version": "1",
  "auth": {
    "user_pool_id": "YOUR_USER_POOL_ID",
    "user_pool_client_id": "YOUR_USER_POOL_CLIENT_ID",
    "identity_pool_id": "YOUR_IDENTITY_POOL_ID",
    "aws_region": "us-east-1"
  },
  "data": {
    "aws_region": "us-east-1",
    "url": "https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql",
    "api_key": null
  },
  "custom": {
    "amplify_outputs_file": "amplify_outputs.json"
  }
}
```

**Important**: Replace:
- `YOUR_USER_POOL_ID` - From Cognito User Pools console
- `YOUR_USER_POOL_CLIENT_ID` - From Cognito User Pools console
- `YOUR_IDENTITY_POOL_ID` - From Cognito Identity Pools console (if using)
- Set `api_key` to `null` since we're using Cognito User Pools, not API_KEY

### Option 3: Use Environment Variables (Alternative)

If `amplify_outputs.json` isn't being generated correctly, you can configure Amplify manually in `src/main.tsx`:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
});
```

## Verify the Fix

1. **Open browser console** and check for errors
2. **Try logging in** - should work without 401 errors
3. **Check Network tab** - GraphQL requests should go to:
   - `https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql`
   - NOT `https://ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql`

## Why Two APIs?

You have two AppSync APIs:
1. **API 1** (`klp7rzjva5c2bef2zjaygpod44`): Primary auth = `AMAZON_COGNITO_USER_POOLS` ✅ (Use this for frontend)
2. **API 2** (`ucwy5mmmyrh2rjz6hhkolzwnke`): Primary auth = `API_KEY` ✅ (Use this for Lambda with IAM)

- **Frontend** should use API 1 (Cognito User Pools)
- **Lambda functions** should use API 2 (IAM authentication)

## Next Steps

1. **Regenerate** `amplify_outputs.json` by deploying the backend
2. **Verify** the endpoint in the generated file
3. **Test** the frontend login and company loading
4. **Check** that both APIs are correctly configured in AppSync console
