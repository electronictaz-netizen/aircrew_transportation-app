/**
 * Customer Portal Lambda Function
 * Provides public access to customer portal functionality without Cognito authentication.
 * Uses IAM credentials for AppSync GraphQL access.
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { createHmac, createHash } from 'crypto';

// Note: The Lambda function needs IAM permissions to access the Data API
// These permissions are automatically granted when the function is defined in backend.ts
// The GraphQL endpoint and region are set by backend.ts (AMPLIFY_DATA_GRAPHQL_ENDPOINT, AMPLIFY_DATA_REGION)

const getEndpoint = (): string => {
  const e = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;
  if (!e) throw new Error('AMPLIFY_DATA_GRAPHQL_ENDPOINT is not set');
  return e;
};

const getRegion = (): string => process.env.AMPLIFY_DATA_REGION || 'us-east-1';

type Creds = { accessKeyId: string; secretAccessKey: string; sessionToken?: string };

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
  const kDate = hmac(`AWS4${creds.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, cano).toString('hex');
  return {
    ...headers,
    'authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function graphqlRequest(query: string, variables: Record<string, any> = {}): Promise<any> {
  const endpoint = getEndpoint();
  const region = getRegion();
  const creds = await getCreds();
  const url = new URL(endpoint);
  const body = JSON.stringify({ query, variables });
  const headers = sign(creds, 'POST', url, body, 'appsync', region);
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL error: ${res.status} ${text}`);
  }
  return res.json();
}

const responseHeaders = {
  'Content-Type': 'application/json',
};

export const handler = async (event: {
  httpMethod: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> => {
  const headers = {
    ...responseHeaders,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, companyId, email, phone, accessCode, customerId, view } = body;

    if (!companyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Company ID is required' }),
      };
    }

    switch (action) {
      case 'findCustomer': {
        if (!email && !phone) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email or phone is required' }),
          };
        }

        try {
          // Build GraphQL query to find customer
          const filters: string[] = [
            `companyId: { eq: "${companyId}" }`,
            `portalEnabled: { eq: true }`,
            `isActive: { eq: true }`,
          ];

          if (email) {
            filters.push(`email: { eq: "${email.trim().toLowerCase()}" }`);
          }
          if (phone) {
            filters.push(`phone: { eq: "${phone.trim()}" }`);
          }

          const query = `
            query ListCustomers {
              listCustomers(filter: { and: [${filters.join(', ')}] }) {
                items {
                  id
                  name
                  email
                  phone
                  companyName
                  portalEnabled
                  portalAccessCode
                }
              }
            }
          `;

          const response = await graphqlRequest(query);
          const customer = response.data?.listCustomers?.items?.[0];

          if (!customer) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'No account found',
                hint: 'Please contact your transportation provider to enable portal access.',
              }),
            };
          }

          // Generate access code
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Update customer with access code
          const updateQuery = `
            mutation UpdateCustomer {
              updateCustomer(input: {
                id: "${customer.id}"
                portalAccessCode: "${code}"
              }) {
                id
              }
            }
          `;
          await graphqlRequest(updateQuery);

          // In production, send code via email/SMS
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              customerId: customer.id,
              accessCode: code, // Remove in production - send via email/SMS instead
              message: 'Access code generated. Check your email or phone.',
            }),
          };
        } catch (error: any) {
          console.error('Error finding customer:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to process request' }),
          };
        }
      }

      case 'verifyCode': {
        if (!customerId || !accessCode) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Customer ID and access code are required' }),
          };
        }

        try {
          const query = `
            query GetCustomer {
              getCustomer(id: "${customerId}") {
                id
                name
                email
                phone
                companyName
                companyId
                portalAccessCode
              }
            }
          `;

          const response = await graphqlRequest(query);
          const customer = response.data?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Customer not found' }),
            };
          }

          if (customer.portalAccessCode !== accessCode.toUpperCase()) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ error: 'Invalid access code' }),
            };
          }

          // Update last login and clear access code
          const updateQuery = `
            mutation UpdateCustomer {
              updateCustomer(input: {
                id: "${customer.id}"
                lastPortalLogin: "${new Date().toISOString()}"
                portalAccessCode: null
              }) {
                id
              }
            }
          `;
          await graphqlRequest(updateQuery);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                companyName: customer.companyName,
              },
            }),
          };
        } catch (error: any) {
          console.error('Error verifying code:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to verify code' }),
          };
        }
      }

      case 'getTrips': {
        if (!customerId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Customer ID is required' }),
          };
        }

        try {
          // Verify customer belongs to company
          const customerQuery = `
            query GetCustomer {
              getCustomer(id: "${customerId}") {
                id
                companyId
              }
            }
          `;
          const customerResponse = await graphqlRequest(customerQuery);
          const customer = customerResponse.data?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Access denied' }),
            };
          }

          const tripView = view || 'upcoming';
          const now = new Date().toISOString();
          
          let dateFilter = '';
          if (tripView === 'upcoming') {
            dateFilter = `pickupDate: { ge: "${now}" }`;
          } else {
            dateFilter = `pickupDate: { lt: "${now}" }`;
          }

          const tripsQuery = `
            query ListTrips {
              listTrips(filter: {
                companyId: { eq: "${companyId}" }
                customerId: { eq: "${customerId}" }
                ${dateFilter}
              }) {
                items {
                  id
                  flightNumber
                  pickupDate
                  pickupLocation
                  dropoffLocation
                  numberOfPassengers
                  status
                  driverId
                  tripRate
                  actualPickupTime
                  actualDropoffTime
                  notes
                }
              }
            }
          `;

          const tripsResponse = await graphqlRequest(tripsQuery);
          const trips = tripsResponse.data?.listTrips?.items || [];

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              trips,
            }),
          };
        } catch (error: any) {
          console.error('Error loading trips:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to load trips' }),
          };
        }
      }

      case 'createModificationRequest': {
        const { customerId, tripId, requestType, requestedChanges, reason } = body;
        
        if (!customerId || !tripId || !requestType || !reason) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' }),
          };
        }

        try {
          // Verify customer belongs to company
          const customerQuery = `
            query GetCustomer {
              getCustomer(id: "${customerId}") {
                id
                companyId
              }
            }
          `;
          const customerResponse = await graphqlRequest(customerQuery);
          const customer = customerResponse.data?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Access denied' }),
            };
          }

          const mutation = `
            mutation CreateModificationRequest {
              createTripModificationRequest(input: {
                companyId: "${companyId}"
                tripId: "${tripId}"
                customerId: "${customerId}"
                requestType: "${requestType}"
                requestedChanges: ${JSON.stringify(JSON.stringify(requestedChanges))}
                reason: ${JSON.stringify(reason)}
                status: "pending"
                createdAt: "${new Date().toISOString()}"
              }) {
                id
              }
            }
          `;

          const result = await graphqlRequest(mutation);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              requestId: result?.createTripModificationRequest?.id,
            }),
          };
        } catch (error: any) {
          console.error('Error creating modification request:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create modification request' }),
          };
        }
      }

      case 'createRating': {
        const { customerId, tripId, rating, driverRating, vehicleRating, review, wouldRecommend } = body;
        
        if (!customerId || !tripId || !rating) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' }),
          };
        }

        try {
          // Verify customer belongs to company
          const customerQuery = `
            query GetCustomer {
              getCustomer(id: "${customerId}") {
                id
                companyId
              }
            }
          `;
          const customerResponse = await graphqlRequest(customerQuery);
          const customer = customerResponse.data?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Access denied' }),
            };
          }

          // Build mutation input with optional fields
          const ratingInput: string[] = [
            `companyId: "${companyId}"`,
            `tripId: "${tripId}"`,
            `customerId: "${customerId}"`,
            `rating: ${rating}`,
            `createdAt: "${new Date().toISOString()}"`,
          ];
          
          if (driverRating !== undefined && driverRating !== null) {
            ratingInput.push(`driverRating: ${driverRating}`);
          }
          if (vehicleRating !== undefined && vehicleRating !== null) {
            ratingInput.push(`vehicleRating: ${vehicleRating}`);
          }
          if (review && review.trim()) {
            ratingInput.push(`review: ${JSON.stringify(review)}`);
          }
          if (wouldRecommend !== undefined && wouldRecommend !== null) {
            ratingInput.push(`wouldRecommend: ${wouldRecommend}`);
          }

          const mutation = `
            mutation CreateRating {
              createTripRating(input: {
                ${ratingInput.join('\n                ')}
              }) {
                id
              }
            }
          `;

          const result = await graphqlRequest(mutation);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              ratingId: result?.createTripRating?.id,
            }),
          };
        } catch (error: any) {
          console.error('Error creating rating:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create rating' }),
          };
        }
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error: any) {
    console.error('Error in customer portal handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
