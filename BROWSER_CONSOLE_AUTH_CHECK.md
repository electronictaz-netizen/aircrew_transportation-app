# Browser Console Authentication Check (Working Version)

## Problem

Dynamic imports don't work in browser console. Use the already-loaded Amplify instance instead.

## Solution: Access Amplify Through Window/Global Scope

Since Amplify is already loaded in your app, use these commands:

### Method 1: Check Network Tab (Easiest)

1. Open **DevTools** → **Network** tab
2. Try to sign in or load companies
3. Look for GraphQL requests to `klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com`
4. Click on a request → **Headers** tab
5. Check **Request Headers**:
   - Look for `authorization` header
   - Should start with `Bearer eyJ...`
6. Check **Response**:
   - Status code: 200 = success, 401 = unauthorized
   - Response body: Look for error messages

### Method 2: Check Cookies/Storage

```javascript
// Check if authentication cookies exist
console.log('Cookies:', document.cookie);

// Check localStorage for Amplify/Cognito keys
const amplifyKeys = Object.keys(localStorage).filter(k => 
  k.toLowerCase().includes('amplify') || 
  k.toLowerCase().includes('cognito') ||
  k.toLowerCase().includes('cognitoidentityserviceprovider')
);
console.log('Amplify/Cognito keys:', amplifyKeys);
amplifyKeys.forEach(key => {
  try {
    const value = localStorage.getItem(key);
    console.log(key, ':', value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'empty');
  } catch (e) {
    console.log(key, ': (could not read)');
  }
});
```

### Method 3: Check if Amplify is Loaded

```javascript
// Check if Amplify is available globally
console.log('Amplify available:', typeof Amplify !== 'undefined');
console.log('Window.Amplify:', window.Amplify);

// Try to access Amplify modules
if (typeof window !== 'undefined' && window.Amplify) {
  console.log('Amplify modules:', Object.keys(window.Amplify));
}
```

### Method 4: Inspect GraphQL Requests

```javascript
// Intercept fetch requests to see what's being sent
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args[0]);
  if (args[1] && args[1].headers) {
    console.log('Headers:', args[1].headers);
    if (args[1].headers.get && args[1].headers.get('authorization')) {
      console.log('✅ Authorization header present');
    } else {
      console.log('❌ No authorization header');
    }
  }
  return originalFetch.apply(this, args).then(response => {
    console.log('Response status:', response.status, response.statusText);
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized error!');
    }
    return response;
  });
};

console.log('✅ Fetch interceptor installed. Try loading companies now.');
```

### Method 5: Check Current URL and Domain

```javascript
console.log('Current URL:', window.location.href);
console.log('Current origin:', window.location.origin);
console.log('Current domain:', window.location.hostname);
console.log('Protocol:', window.location.protocol);

// Check if we're on the custom domain
if (window.location.hostname === 'onyxdispatch.us') {
  console.log('✅ On custom domain');
} else {
  console.log('⚠️  Not on custom domain:', window.location.hostname);
}
```

### Method 6: Manual Token Check (If Available)

If you can see tokens in localStorage, check them:

```javascript
// Find Cognito token keys
const tokenKeys = Object.keys(localStorage).filter(k => 
  k.includes('CognitoIdentityServiceProvider') && k.includes('idToken')
);

if (tokenKeys.length > 0) {
  console.log('Found token keys:', tokenKeys);
  tokenKeys.forEach(key => {
    const token = localStorage.getItem(key);
    if (token) {
      try {
        // Decode JWT token (just the payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', {
          sub: payload.sub,
          email: payload.email,
          exp: new Date(payload.exp * 1000).toLocaleString(),
          valid: payload.exp * 1000 > Date.now() ? '✅' : '❌ EXPIRED'
        });
      } catch (e) {
        console.log('Could not parse token');
      }
    }
  });
} else {
  console.log('❌ No tokens found in localStorage');
}
```

## Quick Diagnostic Checklist

Run these in order:

1. **Check domain:**
   ```javascript
   console.log('Domain:', window.location.hostname);
   ```

2. **Check cookies:**
   ```javascript
   console.log('Cookies:', document.cookie ? 'Present' : 'None');
   ```

3. **Check localStorage:**
   ```javascript
   console.log('localStorage keys:', Object.keys(localStorage).filter(k => k.includes('cognito') || k.includes('amplify')).length);
   ```

4. **Check Network tab:**
   - Open Network tab
   - Try to load companies
   - Look for 401 errors
   - Check request headers for `authorization`

## Most Important: Check Network Tab

The Network tab will tell you exactly what's happening:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Try to sign in or load companies**
4. **Find the GraphQL request** (filter by "graphql" or "appsync")
5. **Click on it** → **Headers** tab
6. **Check:**
   - **Request URL**: Should be `klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql`
   - **Request Headers**: Look for `authorization: Bearer ...`
   - **Response Status**: 200 = good, 401 = unauthorized
   - **Response Body**: Will show the actual error message

## What to Look For

- **No authorization header** → Authentication not working, tokens not being sent
- **401 status** → Token invalid or AppSync not accepting it
- **CORS error** → CORS not configured for custom domain
- **Network error** → Connection issue or wrong endpoint

## Report Back

After checking the Network tab, tell me:
1. What's the response status code?
2. Is there an `authorization` header in the request?
3. What does the response body say?
4. Any CORS errors in the console?

This will help identify the exact issue.
