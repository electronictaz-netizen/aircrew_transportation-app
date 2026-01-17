# Dependency Update Guide

## Quick Start

### Check for outdated packages:
```bash
npm run check-deps
```

### Update all packages to latest (dry-run):
```bash
npm run update-all
```

### Actually update packages:
```bash
npm run update-all:apply
npm install
```

## What Was Updated

Based on the latest available versions, here are the key updates:

### Major Updates:
- **@aws-amplify/backend**: `^1.0.0` → `^1.20.0` (major update)
- **@aws-amplify/backend-cli**: `^1.0.0` → `^1.8.2` (major update)
- **date-fns**: `^2.30.0` → `^4.1.0` (major version jump - may have breaking changes)
- **@typescript-eslint/eslint-plugin**: `^6.14.0` → `^8.53.0` (major update)
- **@typescript-eslint/parser**: `^6.14.0` → `^8.53.0` (major update)
- **eslint**: `^8.55.0` → `^9.18.0` (major update - breaking changes)

### Minor/Patch Updates:
- **axios**: `^1.6.2` → `^1.7.9`
- **constructs**: `^10.3.0` → `^10.4.2`
- **react**: `^18.2.0` → `^18.3.1`
- **react-dom**: `^18.2.0` → `^18.3.1`
- **react-router-dom**: `^6.20.0` → `^6.28.0`
- **@aws-sdk/client-lambda**: `^3.700.0` → `^3.971.0`
- **@types/react**: `^18.2.43` → `^18.3.12`
- **@types/react-dom**: `^18.2.17` → `^18.3.1`
- **@vitejs/plugin-react**: `^4.2.1` → `^4.3.4`
- **typescript**: `^5.2.2` → `^5.7.2`

## Important Notes

### ⚠️ Breaking Changes to Watch For:

1. **date-fns v4.x**: 
   - Major version jump from v2 to v4
   - May have breaking API changes
   - Test all date formatting/parsing functionality

2. **ESLint v9.x**:
   - New flat config format (eslint.config.js instead of .eslintrc)
   - May require configuration updates
   - Check if your current ESLint config still works

3. **TypeScript ESLint v8.x**:
   - Requires ESLint v9.x
   - May have new rules or changed rule names

4. **@aws-amplify/backend v1.20.x**:
   - Check Amplify release notes for breaking changes
   - Test backend deployment after update

### Testing Checklist

After updating, test:
- [ ] Application builds successfully (`npm run build`)
- [ ] Development server starts (`npm run dev`)
- [ ] All date formatting/parsing works correctly
- [ ] ESLint runs without errors (`npm run lint`)
- [ ] TypeScript compilation succeeds
- [ ] Backend deploys successfully
- [ ] All features work as expected

### Rollback Plan

If issues occur:
```bash
git checkout package.json package-lock.json
npm install
```

## Automated Updates

The `updateToLatest.ts` script:
- Checks all packages against npm registry
- Shows what would be updated (dry-run mode)
- Updates package.json with latest versions
- Preserves version prefixes (^ or ~)

## Manual Update Process

1. **Check current versions:**
   ```bash
   npm outdated
   ```

2. **Update specific package:**
   ```bash
   npm install package-name@latest
   ```

3. **Update all packages:**
   ```bash
   npm update
   ```

4. **Update to latest (ignoring semver):**
   ```bash
   npm install package-name@latest --save
   ```

## Version Strategy

- **^ (caret)**: Allows minor and patch updates (e.g., `^1.0.0` allows `1.x.x`)
- **~ (tilde)**: Allows only patch updates (e.g., `~1.0.0` allows `1.0.x`)
- **Latest**: Always use the absolute latest version

The update script preserves your existing version prefix strategy.
