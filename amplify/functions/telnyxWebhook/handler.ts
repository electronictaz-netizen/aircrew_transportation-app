/**
 * Telnyx Webhook Handler
 * 
 * Handles inbound SMS messages and delivery status updates from Telnyx.
 * 
 * Webhook Events:
 * - message.received: When an SMS is received
 * - message.finalized: When message delivery status is finalized
 * 
 * Environment Variables:
 * - TELNYX_WEBHOOK_SECRET (optional): Webhook secret for signature verification
 * - AMPLIFY_DATA_GRAPHQL_ENDPOINT (required): GraphQL endpoint for database access
 * - AMPLIFY_DATA_REGION (required): AWS region
 * - TELNYX_SMS_FUNCTION_URL (optional): Function URL for sending SMS confirmations
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { createHmac, createHash } from 'crypto';

// GraphQL execution helpers (similar to publicBooking handler)
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
  const strToSign = `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${sha256(cano)}`;
  const kSign = hmac(hmac(hmac(hmac('AWS4' + creds.secretAccessKey, dateStamp), region), service), 'aws4_request');
  const sig = hmac(kSign, strToSign).toString('hex');
  return {
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase() === 'host' ? 'Host' : k === 'content-type' ? 'Content-Type' : k === 'x-amz-content-sha256' ? 'X-Amz-Content-Sha256' : k === 'x-amz-date' ? 'X-Amz-Date' : k === 'x-amz-security-token' ? 'X-Amz-Security-Token' : k, v])),
    'Authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
}

function toFetchHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    const n = k === 'host' ? 'Host' : k === 'content-type' ? 'Content-Type' : k === 'x-amz-content-sha256' ? 'X-Amz-Content-Sha256' : k === 'x-amz-date' ? 'X-Amz-Date' : k === 'x-amz-security-token' ? 'X-Amz-Security-Token' : k === 'authorization' ? 'Authorization' : k;
    out[n] = v;
  }
  return out;
}

async function executeGraphQL(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const endpoint = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    console.warn('AMPLIFY_DATA_GRAPHQL_ENDPOINT not set, skipping database operations');
    return null;
  }
  const url = new URL(endpoint);
  const bodyStr = JSON.stringify({ query, variables });
  const region = process.env.AMPLIFY_DATA_REGION || 'us-east-1';
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
 * Normalize phone number to E.164 format for comparison
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Find customer by phone number
 */
async function findCustomerByPhone(phone: string): Promise<{ id: string; companyId: string } | null> {
  const normalized = normalizePhone(phone);
  const query = `
    query ListCustomers($filter: ModelCustomerFilterInput) {
      listCustomers(filter: $filter) {
        items {
          id
          companyId
          phone
          smsOptIn
          smsOptOutAt
        }
      }
    }
  `;
  
  try {
    const data = await executeGraphQL(query, {
      filter: {
        phone: { eq: normalized },
        isActive: { eq: true },
      },
    });
    
    const customers = data?.listCustomers?.items || [];
    // Also check without +1 prefix (for US numbers)
    if (customers.length === 0 && normalized.startsWith('+1')) {
      const altQuery = await executeGraphQL(query, {
        filter: {
          phone: { eq: normalized.slice(2) },
          isActive: { eq: true },
        },
      });
      const altCustomers = altQuery?.listCustomers?.items || [];
      if (altCustomers.length > 0) {
        return { id: altCustomers[0].id, companyId: altCustomers[0].companyId };
      }
    }
    
    return customers.length > 0 ? { id: customers[0].id, companyId: customers[0].companyId } : null;
  } catch (error) {
    console.error('Error finding customer by phone:', error);
    return null;
  }
}

/**
 * Send SMS via Telnyx (for opt-in/opt-out confirmations)
 */
async function sendSmsConfirmation(phone: string, message: string): Promise<void> {
  const functionUrl = process.env.TELNYX_SMS_FUNCTION_URL;
  if (!functionUrl) {
    console.log('TELNYX_SMS_FUNCTION_URL not configured, skipping SMS confirmation');
    return;
  }

  try {
    await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
  } catch (error) {
    console.error('Error sending SMS confirmation:', error);
  }
}

interface TelnyxWebhookEvent {
  data: {
    event_type: string;
    payload: {
      id: string;
      from: {
        phone_number: string;
      };
      to: Array<{
        phone_number: string;
      }>;
      text: string;
      direction: 'inbound' | 'outbound';
      status?: string;
      [key: string]: any;
    };
  };
}

const RES_JSON = { 'Content-Type': 'application/json' };

function isHttpEvent(event: unknown): event is { requestContext?: { http?: unknown }; body?: string } {
  return (
    typeof event === 'object' &&
    event !== null &&
    ('requestContext' in event || ('body' in event && typeof (event as any).body === 'string'))
  );
}

/**
 * Verify webhook signature (optional but recommended)
 * See: https://developers.telnyx.com/docs/api/v2/webhooks
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  // Telnyx uses HMAC-SHA256 for webhook signatures
  // Implementation depends on Telnyx's specific signature format
  // For now, we'll skip verification if secret is not set
  if (!secret) {
    return true; // Skip verification if no secret configured
  }
  
  // TODO: Implement signature verification based on Telnyx documentation
  // This typically involves:
  // 1. Creating HMAC-SHA256 hash of the request body
  // 2. Comparing with the signature header
  return true;
}

/**
 * Handle inbound SMS message
 */
