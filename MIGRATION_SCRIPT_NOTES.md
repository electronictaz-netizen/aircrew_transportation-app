# Migration Script - Important Notes

## Why the Migration Script Fails

The migration script requires the **Company model to exist** in your deployed backend. If you get:

```
Error: Company model not found. Please deploy the schema first
```

This means the schema hasn't been deployed yet.

## Two Options

### Option 1: Wait for CI/CD Deployment (Recommended)

1. **Code is already pushed to git** ✅
2. **CI/CD will deploy automatically** - Your `amplify.yml` will deploy the schema
3. **Wait for deployment to complete** - Check your Amplify console
4. **Then run migration script** (if you want to migrate existing data)

**Timeline:** Usually 5-15 minutes after pushing to git

### Option 2: Skip Migration Script (Easiest)

**The migration script is OPTIONAL!**

The `CompanyContext` will automatically:
- ✅ Create GLS Transportation company when users log in
- ✅ Create CompanyUser record linking user to company
- ✅ Work without the migration script

**You only need the migration script if:**
- You have existing trips/drivers/locations that need `companyId` added
- You want to do this BEFORE users log in

**If you don't have much existing data:**
- Just wait for CI/CD to deploy
- Have users log in
- CompanyContext will handle everything automatically
- Existing data can be updated later if needed

## When to Run Migration Script

**Run the migration script AFTER:**
1. ✅ Schema is deployed (Company model exists)
2. ✅ You have existing data (trips/drivers/locations) that needs `companyId`
3. ✅ You want to add `companyId` to existing records

**Don't run the migration script if:**
- ❌ Schema isn't deployed yet (you'll get the error you're seeing)
- ❌ You don't have existing data (CompanyContext will handle new data)
- ❌ You're okay with CompanyContext auto-creating the company on login

## Current Situation

Since you can't deploy locally (no AWS credentials):
1. **Wait for CI/CD** to deploy the schema
2. **Check Amplify console** to see when deployment completes
3. **Then decide** if you need the migration script

## How to Check if Schema is Deployed

After CI/CD completes, check in browser console:

```javascript
// This should work if schema is deployed
fetch('/amplify_outputs.json')
  .then(r => r.json())
  .then(data => {
    if (data.data?.url !== 'PLACEHOLDER') {
      console.log('✅ Backend is deployed!');
      console.log('API URL:', data.data.url);
    } else {
      console.log('❌ Still deploying...');
    }
  });
```

## Summary

- **Migration script = Optional** (only for migrating existing data)
- **CompanyContext = Automatic** (creates company on login)
- **Wait for CI/CD** to deploy schema first
- **Then decide** if you need the migration script
