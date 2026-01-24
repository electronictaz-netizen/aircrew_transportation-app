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
 * Configures Amplify with GraphQL endpoint and uses IAM authentication
 */
async function getAmplifyClient() {
  try {
    // Get GraphQL endpoint from environment variables or construct from API ID
    // In Amplify Gen 2, the endpoint should be available via environment variables
    const graphqlEndpoint = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || 
                           process.env.AMPLIFY_DATA_GRAPHQL_URL ||
                           process.env.GRAPHQL_ENDPOINT;
    const region = process.env.AWS_REGION || process.env.AMPLIFY_DATA_REGION || 'us-east-1';
    
    // If endpoint is not in env vars, try to construct it from API ID
    let endpoint = graphqlEndpoint;
    if (!endpoint) {
      const apiId = process.env.AMPLIFY_DATA_GRAPHQL_API_ID;
      if (apiId) {
        // Construct GraphQL endpoint from API ID
        endpoint = `https://${apiId}.appsync-api.${region}.amazonaws.com/graphql`;
      }
    }
    
    console.log('Initializing Amplify client:', {
      hasEndpoint: !!endpoint,
      region: region,
      endpointPreview: endpoint ? endpoint.substring(0, 50) + '...' : 'missing',
    });
    
    if (!endpoint) {
      throw new Error('GraphQL endpoint not found. Check environment variables: AMPLIFY_DATA_GRAPHQL_ENDPOINT, AMPLIFY_DATA_GRAPHQL_URL, or AMPLIFY_DATA_GRAPHQL_API_ID');
    }
    
    // Configure Amplify with the GraphQL endpoint
    // This MUST be called before generateClient()
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: endpoint,
          region: region,
          defaultAuthMode: 'iam',
        },
      },
    });
    
    console.log('Amplify configured successfully');
    
    // Use dynamic import for generateClient
    const { generateClient } = await import('aws-amplify/data');
    
    // The client will use IAM credentials from the Lambda execution role
    const client = generateClient<Schema>({
      authMode: 'iam', // Use IAM authentication for Lambda
    });
    
    console.log('Amplify client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing Amplify client:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Environment variables:', {
      hasGraphqlEndpoint: !!process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
      hasGraphqlUrl: !!process.env.AMPLIFY_DATA_GRAPHQL_URL,
      hasApiId: !!process.env.AMPLIFY_DATA_GRAPHQL_API_ID,
      region: process.env.AWS_REGION || process.env.AMPLIFY_DATA_REGION,
      allEnvVars: Object.keys(process.env).filter(k => k.includes('AMPLIFY') || k.includes('GRAPHQL') || k.includes('DATA') || k.includes('API')),
    });
    throw error;
  }
}

/**
 * Get company by booking code
 */
async function getCompanyByCode(code: string): Promise<Schema['Company']['type'] | null> {
  const client = await getAmplifyClient();
  
  try {
    const { data: companies } = await client.models.Company.list({
      filter: {
        bookingCode: { eq: code },
        isActive: { eq: true },
        bookingEnabled: { eq: true },
      },
    });

    if (!companies || companies.length === 0) {
      return null;
    }

    return companies[0] as Schema['Company']['type'];
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

/**
 * Create booking (trip and customer)
 */
async function createBooking(request: CreateBookingRequest): Promise<{ tripId: string; customerId?: string }> {
  const client = await getAmplifyClient();
  
  try {
    // Create or find customer
    let customerId: string | undefined;
    
    if (request.customerEmail) {
      const { data: existingCustomers } = await client.models.Customer.list({
        filter: {
          companyId: { eq: request.companyId },
          email: { eq: request.customerEmail.toLowerCase().trim() },
        },
      });

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        // Update customer info if provided
        if (request.customerName || request.customerPhone) {
          await client.models.Customer.update({
            id: customerId,
            name: request.customerName || existingCustomers[0].name,
            phone: request.customerPhone || existingCustomers[0].phone,
            companyName: request.customerCompany || existingCustomers[0].companyName,
          });
        }
      } else {
        // Create new customer
        const { data: newCustomer } = await client.models.Customer.create({
          companyId: request.companyId,
          name: request.customerName,
          email: request.customerEmail.toLowerCase().trim(),
          phone: request.customerPhone,
          companyName: request.customerCompany,
          isActive: true,
        });
        customerId = newCustomer?.id;
      }
    }

    // Create trip
    const flightNumberOrJob = request.tripType === 'Airport Trip' 
      ? request.flightNumber || ''
      : request.jobNumber || '';

    const { data: trip } = await client.models.Trip.create({
      companyId: request.companyId,
      pickupDate: request.pickupDate,
      flightNumber: flightNumberOrJob,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      numberOfPassengers: request.numberOfPassengers,
      status: 'Unassigned',
      customerId: customerId,
      notes: request.specialInstructions || undefined,
    });

    if (!trip || !trip.id) {
      throw new Error('Failed to create trip');
    }

    return {
      tripId: trip.id,
      customerId: customerId,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
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
