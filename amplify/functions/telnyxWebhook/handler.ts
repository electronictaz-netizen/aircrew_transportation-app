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
 */

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
    // TODO: Update customer record to set smsOptOutAt
    // This requires database access - implement based on your schema
    console.log('Opt-out request detected:', { from, text });
    
    // Send opt-out confirmation (would need to call sendTelnyxSms)
    // For now, just log it
    return;
  }

  if (optInKeywords.some(keyword => upperText.includes(keyword))) {
    // TODO: Update customer record to set smsOptIn = true
    console.log('Opt-in request detected:', { from, text });
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
