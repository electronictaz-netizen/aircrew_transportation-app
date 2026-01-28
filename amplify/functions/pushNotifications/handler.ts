/**
 * Push Notifications Lambda Function
 * Handles push notification subscriptions and sending notifications
 * Uses VAPID keys for secure push notification delivery
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { createHmac, createHash } from 'crypto';
import webpush from 'web-push';

// Note: The Lambda function needs IAM permissions to access the Data API
// These permissions are automatically granted when the function is defined in backend.ts
// The GraphQL endpoint and region are set by backend.ts (AMPLIFY_DATA_GRAPHQL_ENDPOINT, AMPLIFY_DATA_REGION)

interface SubscribeRequest {
  action: 'subscribe';
  userId: string;
  companyId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
}

interface UnsubscribeRequest {
  action: 'unsubscribe';
  userId: string;
  companyId: string;
  endpoint: string;
}

interface SendNotificationRequest {
  action: 'send';
  userId?: string; // Optional: send to specific user
  companyId?: string; // Optional: send to all users in company
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
  };
}

type RequestBody = SubscribeRequest | UnsubscribeRequest | SendNotificationRequest;

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// Note: CORS headers are handled by Lambda Function URL configuration
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

/**
 * Initialize web-push with VAPID keys
 */
function initializeWebPush(): void {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'noreply@onyxdispatch.us';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[PushNotifications] VAPID keys not configured. Push notifications will not work.');
    return;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log('[PushNotifications] Web-push initialized with VAPID keys');
}

/**
 * Subscribe user to push notifications
 */
async function handleSubscribe(request: SubscribeRequest): Promise<LambdaResponse> {
  try {
    const { userId, companyId, subscription, userAgent } = request;

    // Check if subscription already exists
    const checkQuery = `
      query ListPushSubscriptions($companyId: ID!, $userId: String!, $endpoint: String!) {
        listPushSubscriptions(filter: { companyId: { eq: $companyId }, userId: { eq: $userId }, endpoint: { eq: $endpoint } }) {
          items {
            id
            endpoint
          }
        }
      }
    `;

    const existing = await graphqlRequest(checkQuery, {
      companyId,
      userId,
      endpoint: subscription.endpoint,
    });

    const existingSubscription = existing?.listPushSubscriptions?.items?.[0];

    const keysJson = JSON.stringify(subscription.keys);
    const now = new Date().toISOString();

    if (existingSubscription) {
      // Update existing subscription
      const updateMutation = `
        mutation UpdatePushSubscription($id: ID!, $keys: String!, $userAgent: String, $lastUsed: AWSDateTime!) {
          updatePushSubscription(input: { id: $id, keys: $keys, userAgent: $userAgent, lastUsed: $lastUsed }) {
            id
            endpoint
          }
        }
      `;

      await graphqlRequest(updateMutation, {
        id: existingSubscription.id,
        keys: keysJson,
        userAgent: userAgent || null,
        lastUsed: now,
      });

      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ success: true, message: 'Subscription updated', id: existingSubscription.id }),
      };
    } else {
      // Create new subscription
      const createMutation = `
        mutation CreatePushSubscription(
          $companyId: ID!
          $userId: String!
          $endpoint: String!
          $keys: String!
          $userAgent: String
          $createdAt: AWSDateTime!
          $lastUsed: AWSDateTime!
        ) {
          createPushSubscription(input: {
            companyId: $companyId
            userId: $userId
            endpoint: $endpoint
            keys: $keys
            userAgent: $userAgent
            createdAt: $createdAt
            lastUsed: $lastUsed
          }) {
            id
            endpoint
          }
        }
      `;

      const result = await graphqlRequest(createMutation, {
        companyId,
        userId,
        endpoint: subscription.endpoint,
        keys: keysJson,
        userAgent: userAgent || null,
        createdAt: now,
        lastUsed: now,
      });

      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ success: true, message: 'Subscription created', id: result.createPushSubscription.id }),
      };
    }
  } catch (error) {
    console.error('[PushNotifications] Error subscribing:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to subscribe' }),
    };
  }
}

/**
 * Unsubscribe user from push notifications
 */
