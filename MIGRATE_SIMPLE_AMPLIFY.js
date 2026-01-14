/**
 * SIMPLE Migration Using Amplify Client
 * 
 * ⚠️ IMPORTANT: ES module imports don't work in browser console
 * Use MIGRATE_VIA_NETWORK.js instead - it gets the API URL from Network tab
 * 
 * This file is kept for reference but won't work in console
 */

(async function() {
  console.log('⚠️  This script uses ES imports which don\'t work in browser console.');
  console.log('Please use MIGRATE_VIA_NETWORK.js instead.');
  console.log('It will guide you to get the API URL from the Network tab.');
  return;
  
  try {
    // This won't work in console - ES imports fail
    const { generateClient } = await import('aws-amplify/data');
    const { fetchAuthSession } = await import('aws-amplify/auth');
    
    // Check auth
    const sess = await fetchAuthSession();
    if (!sess.tokens?.idToken) throw new Error('Not logged in');
    console.log('✅ Authenticated');
    
    // Get client (Amplify already configured)
    const client = generateClient();
    
    // Find company
    console.log('Finding company...');
    const { data: cs } = await client.models.Company.list();
    const co = cs?.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
    if (!co) throw new Error('Company not found. Refresh and log in.');
    console.log('✅ Found:', co.name);
    
    // Migrate trips
    console.log('\nMigrating trips...');
    const { data: ts } = await client.models.Trip.list();
    const tsm = (ts || []).filter(t => !t.companyId);
    console.log(`${ts?.length || 0} total, ${tsm.length} need migration`);
    let c = 0;
    for (const t of tsm) {
      try {
        await client.models.Trip.update({ id: t.id, companyId: co.id });
        c++;
        if (c % 10 === 0) console.log(`  ${c}...`);
      } catch (e) { console.error(`  ❌ ${t.id}`); }
    }
    console.log(`✅ ${c} trips migrated`);
    
    // Migrate drivers
    console.log('\nMigrating drivers...');
    const { data: ds } = await client.models.Driver.list();
    const dsm = (ds || []).filter(d => !d.companyId);
    console.log(`${ds?.length || 0} total, ${dsm.length} need migration`);
    c = 0;
    for (const d of dsm) {
      try {
        await client.models.Driver.update({ id: d.id, companyId: co.id });
        c++;
      } catch (e) { console.error(`  ❌ ${d.id}`); }
    }
    console.log(`✅ ${c} drivers migrated`);
    
    // Migrate locations
    console.log('\nMigrating locations...');
    const { data: ls } = await client.models.Location.list();
    const lsm = (ls || []).filter(l => !l.companyId);
    console.log(`${ls?.length || 0} total, ${lsm.length} need migration`);
    c = 0;
    for (const l of lsm) {
      try {
        await client.models.Location.update({ id: l.id, companyId: co.id });
        c++;
      } catch (e) { console.error(`  ❌ ${l.id}`); }
    }
    console.log(`✅ ${c} locations migrated`);
    
    // Verify
    const vt = await client.models.Trip.list({ filter: { companyId: { eq: co.id } } });
    const vd = await client.models.Driver.list({ filter: { companyId: { eq: co.id } } });
    const vl = await client.models.Location.list({ filter: { companyId: { eq: co.id } } });
    
    console.log('\n✅ Summary:');
    console.log(`   Trips: ${vt.data?.length || 0}`);
    console.log(`   Drivers: ${vd.data?.length || 0}`);
    console.log(`   Locations: ${vl.data?.length || 0}`);
    console.log('\n🎉 Done! Refresh page (F5)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    alert('Migration failed: ' + error.message);
  }
})();
