# Migration Script Instructions

## Important: Deploy Schema First!

**The migration script updates DATA, not code.** You must deploy the schema changes first before running the migration.

## Step-by-Step Process

### Step 1: Deploy the Schema (Required First)

The Company model must exist in your backend before you can run the migration:

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# For local/development deployment
npx ampx sandbox

# Note: npx ampx pipeline-deploy requires an app-id and is for CI/CD pipelines only
# For production, the schema will be deployed automatically via your CI/CD pipeline
# (see amplify.yml which uses $AWS_APP_ID environment variable)
```

**Wait for deployment to complete** - this creates the Company and CompanyUser models in your backend.

### Step 2: Run the Migration Script

After the schema is deployed, run the migration script:

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# Run the migration script
npx ts-node scripts/migrateToMultiTenant.ts
```

This will:
- Create the GLS Transportation company (if it doesn't exist)
- Add `companyId` to all existing trips
- Add `companyId` to all existing drivers  
- Add `companyId` to all existing locations
- Show a verification summary

### Step 3: Verify in the App

1. Refresh your web app
2. Log in
3. You should now be associated with GLS Transportation company
4. All your data should be visible

## Complete Command Sequence

```powershell
# Navigate to project
cd "C:\Users\ericd\app\Aircrew transportation app"

# Step 1: Deploy schema (if not already deployed)
npx ampx sandbox

# Step 2: Run migration script
npx ts-node scripts/migrateToMultiTenant.ts

# Step 3: Refresh your web app and log in
```

## What Gets Updated

### Migration Script Updates:
- ✅ **Database records** (trips, drivers, locations get `companyId`)
- ✅ **Creates Company record** (GLS Transportation)
- ❌ **Does NOT update code** (code is already pushed to git)

### Code Deployment:
- ✅ **Code changes** are already pushed to git
- ✅ **Schema changes** need to be deployed with `npx ampx sandbox`
- ✅ **After deployment**, the app will use the new schema

## Troubleshooting

### Error: "Company model not found"
**Solution:** The schema hasn't been deployed yet. Run `npx ampx sandbox` first.

### Error: "Unauthorized" or permission errors
**Solution:** Make sure you're authenticated. The script uses your Amplify credentials.

### Migration script runs but app still shows "No Company"
**Solution:** 
1. Check browser console for errors
2. Try refreshing the page
3. The CompanyContext should auto-create the company on login

## Notes

- **Migration script is idempotent** - safe to run multiple times
- **Only updates records missing `companyId`** - won't duplicate work
- **CompanyUser records** are created automatically when users log in (no need to create manually)
- **Data changes are immediate** - web app sees changes right away
