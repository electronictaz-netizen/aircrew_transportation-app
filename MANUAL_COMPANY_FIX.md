# Manual Company Creation Fix (Browser Console)

## Step 1: Access the Amplify Client

The app already has Amplify configured. Use this code in the browser console:

```javascript
// Get the Amplify client from the app's context
(async () => {
  try {
    // Access the client from the app's module
    const { generateClient } = window.__AMPLIFY_CLIENT__ || 
      await import('/src/utils/flightStatus.js').then(() => {
        // Try to get it from the app's context
        return window.__AMPLIFY_CLIENT__;
      });
    
    // Alternative: Use the app's existing client
    // The app already has Amplify configured, so we can access it directly
    
    // Method 1: Access via React DevTools (if available)
    // Method 2: Use the app's window object if it exposes the client
    // Method 3: Use a simpler approach with fetch to AppSync directly
    
    console.log('Starting manual company creation...');
    
    // Get current user first
    const { getCurrentUser } = await import('https://esm.sh/aws-amplify@5/auth');
    const user = await getCurrentUser();
    console.log('Current user:', user);
    console.log('User ID:', user.userId);
    
    // For now, let's use a different approach - access the client from the app
    // We'll need to use the GraphQL endpoint directly or access the client differently
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

## Better Solution: Use the App's Existing Client

Since the app already has Amplify configured, we can access it through the React component tree or use a simpler GraphQL approach.

## Simplest Solution: Use GraphQL Directly

```javascript
// Get the API endpoint from amplify_outputs.json
(async () => {
  // First, get the current user
  const authResponse = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
    method: 'POST',
    headers: {
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetUser',
      'Content-Type': 'application/x-amz-json-1.1'
    }
  });
  
  // Actually, let's use a simpler approach - refresh the page and check console
  // Or use the app's existing client through window object
})();
```

## Easiest Solution: Check What's Available

Run this first to see what's available:

```javascript
// Check what Amplify objects are available
console.log('Window objects:', Object.keys(window).filter(k => k.includes('amplify') || k.includes('Amplify')));
console.log('React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Try to access the client from the app
// The app uses generateClient from 'aws-amplify/data'
// We need to access it through the app's context
```

## Recommended: Use React DevTools

1. Install React DevTools browser extension
2. Open React DevTools
3. Find the `CompanyProvider` component
4. Check its state and see what errors are in the console

## Alternative: Refresh and Check Console

The CompanyContext should automatically create the company. Check the console for:
- "Error ensuring default company"
- "Company creation errors"
- "CompanyUser creation errors"

Share those specific error messages and we can fix them.
