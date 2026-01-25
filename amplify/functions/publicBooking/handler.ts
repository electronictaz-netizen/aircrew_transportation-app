/**
 * Public Booking Portal Lambda Function
 * Provides public access to booking portal functionality without authentication
 */

import type { Handler } from 'aws-lambda';
import aws4 from 'aws4';

// Note: The Lambda function needs IAM permissions to access the Data API
// These permissions are automatically granted when the function is defined in backend.ts
// The GraphQL endpoint and region are set by backend.ts (AMPLIFY_DATA_GRAPHQL_ENDPOINT, AMPLIFY_DATA_REGION)

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

const getEndpoint = (): string => {
  const e = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;
  if (!e) throw new Error('AMPLIFY_DATA_GRAPHQL_ENDPOINT is not set');
  return e;
};

const getRegion = (): string => process.env.AMPLIFY_DATA_REGION || 'us-east-1';

/**
 * Execute a GraphQL request against AppSync with IAM signing
 */
async function executeGraphQL(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  const bodyStr = JSON.stringify({ query, variables });

  const opts: { host: string; path: string; method: string; body: string; headers: Record<string, string>; service: string; region: string } = {
    host: url.hostname,
    path: url.pathname || '/graphql',
    method: 'POST',
    body: bodyStr,
    headers: { 'Content-Type': 'application/json' },
    service: 'appsync',
    region: getRegion(),
  };
  aws4.sign(opts);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: opts.headers as Record<string, string>,
    body: bodyStr,
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/**
 * Get company by booking code (bookingEnabled must be true)
 */
async function getCompanyByCode(code: string): Promise<{ id: string; name: string; displayName?: string | null; logoUrl?: string | null; bookingCode?: string | null; bookingEnabled?: boolean | null } | null> {
  const query = `
    query ListCompanies($filter: ModelCompanyFilterInput) {
      listCompanies(filter: $filter) {
        items { id name displayName logoUrl bookingCode bookingEnabled }
        nextToken
      }
    }
  `;
  const data = await executeGraphQL(query, {
    filter: {
      bookingCode: { eq: code },
      bookingEnabled: { eq: true },
    },
  });
  const items = data?.listCompanies?.items;
  return items?.length ? items[0] : null;
}

/**
 * Create booking (trip and customer)
 * Uses AWS Signature V4 for GraphQL mutations
 */
async function createBooking(request: CreateBookingRequest): Promise<{ tripId: string; customerId?: string }> {
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
      
      const listData = await executeGraphQL(listCustomersQuery, {
        filter: {
          companyId: { eq: request.companyId },
          email: { eq: request.customerEmail.toLowerCase().trim() },
        },
      });
      
      const existingCustomers = listData?.listCustomers?.items;
      
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
          
          await executeGraphQL(updateCustomerMutation, {
            input: {
              id: customerId,
              name: request.customerName || existingCustomers[0].name,
              phone: request.customerPhone || existingCustomers[0].phone,
              companyName: request.customerCompany || existingCustomers[0].companyName,
            },
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
        
        const createData = await executeGraphQL(createCustomerMutation, {
          input: {
            companyId: request.companyId,
            name: request.customerName,
            email: request.customerEmail.toLowerCase().trim(),
            phone: request.customerPhone,
            companyName: request.customerCompany,
            isActive: true,
          },
        });
        
        customerId = createData?.createCustomer?.id;
      }
    }

    // Create trip (Trip.flightNumber is required; we use jobNumber for Standard Trip)
    const flightNumberOrJob = (request.tripType === 'Airport Trip'
      ? request.flightNumber
      : request.jobNumber) || 'N/A';

    const createTripMutation = `
      mutation CreateTrip($input: CreateTripInput!) {
        createTrip(input: $input) {
          id
        }
      }
    `;
    
    const tripData = await executeGraphQL(createTripMutation, {
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
    });

    const trip = tripData?.createTrip;
    
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
