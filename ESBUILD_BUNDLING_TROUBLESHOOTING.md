# Troubleshooting esbuild Bundling Errors

## Problem

The `publicBooking` Lambda function is failing to build with esbuild bundling errors. The error message shows:
```
ValidationError: bash -c npx --no-install esbuild --bundle ... exited with status 1
```

## Root Cause

esbuild is trying to bundle AWS SDK packages (`@aws-sdk/signature-v4`, `@aws-sdk/protocol-http`, etc.) and failing. Even with dynamic imports, esbuild may still try to analyze and resolve these imports during bundling.

## Potential Solutions

### Option 1: Use AWS SDK AppSync Client (Recommended)

Instead of manually signing requests with SignatureV4, use the AWS SDK's AppSync client:

```typescript
import { AppSyncClient, ExecuteGraphQLCommand } from '@aws-sdk/client-appsync';

const client = new AppSyncClient({ region: 'us-east-1' });
const command = new ExecuteGraphQLCommand({
  apiId: apiId,
  query: queryString,
  variables: variables,
});
const response = await client.send(command);
```

**Pros:**
- Simpler code
- Better maintained
- May bundle better with esbuild

**Cons:**
- Need to check if it bundles correctly

### Option 2: Mark Packages as External

Configure the function to mark AWS SDK packages as external (not bundled):

```typescript
export const publicBooking = defineFunction({
  name: 'publicBooking',
  entry: './handler.ts',
  timeoutSeconds: 30,
  // Note: Check if Amplify Gen 2 supports bundling configuration
  // This might require CDK customization
});
```

**Note:** Amplify Gen 2 may not expose bundling configuration directly. This might require custom CDK code.

### Option 3: Use Lambda Layers

Create a Lambda Layer with the AWS SDK packages and use it in the function:

1. Create a Lambda Layer with the required packages
2. Attach the layer to the function
3. Remove packages from `package.json`
4. Import from the layer at runtime

**Pros:**
- Packages not bundled
- Can be reused across functions

**Cons:**
- More complex setup
- Need to manage layer versions

### Option 4: Simplify to Use Built-in fetch

Use Node.js 20's built-in `fetch` with a simpler authentication approach, or use API keys if available:

```typescript
// Use API key if available (less secure but simpler)
const response = await fetch(graphqlEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.APPSYNC_API_KEY || '',
  },
  body: JSON.stringify({ query, variables }),
});
```

**Note:** This requires API key authentication to be enabled on the AppSync API.

### Option 5: Use Amplify's generateClient

Try using Amplify's `generateClient` with IAM auth mode (the original approach):

```typescript
import { generateClient } from 'aws-amplify/data';

const client = generateClient({
  authMode: 'iam',
});
```

**Note:** This was the original approach that had credential issues, but it might work now with proper configuration.

## Current Status

The function is using dynamic imports to avoid bundling, but esbuild is still failing. This suggests:
1. esbuild is still analyzing the dynamic imports
2. There might be a syntax error or other issue
3. The packages might not be resolving correctly

## Next Steps

1. **Try Option 1** (AppSync Client) - Simplest and most likely to work
2. **Check for syntax errors** - Verify the handler file has no TypeScript errors
3. **Test locally** - Try running esbuild locally to see the actual error message
4. **Consider Lambda Layer** - If bundling continues to fail

## Testing Locally

To test esbuild bundling locally:

```bash
cd amplify/functions/publicBooking
npx esbuild handler.ts --bundle --platform=node --target=node20 --format=esm --outfile=test.mjs
```

This will show the actual error message that's being hidden in the CI/CD logs.
