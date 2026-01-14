# Debug: "No Company Assigned" Error

## Quick Debug Steps

### Step 1: Check Browser Console

1. Open your app in the browser
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Look for errors related to:
   - "Error loading company"
   - "Error ensuring default company"
   - "Company creation errors"
   - "CompanyUser creation errors"

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Filter by **XHR** or **Fetch**
3. Look for failed requests to AppSync (GraphQL)
4. Check the error messages in the response

### Step 3: Manual Company Creation (Quick Fix)

Open browser console (F12) and run:

```javascript
// Step 1: Import Amplify client
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

// Step 2: Check if Company model exists
console.log('Company model available:', !!client.models.Company);

// Step 3: Try to list companies
const { data: companies, errors } = await client.models.Company.list();
console.log('Companies:', companies);
console.log('Errors:', errors);

// Step 4: Create company if it doesn't exist
if (!companies || companies.length === 0) {
  const { data: newCompany, errors: createErrors } = await client.models.Company.create({
    name: 'GLS Transportation',
    subdomain: 'gls',
    isActive: true,
    subscriptionTier: 'premium',
    subscriptionStatus: 'active',
  });
  console.log('Created company:', newCompany);
  console.log('Create errors:', createErrors);
}

// Step 5: Get current user
const { getCurrentUser } = await import('aws-amplify/auth');
const user = await getCurrentUser();
console.log('Current user:', user);
console.log('User ID:', user.userId);

// Step 6: Create CompanyUser record
const { data: allCompanies } = await client.models.Company.list();
const glsCompany = allCompanies?.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');

if (glsCompany) {
  const { data: companyUser, errors: userErrors } = await client.models.CompanyUser.create({
    companyId: glsCompany.id,
    userId: user.userId,
    email: user.signInDetails?.loginId || '',
    role: 'admin',
    isActive: true,
  });
  console.log('Created CompanyUser:', companyUser);
  console.log('User errors:', userErrors);
  
  // Step 7: Refresh the page
  console.log('✅ Company and CompanyUser created! Refresh the page now.');
}
```

### Step 4: Verify Schema Deployment

In browser console:

```javascript
// Check if Company model is available
const { generateClient } = await import('aws-amplify/data');
const client = generateClient();

// Try to access Company model
try {
  const { data, errors } = await client.models.Company.list();
  console.log('✅ Company model exists!');
  console.log('Companies:', data);
  console.log('Errors:', errors);
} catch (error) {
  console.error('❌ Company model not found:', error);
  console.error('Schema may not be deployed yet');
}
```

## Common Issues

### Issue 1: Company Model Not Deployed
**Symptom:** Error "Company model not found" or "Cannot read properties of undefined"

**Solution:** 
- Verify schema is deployed
- Check that `amplify_outputs.json` has real values (not PLACEHOLDER)
- Wait for CI/CD deployment to complete

### Issue 2: Authorization Errors
**Symptom:** "Unauthorized" or "Access Denied" errors

**Solution:**
- Check that user is authenticated
- Verify schema authorization rules allow company creation
- Check IAM permissions

### Issue 3: Company Creation Fails Silently
**Symptom:** No errors but company not created

**Solution:**
- Check browser console for detailed errors
- Try manual creation (see Step 3 above)
- Verify user has permission to create companies

### Issue 4: CompanyUser Creation Fails
**Symptom:** Company exists but user not linked

**Solution:**
- Manually create CompanyUser (see Step 3)
- Check that userId matches Cognito user ID
- Verify email is correct

## After Manual Fix

Once you've manually created the company and CompanyUser:

1. **Refresh the page** (F5)
2. **Log in again**
3. You should now see the Management Dashboard

## Still Not Working?

1. **Check all console errors** - Look for specific error messages
2. **Verify schema deployment** - Company model must exist
3. **Check amplify_outputs.json** - Should have real values, not PLACEHOLDER
4. **Try incognito/private window** - Rule out cache issues
5. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
