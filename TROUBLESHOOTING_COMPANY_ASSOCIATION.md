# Troubleshooting: "No Company Associated" Error

## Common Causes

### 1. **Schema Not Deployed** (Most Common)
The Company model doesn't exist in your backend yet.

**Solution:**
```bash
# Deploy the schema first
npx ampx sandbox
# or for production
npx ampx pipeline-deploy --branch main
```

### 2. **Authorization Issues**
The user doesn't have permission to create companies.

**Solution:**
- Check that the user is authenticated
- Verify the schema authorization rules allow company creation
- Check browser console for authorization errors

### 3. **Migration Script Not Run**
If you have existing data, you may need to run the migration script.

**Solution:**
```bash
cd "C:\Users\ericd\app\Aircrew transportation app"
npx ts-node scripts/migrateToMultiTenant.ts
```

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors:
- Look for "Error ensuring default company"
- Look for "Company creation errors"
- Look for authorization/permission errors

### Step 2: Verify Schema is Deployed
In browser console, try:
```javascript
const { generateClient } = await import('aws-amplify/data');
const { Schema } = await import('./amplify/data/resource');
const client = generateClient();

// Try to list companies
const { data, errors } = await client.models.Company.list();
console.log('Companies:', data);
console.log('Errors:', errors);
```

If you get an error like "Company model not found", the schema isn't deployed.

### Step 3: Check User Authentication
In browser console:
```javascript
import { getCurrentUser } from 'aws-amplify/auth';
const user = await getCurrentUser();
console.log('User:', user);
console.log('User ID:', user.userId);
```

### Step 4: Manually Create Company (If Needed)
If automatic creation fails, you can manually create it:

In browser console:
```javascript
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

// Create company
const { data: company, errors } = await client.models.Company.create({
  name: 'GLS Transportation',
  subdomain: 'gls',
  isActive: true,
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
});

console.log('Company:', company);
console.log('Errors:', errors);

// Then create CompanyUser
const { getCurrentUser } = await import('aws-amplify/auth');
const user = await getCurrentUser();

const { data: companyUser, errors: userErrors } = await client.models.CompanyUser.create({
  companyId: company.id,
  userId: user.userId,
  email: user.signInDetails?.loginId || '',
  role: 'admin',
  isActive: true,
});

console.log('CompanyUser:', companyUser);
console.log('Errors:', userErrors);
```

## Quick Fixes

### Fix 1: Refresh the Page
Sometimes a simple refresh resolves the issue:
- Press F5 or click the Refresh button
- The CompanyContext will retry loading the company

### Fix 2: Clear Cache and Reload
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed API calls to AppSync
4. Check the error messages in the response

## Expected Behavior

When working correctly:
1. User logs in
2. CompanyContext loads
3. Checks for CompanyUser record
4. If not found, creates GLS Transportation company
5. Creates CompanyUser record linking user to company
6. User can access the app

## Still Having Issues?

1. **Check the browser console** - Look for specific error messages
2. **Verify schema deployment** - Ensure Company model exists
3. **Check user permissions** - User must be authenticated
4. **Run migration script** - If you have existing data
5. **Manually create company** - Use the browser console code above

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Company model not found" | Schema not deployed | Deploy schema |
| "Unauthorized" | Permission issue | Check authorization rules |
| "CompanyUser creation failed" | User ID mismatch | Check user.userId format |
| "No company found" | Company doesn't exist | Run migration or create manually |
