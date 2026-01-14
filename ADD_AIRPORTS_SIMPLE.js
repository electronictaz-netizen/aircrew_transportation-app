/**
 * SIMPLE Browser Console Script: Add Airport Locations
 * 
 * Instructions:
 * 1. Open your app in the browser (logged in)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Refresh the page or reopen "Manage Locations"
 */

(async function() {
  console.log('🚀 Adding airport locations...\n');

  try {
    // Import Amplify (if available in window)
    const { generateClient } = await import('https://esm.sh/aws-amplify/data@1.0.0');
    
    // Or use the app's existing client if available
    let client;
    if (window.__AMPLIFY_CLIENT__) {
      client = window.__AMPLIFY_CLIENT__;
    } else {
      // Try to get from the app's context
      console.log('⚠️  Using alternative method...');
      
      // Get the API URL from network requests
      const apiUrl = localStorage.getItem('amplify_api_url') || 
                     window.location.origin.replace('amplifyapp.com', 'api.amplifyapp.com');
      
      // Get auth token
      const cognitoKeys = Object.keys(localStorage).filter(k => k.includes('Cognito'));
      let authToken = null;
      for (const key of cognitoKeys) {
        try {
          const value = JSON.parse(localStorage.getItem(key) || '{}');
          authToken = value.accessToken || value.idToken || value.token;
          if (authToken) break;
        } catch (e) {}
      }

      if (!authToken) {
        throw new Error('Could not find auth token. Please ensure you are logged in.');
      }

      // Use direct GraphQL calls
      const airports = [
        { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)', address: 'Buffalo, NY' },
        { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)', address: 'Rochester, NY' },
        { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)', address: 'Syracuse, NY' },
        { code: 'ALB', name: 'Albany International Airport (ALB)', address: 'Albany, NY' },
      ];

      // Get company ID from current context (you may need to check the app's state)
      // For now, we'll find GLS company
      const findCompanyQuery = {
        query: `query ListCompanies {
          listCompanies {
            items {
              id
              name
            }
          }
        }`
      };

      // Get GraphQL endpoint - try to find it from the app
      const graphqlEndpoint = window.__AMPLIFY_CONFIG__?.aws_appsync_graphqlEndpoint ||
                              localStorage.getItem('amplify_graphql_endpoint') ||
                              'https://api.amplifyapp.com/graphql'; // Fallback

      console.log('Finding GLS company...');
      const companyRes = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(findCompanyQuery)
      });

      const companyData = await companyRes.json();
      const companies = companyData.data?.listCompanies?.items || [];
      const glsCompany = companies.find(c => c.name === 'GLS Transportation' || c.name === 'GLS');

      if (!glsCompany) {
        console.error('❌ GLS company not found. Available:', companies.map(c => c.name));
        return;
      }

      console.log(`✅ Found: ${glsCompany.name}\n`);

      // Check existing locations
      const listQuery = {
        query: `query ListLocations($filter: ModelLocationFilterInput) {
          listLocations(filter: $filter) {
            items {
              id
              name
            }
          }
        }`,
        variables: {
          filter: { companyId: { eq: glsCompany.id } }
        }
      };

      const locRes = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(listQuery)
      });

      const locData = await locRes.json();
      const existing = (locData.data?.listLocations?.items || []).map(l => l.name);
      console.log(`Found ${existing.length} existing locations\n`);

      // Create airports
      let created = 0;
      for (const airport of airports) {
        if (existing.includes(airport.name)) {
          console.log(`⏭️  ${airport.code}: Already exists`);
          continue;
        }

        const createMutation = {
          query: `mutation CreateLocation($input: CreateLocationInput!) {
            createLocation(input: $input) {
              id
              name
            }
          }`,
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
        };

        const createRes = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(createMutation)
        });

        const createData = await createRes.json();
        if (createData.errors) {
          console.error(`❌ ${airport.code}:`, createData.errors);
        } else {
          console.log(`✅ Created: ${airport.name}`);
          created++;
        }
      }

      console.log(`\n✅ Done! Created ${created} location(s)`);
      console.log('📝 Refresh the page or reopen "Manage Locations" to see them');

    } else {
      // Use existing client
      console.log('Using existing Amplify client...');
      // This path would use the app's client if available
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Alternative: Use the Node.js script:');
    console.log('   npx ts-node scripts/addAirportLocations.ts');
  }
})();
