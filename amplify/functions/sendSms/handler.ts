/**
 * Send SMS Lambda Handler
 * Sends SMS via AWS End User Messaging (Pinpoint SMS Voice v2 / SendTextMessage).
 *
 * Invocation:
 * - Direct (from another Lambda, EventBridge, etc.): event = { phone, message } or { destinationPhoneNumber, messageBody }
 * - Function URL / API Gateway: POST body JSON = { phone, message } or { destinationPhoneNumber, messageBody }
 *
 * Env: ORIGINATION_IDENTITY (required), CONFIGURATION_SET_NAME, PROTECT_CONFIGURATION_ID, MESSAGE_TYPE
 */

import {
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
} from '@aws-sdk/client-pinpoint-sms-voice-v2';

const region = process.env.AWS_REGION || 'us-east-1';
const client = new PinpointSMSVoiceV2Client({ region });

const RES_JSON = { 'Content-Type': 'application/json' };

/** Normalize to E.164. US 10-digit -> +1xxxxxxxxxx. */
function toE164(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.trim().startsWith('+')) {
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

function isHttpEvent(event: unknown): event is { requestContext?: { http?: unknown }; body?: string } {
  return (
    typeof event === 'object' &&
    event !== null &&
    ('requestContext' in event || ('body' in event && typeof (event as any).body === 'string'))
  );
}

function parseInput(event: any): { destinationPhoneNumber: string; messageBody: string } | { error: string; statusCode: number } {
  let raw: any = event;

  if (isHttpEvent(event)) {
    try {
      raw = typeof event.body === 'string' ? (event.body ? JSON.parse(event.body) : {}) : event.body || {};
    } catch {
      return { error: 'Invalid JSON in request body', statusCode: 400 };
    }
  }

  const phone = raw.phone ?? raw.destinationPhoneNumber;
  const message = raw.message ?? raw.messageBody;

  if (!phone || typeof phone !== 'string' || !message || typeof message !== 'string') {
    return {
      error: 'Missing or invalid fields: need "phone" and "message" (or "destinationPhoneNumber" and "messageBody")',
      statusCode: 400,
    };
  }

  const destinationPhoneNumber = toE164(phone);
  if (destinationPhoneNumber.length < 10) {
    return { error: 'Invalid phone number', statusCode: 400 };
  }

  return { destinationPhoneNumber, messageBody: message };
}

export const handler = async (event: unknown) => {
  const origination = process.env.ORIGINATION_IDENTITY?.trim();
  if (!origination) {
    const err = { success: false, error: 'ORIGINATION_IDENTITY is not configured. Set it in the Lambda environment.' };
    if (isHttpEvent(event)) {
      return { statusCode: 500, headers: RES_JSON, body: JSON.stringify(err) };
    }
    throw new Error(err.error);
  }

  const parsed = parseInput(event);
  if ('error' in parsed) {
    if (isHttpEvent(event)) {
      return { statusCode: parsed.statusCode, headers: RES_JSON, body: JSON.stringify({ success: false, error: parsed.error }) };
    }
    throw new Error(parsed.error);
  }

  const { destinationPhoneNumber, messageBody } = parsed;

  const configSet = process.env.CONFIGURATION_SET_NAME?.trim() || undefined;
  const protectId = process.env.PROTECT_CONFIGURATION_ID?.trim() || undefined;
  const messageType = (process.env.MESSAGE_TYPE || 'TRANSACTIONAL').toUpperCase();
  const msgType = messageType === 'PROMOTIONAL' ? 'PROMOTIONAL' : 'TRANSACTIONAL';

  const command = new SendTextMessageCommand({
    DestinationPhoneNumber: destinationPhoneNumber,
    OriginationIdentity: origination,
    MessageBody: messageBody,
    MessageType: msgType,
    ConfigurationSetName: configSet,
    ProtectConfigurationId: protectId,
    TimeToLive: 72 * 3600,
    MaxPrice: '0.50',
  });

  try {
    const { MessageId } = await client.send(command);

    const out = { success: true, messageId: MessageId };
    if (isHttpEvent(event)) {
      return { statusCode: 200, headers: RES_JSON, body: JSON.stringify(out) };
    }
    return out;
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('SendTextMessage failed:', msg);

    if (isHttpEvent(event)) {
      return {
        statusCode: 500,
        headers: RES_JSON,
        body: JSON.stringify({ success: false, error: msg }),
      };
    }
    throw e;
  }
};
