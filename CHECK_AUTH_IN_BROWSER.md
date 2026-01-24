# Check Authentication Status in Browser Console

## Problem

The ES6 import syntax doesn't work in browser console. Use these alternatives instead.

## Solution: Use Amplify's Global Instance

Since Amplify is already loaded in your app, use these commands in the browser console:

### Check Authentication Status

```javascript
// Method 1: Using Amplify's global instance
(async () => {
  try {
    const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    
    console.log('✅ User authenticated:', {
      userId: user.userId,
      email: user.signInDetails?.loginId || user.username,
      tokens: {
        idToken: session.tokens?.idToken ? 'Present' : 'Missing',
        accessToken: session.tokens?.accessToken ? 'Present' : 'Missing',
      }
    });
    
    // Check token expiration
    if (session.tokens?.idToken) {
      const payload = JSON.parse(atob(session.tokens.idToken.toString().split('.')[1]));
      console.log('Token expiration:', new Date(payload.exp * 1000));
      console.log('Token valid:', payload.exp * 1000 > Date.now());
    }
  } catch (error) {
    console.error('❌ Not authenticated:', error);
  }
})();
```

### Alternative: Check via GraphQL Client

```javascript
// Method 2: Test GraphQL request directly
(async () => {
  try {
    const { generateClient } = await import('aws-amplify/data');
    const client = generateClient();
    
    console.log('Testing GraphQL request...');
    const { data, errors } = await client.models.Company.list();
    
    if (errors && errors.length > 0) {
      console.error('❌ GraphQL errors:', errors);
    } else {
      console.log('✅ GraphQL request successful:', data?.length || 0, 'companies');
    }
  } catch (error) {
    console.error('❌ GraphQL request failed:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }
})();
```

### Check Cookies/Storage

```javascript
// Method 3: Check if authentication cookies are stored
console.log('Cookies:', document.cookie);
console.log('Local Storage:', Object.keys(localStorage).filter(k => k.includes('amplify') || k.includes('cognito')));
console.log('Session Storage:', Object.keys(sessionStorage).filter(k => k.includes('amplify') || k.includes('cognito')));
```

### Full Diagnostic Script

Run this complete diagnostic:

```javascript
(async () => {
  console.log('=== Authentication Diagnostic ===\n');
  
  // 1. Check user
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    console.log('✅ User:', {
      userId: user.userId,
      email: user.signInDetails?.loginId || user.username,
    });
  } catch (error) {
    console.error('❌ User check failed:', error.message);
    return;
  }
  
  // 2. Check session
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    
    console.log('\n✅ Session:', {
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
      credentials: session.credentials ? 'Present' : 'Missing',
    });
    
    // Check token expiration
    if (session.tokens?.idToken) {
      try {
        const payload = JSON.parse(atob(session.tokens.idToken.toString().split('.')[1]));
        const expDate = new Date(payload.exp * 1000);
        const isValid = payload.exp * 1000 > Date.now();
        console.log('Token expiration:', expDate.toLocaleString());
        console.log('Token valid:', isValid ? '✅' : '❌ EXPIRED');
      } catch (e) {
        console.log('Could not parse token');
      }
    }
  } catch (error) {
    console.error('❌ Session check failed:', error.message);
  }
  
  // 3. Test GraphQL
  try {
    const { generateClient } = await import('aws-amplify/data');
    const client = generateClient();
    const { data, errors } = await client.models.Company.list();
    
    if (errors && errors.length > 0) {
      console.error('\n❌ GraphQL errors:', errors);
    } else {
      console.log('\n✅ GraphQL test successful:', data?.length || 0, 'companies');
    }
  } catch (error) {
    console.error('\n❌ GraphQL test failed:', error.message);
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.error('⚠️  This is an authorization issue. Check:');
      console.error('   1. AppSync API authorization mode');
      console.error('   2. Cognito callback URLs');
      console.error('   3. Token validity');
    }
  }
  
  // 4. Check storage
  console.log('\n📦 Storage:');
  console.log('Cookies:', document.cookie ? 'Present' : 'None');
  const amplifyKeys = Object.keys(localStorage).filter(k => 
    k.includes('amplify') || k.includes('cognito') || k.includes('CognitoIdentityServiceProvider')
  );
  console.log('Amplify/Cognito keys in localStorage:', amplifyKeys.length);
  
  console.log('\n=== Diagnostic Complete ===');
})();
```

## What to Look For

After running the diagnostic:

1. **If user check fails:**
   - You're not signed in
   - Sign in again

2. **If tokens are missing:**
   - Authentication didn't complete
   - Check Cognito callback URLs
   - Clear cache and sign in again

3. **If token is expired:**
   - Sign out and sign back in
   - Tokens refresh automatically, but might need manual refresh

4. **If GraphQL returns 401:**
   - AppSync API authorization issue
   - Token not being sent correctly
   - Check request headers in Network tab

5. **If GraphQL works:**
   - Authentication is working!
   - The issue might be elsewhere (UI, permissions, etc.)

## Quick One-Liner

For a quick check, just run:

```javascript
import('aws-amplify/data').then(m => m.generateClient().models.Company.list()).then(r => console.log('✅ Works:', r.data?.length || 0, 'companies')).catch(e => console.error('❌ Failed:', e.message));
```

This will quickly tell you if GraphQL requests work.
