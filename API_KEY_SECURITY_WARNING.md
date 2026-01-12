# ⚠️ API KEY SECURITY WARNING

## DO NOT Commit API Keys to Git!

**NEVER** put your API key directly in source code files that will be committed to Git.

### Why This is Dangerous:

1. **Publicly Visible**: API keys in code are visible to anyone who has access to your repository
2. **Browser Exposure**: Client-side code is visible in browser DevTools
3. **Git History**: Even if you remove it later, it remains in Git history forever
4. **Unauthorized Usage**: Anyone can copy your key and use your API quota
5. **Costs**: Others could rack up charges on your account
6. **No Way to Revoke**: Once exposed, you must generate a new key

### What Happens If You Commit a Key:

- ✅ Key is visible in GitHub/GitLab/etc.
- ✅ Anyone can clone your repo and see the key
- ✅ Bots scan public repos for API keys
- ✅ Your key could be stolen and misused
- ✅ You'll need to regenerate the key immediately

## ✅ Correct Way: Use Environment Variables

### For Local Development:
```env
# .env file (NOT committed to Git)
VITE_FLIGHT_API_KEY=your_actual_key_here
```

### For Production (AWS Amplify):
- Add as Environment Variable in Amplify Console
- Never in source code

## ❌ What NOT to Do:

```typescript
// DON'T DO THIS!
const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // ❌ EXPOSED!
```

## ✅ What TO Do:

```typescript
// DO THIS!
const API_KEY = import.meta.env.VITE_FLIGHT_API_KEY || 'YOUR_API_KEY';
```

## If You Already Committed a Key:

1. **Immediately regenerate the key** in AviationStack dashboard
2. **Remove it from the code**
3. **Add to .gitignore** (already done)
4. **Use git filter-branch or BFG Repo-Cleaner** to remove from history (advanced)
5. **Or create a new repository** if the key was exposed publicly

## Testing Without Environment Variables

If you need to test quickly without setting up environment variables:

1. **Use a test key** that you'll regenerate after testing
2. **Create a separate test file** that's in `.gitignore`
3. **Never commit it**
4. **Switch back to environment variables** before committing

---

**Remember**: Environment variables exist for a reason - to keep secrets out of your code!
