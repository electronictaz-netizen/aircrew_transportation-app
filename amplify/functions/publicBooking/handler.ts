/**
 * Public Booking Portal Lambda Function
 * Provides public access to booking portal functionality without authentication.
 * Uses @aws-sdk/credential-providers (fromNodeProviderChain) for Lambda execution role
 * credentials and inline SigV4 (crypto + fetch) for AppSync.
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { createHmac, createHash } from 'crypto';

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

type Creds = { accessKeyId: string; secretAccessKey: string; sessionToken?: string };

/**
 * Get credentials from the default provider chain (Lambda execution role, env, etc.).
 * AWS_CONTAINER_CREDENTIALS_RELATIVE_URI is ECS-only; Lambda uses a different mechanism
 * that fromNodeProviderChain() resolves.
 */
async function getCreds(): Promise<Creds> {
  const c = await fromNodeProviderChain()();
  return { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, sessionToken: c.sessionToken };
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function sign(creds: Creds, method: string, url: URL, body: string, service: string, region: string): Record<string, string> {
  const amz = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amz.slice(0, 8);
  const payloadHash = sha256(body);
  const host = url.hostname;
  const path = url.pathname || '/';
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz,
  };
  if (creds.sessionToken) headers['x-amz-security-token'] = creds.sessionToken;
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canoH = Object.keys(headers).sort().map((k) => `${k}:${headers[k].trim()}`).join('\n') + '\n';
  const cano = `${method}\n${path}\n\n${canoH}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const strToSign = `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${sha256(cano)}`;
  const kSign = hmac(hmac(hmac(hmac('AWS4' + creds.secretAccessKey, dateStamp), region), service), 'aws4_request');
  const sig = hmac(kSign, strToSign).toString('hex');
  return {
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase() === 'host' ? 'Host' : k === 'content-type' ? 'Content-Type' : k === 'x-amz-content-sha256' ? 'X-Amz-Content-Sha256' : k === 'x-amz-date' ? 'X-Amz-Date' : k === 'x-amz-security-token' ? 'X-Amz-Security-Token' : k, v])),
    'Authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
}

// Normalize header names to HTTP style (e.g. Content-Type) for fetch
function toFetchHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    const n = k === 'host' ? 'Host' : k === 'content-type' ? 'Content-Type' : k === 'x-amz-content-sha256' ? 'X-Amz-Content-Sha256' : k === 'x-amz-date' ? 'X-Amz-Date' : k === 'x-amz-security-token' ? 'X-Amz-Security-Token' : k === 'authorization' ? 'Authorization' : k;
    out[n] = v;
  }
  return out;
}

/**
 * Execute a GraphQL request against AppSync with IAM (SigV4) signing.
 * Uses fromNodeProviderChain for credentials and node:crypto for signing.
 */
async function executeGraphQL(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  const bodyStr = JSON.stringify({ query, variables });
  const region = getRegion();
  const creds = await getCreds();
  const headers = toFetchHeaders(sign(creds, 'POST', url, bodyStr, 'appsync', region));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
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
export const handler = async (event: { body?: string | object; queryStringParameters?: Record<string, string>; requestContext?: { http?: { method?: string; path?: string } }; requestMethod?: string; path?: string }): Promise<LambdaResponse> => {
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