async function handleUnsubscribe(request: UnsubscribeRequest): Promise<LambdaResponse> {
  try {
    const { userId, companyId, endpoint } = request;

    // Find subscription
    const query = `
      query ListPushSubscriptions($companyId: ID!, $userId: String!, $endpoint: String!) {
        listPushSubscriptions(filter: { companyId: { eq: $companyId }, userId: { eq: $userId }, endpoint: { eq: $endpoint } }) {
          items {
            id
          }
        }
      }
    `;

    const result = await graphqlRequest(query, {
      companyId,
      userId,
      endpoint,
    });

    const subscription = result?.listPushSubscriptions?.items?.[0];

    if (!subscription) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ success: false, error: 'Subscription not found' }),
      };
    }

    // Delete subscription
    const deleteMutation = `
      mutation DeletePushSubscription($id: ID!) {
        deletePushSubscription(input: { id: $id }) {
          id
        }
      }
    `;

    await graphqlRequest(deleteMutation, { id: subscription.id });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
    };
  } catch (error) {
    console.error('[PushNotifications] Error unsubscribing:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to unsubscribe' }),
    };
  }
}

/**
 * Send push notification to user(s)
 */
async function handleSend(request: SendNotificationRequest): Promise<LambdaResponse> {
  try {
    initializeWebPush();

    const { userId, companyId, payload } = request;

    // Build GraphQL filter string
    const filterParts: string[] = [];
    const variables: any = {};
    const variableDefs: string[] = [];

    if (userId) {
      filterParts.push(`userId: { eq: $userId }`);
      variableDefs.push('$userId: String!');
      variables.userId = userId;
    }
    if (companyId) {
      filterParts.push(`companyId: { eq: $companyId }`);
      variableDefs.push('$companyId: ID!');
      variables.companyId = companyId;
    }

    if (filterParts.length === 0) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ success: false, error: 'Either userId or companyId must be provided' }),
      };
    }

    const filterString = `filter: { ${filterParts.join(', ')} }`;
    const variableDefString = variableDefs.length > 0 ? `(${variableDefs.join(', ')})` : '';

    const query = `
      query ListPushSubscriptions${variableDefString} {
        listPushSubscriptions(${filterString}) {
          items {
            id
            endpoint
            keys
          }
        }
      }
    `;

    const result = await graphqlRequest(query, variables);
    const subscriptions = result?.listPushSubscriptions?.items || [];

    if (subscriptions.length === 0) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ success: false, error: 'No subscriptions found' }),
      };
    }

    // Send notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const keys = JSON.parse(sub.keys);
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: keys.p256dh,
              auth: keys.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

          // Update lastUsed timestamp
          const updateMutation = `
            mutation UpdatePushSubscription($id: ID!, $lastUsed: AWSDateTime!) {
              updatePushSubscription(input: { id: $id, lastUsed: $lastUsed }) {
                id
              }
            }
          `;

          await graphqlRequest(updateMutation, {
            id: sub.id,
            lastUsed: new Date().toISOString(),
          });

          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          console.error(`[PushNotifications] Error sending to subscription ${sub.id}:`, error);
          
          // If subscription is invalid (410 Gone), delete it
          if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            const deleteMutation = `
              mutation DeletePushSubscription($id: ID!) {
                deletePushSubscription(input: { id: $id }) {
                  id
                }
              }
            `;
            await graphqlRequest(deleteMutation, { id: sub.id });
          }

          return { success: false, subscriptionId: sub.id, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        success: true,
        message: `Sent to ${successful} subscription(s)`,
        sent: successful,
        failed,
        total: subscriptions.length,
      }),
    };
  } catch (error) {
    console.error('[PushNotifications] Error sending notification:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to send notification' }),
    };
  }
}

/**
 * Lambda handler
 */
export const handler = async (event: any): Promise<LambdaResponse> => {
  console.log('[PushNotifications] Event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: '',
      };
    }

    // Parse request body
    let body: RequestBody;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
      };
    }

    // Route to appropriate handler
    switch (body.action) {
      case 'subscribe':
        return await handleSubscribe(body as SubscribeRequest);
      case 'unsubscribe':
        return await handleUnsubscribe(body as UnsubscribeRequest);
      case 'send':
        return await handleSend(body as SendNotificationRequest);
      default:
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ success: false, error: `Unknown action: ${(body as any).action}` }),
        };
    }
  } catch (error) {
    console.error('[PushNotifications] Handler error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};
