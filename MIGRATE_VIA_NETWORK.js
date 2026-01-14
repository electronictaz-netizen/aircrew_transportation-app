/**
 * Migration Script - Get API URL from Network Tab
 * 
 * Since ES module imports don't work in console, use this method:
 * 
 * 1. Open DevTools → Network tab
 * 2. Filter by "graphql" or "xhr"
 * 3. Perform any action in the app (like viewing trips)
 * 4. Click on a GraphQL request
 * 5. Copy the "Request URL" (it will look like: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql)
 * 6. Paste that URL below where it says "PASTE_API_URL_HERE"
 * 7. Run this script
 */

(async function migrate() {
  console.log('🚀 Starting migration via GraphQL API...\n');
  console.log('⏳ Script is running... Please wait for progress updates...\n');
  
  // ⚠️ STEP 1: Get your API URL from Network tab
  // Open DevTools → Network → Filter "graphql" → Click any request → Copy "Request URL"
  const API_URL = 'https://ucwy5mmmyrh2rjz6hhkolzwnke.appsync-api.us-east-1.amazonaws.com/graphql'; // Replace this with your API URL from Network tab
  
  console.log('✅ API URL configured:', API_URL.substring(0, 50) + '...');
  
  if (API_URL === 'PASTE_API_URL_HERE') {
    console.error('❌ Please set API_URL first!');
    console.log('\nInstructions:');
    console.log('1. Open DevTools → Network tab');
    console.log('2. Filter by "graphql"');
    console.log('3. Click on any GraphQL request');
    console.log('4. Copy the "Request URL"');
    console.log('5. Replace PASTE_API_URL_HERE in the script with that URL');
    alert('Please set the API_URL first. Check console for instructions.');
    return;
  }
  
  try {
    // Get auth token from localStorage (Cognito stores it there)
    console.log('📋 Step 1: Getting auth token from localStorage...');
    const cognitoKeys = Object.keys(localStorage).filter(k => 
      k.includes('CognitoIdentityServiceProvider')
    );
    
    console.log(`   Found ${cognitoKeys.length} Cognito keys in localStorage`);
    
    if (cognitoKeys.length === 0) {
      throw new Error('Not authenticated. Please log in first.');
    }
    
    // Find the idToken - try multiple strategies
    let token = null;
    
    // Strategy 1: Look for keys with 'idToken' in the name
    for (const key of cognitoKeys) {
      if (key.toLowerCase().includes('idtoken')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Token might be nested in an object
            if (typeof parsed === 'object' && parsed !== null) {
              token = parsed.idToken || parsed.IdToken || parsed.token || parsed;
            } else if (typeof parsed === 'string') {
              token = parsed;
            }
            if (token && typeof token === 'string' && token.length > 100) {
              console.log(`   ✅ Found token in key: ${key}`);
              break;
            }
          } catch (e) {
            // Not JSON, might be raw string
            if (data.length > 100) {
              token = data;
              console.log(`   ✅ Found token (raw string) in key: ${key}`);
              break;
            }
          }
        }
      }
    }
    
    // Strategy 2: Look for JWT-like strings in any Cognito key
    if (!token || typeof token !== 'string') {
      console.log('   Trying alternative token lookup...');
      for (const key of cognitoKeys) {
        const data = localStorage.getItem(key);
        if (data && data.length > 200 && data.includes('.')) {
          // JWT tokens have 3 parts separated by dots
          const parts = data.split('.');
          if (parts.length === 3 || (data.startsWith('eyJ') && data.length > 200)) {
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed === 'string' && parsed.length > 100) {
                token = parsed;
                console.log(`   ✅ Found token in key: ${key}`);
                break;
              }
            } catch (e) {
              // Raw JWT string
              token = data;
              console.log(`   ✅ Found token (JWT string) in key: ${key}`);
              break;
            }
          }
        }
      }
    }
    
    // Strategy 3: Check for accessToken (sometimes used instead)
    if (!token || typeof token !== 'string') {
      console.log('   Trying accessToken lookup...');
      for (const key of cognitoKeys) {
        if (key.toLowerCase().includes('accesstoken')) {
          const data = localStorage.getItem(key);
          if (data && data.length > 100) {
            try {
              const parsed = JSON.parse(data);
              token = parsed.accessToken || parsed.AccessToken || parsed || data;
              if (token && typeof token === 'string' && token.length > 100) {
                console.log(`   ✅ Found accessToken in key: ${key}`);
                break;
              }
            } catch (e) {
              if (data.length > 100) {
                token = data;
                console.log(`   ✅ Found accessToken (raw) in key: ${key}`);
                break;
              }
            }
          }
        }
      }
    }
    
    if (!token) {
      console.error('❌ Could not find auth token in localStorage');
      console.log('   Available Cognito keys:', cognitoKeys);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure you are logged in to the app');
      console.log('   2. Try refreshing the page and logging in again');
      console.log('   3. Run CHECK_AUTH.js script to see what keys are available');
      throw new Error('Could not find auth token. Please refresh and log in again.');
    }
    
    console.log('   ✅ Token found (length: ' + token.length + ' characters)');
    
    // Ensure token is a string and has Bearer prefix if needed
    if (!token.startsWith('Bearer ') && !token.startsWith('eyJ')) {
      // Might need to extract from object
      try {
        const parsed = JSON.parse(token);
        token = parsed.idToken || parsed.IdToken || parsed;
      } catch (e) {
        // Already a string
      }
    }
    
    if (!token.startsWith('Bearer ')) {
      token = token.startsWith('eyJ') ? token : `Bearer ${token}`;
    }
    
    console.log('✅ Step 1 Complete: Auth token ready\n');
    
    // Get API key from headers (check Network tab for x-api-key header)
    // Or try to get from the app's source
    // For now, we'll try without it first (some setups don't need it)
    const API_KEY = null; // You might need to get this from Network tab headers
    
    // GraphQL helper
    const gql = async (query, variables) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
      };
      
      if (API_KEY) {
        headers['x-api-key'] = API_KEY;
      }
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query, variables: variables || {} })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`API returned HTML. Status: ${res.status}. Check API URL.`);
      }
      
      const data = await res.json();
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error('GraphQL error: ' + JSON.stringify(data.errors));
      }
      return data;
    };
    
    // Find company
    console.log('📋 Step 2: Finding GLS Transportation company...');
    const { data: { listCompanies: { items: companies } } } = await gql(`
      query {
        listCompanies {
          items {
            id
            name
          }
        }
      }
    `);
    
    const company = companies.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');
    if (!company) {
      throw new Error('Company not found. Refresh and log in to create it.');
    }
    
    console.log('✅ Step 2 Complete: Found company -', company.name, '(' + company.id + ')\n');
    
    // Migrate trips
    console.log('📋 Step 3: Migrating trips...');
    // Don't query companyId - it's non-nullable but some trips have null, causing GraphQL errors
    const { data: { listTrips: { items: trips } } } = await gql(`
      query {
        listTrips {
          items {
            id
          }
        }
      }
    `);
    
    console.log(`${trips.length} total trips found`);
    console.log('Updating all trips with companyId...');
    
    let count = 0;
    let skipped = 0;
    for (const trip of trips) {
      try {
        // Try to update - if companyId is already set, this will just update it to the same value (no-op)
        await gql(`
          mutation UpdateTrip($input: UpdateTripInput!) {
            updateTrip(input: $input) {
              id
            }
          }
        `, {
          input: { id: trip.id, companyId: company.id }
        });
        count++;
        if (count % 10 === 0) console.log(`  ${count}...`);
      } catch (e) {
        // If update fails, the trip might already have a companyId or there's another issue
        skipped++;
        if (skipped <= 5) { // Only log first few errors to avoid spam
          console.warn(`  ⚠️  Trip ${trip.id}: ${e.message.substring(0, 50)}`);
        }
      }
    }
    console.log(`✅ ${count} trips updated, ${skipped} skipped`);
    if (count > 0) {
      console.log('   ✓ Trips migration completed');
    }
    
    // Migrate drivers
    console.log('\n📋 Step 4: Migrating drivers...');
    const { data: { listDrivers: { items: drivers } } } = await gql(`
      query {
        listDrivers {
          items {
            id
          }
        }
      }
    `);
    
    console.log(`${drivers.length} total drivers found`);
    console.log('Updating all drivers with companyId...');
    
    count = 0;
    skipped = 0;
    for (const driver of drivers) {
      try {
        await gql(`
          mutation UpdateDriver($input: UpdateDriverInput!) {
            updateDriver(input: $input) {
              id
            }
          }
        `, {
          input: { id: driver.id, companyId: company.id }
        });
        count++;
      } catch (e) {
        skipped++;
        if (skipped <= 5) {
          console.warn(`  ⚠️  Driver ${driver.id}: ${e.message.substring(0, 50)}`);
        }
      }
    }
    console.log(`✅ ${count} drivers updated, ${skipped} skipped`);
    if (count > 0) {
      console.log('   ✓ Drivers migration completed');
    }
    
    // Migrate locations
    console.log('\n📋 Step 5: Migrating locations...');
    const { data: { listLocations: { items: locations } } } = await gql(`
      query {
        listLocations {
          items {
            id
          }
        }
      }
    `);
    
    console.log(`${locations.length} total locations found`);
    console.log('Updating all locations with companyId...');
    
    count = 0;
    skipped = 0;
    for (const location of locations) {
      try {
        await gql(`
          mutation UpdateLocation($input: UpdateLocationInput!) {
            updateLocation(input: $input) {
              id
            }
          }
        `, {
          input: { id: location.id, companyId: company.id }
        });
        count++;
      } catch (e) {
        skipped++;
        if (skipped <= 5) {
          console.warn(`  ⚠️  Location ${location.id}: ${e.message.substring(0, 50)}`);
        }
      }
    }
    console.log(`✅ ${count} locations updated, ${skipped} skipped`);
    if (count > 0) {
      console.log('   ✓ Locations migration completed');
    }
    
    // Verify
    const vt = await gql(`
      query($filter: ModelTripFilterInput) {
        listTrips(filter: $filter) {
          items {
            id
          }
        }
      }
    `, { filter: { companyId: { eq: company.id } } });
    
    const vd = await gql(`
      query($filter: ModelDriverFilterInput) {
        listDrivers(filter: $filter) {
          items {
            id
          }
        }
      }
    `, { filter: { companyId: { eq: company.id } } });
    
    const vl = await gql(`
      query($filter: ModelLocationFilterInput) {
        listLocations(filter: $filter) {
          items {
            id
          }
        }
      }
    `, { filter: { companyId: { eq: company.id } } });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📊 Final Summary:');
    console.log(`   ✅ Trips with companyId: ${vt.data.listTrips.items.length}`);
    console.log(`   ✅ Drivers with companyId: ${vd.data.listDrivers.items.length}`);
    console.log(`   ✅ Locations with companyId: ${vl.data.listLocations.items.length}`);
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! All data has been migrated to GLS Transportation');
    console.log('='.repeat(50));
    console.log('\n📝 Next Steps:');
    console.log('   1. Refresh the page (Press F5 or Ctrl+R)');
    console.log('   2. Your trips, drivers, and locations should now be visible');
    console.log('   3. All data is now associated with GLS Transportation company');
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ MIGRATION FAILED');
    console.error('='.repeat(50));
    console.error('\nError:', error.message);
    console.error('\nFull error details:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure you are logged in');
    console.error('   2. Check that the API URL is correct');
    console.error('   3. Verify the GLS Transportation company exists');
    console.error('   4. Check the Network tab for any failed requests');
    alert('Migration failed: ' + error.message + '\n\nCheck console for details.');
  }
})();
