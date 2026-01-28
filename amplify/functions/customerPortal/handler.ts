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
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// Note: CORS headers are handled by Lambda Function URL configuration
// Do not set CORS headers here to avoid duplicate headers
const responseHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Send access code via email
 */
async function sendAccessCodeEmail(
  email: string,
  customerName: string,
  accessCode: string,
  companyName: string
): Promise<void> {
  const emailFunctionUrl = process.env.SEND_BOOKING_EMAIL_FUNCTION_URL;
  if (!emailFunctionUrl) {
    console.warn('SEND_BOOKING_EMAIL_FUNCTION_URL not configured. Skipping email send.');
    return;
  }

  try {
    const portalUrl = process.env.PORTAL_BASE_URL || 'https://onyxdispatch.us/portal';
    const emailBody = {
      type: 'customer_confirmation',
      to: email,
      customerName,
      customerEmail: email,
      customerPhone: '',
      companyName,
      bookingId: 'portal-access',
      pickupDate: new Date().toISOString(),
      pickupLocation: '',
      dropoffLocation: '',
      numberOfPassengers: 0,
      specialInstructions: `Your Customer Portal access code is: ${accessCode}\n\nUse this code to log in to your portal at: ${portalUrl}\n\nThis code will expire after use.`,
    };

    const response = await fetch(emailFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send access code email:', errorText);
    } else {
      console.log('Access code email sent successfully');
    }
  } catch (error) {
    console.error('Error sending access code email:', error);
    // Don't throw - email failure shouldn't block portal access
  }
}

/**
 * Send access code via SMS
 */
async function sendAccessCodeSms(
  phone: string,
  accessCode: string,
  companyName: string
): Promise<void> {
  const smsFunctionUrl = process.env.SEND_TELNYX_SMS_FUNCTION_URL || process.env.SEND_SMS_FUNCTION_URL;
  if (!smsFunctionUrl) {
    console.warn('SMS Function URL not configured. Skipping SMS send.');
    return;
  }

  try {
    const portalUrl = process.env.PORTAL_BASE_URL || 'https://onyxdispatch.us/portal';
    const message = `${companyName}: Your Customer Portal access code is ${accessCode}. Use it to log in at ${portalUrl}. This code expires after use.`;

    const response = await fetch(smsFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send access code SMS:', errorText);
    } else {
      console.log('Access code SMS sent successfully');
    }
  } catch (error) {
    console.error('Error sending access code SMS:', error);
    // Don't throw - SMS failure shouldn't block portal access
  }
}

