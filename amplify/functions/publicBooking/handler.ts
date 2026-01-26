/**
 * Public Booking Portal Lambda Function
 * Provides public access to booking portal functionality without authentication.
 * Uses @aws-sdk/credential-providers (fromNodeProviderChain) for Lambda execution role
 * credentials and inline SigV4 (crypto + fetch) for AppSync.
 * DynamoDB Scan fallback when listCompanies (IAM) does not return a company.
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
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
 * Get company by booking code. Requires bookingEnabled=true. Treats isActive
 * as active when true or when missing (for companies created before isActive existed).
 * Matching is case-insensitive: "TEST", "test", and "Test" all match the same stored value.
 * Paginates through listCompanies so we don't miss companies on later pages.
 */
async function getCompanyByCode(code: string): Promise<{ id: string; name: string; displayName?: string | null; logoUrl?: string | null; bookingCode?: string | null; bookingEnabled?: boolean | null } | null> {
  const normalized = (code || '').toUpperCase().trim();
  if (!normalized) return null;
  const query = `
    query ListCompanies($filter: ModelCompanyFilterInput, $limit: Int, $nextToken: String) {
      listCompanies(filter: $filter, limit: $limit, nextToken: $nextToken) {
        items { id name displayName logoUrl bookingCode bookingEnabled isActive }
        nextToken
      }
    }
  `;
  const allItems: Array<{ id?: string; bookingCode?: string | null; isActive?: boolean | null }> = [];
  let nextToken: string | null | undefined = undefined;
  do {
    const variables: Record<string, unknown> = { filter: { bookingEnabled: { eq: true } }, limit: 100 };
    if (nextToken != null) variables.nextToken = nextToken;
    const data = await executeGraphQL(query, variables);
    const page = data?.listCompanies?.items || [];
    nextToken = data?.listCompanies?.nextToken;
    allItems.push(...page);
  } while (nextToken);

  // Exclude only when isActive is explicitly false; treat null/undefined as active
  const active = allItems.filter((c: { isActive?: boolean | null }) => c.isActive !== false);
  const match = active.find((c: { bookingCode?: string | null }) => (c.bookingCode || '').toUpperCase().trim() === normalized);
  console.log('getCompanyByCode:', {
    normalized,
    totalBookingEnabled: allItems.length,
    afterIsActiveFilter: active.length,
    matched: !!match,
    codes: active.map((c: { id?: string; bookingCode?: string | null; isActive?: boolean | null }) => ({ id: c.id, bookingCode: c.bookingCode, isActive: c.isActive })),
  });

  // When the requested code is not found and we only see 1 booking-enabled company,
  // run an unfiltered list to verify what is in the DB (helps if a second company
  // was never saved with bookingEnabled/bookingCode).
  if (!match && allItems.length <= 1) {
    const diagQuery = `
      query ListCompaniesDiag($limit: Int, $nextToken: String) {
        listCompanies(limit: $limit, nextToken: $nextToken) {
          items { id name bookingEnabled bookingCode }
          nextToken
        }
      }
    `;
    const diag: Array<{ id: string; name?: string | null; bookingEnabled?: boolean | null; bookingCode?: string | null }> = [];
    let dt: string | null | undefined;
    do {
      const v: Record<string, unknown> = { limit: 50 };
      if (dt != null) v.nextToken = dt;
      const d = await executeGraphQL(diagQuery, v);
      const items = d?.listCompanies?.items || [];
      dt = d?.listCompanies?.nextToken;
      diag.push(...items);
    } while (dt);
    console.log('getCompanyByCode diagnostic (all companies, paginated):', {
      total: diag.length,
      byBooking: diag.map((c) => ({ name: c.name, bookingEnabled: c.bookingEnabled, bookingCode: c.bookingCode })),
    });
  }

  // DynamoDB fallback: listCompanies (IAM) may not return all companies (e.g. Cognito sees
  // "Company" but IAM does not). Scan the Company table for bookingEnabled=true and
  // match bookingCode case-insensitively in JS (DynamoDB has no case-insensitive filter).
  if (!match && process.env.COMPANY_TABLE_NAME) {
    try {
      const ddb = new DynamoDBClient({ region: getRegion() });
      const collected: Record<string, unknown>[] = [];
      let lastKey: Record<string, unknown> | undefined;
      do {
        const res = await ddb.send(new ScanCommand({
          TableName: process.env.COMPANY_TABLE_NAME,
          FilterExpression: 'bookingEnabled = :enb',
          ExpressionAttributeValues: { ':enb': { BOOL: true } },
          ExclusiveStartKey: lastKey,
        }));
        const items = (res.Items || []).map((it) => unmarshall(it) as Record<string, unknown>);
        collected.push(...items);
        lastKey = res.LastEvaluatedKey;
      } while (lastKey);
      const activeList = collected.filter((c) => (c.isActive as boolean) !== false);
      const ddbMatch = activeList.find((c) => ((c.bookingCode as string) || '').toUpperCase().trim() === normalized);
      if (ddbMatch && typeof ddbMatch.id === 'string' && typeof ddbMatch.name === 'string') {
        console.log('getCompanyByCode: found via DynamoDB fallback', { id: ddbMatch.id, bookingCode: ddbMatch.bookingCode });
        return {
          id: ddbMatch.id,
          name: String(ddbMatch.name),
          displayName: (ddbMatch.displayName as string | null) ?? null,
          logoUrl: (ddbMatch.logoUrl as string | null) ?? null,
          bookingCode: (ddbMatch.bookingCode as string | null) ?? null,
          bookingEnabled: (ddbMatch.bookingEnabled as boolean | null) ?? null,
        };
      }
    } catch (e) {
      console.warn('getCompanyByCode: DynamoDB fallback error', e);
    }
  }

  return match || null;
}

