/**
 * Send SMS via Telnyx Lambda Handler
 * 
 * Sends SMS messages using the Telnyx API.
 * 
 * Invocation:
 * - Direct (from another Lambda, EventBridge, etc.): event = { phone, message } or { to, text }
 * - Function URL / API Gateway: POST body JSON = { phone, message } or { to, text }
 * 
 * Environment Variables:
 * - TELNYX_API_KEY (required): Your Telnyx API key
 * - TELNYX_MESSAGING_PROFILE_ID (required): Your Telnyx messaging profile ID
 * - TELNYX_PHONE_NUMBER (required): Your Telnyx phone number in E.164 format
 */

interface SendSmsRequest {
  phone?: string;
  message?: string;
  to?: string;
  text?: string;
}

interface TelnyxSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RES_JSON = { 'Content-Type': 'application/json' };

/** Normalize phone number to E.164 format. US 10-digit -> +1xxxxxxxxxx. */
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

function parseInput(event: any): { to: string; text: string } | { error: string; statusCode: number } {
  let raw: any = event;

  if (isHttpEvent(event)) {
    try {
      raw = typeof event.body === 'string' ? (event.body ? JSON.parse(event.body) : {}) : event.body || {};
    } catch {
      return { error: 'Invalid JSON in request body', statusCode: 400 };
    }
  }

  const phone = raw.phone ?? raw.to;
  const message = raw.message ?? raw.text;

  if (!phone || typeof phone !== 'string' || !message || typeof message !== 'string') {
    return {
      error: 'Missing or invalid fields: need "phone" and "message" (or "to" and "text")',
      statusCode: 400,
    };
  }

  const to = toE164(phone);
  if (to.length < 10) {
    return { error: 'Invalid phone number', statusCode: 400 };
  }

  return { to, text: message };
}

export const handler = async (event: unknown): Promise<TelnyxSmsResponse | { statusCode: number; headers: Record<string, string>; body: string }> => {
  // Get environment variables
  const apiKey = process.env.TELNYX_API_KEY?.trim();
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim();
  const fromNumber = process.env.TELNYX_PHONE_NUMBER?.trim();

  if (!apiKey) {
    const err = { success: false, error: 'TELNYX_API_KEY is not configured. Set it in the Lambda environment.' };
    if (isHttpEvent(event)) {
      return { statusCode: 500, headers: RES_JSON, body: JSON.stringify(err) };
    }
    throw new Error(err.error);
  }

  if (!messagingProfileId) {
    const err = { success: false, error: 'TELNYX_MESSAGING_PROFILE_ID is not configured. Set it in the Lambda environment.' };
    if (isHttpEvent(event)) {
      return { statusCode: 500, headers: RES_JSON, body: JSON.stringify(err) };
    }
    throw new Error(err.error);
  }

  if (!fromNumber) {
    const err = { success: false, error: 'TELNYX_PHONE_NUMBER is not configured. Set it in the Lambda environment.' };
    if (isHttpEvent(event)) {
      return { statusCode: 500, headers: RES_JSON, body: JSON.stringify(err) };
    }
    throw new Error(err.error);
  }

  // Parse input
  const parsed = parseInput(event);
  if ('error' in parsed) {
    if (isHttpEvent(event)) {
      return { statusCode: parsed.statusCode, headers: RES_JSON, body: JSON.stringify({ success: false, error: parsed.error }) };
    }
    throw new Error(parsed.error);
  }

  const { to, text } = parsed;

  // Prepare Telnyx API request
  const telnyxUrl = 'https://api.telnyx.com/v2/messages';
  const requestBody = {
    from: fromNumber,
    to: to,
    text: text,
    messaging_profile_id: messagingProfileId,
  };

  try {
    const response = await fetch(telnyxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData.errors?.[0]?.detail || responseData.errors?.[0]?.title || `HTTP ${response.status}`;
      console.error('Telnyx API error:', errorMsg, responseData);
      
      if (isHttpEvent(event)) {
        return {
          statusCode: response.status,
          headers: RES_JSON,
          body: JSON.stringify({ success: false, error: errorMsg }),
        };
      }
      throw new Error(errorMsg);
    }

    const messageId = responseData.data?.id || responseData.id;
    const out = { success: true, messageId };

    if (isHttpEvent(event)) {
      return { statusCode: 200, headers: RES_JSON, body: JSON.stringify(out) };
    }
    return out;
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('Telnyx SMS send failed:', msg);

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
