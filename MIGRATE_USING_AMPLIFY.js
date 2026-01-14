/**
 * Migration Script Using Amplify Client
 * 
 * This script uses the app's already-configured Amplify instance
 * Copy this ENTIRE code block into your DEPLOYED app's browser console (F12)
 * Make sure you are LOGGED IN first!
 */

(async function migrate() {
  console.log('🚀 Starting migration using Amplify client...\n');
  
  try {
    // Step 1: Import Amplify modules (they're already loaded in the app)
    console.log('📋 Step 1: Loading Amplify modules...');
    
    const { generateClient } = await import('aws-amplify/data');
    const { fetchAuthSession } = await import('aws-amplify/auth');
    
    // Step 2: Get auth session
    console.log('📋 Step 2: Getting auth session...');
    const session = await fetchAuthSession();
    
    if (!session.tokens?.idToken) {
      throw new Error('Not authenticated. Please log in first.');
    }
    
    console.log('✅ Authenticated');
    
    // Step 3: Generate client (Amplify is already configured in the app)
    console.log('📋 Step 3: Generating Amplify client...');
    
    // The app already has Amplify.configure() called, so we can just generate the client
    // We need to get the schema type, but we can work around it
    const client = generateClient();
    
    // Step 4: Find GLS Transportation company
    console.log('\n📋 Step 4: Finding GLS Transportation company...');
    const { data: companies, errors: companyErrors } = await client.models.Company.list();
    
    if (companyErrors && companyErrors.length > 0) {
      throw new Error('Error listing companies: ' + JSON.stringify(companyErrors));
    }
    
    const company = companies?.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
    
    if (!company) {
      throw new Error('GLS Transportation company not found. Please refresh and log in to create it.');
    }
    
    console.log('✅ Found company:', company.name, company.id);
    const companyId = company.id;
    
    // Step 5: Migrate trips
    console.log('\n📋 Step 5: Migrating trips...');
    const { data: allTrips } = await client.models.Trip.list();
    const tripsToMigrate = (allTrips || []).filter(t => !t.companyId);
    
    console.log(`Found ${allTrips?.length || 0} trips, ${tripsToMigrate.length} need migration`);
    
    let migrated = 0;
    for (const trip of tripsToMigrate) {
      try {
        await client.models.Trip.update({
          id: trip.id,
          companyId: companyId
        });
        migrated++;
        if (migrated % 10 === 0) console.log(`  Migrated ${migrated} trips...`);
      } catch (e) {
        console.error(`  ❌ Trip ${trip.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} trips`);
    
    // Step 6: Migrate drivers
    console.log('\n📋 Step 6: Migrating drivers...');
    const { data: allDrivers } = await client.models.Driver.list();
    const driversToMigrate = (allDrivers || []).filter(d => !d.companyId);
    
    console.log(`Found ${allDrivers?.length || 0} drivers, ${driversToMigrate.length} need migration`);
    
    migrated = 0;
    for (const driver of driversToMigrate) {
      try {
        await client.models.Driver.update({
          id: driver.id,
          companyId: companyId
        });
        migrated++;
      } catch (e) {
        console.error(`  ❌ Driver ${driver.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} drivers`);
    
    // Step 7: Migrate locations
    console.log('\n📋 Step 7: Migrating locations...');
    const { data: allLocations } = await client.models.Location.list();
    const locationsToMigrate = (allLocations || []).filter(l => !l.companyId);
    
    console.log(`Found ${allLocations?.length || 0} locations, ${locationsToMigrate.length} need migration`);
    
    migrated = 0;
    for (const location of locationsToMigrate) {
      try {
        await client.models.Location.update({
          id: location.id,
          companyId: companyId
        });
        migrated++;
      } catch (e) {
        console.error(`  ❌ Location ${location.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} locations`);
    
    // Step 8: Verify
    console.log('\n📋 Step 8: Verifying migration...');
    const { data: verifyTrips } = await client.models.Trip.list({
      filter: { companyId: { eq: companyId } }
    });
    
    const { data: verifyDrivers } = await client.models.Driver.list({
      filter: { companyId: { eq: companyId } }
    });
    
    const { data: verifyLocations } = await client.models.Location.list({
      filter: { companyId: { eq: companyId } }
    });
    
    console.log('\n✅ Migration Summary:');
    console.log(`   Trips: ${verifyTrips?.length || 0}`);
    console.log(`   Drivers: ${verifyDrivers?.length || 0}`);
    console.log(`   Locations: ${verifyLocations?.length || 0}`);
    console.log('\n🎉 Migration complete! Refresh the page (F5) to see your data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message, error.stack);
    alert('Migration failed: ' + error.message + '\n\nCheck console for details.');
  }
})();
