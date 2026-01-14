/**
 * SIMPLE Browser Console Migration - NO IMPORTS NEEDED
 * 
 * Copy this ENTIRE code block into your DEPLOYED app's browser console (F12)
 * Make sure you are LOGGED IN first!
 */

(async function migrate() {
  console.log('🚀 Starting migration...\n');
  
  try {
    // Get config
    const outputsRes = await fetch('/amplify_outputs.json');
    if (!outputsRes.ok) {
      throw new Error(`Failed to load amplify_outputs.json: ${outputsRes.status}`);
    }
    const outputs = await outputsRes.json();
    
    if (!outputs.data || outputs.data.url === 'PLACEHOLDER' || !outputs.data.url) {
      throw new Error('Backend not configured. amplify_outputs.json has PLACEHOLDER values. Wait for deployment to complete.');
    }
    
    console.log('API URL:', outputs.data.url);
    console.log('API Key:', outputs.data.api_key ? 'Present' : 'Missing');
    
    // Get auth token - try multiple methods
    let token = null;
    
    // Method 1: Try Amplify import (works if module is available)
    try {
      const mod = await import('aws-amplify/auth');
      const sess = await mod.fetchAuthSession();
      token = sess.tokens?.idToken?.toString();
    } catch (e) {
      console.log('Trying alternative auth method...');
      // Method 2: Check if we can access Amplify from window
      // The app has Amplify configured, so tokens might be in storage
      // For now, we'll need the user to ensure they're logged in
      throw new Error('Please ensure you are logged in. If error persists, refresh page and log in again, then run script.');
    }
    
    if (!token) throw new Error('Not authenticated');
    
    // GraphQL helper with better error handling
    const gql = async (q, v) => {
      const r = await fetch(outputs.data.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'x-api-key': outputs.data.api_key
        },
        body: JSON.stringify({ query: q, variables: v || {} })
      });
      
      // Check if response is JSON
      const contentType = r.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await r.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error(`API returned HTML instead of JSON. Check API URL: ${outputs.data.url}`);
      }
      
      const d = await r.json();
      if (d.errors) {
        console.error('GraphQL errors:', d.errors);
        throw new Error('GraphQL error: ' + JSON.stringify(d.errors));
      }
      return d;
    };
    
    // Find company
    console.log('Finding company...');
    const { data: { listCompanies: { items: cs } } } = await gql('query { listCompanies { items { id name } } }');
    const co = cs.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
    if (!co) throw new Error('Company not found. Refresh and log in to create it.');
    console.log('✅ Found:', co.name);
    
    // Migrate trips
    console.log('\nMigrating trips...');
    const { data: { listTrips: { items: ts } } } = await gql('query { listTrips { items { id companyId } } }');
    const tsm = ts.filter(t => !t.companyId);
    console.log(`${ts.length} total, ${tsm.length} need migration`);
    let c = 0;
    for (const t of tsm) {
      try {
        await gql('mutation($i: UpdateTripInput!) { updateTrip(input: $i) { id } }', {
          i: { id: t.id, companyId: co.id }
        });
        c++;
        if (c % 10 === 0) console.log(`  ${c}...`);
      } catch (e) { console.error(`  ❌ ${t.id}`); }
    }
    console.log(`✅ ${c} trips migrated`);
    
    // Migrate drivers
    console.log('\nMigrating drivers...');
    const { data: { listDrivers: { items: ds } } } = await gql('query { listDrivers { items { id companyId } } }');
    const dsm = ds.filter(d => !d.companyId);
    console.log(`${ds.length} total, ${dsm.length} need migration`);
    c = 0;
    for (const d of dsm) {
      try {
        await gql('mutation($i: UpdateDriverInput!) { updateDriver(input: $i) { id } }', {
          i: { id: d.id, companyId: co.id }
        });
        c++;
      } catch (e) { console.error(`  ❌ ${d.id}`); }
    }
    console.log(`✅ ${c} drivers migrated`);
    
    // Migrate locations
    console.log('\nMigrating locations...');
    const { data: { listLocations: { items: ls } } } = await gql('query { listLocations { items { id companyId } } }');
    const lsm = ls.filter(l => !l.companyId);
    console.log(`${ls.length} total, ${lsm.length} need migration`);
    c = 0;
    for (const l of lsm) {
      try {
        await gql('mutation($i: UpdateLocationInput!) { updateLocation(input: $i) { id } }', {
          i: { id: l.id, companyId: co.id }
        });
        c++;
      } catch (e) { console.error(`  ❌ ${l.id}`); }
    }
    console.log(`✅ ${c} locations migrated`);
    
    // Verify
    const vt = await gql('query($f: ModelTripFilterInput) { listTrips(filter: $f) { items { id } } }', { f: { companyId: { eq: co.id } } });
    const vd = await gql('query($f: ModelDriverFilterInput) { listDrivers(filter: $f) { items { id } } }', { f: { companyId: { eq: co.id } } });
    const vl = await gql('query($f: ModelLocationFilterInput) { listLocations(filter: $f) { items { id } } }', { f: { companyId: { eq: co.id } } });
    
    console.log('\n✅ Summary:');
    console.log(`   Trips: ${vt.data.listTrips.items.length}`);
    console.log(`   Drivers: ${vd.data.listDrivers.items.length}`);
    console.log(`   Locations: ${vl.data.listLocations.items.length}`);
    console.log('\n🎉 Done! Refresh page (F5)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    alert('Migration failed: ' + error.message);
  }
})();