async function handleInboundMessage(payload: TelnyxWebhookEvent['data']['payload']): Promise<void> {
  const from = payload.from.phone_number;
  const text = payload.text?.trim() || '';
  const messageId = payload.id;

  console.log('Received inbound SMS:', { from, text, messageId });

  // Handle opt-out keywords (TCPA compliance)
  const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'QUIT', 'END', 'CANCEL'];
  const optInKeywords = ['START', 'YES', 'SUBSCRIBE', 'OPTIN'];

  const upperText = text.toUpperCase();

  if (optOutKeywords.some(keyword => upperText.includes(keyword))) {
    console.log('Opt-out request detected:', { from, text });
    
    // Find customer by phone number
    const customer = await findCustomerByPhone(from);
    
    if (customer) {
      // Update customer record to set smsOptOutAt
      const mutation = `
        mutation UpdateCustomer($input: UpdateCustomerInput!) {
          updateCustomer(input: $input) {
            id
            smsOptOutAt
            smsOptIn
          }
        }
      `;
      
      try {
        await executeGraphQL(mutation, {
          input: {
            id: customer.id,
            smsOptOutAt: new Date().toISOString(),
            smsOptIn: false,
          },
        });
        console.log('Customer opt-out updated:', customer.id);
      } catch (error) {
        console.error('Error updating customer opt-out:', error);
      }
    } else {
      console.log('Customer not found for phone number:', from);
    }
    
    // Send opt-out confirmation
    await sendSmsConfirmation(from, 'You have been unsubscribed from SMS notifications. Reply START to resubscribe.');
    return;
  }

  if (optInKeywords.some(keyword => upperText.includes(keyword))) {
    console.log('Opt-in request detected:', { from, text });
    
    // Find customer by phone number
    const customer = await findCustomerByPhone(from);
    
    if (customer) {
      // Update customer record to set smsOptIn = true
      const mutation = `
        mutation UpdateCustomer($input: UpdateCustomerInput!) {
          updateCustomer(input: $input) {
            id
            smsOptIn
            smsOptInAt
            smsOptOutAt
          }
        }
      `;
      
      try {
        await executeGraphQL(mutation, {
          input: {
            id: customer.id,
            smsOptIn: true,
            smsOptInAt: new Date().toISOString(),
            smsOptOutAt: null,
          },
        });
        console.log('Customer opt-in updated:', customer.id);
      } catch (error) {
        console.error('Error updating customer opt-in:', error);
      }
    } else {
      console.log('Customer not found for phone number:', from);
    }
    
    // Send opt-in confirmation
    await sendSmsConfirmation(from, 'You have been subscribed to SMS notifications. Reply STOP to unsubscribe at any time.');
    return;
  }

  // TODO: Handle other inbound messages
  // - Route to customer support
  // - Process booking-related queries
  // - Auto-respond to common questions
}

/**
 * Handle message delivery status
 */
async function handleDeliveryStatus(payload: TelnyxWebhookEvent['data']['payload']): Promise<void> {
  const messageId = payload.id;
  const status = payload.status;

  console.log('Message delivery status:', { messageId, status });

  // TODO: Update message status in database if tracking
  // - Store delivery receipts
  // - Track failed deliveries
  // - Update customer notification preferences if delivery fails repeatedly
}

export const handler = async (event: unknown): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {
  if (!isHttpEvent(event)) {
    return {
      statusCode: 400,
      headers: RES_JSON,
      body: JSON.stringify({ error: 'Invalid event type' }),
    };
  }

  // Parse request body
  let body: string;
  try {
    body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {});
  } catch {
    return {
      statusCode: 400,
      headers: RES_JSON,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  // Verify webhook signature (optional)
  const webhookSecret = process.env.TELNYX_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const signature = (event as any).headers?.['telnyx-signature'] || (event as any).headers?.['Telnyx-Signature'];
    if (signature && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.warn('Webhook signature verification failed');
      return {
        statusCode: 401,
        headers: RES_JSON,
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }
  }

  // Parse webhook event
  let webhookEvent: TelnyxWebhookEvent;
  try {
    webhookEvent = JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse webhook event:', error);
    return {
      statusCode: 400,
      headers: RES_JSON,
      body: JSON.stringify({ error: 'Invalid JSON in webhook body' }),
    };
  }

  const eventType = webhookEvent.data?.event_type;
  const payload = webhookEvent.data?.payload;

  if (!eventType || !payload) {
    return {
      statusCode: 400,
      headers: RES_JSON,
      body: JSON.stringify({ error: 'Invalid webhook event structure' }),
    };
  }

  try {
    // Handle different event types
    switch (eventType) {
      case 'message.received':
        await handleInboundMessage(payload);
        break;
      case 'message.finalized':
        await handleDeliveryStatus(payload);
        break;
      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return {
      statusCode: 200,
      headers: RES_JSON,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers: RES_JSON,
      body: JSON.stringify({ error: 'Internal server error processing webhook' }),
    };
  }
};
