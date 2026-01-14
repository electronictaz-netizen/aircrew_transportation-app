/**
 * Browser Console Migration Script
 * 
 * Run this in your DEPLOYED app's browser console (F12 → Console tab)
 * 
 * This will migrate all existing trips, drivers, and locations to GLS Transportation company
 */

(async function migrateDataInBrowser() {
  console.log('🚀 Starting data migration in browser...\n');
  
  try {
    // Get the Amplify client - it's already configured in the app
    // We need to access it through the app's context
    // Since we can't import directly, we'll use the app's existing client
    
    // Method: Access through window if exposed, or use fetch to AppSync directly
    // Actually, let's use a simpler approach - access the client from React DevTools
    // Or use the app's configured Amplify instance
    
    console.log('📋 Step 1: Getting Amplify client...');
    
    // The app already has Amplify configured, so we can access it
    // We'll need to get the client from the app's context
    // For now, let's use fetch to call AppSync directly
    
    // First, get amplify_outputs.json to get the API endpoint
    const outputsResponse = await fetch('/amplify_outputs.json');
    const outputs = await outputsResponse.json();
    
    if (!outputs.data || outputs.data.url === 'PLACEHOLDER') {
      throw new Error('Backend not properly configured. Check amplify_outputs.json');
    }
    
    const apiUrl = outputs.data.url;
    const apiKey = outputs.data.api_key;
    
    console.log('✅ Got API endpoint:', apiUrl);
    
    // Get auth token
    const { fetchAuthSession } = await import('https://esm.sh/aws-amplify@5/auth');
    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      throw new Error('Not authenticated. Please log in first.');
    }
    
    const authToken = session.tokens.idToken?.toString();
    console.log('✅ Got auth token');
    
    // Helper function to call GraphQL
    async function graphqlQuery(query, variables = {}) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'x-api-key': apiKey
        },
        body: JSON.stringify({ query, variables })
      });
      return response.json();
    }
    
    // Step 2: Find or create GLS Transportation company
    console.log('\n📋 Step 2: Finding GLS Transportation company...');
    
    const listCompaniesQuery = `
      query ListCompanies {
        listCompanies {
          items {
            id
            name
            subdomain
          }
        }
      }
    `;
    
    const companiesResult = await graphqlQuery(listCompaniesQuery);
    console.log('Companies result:', companiesResult);
    
    let companyId = null;
    
    if (companiesResult.data?.listCompanies?.items) {
      const glsCompany = companiesResult.data.listCompanies.items.find(
        c => c.name === 'GLS Transportation' || c.name === 'GLS'
      );
      if (glsCompany) {
        companyId = glsCompany.id;
        console.log('✅ Found company:', glsCompany.name, companyId);
      }
    }
    
    if (!companyId) {
      console.log('❌ GLS Transportation company not found.');
      console.log('   CompanyContext should have created it. Please refresh and log in again.');
      return;
    }
    
    // Step 3: Migrate trips
    console.log('\n📋 Step 3: Migrating trips...');
    
    const listTripsQuery = `
      query ListTrips {
        listTrips {
          items {
            id
            companyId
            flightNumber
            pickupDate
          }
        }
      }
    `;
    
    const tripsResult = await graphqlQuery(listTripsQuery);
    const allTrips = tripsResult.data?.listTrips?.items || [];
    const tripsNeedingMigration = allTrips.filter(t => !t.companyId);
    
    console.log(`Found ${allTrips.length} total trips, ${tripsNeedingMigration.length} need migration`);
    
    let tripCount = 0;
    for (const trip of tripsNeedingMigration) {
      try {
        const updateMutation = `
          mutation UpdateTrip($input: UpdateTripInput!) {
            updateTrip(input: $input) {
              id
              companyId
            }
          }
        `;
        
        await graphqlQuery(updateMutation, {
          input: {
            id: trip.id,
            companyId: companyId
          }
        });
        
        tripCount++;
        if (tripCount % 10 === 0) {
          console.log(`  Migrated ${tripCount} trips...`);
        }
      } catch (error) {
        console.error(`  ❌ Error migrating trip ${trip.id}:`, error);
      }
    }
    
    console.log(`✅ Migrated ${tripCount} trips`);
    
    // Step 4: Migrate drivers
    console.log('\n📋 Step 4: Migrating drivers...');
    
    const listDriversQuery = `
      query ListDrivers {
        listDrivers {
          items {
            id
            companyId
            name
          }
        }
      }
    `;
    
    const driversResult = await graphqlQuery(listDriversQuery);
    const allDrivers = driversResult.data?.listDrivers?.items || [];
    const driversNeedingMigration = allDrivers.filter(d => !d.companyId);
    
    console.log(`Found ${allDrivers.length} total drivers, ${driversNeedingMigration.length} need migration`);
    
    let driverCount = 0;
    for (const driver of driversNeedingMigration) {
      try {
        const updateMutation = `
          mutation UpdateDriver($input: UpdateDriverInput!) {
            updateDriver(input: $input) {
              id
              companyId
            }
          }
        `;
        
        await graphqlQuery(updateMutation, {
          input: {
            id: driver.id,
            companyId: companyId
          }
        });
        
        driverCount++;
      } catch (error) {
        console.error(`  ❌ Error migrating driver ${driver.id}:`, error);
      }
    }
    
    console.log(`✅ Migrated ${driverCount} drivers`);
    
    // Step 5: Migrate locations
    console.log('\n📋 Step 5: Migrating locations...');
    
    const listLocationsQuery = `
      query ListLocations {
        listLocations {
          items {
            id
            companyId
            name
          }
        }
      }
    `;
    
    const locationsResult = await graphqlQuery(listLocationsQuery);
    const allLocations = locationsResult.data?.listLocations?.items || [];
    const locationsNeedingMigration = allLocations.filter(l => !l.companyId);
    
    console.log(`Found ${allLocations.length} total locations, ${locationsNeedingMigration.length} need migration`);
    
    let locationCount = 0;
    for (const location of locationsNeedingMigration) {
      try {
        const updateMutation = `
          mutation UpdateLocation($input: UpdateLocationInput!) {
            updateLocation(input: $input) {
              id
              companyId
            }
          }
        `;
        
        await graphqlQuery(updateMutation, {
          input: {
            id: location.id,
            companyId: companyId
          }
        });
        
        locationCount++;
      } catch (error) {
        console.error(`  ❌ Error migrating location ${location.id}:`, error);
      }
    }
    
    console.log(`✅ Migrated ${locationCount} locations`);
    
    // Step 6: Verification
    console.log('\n📋 Step 6: Verifying migration...');
    
    const verifyTrips = await graphqlQuery(`
      query ListTrips($filter: ModelTripFilterInput) {
        listTrips(filter: $filter) {
          items {
            id
          }
        }
      }
    `, {
      filter: { companyId: { eq: companyId } }
    });
    
    const verifyDrivers = await graphqlQuery(`
      query ListDrivers($filter: ModelDriverFilterInput) {
        listDrivers(filter: $filter) {
          items {
            id
          }
        }
      }
    `, {
      filter: { companyId: { eq: companyId } }
    });
    
    const verifyLocations = await graphqlQuery(`
      query ListLocations($filter: ModelLocationFilterInput) {
        listLocations(filter: $filter) {
          items {
            id
          }
        }
      }
    `, {
      filter: { companyId: { eq: companyId } }
    });
    
    console.log('\n✅ Migration Summary:');
    console.log(`   - Trips with companyId: ${verifyTrips.data?.listTrips?.items?.length || 0}`);
    console.log(`   - Drivers with companyId: ${verifyDrivers.data?.listDrivers?.items?.length || 0}`);
    console.log(`   - Locations with companyId: ${verifyLocations.data?.listLocations?.items?.length || 0}`);
    
    console.log('\n🎉 Migration completed!');
    console.log('Please refresh the page to see your migrated data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message, error.stack);
    alert('Migration failed. Check console for details: ' + error.message);
  }
})();
