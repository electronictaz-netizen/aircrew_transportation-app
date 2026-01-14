/**
 * FINAL Migration Script - Works in Browser Console
 * 
 * This script accesses the app's already-loaded Amplify modules
 * Copy this ENTIRE code block into your DEPLOYED app's browser console (F12)
 * Make sure you are LOGGED IN first!
 * 
 * This version uses the app's existing module loader
 */

(async function migrate() {
  console.log('🚀 Starting migration...\n');
  
  try {
    // Method 1: Try to access Amplify from the app's bundle
    // The app already has these modules loaded, so we can access them via import maps or the app's loader
    
    // Since we can't use ES imports directly, we'll use a workaround:
    // Access the modules through the app's existing setup
    
    console.log('📋 Loading Amplify modules...');
    
    // Try to get the client from the React app's context or use fetch with GraphQL
    // First, let's try to get the API endpoint from the app's configuration
    
    // Check if we can access Amplify from window
    let client = null;
    let fetchAuthSession = null;
    let generateClient = null;
    
    // Try accessing via window if available
    if (window.Amplify) {
      console.log('Found Amplify on window');
      // Try different ways Amplify might be exposed
    }
    
    // Alternative: Use dynamic import with the app's module system
    // Since the app uses Vite, modules might be available via import()
    try {
      // Try using the app's module resolution
      const dataModule = await import('aws-amplify/data');
      const authModule = await import('aws-amplify/auth');
      
      generateClient = dataModule.generateClient;
      fetchAuthSession = authModule.fetchAuthSession;
      
      console.log('✅ Loaded modules via import');
    } catch (importError) {
      console.log('Import failed, trying alternative method...');
      
      // Alternative: Use fetch to call GraphQL directly
      // We need to get the API endpoint and auth token
      
      // Get auth token from Cognito storage
      const cognitoKeys = Object.keys(localStorage).filter(k => 
        k.includes('CognitoIdentityServiceProvider') && k.includes('idToken')
      );
      
      if (cognitoKeys.length === 0) {
        throw new Error('Not authenticated. Please log in first.');
      }
      
      // Get the token from the most recent session
      const tokenKey = cognitoKeys.find(k => k.includes('idToken')) || cognitoKeys[0];
      const tokenData = localStorage.getItem(tokenKey);
      
      if (!tokenData) {
        throw new Error('Could not find auth token. Please refresh and log in again.');
      }
      
      let token = null;
      try {
        const parsed = JSON.parse(tokenData);
        token = parsed || tokenData; // Could be string or object
        if (typeof token === 'object' && token.idToken) {
          token = token.idToken;
        }
      } catch (e) {
        token = tokenData; // Might already be a string
      }
      
      // Get API endpoint - try to find it in the app's source or use a known pattern
      // For Amplify Gen 2, the endpoint is usually in the app's configuration
      // We'll need to get it from the network tab or app config
      
      console.log('Using GraphQL fetch method...');
      console.log('⚠️  Need API endpoint. Check Network tab for GraphQL requests to get the URL.');
      
      // For now, throw an error with instructions
      throw new Error('Cannot access Amplify modules. Please use the Network tab method:\n\n1. Open DevTools → Network tab\n2. Filter by "graphql"\n3. Click on any GraphQL request\n4. Copy the Request URL\n5. Use that URL in the migration script');
    }
    
    // If we got here with modules loaded, proceed
    if (generateClient && fetchAuthSession) {
      // Get auth session
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        throw new Error('Not authenticated. Please log in first.');
      }
      
      console.log('✅ Authenticated');
      
      // Generate client
      client = generateClient();
      
      // Find company
      console.log('Finding company...');
      const { data: companies } = await client.models.Company.list();
      const company = companies?.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
      
      if (!company) {
        throw new Error('Company not found. Refresh and log in to create it.');
      }
      
      console.log('✅ Found:', company.name);
      
      // Migrate trips
      console.log('\nMigrating trips...');
      const { data: trips } = await client.models.Trip.list();
      const tripsToMigrate = (trips || []).filter(t => !t.companyId);
      console.log(`${trips?.length || 0} total, ${tripsToMigrate.length} need migration`);
      
      let count = 0;
      for (const trip of tripsToMigrate) {
        try {
          await client.models.Trip.update({ id: trip.id, companyId: company.id });
          count++;
          if (count % 10 === 0) console.log(`  ${count}...`);
        } catch (e) {
          console.error(`  ❌ ${trip.id}`);
        }
      }
      console.log(`✅ ${count} trips migrated`);
      
      // Migrate drivers
      console.log('\nMigrating drivers...');
      const { data: drivers } = await client.models.Driver.list();
      const driversToMigrate = (drivers || []).filter(d => !d.companyId);
      console.log(`${drivers?.length || 0} total, ${driversToMigrate.length} need migration`);
      
      count = 0;
      for (const driver of driversToMigrate) {
        try {
          await client.models.Driver.update({ id: driver.id, companyId: company.id });
          count++;
        } catch (e) {
          console.error(`  ❌ ${driver.id}`);
        }
      }
      console.log(`✅ ${count} drivers migrated`);
      
      // Migrate locations
      console.log('\nMigrating locations...');
      const { data: locations } = await client.models.Location.list();
      const locationsToMigrate = (locations || []).filter(l => !l.companyId);
      console.log(`${locations?.length || 0} total, ${locationsToMigrate.length} need migration`);
      
      count = 0;
      for (const location of locationsToMigrate) {
        try {
          await client.models.Location.update({ id: location.id, companyId: company.id });
          count++;
        } catch (e) {
          console.error(`  ❌ ${location.id}`);
        }
      }
      console.log(`✅ ${count} locations migrated`);
      
      // Verify
      const vt = await client.models.Trip.list({ filter: { companyId: { eq: company.id } } });
      const vd = await client.models.Driver.list({ filter: { companyId: { eq: company.id } } });
      const vl = await client.models.Location.list({ filter: { companyId: { eq: company.id } } });
      
      console.log('\n✅ Summary:');
      console.log(`   Trips: ${vt.data?.length || 0}`);
      console.log(`   Drivers: ${vd.data?.length || 0}`);
      console.log(`   Locations: ${vl.data?.length || 0}`);
      console.log('\n🎉 Done! Refresh page (F5)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    alert('Migration failed: ' + error.message);
  }
})();
