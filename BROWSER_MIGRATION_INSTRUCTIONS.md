# Browser Console Migration - Quick Guide

## Run Migration in Deployed App

Since your local `amplify_outputs.json` has PLACEHOLDER values, run the migration directly in your **deployed app's browser console**.

## Steps

### 1. Open Your Deployed App
Go to your deployed app URL (not localhost).

### 2. Log In
Make sure you're logged in.

### 3. Open Browser Console
- Press **F12** (or right-click → Inspect)
- Go to **Console** tab

### 4. Copy and Paste Migration Script

**RECOMMENDED: Use MIGRATE_SIMPLE_AMPLIFY.js** (doesn't need amplify_outputs.json)

1. Open the file `MIGRATE_SIMPLE_AMPLIFY.js` in your project
2. Copy the **entire contents** (everything between the comments)
3. Paste into the browser console
4. Press Enter

**Alternative: MIGRATE_USING_AMPLIFY.js** (more detailed output, same approach)

**Old scripts (if amplify_outputs.json is available):**
- `MIGRATE_SIMPLE_CONSOLE.js`
- `MIGRATE_DATA_CONSOLE.js`

**Option B: Use the Full Script**

Copy the **entire contents** of `BROWSER_MIGRATION_SCRIPT.js` and paste it into the console, then press Enter.

**OR** use this shorter version:

```javascript
// Quick migration - copy this entire block
(async () => {
  const outputs = await fetch('/amplify_outputs.json').then(r => r.json());
  const { fetchAuthSession } = await import('https://esm.sh/aws-amplify@5/auth');
  const session = await fetchAuthSession();
  const token = session.tokens.idToken?.toString();
  
  const graphql = async (query, vars) => {
    const res = await fetch(outputs.data.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'x-api-key': outputs.data.api_key
      },
      body: JSON.stringify({ query, variables: vars })
    });
    return res.json();
  };
  
  // Find company
  const { data: { listCompanies: { items: companies } } } = await graphql(`
    query { listCompanies { items { id name } } }
  `);
  const company = companies.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
  if (!company) { console.error('Company not found'); return; }
  
  // Migrate trips
  const { data: { listTrips: { items: trips } } } = await graphql(`query { listTrips { items { id companyId } } }`);
  let count = 0;
  for (const trip of trips.filter(t => !t.companyId)) {
    await graphql(`mutation($id: ID!, $cid: ID!) { updateTrip(input: { id: $id, companyId: $cid }) { id } }`, 
      { id: trip.id, cid: company.id });
    count++;
  }
  console.log(`✅ Migrated ${count} trips`);
  
  // Migrate drivers
  const { data: { listDrivers: { items: drivers } } } = await graphql(`query { listDrivers { items { id companyId } } }`);
  count = 0;
  for (const driver of drivers.filter(d => !d.companyId)) {
    await graphql(`mutation($id: ID!, $cid: ID!) { updateDriver(input: { id: $id, companyId: $cid }) { id } }`, 
      { id: driver.id, cid: company.id });
    count++;
  }
  console.log(`✅ Migrated ${count} drivers`);
  
  // Migrate locations
  const { data: { listLocations: { items: locations } } } = await graphql(`query { listLocations { items { id companyId } } }`);
  count = 0;
  for (const location of locations.filter(l => !l.companyId)) {
    await graphql(`mutation($id: ID!, $cid: ID!) { updateLocation(input: { id: $id, companyId: $cid }) { id } }`, 
      { id: location.id, cid: company.id });
    count++;
  }
  console.log(`✅ Migrated ${count} locations`);
  
  console.log('🎉 Migration complete! Refresh the page.');
})();
```

### 5. Wait for Completion
The script will show progress and a summary when done.

### 6. Refresh the Page
Press **F5** to refresh and see your migrated data.

## What Gets Migrated

- ✅ All trips without `companyId` → Gets GLS Transportation `companyId`
- ✅ All drivers without `companyId` → Gets GLS Transportation `companyId`
- ✅ All locations without `companyId` → Gets GLS Transportation `companyId`

## Notes

- **Safe to run multiple times** - Only updates records missing `companyId`
- **No data loss** - Only adds `companyId`, doesn't modify other fields
- **Works in deployed app** - Uses the real backend configuration
