/**
 * Public Booking Portal Lambda Function
 * Provides public access to booking portal functionality without authentication
 */

import type { Handler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import type { Schema } from '../../data/resource';

// Note: The Lambda function needs IAM permissions to access the Data API
// These permissions are automatically granted when the function is defined in backend.ts
// The GraphQL endpoint should be available via environment variables set by Amplify

interface GetCompanyRequest {
  action: 'getCompany';
  code: string;
}

interface CreateBookingRequest {
  action: 'createBooking';
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  tripType: 'Airport Trip' | 'Standard Trip';
  pickupDate: string;
  flightNumber?: string;
  jobNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  vehicleType?: string;
  isRoundTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  specialInstructions?: string;
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// Note: CORS headers are handled by Lambda Function URL configuration
// Do not set CORS headers here to avoid duplicate headers
const responseHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Initialize Amplify client
 * Configures Amplify with GraphQL endpoint and IAM authentication
 * In Lambda, AWS credentials are automatically available from the execution role
 */
async function getAmplifyClient() {
  try {
    // Get GraphQL endpoint from environment variable (set by backend.ts)
    const graphqlEndpoint = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;
    const region = process.env.AMPLIFY_DATA_REGION || process.env.AWS_REGION || 'us-east-1';
    
    console.log('Initializing Amplify client:', {
      hasEndpoint: !!graphqlEndpoint,
      region: region,
    });
    
    if (!graphqlEndpoint) {
      throw new Error('AMPLIFY_DATA_GRAPHQL_ENDPOINT environment variable not set. Check backend.ts configuration.');
    }
    
    // Configure Amplify with the GraphQL endpoint
    // In Lambda, the execution role's credentials are automatically available
    // via the default credential provider chain - Amplify will use them automatically
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: graphqlEndpoint,
          region: region,
          defaultAuthMode: 'iam',
        },
      },
    });
    
    console.log('Amplify configured successfully');
    
    // Use dynamic import for generateClient
    const { generateClient } = await import('aws-amplify/data');
    
    // The client will use IAM credentials from the Lambda execution role
    // The credentials are automatically available via AWS SDK's default provider chain
    const client = generateClient({
      authMode: 'iam',
    });
    
    console.log('Amplify client initialized successfully');
    
    return client;
  } catch (error) {
    console.error('Error initializing Amplify client:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
}

/**
 * Get company by booking code
 * Uses GraphQL queries directly since models API requires schema introspection
 */
async function getCompanyByCode(code: string): Promise<Schema['Company']['type'] | null> {
  const client = await getAmplifyClient();
  
  try {
    console.log('Fetching company with booking code:', code);
    
    // Use GraphQL query directly instead of models API
    const query = `
      query ListCompanies($filter: ModelCompanyFilterInput) {
        listCompanies(filter: $filter) {
          items {
            id
            name
            displayName
            logoUrl
            bookingCode
            bookingEnabled
            isActive
            subscriptionTier
            subscriptionStatus
          }
        }
      }
    `;
    
    const variables = {
      filter: {
        bookingCode: { eq: code },
        isActive: { eq: true },
        bookingEnabled: { eq: true },
      },
    };
    
    // Use IAM auth mode - credentials should be available from Lambda execution role
    // Note: Remove 'as any' to ensure proper type checking
    const response = await client.graphql({
      query,
      variables,
      authMode: 'iam',
    });
    
    const companies = response.data?.listCompanies?.items;
    
    if (!companies || companies.length === 0) {
      return null;
    }

    return companies[0] as Schema['Company']['type'];
  } catch (error) {
    console.error('Error fetching company:', error);
    console.error('GraphQL response:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Create booking (trip and customer)
 * Uses GraphQL mutations directly since models API requires schema introspection
 */
async function createBooking(request: CreateBookingRequest): Promise<{ tripId: string; customerId?: string }> {
  const client = await getAmplifyClient();
  
  try {
    // Create or find customer
    let customerId: string | undefined;
    
    if (request.customerEmail) {
      // Check if customer exists
      const listCustomersQuery = `
        query ListCustomers($filter: ModelCustomerFilterInput) {
          listCustomers(filter: $filter) {
            items {
              id
              name
              phone
              companyName
            }
          }
        }
      `;
      
      const listResponse = await client.graphql({
        query: listCustomersQuery,
        variables: {
          filter: {
            companyId: { eq: request.companyId },
            email: { eq: request.customerEmail.toLowerCase().trim() },
          },
        },
        authMode: 'iam',
      });
      
      const existingCustomers = listResponse.data?.listCustomers?.items;
      
      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        // Update customer info if provided
        if (request.customerName || request.customerPhone) {
          const updateCustomerMutation = `
            mutation UpdateCustomer($input: UpdateCustomerInput!) {
              updateCustomer(input: $input) {
                id
              }
            }
          `;
          
          await client.graphql({
            query: updateCustomerMutation,
            variables: {
              input: {
                id: customerId,
                name: request.customerName || existingCustomers[0].name,
                phone: request.customerPhone || existingCustomers[0].phone,
                companyName: request.customerCompany || existingCustomers[0].companyName,
              },
            },
            authMode: 'iam',
          });
        }
      } else {
        // Create new customer
        const createCustomerMutation = `
          mutation CreateCustomer($input: CreateCustomerInput!) {
            createCustomer(input: $input) {
              id
            }
          }
        `;
        
        const createResponse = await client.graphql({
          query: createCustomerMutation,
          variables: {
            input: {
              companyId: request.companyId,
              name: request.customerName,
              email: request.customerEmail.toLowerCase().trim(),
              phone: request.customerPhone,
              companyName: request.customerCompany,
              isActive: true,
            },
          },
          authMode: 'iam',
        });
        
        customerId = createResponse.data?.createCustomer?.id;
      }
    }

    // Create trip
    const flightNumberOrJob = request.tripType === 'Airport Trip' 
      ? request.flightNumber || ''
      : request.jobNumber || '';

    const createTripMutation = `
      mutation CreateTrip($input: CreateTripInput!) {
        createTrip(input: $input) {
          id
        }
      }
    `;
    
    const tripResponse = await client.graphql({
      query: createTripMutation,
      variables: {
        input: {
          companyId: request.companyId,
          pickupDate: request.pickupDate,
          flightNumber: flightNumberOrJob,
          pickupLocation: request.pickupLocation,
          dropoffLocation: request.dropoffLocation,
          numberOfPassengers: request.numberOfPassengers,
          status: 'Unassigned',
          customerId: customerId,
          notes: request.specialInstructions || undefined,
        },
      },
      authMode: 'iam',
    });

    const trip = tripResponse.data?.createTrip;
    
    if (!trip || !trip.id) {
      throw new Error('Failed to create trip');
    }

    return {
      tripId: trip.id,
      customerId: customerId,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('GraphQL error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Lambda handler
 */
export const handler: Handler = async (event): Promise<LambdaResponse> => {
  // Note: CORS preflight (OPTIONS) is handled automatically by Lambda Function URL
  // No need to handle it in the handler

  console.log('Handler invoked:', {
    method: event.requestContext?.http?.method || event.requestMethod,
    path: event.requestContext?.http?.path || event.path,
    hasBody: !!event.body,
  });

  try {
    // Parse request body
    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (e) {
        // If body is not JSON, try query string parameters
        body = event.queryStringParameters || {};
      }
    } else if (event.queryStringParameters) {
      body = event.queryStringParameters;
    }

    const { action } = body;

    // Handle getCompany action
    if (action === 'getCompany') {
      const { code } = body;
      
      if (!code) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Booking code is required' }),
        };
      }

      console.log('Fetching company for booking code:', code);
      const company = await getCompanyByCode(code);
      console.log('Company lookup result:', company ? 'Found' : 'Not found');
      
      if (!company) {
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Company not found or booking portal not enabled' }),
        };
      }

      // Return only necessary company data (exclude sensitive info)
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          success: true,
          company: {
            id: company.id,
            name: company.name,
            displayName: company.displayName,
            logoUrl: company.logoUrl,
            bookingCode: company.bookingCode,
            bookingEnabled: company.bookingEnabled,
          },
        }),
      };
    }

    // Handle createBooking action
    if (action === 'createBooking') {
      const bookingRequest = body as CreateBookingRequest;
      
      // Validate required fields
      // Note: companyId in the request is actually the booking code
      const bookingCode = bookingRequest.companyId;
      
      if (!bookingCode || !bookingRequest.customerName || 
          !bookingRequest.customerEmail || !bookingRequest.customerPhone ||
          !bookingRequest.pickupDate || !bookingRequest.pickupLocation || 
          !bookingRequest.dropoffLocation) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Verify company exists and booking is enabled by booking code
      const company = await getCompanyByCode(bookingCode);
      if (!company) {
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Company not found or booking not enabled' }),
        };
      }
      
      // Use the actual company ID from the fetched company
      bookingRequest.companyId = company.id;

      const result = await createBooking(bookingRequest);
      
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          success: true,
          bookingId: result.tripId,
          customerId: result.customerId,
          message: 'Booking created successfully',
        }),
      };
    }

    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Invalid action. Supported actions: getCompany, createBooking' }),
    };
  } catch (error: any) {
    console.error('Error in publicBooking handler:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        // Include error type for debugging (remove in production if needed)
        type: error.name || 'UnknownError',
      }),
    };
  }
};
