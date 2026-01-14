/**
 * Browser Console Script: Add Airport Locations for GLS Company
 * 
 * Instructions:
 * 1. Open your app in the browser
 * 2. Log in as a user associated with GLS Transportation
 * 3. Open the browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 
 * This will create the 4 airports as saved locations with "Airport" category
 */

(async function addAirportLocations() {
  console.log('🚀 Starting airport locations creation...\n');

  try {
    // Get API URL and auth token from the app
    const apiUrl = window.location.origin.includes('amplifyapp.com') 
      ? 'https://api.amplifyapp.com' // Update with your actual API URL
      : 'http://localhost:20002'; // Local development
    
    // Get auth token from localStorage
    let authToken = null;
    const cognitoKeys = Object.keys(localStorage).filter(k => k.includes('Cognito'));
    for (const key of cognitoKeys) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || '{}');
        if (value.accessToken || value.idToken) {
          authToken = value.accessToken || value.idToken;
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    if (!authToken) {
      console.error('❌ Could not find auth token. Please ensure you are logged in.');
      return;
    }

    // Airport definitions
    const airports = [
      { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)', address: 'Buffalo, NY' },
      { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)', address: 'Rochester, NY' },
      { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)', address: 'Syracuse, NY' },
      { code: 'ALB', name: 'Albany International Airport (ALB)', address: 'Albany, NY' },
    ];

    // Get GraphQL endpoint from Amplify
    const amplifyConfig = window.aws_amplify_config || {};
    const graphqlEndpoint = amplifyConfig.aws_appsync_graphqlEndpoint;
    
    if (!graphqlEndpoint) {
      console.error('❌ Could not find GraphQL endpoint. Please check your Amplify configuration.');
      return;
    }

    console.log('📋 Step 1: Finding GLS company...');
    
    // GraphQL query to find GLS company
    const findCompanyQuery = `
      query ListCompanies {
        listCompanies {
          items {
            id
            name
          }
        }
      }
    `;

    const companyResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ query: findCompanyQuery })
    });

    const companyData = await companyResponse.json();
    
    if (companyData.errors) {
      console.error('❌ Error finding company:', companyData.errors);
      return;
    }

    const companies = companyData.data?.listCompanies?.items || [];
    const glsCompany = companies.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');

    if (!glsCompany) {
      console.error('❌ GLS Transportation company not found.');
      console.log('Available companies:', companies.map(c => c.name));
      return;
    }

    console.log(`   ✅ Found company: ${glsCompany.name} (${glsCompany.id})\n`);

    // Check existing locations
    console.log('📋 Step 2: Checking existing locations...');
    
    const listLocationsQuery = `
      query ListLocations($filter: ModelLocationFilterInput) {
        listLocations(filter: $filter) {
          items {
            id
            name
          }
        }
      }
    `;

    const locationsResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: listLocationsQuery,
        variables: {
          filter: {
            companyId: { eq: glsCompany.id }
          }
        }
      })
    });

    const locationsData = await locationsResponse.json();
    const existingLocations = locationsData.data?.listLocations?.items || [];
    const existingLocationNames = new Set(existingLocations.map(l => l.name));

    console.log(`   Found ${existingLocations.length} existing location(s)\n`);

    // Add airports as locations
    console.log('📋 Step 3: Adding airport locations...');
    let createdCount = 0;
    let skippedCount = 0;

    const createLocationMutation = `
      mutation CreateLocation($input: CreateLocationInput!) {
        createLocation(input: $input) {
          id
          name
          category
        }
      }
    `;

    for (const airport of airports) {
      if (existingLocationNames.has(airport.name)) {
        console.log(`   ⏭️  Skipping ${airport.code}: Already exists`);
        skippedCount++;
        continue;
      }

      try {
        const createResponse = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            query: createLocationMutation,
            variables: {
              input: {
                name: airport.name,
                address: airport.address,
                category: 'Airport',
                description: `Airport code: ${airport.code}`,
                isActive: true,
                locationCompanyId: glsCompany.id
              }
            }
          })
        });

        const createData = await createResponse.json();
        
        if (createData.errors) {
          console.error(`   ❌ Error creating ${airport.code}:`, createData.errors);
        } else {
          console.log(`   ✅ Created: ${airport.name} (${airport.code})`);
          createdCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating ${airport.code}:`, error);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Created: ${createdCount} location(s)`);
    console.log(`   Skipped: ${skippedCount} location(s) (already exist)`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Refresh the page or click "Manage Locations" again`);
    console.log(`   2. You should now see the airports in the location list`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
})();
