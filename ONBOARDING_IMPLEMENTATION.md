# Quick Implementation Guide: New Company Onboarding

## Current Situation

Right now, **only GLS Transportation** is automatically created. New companies need to be manually created.

## Quick Solution: Admin Creates Companies

The fastest way to onboard new companies is to have an admin create them manually:

### Step 1: Create Company via Browser Console

Run this in your browser console (while logged in as an admin):

```javascript
(async function createCompany() {
  const { generateClient } = await import('aws-amplify/data');
  const client = generateClient();
  
  const companyData = {
    name: 'Acme Transportation', // Change this
    subdomain: 'acme', // Change this (lowercase, no spaces)
    isActive: true,
    subscriptionTier: 'premium',
    subscriptionStatus: 'active'
  };
  
  const { data, errors } = await client.models.Company.create(companyData);
  
  if (errors) {
    console.error('Error:', errors);
  } else {
    console.log('✅ Company created:', data);
    console.log('Company ID:', data.id);
  }
})();
```

### Step 2: Link Users to Company

After creating the company, link users:

```javascript
(async function linkUser() {
  const { generateClient } = await import('aws-amplify/data');
  const client = generateClient();
  
  const COMPANY_ID = 'paste-company-id-here';
  const USER_EMAIL = 'user@example.com';
  const USER_ID = 'paste-user-id-from-cognito';
  
  const { data, errors } = await client.models.CompanyUser.create({
    companyId: COMPANY_ID,
    userId: USER_ID,
    email: USER_EMAIL,
    role: 'admin', // or 'manager' or 'driver'
    isActive: true
  });
  
  if (errors) {
    console.error('Error:', errors);
  } else {
    console.log('✅ User linked to company');
  }
})();
```

## Better Solution: Add to Management Dashboard

Add a "Create Company" button to your Management Dashboard for easier onboarding.