export const handler = async (event: {
  httpMethod: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> => {
  // Note: CORS preflight (OPTIONS) is handled automatically by Lambda Function URL
  // when CORS is enabled in Function URL settings

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, companyId, email, phone, accessCode, customerId, view, tripId } = body;

    if (!companyId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Company ID is required' }),
      };
    }

    switch (action) {
      case 'findCustomer': {
        if (!email && !phone) {
          return {
            statusCode: 400,
            headers: responseHeaders,
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
          const customer = response?.listCustomers?.items?.[0];

          if (!customer) {
          return {
            statusCode: 404,
            headers: responseHeaders,
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

          // Send access code via email and/or SMS
          const sendPromises: Promise<void>[] = [];
          
          if (customer.email) {
            sendPromises.push(
              sendAccessCodeEmail(
                customer.email,
                customer.name || 'Customer',
                code,
                customer.companyName || 'Your Transportation Provider'
              )
            );
          }
          
          if (customer.phone) {
            sendPromises.push(
              sendAccessCodeSms(
                customer.phone,
                code,
                customer.companyName || 'Your Transportation Provider'
              )
            );
          }

          // Send codes asynchronously (don't wait for completion)
          Promise.all(sendPromises).catch((error) => {
            console.error('Error sending access codes:', error);
            // Continue even if sending fails
          });

          // Return success (don't include access code in response for security)
          return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
              success: true,
              customerId: customer.id,
              message: customer.email && customer.phone
                ? 'Access code sent to your email and phone. Please check both.'
                : customer.email
                ? 'Access code sent to your email. Please check your inbox.'
                : customer.phone
                ? 'Access code sent to your phone. Please check your messages.'
                : 'Access code generated. Please contact support.',
            }),
          };
        } catch (error: any) {
          console.error('Error finding customer:', error);
          return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to process request' }),
          };
        }
      }

      case 'verifyCode': {
        if (!customerId || !accessCode) {
          return {
            statusCode: 400,
            headers: responseHeaders,
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
          const customer = response?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 404,
              headers: responseHeaders,
              body: JSON.stringify({ error: 'Customer not found' }),
            };
          }

          if (customer.portalAccessCode !== accessCode.toUpperCase()) {
            return {
              statusCode: 401,
              headers: responseHeaders,
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
            headers: responseHeaders,
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
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to verify code' }),
          };
        }
      }

      case 'getTrips': {
        if (!customerId) {
          return {
            statusCode: 400,
            headers: responseHeaders,
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
          const customer = customerResponse?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers: responseHeaders,
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
          const trips = tripsResponse?.listTrips?.items || [];

          return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
              success: true,
              trips,
            }),
          };
        } catch (error: any) {
          console.error('Error loading trips:', error);
          return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to load trips' }),
          };
        }
      }

      case 'createModificationRequest': {
        const { customerId, tripId, requestType, requestedChanges, reason } = body;
        
        if (!customerId || !tripId || !requestType || !reason) {
          return {
            statusCode: 400,
            headers: responseHeaders,
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
          const customer = customerResponse?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers: responseHeaders,
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
            headers: responseHeaders,
            body: JSON.stringify({
              success: true,
              requestId: result?.createTripModificationRequest?.id,
            }),
          };
        } catch (error: any) {
          console.error('Error creating modification request:', error);
          return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to create modification request' }),
          };
        }
      }

      case 'getTripLocation': {
        if (!customerId || !tripId) {
          return {
            statusCode: 400,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Customer ID and Trip ID are required' }),
          };
        }

        try {
          const customerQuery = `
            query GetCustomer {
              getCustomer(id: "${customerId}") {
                id
                companyId
              }
            }
          `;
          const customerResponse = await graphqlRequest(customerQuery);
          const customer = customerResponse?.getCustomer;

          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers: responseHeaders,
              body: JSON.stringify({ error: 'Access denied' }),
            };
          }

          const tripQuery = `
            query GetTrip {
              getTrip(id: "${tripId}") {
                id
                companyId
                customerId
              }
            }
          `;
          const tripResponse = await graphqlRequest(tripQuery);
          const trip = tripResponse?.getTrip;

          if (!trip || trip.companyId !== companyId || trip.customerId !== customerId) {
            return {
              statusCode: 404,
              headers: responseHeaders,
              body: JSON.stringify({ error: 'Trip not found or access denied' }),
            };
          }

          const locationsQuery = `
            query ListVehicleLocations {
              listVehicleLocations(filter: { tripId: { eq: "${tripId}" } }, limit: 100) {
                items {
                  latitude
                  longitude
                  timestamp
                }
              }
            }
          `;
          const locationsResponse = await graphqlRequest(locationsQuery);
          const items = locationsResponse?.listVehicleLocations?.items || [];

          if (items.length === 0) {
            return {
              statusCode: 200,
              headers: responseHeaders,
              body: JSON.stringify({
                success: true,
                location: null,
              }),
            };
          }

          const sorted = [...items].sort((a: { timestamp?: string }, b: { timestamp?: string }) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tB - tA;
          });
          const latest = sorted[0] as { latitude: number; longitude: number; timestamp: string };

          return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
              success: true,
              location: {
                latitude: latest.latitude,
                longitude: latest.longitude,
                timestamp: latest.timestamp,
              },
            }),
          };
        } catch (error: any) {
          console.error('Error getting trip location:', error);
          return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to get trip location' }),
          };
        }
      }

      case 'createRating': {
        const { customerId, tripId, rating, driverRating, vehicleRating, review, wouldRecommend } = body;
        
        if (!customerId || !tripId || !rating) {
          return {
            statusCode: 400,
            headers: responseHeaders,
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
          const customer = customerResponse?.getCustomer;
          
          if (!customer || customer.companyId !== companyId) {
            return {
              statusCode: 403,
              headers: responseHeaders,
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
            headers: responseHeaders,
            body: JSON.stringify({
              success: true,
              ratingId: result?.createTripRating?.id,
            }),
          };
        } catch (error: any) {
          console.error('Error creating rating:', error);
          return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Failed to create rating' }),
          };
        }
      }

      default:
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error: any) {
    console.error('Error in customer portal handler:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
