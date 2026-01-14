# Migration Script Troubleshooting

## Error: "Unexpected token '<', "<!doctype "... is not valid JSON"

This error means the API returned HTML instead of JSON. Common causes:

### Cause 1: Wrong API URL

The `amplify_outputs.json` might have an incorrect URL, or the API endpoint doesn't exist.

**Check:**
```javascript
// In browser console:
fetch('/amplify_outputs.json')
  .then(r => r.json())
  .then(data => {
    console.log('API URL:', data.data?.url);
    console.log('API Key:', data.data?.api_key ? 'Present' : 'Missing');
  });
```

**Fix:** Wait for deployment to complete and ensure `amplify_outputs.json` has real values.

### Cause 2: CORS or Authentication Issues

The request might be getting blocked or redirected.

**Check Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Run the migration script
4. Look for the failed request
5. Check:
   - Status code (should be 200)
   - Response headers
   - Request URL

### Cause 3: API Key Invalid

The API key might be expired or invalid.

**Fix:** Wait for fresh deployment or check Amplify console for API key.

## Alternative: Use the App's Existing Client

Since the app already has Amplify configured, we can access it through React DevTools:

1. Install React DevTools browser extension
2. Open React DevTools
3. Find a component that uses `generateClient`
4. Access the client from there

## Quick Fix: Check What's Available

Run this in browser console to see what's available:

```javascript
// Check amplify_outputs.json
fetch('/amplify_outputs.json')
  .then(r => r.text())
  .then(text => {
    console.log('Raw response:', text.substring(0, 500));
    try {
      const data = JSON.parse(text);
      console.log('Parsed data:', data);
      if (data.data?.url === 'PLACEHOLDER') {
        console.error('❌ Still has PLACEHOLDER - deployment not complete');
      } else {
        console.log('✅ Has real values');
      }
    } catch (e) {
      console.error('Not valid JSON:', e);
    }
  });
```

## Best Solution: Wait and Retry

If you're getting HTML responses:

1. **Wait for deployment to fully complete** (check Amplify console)
2. **Hard refresh the deployed app** (Ctrl+Shift+R)
3. **Check amplify_outputs.json** has real values
4. **Then run migration script again**

The migration script needs:
- ✅ Real API URL (not PLACEHOLDER)
- ✅ Valid API key
- ✅ Valid auth token
- ✅ Schema deployed (Company model exists)
