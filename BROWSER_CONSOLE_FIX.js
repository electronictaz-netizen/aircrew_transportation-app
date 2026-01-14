/**
 * Browser Console Fix for Company Creation
 * 
 * Copy and paste this ENTIRE code block into your browser console (F12)
 * 
 * This will manually create the company and link your user to it.
 */

(async function createCompanyManually() {
  console.log('🚀 Starting manual company creation...');
  
  try {
    // Step 1: Get the Amplify configuration from the page
    // The app already has Amplify configured, so we'll use fetch to call AppSync directly
    
    // First, we need to get the API endpoint and API key from amplify_outputs.json
    // Since we can't import it directly, we'll fetch it
    const outputsResponse = await fetch('/amplify_outputs.json');
    const outputs = await outputsResponse.json();
    
    console.log('Amplify outputs:', outputs);
    
    if (!outputs.data || !outputs.data.url) {
      throw new Error('Cannot find AppSync API endpoint. Check amplify_outputs.json');
    }
    
    const apiUrl = outputs.data.url;
    const apiKey = outputs.data.api_key;
    
    // Step 2: Get current user's auth token
    // We need to get the JWT token from Amplify
    const { fetchAuthSession } = await import('https://esm.sh/aws-amplify@5/auth');
    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      throw new Error('Not authenticated. Please log in first.');
    }
    
    const authToken = session.tokens.idToken?.toString();
    console.log('Auth token obtained');
    
    // Step 3: Check if company exists
    const listCompaniesQuery = `
      query ListCompanies {
        listCompanies {
          items {
            id
            name
            subdomain
            isActive
          }
        }
      }
    `;
    
    const listResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'x-api-key': apiKey
      },
      body: JSON.stringify({ query: listCompaniesQuery })
    });
    
    const listData = await listResponse.json();
    console.log('Companies list response:', listData);
    
    let companyId = null;
    
    // Check if GLS Transportation exists
    if (listData.data?.listCompanies?.items) {
      const glsCompany = listData.data.listCompanies.items.find(
        c => c.name === 'GLS Transportation' || c.name === 'GLS'
      );
      if (glsCompany) {
        companyId = glsCompany.id;
        console.log('✅ Found existing company:', glsCompany.name, companyId);
      }
    }
    
    // Step 4: Create company if it doesn't exist
    if (!companyId) {
      console.log('📝 Creating GLS Transportation company...');
      
      const createCompanyMutation = `
        mutation CreateCompany($input: CreateCompanyInput!) {
          createCompany(input: $input) {
            id
            name
            subdomain
          }
        }
      `;
      
      const createResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query: createCompanyMutation,
          variables: {
            input: {
              name: 'GLS Transportation',
              subdomain: 'gls',
              isActive: true,
              subscriptionTier: 'premium',
              subscriptionStatus: 'active'
            }
          }
        })
      });
      
      const createData = await createResponse.json();
      console.log('Create company response:', createData);
      
      if (createData.errors) {
        throw new Error('Failed to create company: ' + JSON.stringify(createData.errors));
      }
      
      companyId = createData.data?.createCompany?.id;
      if (!companyId) {
        throw new Error('Company creation returned no ID');
      }
      
      console.log('✅ Company created:', companyId);
    }
    
    // Step 5: Get current user ID
    const { getCurrentUser } = await import('https://esm.sh/aws-amplify@5/auth');
    const user = await getCurrentUser();
    const userId = user.userId;
    const userEmail = user.signInDetails?.loginId || '';
    
    console.log('Current user:', userId, userEmail);
    
    // Step 6: Check if CompanyUser exists
    const listCompanyUsersQuery = `
      query ListCompanyUsers($filter: ModelCompanyUserFilterInput) {
        listCompanyUsers(filter: $filter) {
          items {
            id
            userId
            companyId
            email
            role
          }
        }
      }
    `;
    
    const checkUserResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        query: listCompanyUsersQuery,
        variables: {
          filter: {
            userId: { eq: userId }
          }
        }
      })
    });
    
    const checkUserData = await checkUserResponse.json();
    console.log('CompanyUser check response:', checkUserData);
    
    // Step 7: Create CompanyUser if it doesn't exist
    if (!checkUserData.data?.listCompanyUsers?.items || checkUserData.data.listCompanyUsers.items.length === 0) {
      console.log('📝 Creating CompanyUser record...');
      
      const createCompanyUserMutation = `
        mutation CreateCompanyUser($input: CreateCompanyUserInput!) {
          createCompanyUser(input: $input) {
            id
            userId
            companyId
            email
            role
          }
        }
      `;
      
      const createUserResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query: createCompanyUserMutation,
          variables: {
            input: {
              companyId: companyId,
              userId: userId,
              email: userEmail,
              role: 'admin',
              isActive: true
            }
          }
        })
      });
      
      const createUserData = await createUserResponse.json();
      console.log('Create CompanyUser response:', createUserData);
      
      if (createUserData.errors) {
        throw new Error('Failed to create CompanyUser: ' + JSON.stringify(createUserData.errors));
      }
      
      console.log('✅ CompanyUser created:', createUserData.data?.createCompanyUser);
    } else {
      console.log('✅ CompanyUser already exists');
    }
    
    console.log('🎉 Done! Please refresh the page (F5) to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message, error.stack);
    alert('Error creating company. Check console for details: ' + error.message);
  }
})();