/**
 * Create a BookingRequest (Pending). A manager accepts it in the Management
 * "Booking Requests" view to create the Trip and Customer.
 */
async function createBookingRequest(request: CreateBookingRequest): Promise<{ requestId: string }> {
  try {
    const mutation = `
      mutation CreateBookingRequest($input: CreateBookingRequestInput!) {
        createBookingRequest(input: $input) {
          id
        }
      }
    `;
    const input: Record<string, unknown> = {
      companyId: request.companyId,
      status: 'Pending',
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      customerCompany: request.customerCompany || undefined,
      tripType: request.tripType || undefined,
      pickupDate: request.pickupDate,
      flightNumber: request.flightNumber || undefined,
      jobNumber: request.jobNumber || undefined,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      numberOfPassengers: request.numberOfPassengers ?? 1,
      vehicleType: request.vehicleType || undefined,
      isRoundTrip: request.isRoundTrip ?? false,
      returnDate: request.returnDate || undefined,
      returnTime: request.returnTime || undefined,
      specialInstructions: request.specialInstructions || undefined,
    };
    const data = await executeGraphQL(mutation, { input });
    const rec = data?.createBookingRequest;
    if (!rec?.id) throw new Error('Failed to create booking request');
    return { requestId: rec.id };
  } catch (error) {
    console.error('Error creating booking request:', error);
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
    console.log('Action:', action ?? '(missing)');

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
          body: JSON.stringify({
            success: false,
            error: 'Company not found or booking portal not enabled',
            hint: 'Ensure the company has this Booking Code and "Enable Public Booking Portal" turned on in Configuration → Company Settings.',
          }),
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
      const bookingCode = bookingRequest.companyId;

      if (!bookingCode || !bookingRequest.customerName ||
          !bookingRequest.customerEmail || !bookingRequest.customerPhone ||
          !bookingRequest.pickupDate || !bookingRequest.pickupLocation ||
          !bookingRequest.dropoffLocation) {
        console.log('createBooking: validation failed, missing required fields');
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      console.log('createBooking: start', { bookingCode });
      const company = await getCompanyByCode(bookingCode);
      if (!company) {
        console.log('createBooking: company not found for code', bookingCode);
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Company not found or booking not enabled',
            hint: 'Ensure the company has this Booking Code and "Enable Public Booking Portal" turned on in Configuration → Company Settings.',
          }),
        };
      }
      console.log('createBooking: company resolved', { companyId: company.id, bookingCode: company.bookingCode });

      bookingRequest.companyId = company.id;
      const result = await createBookingRequest(bookingRequest);

      console.log('Booking request created:', {
        companyId: company.id,
        requestId: result.requestId,
        bookingCode: company.bookingCode,
      });

      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          success: true,
          bookingId: result.requestId,
          requestId: result.requestId,
          message: 'Booking request submitted. A manager will review and confirm your trip.',
        }),
      };
    }

    console.log('Invalid action:', action);
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
