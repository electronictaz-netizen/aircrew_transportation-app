/**
 * SIMPLE Browser Console Migration Script
 * 
 * Copy and paste this ENTIRE code block into your DEPLOYED app's browser console (F12)
 * 
 * This migrates all existing trips, drivers, and locations to GLS Transportation company
 */

(async function() {
  console.log('🚀 Starting data migration...\n');
  
  try {
    // Step 1: Get API configuration
    const outputsRes = await fetch('/amplify_outputs.json');
    if (!outputsRes.ok) {
      throw new Error(`Failed to load amplify_outputs.json: ${outputsRes.status} ${outputsRes.statusText}`);
    }
    const outputs = await outputsRes.json();
    
    if (!outputs.data || outputs.data.url === 'PLACEHOLDER' || !outputs.data.url) {
      throw new Error('Backend not configured. amplify_outputs.json has PLACEHOLDER values. Wait for deployment to complete.');
    }
    
    const apiUrl = outputs.data.url;
    const apiKey = outputs.data.api_key;
    
    console.log('API URL:', apiUrl);
    console.log('API Key:', apiKey ? 'Present' : 'Missing');
    
    // Step 2: Get auth token
    // Since Amplify is already configured in the app, we can use it
    // Try to access Amplify from the global scope or use dynamic import
    let authToken = null;
    
    try {
      // Method 1: Try dynamic import (works in modern browsers)
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      authToken = session.tokens?.idToken?.toString();
    } catch (importError) {
      // Method 2: Try to get from Amplify's internal state via window
      console.warn('Import failed, trying alternative method...');
      // Check if Amplify is available globally
      if (window.Amplify && window.Amplify.Auth) {
        try {
          const session = await window.Amplify.Auth.currentSession();
          authToken = session.getIdToken().getJwtToken();
        } catch (e) {
          console.error('Could not get token from window.Amplify');
        }
      }
      
      if (!authToken) {
        // Method 3: Try localStorage (Cognito stores tokens there)
        const cognitoKeys = Object.keys(localStorage).filter(k => k.includes('CognitoIdentityServiceProvider'));
        if (cognitoKeys.length > 0) {
          console.warn('Cannot get auth token automatically. Please ensure you are logged in.');
          console.warn('You may need to refresh the page and log in again, then run this script.');
          throw new Error('Authentication required. Please log in and refresh, then run this script again.');
        }
      }
    }
    
    if (!authToken) {
      throw new Error('Not authenticated. Please log in first, then refresh and run this script.');
    }
    
    console.log('✅ Got API configuration and auth token');
    
    // Helper: GraphQL query with better error handling
    async function gql(query, variables) {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'x-api-key': apiKey
        },
        body: JSON.stringify({ query, variables: variables || {} })
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`API returned HTML instead of JSON. Status: ${res.status}. Check API URL: ${apiUrl}`);
      }
      
      const data = await res.json();
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error('GraphQL error: ' + JSON.stringify(data.errors));
      }
      return data;
    }
    
    // Step 3: Find GLS Transportation company
    console.log('\n📋 Finding GLS Transportation company...');
    const companiesRes = await gql(`
      query {
        listCompanies {
          items {
            id
            name
          }
        }
      }
    `);
    
    const companies = companiesRes.data?.listCompanies?.items || [];
    const company = companies.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
    
    if (!company) {
      throw new Error('GLS Transportation company not found. Please refresh and log in again to create it.');
    }
    
    console.log('✅ Found company:', company.name, company.id);
    const companyId = company.id;
    
    // Step 4: Migrate trips
    console.log('\n📋 Migrating trips...');
    const tripsRes = await gql(`query { listTrips { items { id companyId flightNumber } } }`);
    const allTrips = tripsRes.data?.listTrips?.items || [];
    const tripsToMigrate = allTrips.filter(t => !t.companyId);
    
    console.log(`Found ${allTrips.length} trips, ${tripsToMigrate.length} need migration`);
    
    let migrated = 0;
    for (const trip of tripsToMigrate) {
      try {
        await gql(`
          mutation UpdateTrip($input: UpdateTripInput!) {
            updateTrip(input: $input) {
              id
            }
          }
        `, {
          input: { id: trip.id, companyId: companyId }
        });
        migrated++;
        if (migrated % 10 === 0) console.log(`  Migrated ${migrated} trips...`);
      } catch (e) {
        console.error(`  ❌ Trip ${trip.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} trips`);
    
    // Step 5: Migrate drivers
    console.log('\n📋 Migrating drivers...');
    const driversRes = await gql(`query { listDrivers { items { id companyId name } } }`);
    const allDrivers = driversRes.data?.listDrivers?.items || [];
    const driversToMigrate = allDrivers.filter(d => !d.companyId);
    
    console.log(`Found ${allDrivers.length} drivers, ${driversToMigrate.length} need migration`);
    
    migrated = 0;
    for (const driver of driversToMigrate) {
      try {
        await gql(`
          mutation UpdateDriver($input: UpdateDriverInput!) {
            updateDriver(input: $input) {
              id
            }
          }
        `, {
          input: { id: driver.id, companyId: companyId }
        });
        migrated++;
      } catch (e) {
        console.error(`  ❌ Driver ${driver.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} drivers`);
    
    // Step 6: Migrate locations
    console.log('\n📋 Migrating locations...');
    const locationsRes = await gql(`query { listLocations { items { id companyId name } } }`);
    const allLocations = locationsRes.data?.listLocations?.items || [];
    const locationsToMigrate = allLocations.filter(l => !l.companyId);
    
    console.log(`Found ${allLocations.length} locations, ${locationsToMigrate.length} need migration`);
    
    migrated = 0;
    for (const location of locationsToMigrate) {
      try {
        await gql(`
          mutation UpdateLocation($input: UpdateLocationInput!) {
            updateLocation(input: $input) {
              id
            }
          }
        `, {
          input: { id: location.id, companyId: companyId }
        });
        migrated++;
      } catch (e) {
        console.error(`  ❌ Location ${location.id}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${migrated} locations`);
    
    // Step 7: Verify
    console.log('\n📋 Verifying migration...');
    const verifyTrips = await gql(`
      query($filter: ModelTripFilterInput) {
        listTrips(filter: $filter) {
          items { id }
        }
      }
    `, { filter: { companyId: { eq: companyId } } });
    
    const verifyDrivers = await gql(`
      query($filter: ModelDriverFilterInput) {
        listDrivers(filter: $filter) {
          items { id }
        }
      }
    `, { filter: { companyId: { eq: companyId } } });
    
    const verifyLocations = await gql(`
      query($filter: ModelLocationFilterInput) {
        listLocations(filter: $filter) {
          items { id }
        }
      }
    `, { filter: { companyId: { eq: companyId } } });
    
    console.log('\n✅ Migration Summary:');
    console.log(`   Trips: ${verifyTrips.data?.listTrips?.items?.length || 0}`);
    console.log(`   Drivers: ${verifyDrivers.data?.listDrivers?.items?.length || 0}`);
    console.log(`   Locations: ${verifyLocations.data?.listLocations?.items?.length || 0}`);
    console.log('\n🎉 Migration complete! Refresh the page (F5) to see your data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    alert('Migration failed: ' + error.message + '\n\nCheck console for details.');
  }
})();
