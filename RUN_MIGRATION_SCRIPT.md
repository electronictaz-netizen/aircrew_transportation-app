# How to Run the Migration Script

## Prerequisites

**IMPORTANT:** The migration script requires the schema to be deployed first!

1. ✅ Schema must be deployed (Company model must exist)
2. ✅ `amplify_outputs.json` must have real values (not PLACEHOLDER)
3. ✅ You must be authenticated (logged in via Amplify)

## Command

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"
npx ts-node scripts/migrateToMultiTenant.ts
```

## What the Script Does

1. **Checks if Company model exists** - Verifies schema is deployed
2. **Finds or creates GLS Transportation company**
3. **Migrates all trips** - Adds `companyId` to trips missing it
4. **Migrates all drivers** - Adds `companyId` to drivers missing it
5. **Migrates all locations** - Adds `companyId` to locations missing it
6. **Shows verification summary** - Confirms how many records were migrated

## Expected Output

```
🚀 Starting migration to multi-tenant architecture...

Step 1: Checking for existing GLS Transportation company...
✅ Found existing GLS Transportation company: [company-id]

Step 3: Migrating trips...
  Migrated 10 trips...
  Migrated 20 trips...
✅ Migrated 50 trips

Step 4: Migrating drivers...
✅ Migrated 20 drivers

Step 5: Migrating locations...
✅ Migrated 10 locations

Step 7: Verifying migration...
✅ Verification:
   - Trips with companyId: 50
   - Drivers with companyId: 20
   - Locations with companyId: 10

🎉 Migration completed successfully!
```

## Common Errors

### Error: "Company model not found"
**Cause:** Schema not deployed yet

**Solution:**
- Wait for CI/CD deployment to complete
- Check Amplify console for deployment status
- Verify `amplify_outputs.json` has real values

### Error: "Amplify has not been configured"
**Cause:** `amplify_outputs.json` has PLACEHOLDER values or doesn't exist

**Solution:**
- Wait for deployment to complete
- The file should be updated automatically by CI/CD

### Error: "Unauthorized" or permission errors
**Cause:** Not authenticated or insufficient permissions

**Solution:**
- Make sure you're logged in
- Check that your user has permission to create/update companies

## When to Run

**Run the migration script AFTER:**
- ✅ Schema is deployed (Company model exists)
- ✅ You have existing data (trips/drivers/locations) that needs `companyId`
- ✅ You want to migrate data BEFORE users log in

**Don't run if:**
- ❌ Schema isn't deployed yet (you'll get "Company model not found")
- ❌ You don't have existing data (CompanyContext handles new data automatically)
- ❌ You're okay with CompanyContext auto-creating company on login

## After Running

1. **Refresh your app** - Changes are immediate
2. **Log in** - You should now be associated with the company
3. **Verify data** - Check that all trips/drivers/locations have `companyId`

## Notes

- **Script is idempotent** - Safe to run multiple times
- **Only updates records missing `companyId`** - Won't duplicate work
- **CompanyUser records** are created automatically when users log in (no need to create manually)
