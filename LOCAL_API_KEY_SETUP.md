# Local API Key Setup (For Testing Only)

## ⚠️ Security Warning

**This is for LOCAL TESTING ONLY. Never commit API keys to Git!**

The file `src/config/apiKey.local.ts` is **gitignored** and will NOT be committed to your repository.

## Quick Setup

1. **Edit the file**: `src/config/apiKey.local.ts`

2. **Replace the placeholder**:
   ```typescript
   export const LOCAL_API_KEY = 'your_actual_api_key_here';
   ```

3. **Save the file** - it's already gitignored, so it won't be committed

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## How It Works

- The code checks for `apiKey.local.ts` first
- If found, it uses that API key
- If not found, it falls back to environment variables
- The local file is gitignored, so it's safe

## For Production

**Always use environment variables in AWS Amplify Console**, not the local file.

## Verification

After setting up, check in browser console:
```javascript
debugFlightAPI()
```

You should see:
- ✅ API Key Configured: Yes
- ✅ API connection successful

## Removing Local Config

If you want to switch back to environment variables:
1. Delete or rename `src/config/apiKey.local.ts`
2. Use `.env` file or AWS Amplify environment variables instead
