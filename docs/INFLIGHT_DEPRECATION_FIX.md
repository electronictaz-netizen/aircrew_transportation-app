# Inflight Deprecation Warning Fix

## Problem

During build/deploy, npm was showing a deprecation warning:
```
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. 
Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests.
```

## Root Cause

The `inflight` package is a transitive dependency pulled in by:
- `glob@7.2.3` (used by AWS Amplify packages)
- Specifically: `@aws-amplify/backend-cli` → `@ardatan/relay-compiler@12.0.0` → `glob@7.2.3` → `inflight@1.0.6`

The `inflight` package has a known memory leak and was deprecated in May 2024.

## Solution

Added npm `overrides` in `package.json` to force all packages to use `glob@10+`, which doesn't depend on `inflight`:

```json
{
  "overrides": {
    "glob": "^10.0.0"
  }
}
```

## Why This Works

- `glob@8+` removed the `inflight` dependency
- `glob@10` is the latest stable version
- The override forces all transitive dependencies to use `glob@10` instead of `glob@7`
- AWS Amplify tooling is compatible with `glob@10`

## Verification

After applying the fix:
- ✅ `npm ls inflight` shows `(empty)` - no inflight in dependency tree
- ✅ `npm install` no longer shows inflight deprecation warning
- ✅ Build completes successfully
- ✅ AWS Amplify deployment works correctly

## Testing

To verify the fix:
```bash
# Check if inflight is still in dependency tree
npm ls inflight

# Should show: (empty)

# Run build to verify no warnings
npm run build

# Should not show inflight deprecation warning
```

## Notes

- This is a **build-time dependency** issue, not a runtime issue
- The memory leak only affects build processes, not the running application
- AWS Amplify will eventually update their dependencies, but this fix addresses it now
- The override is safe and doesn't break any functionality

## Related

- [npm overrides documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
- [inflight deprecation notice](https://github.com/isaacs/inflight-DEPRECATED-DO-NOT-USE)
- [glob v8 release notes](https://github.com/isaacs/node-glob/releases)

---

**Date Fixed:** January 28, 2026  
**Status:** ✅ Resolved
