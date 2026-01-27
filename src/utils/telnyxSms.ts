/**
 * Telnyx SMS Utility
 * 
 * Frontend utility for sending SMS via Telnyx through the Lambda function.
 * 
 * Note: SMS sending should always go through the backend Lambda function
 * for security (API keys should never be in frontend code).
 */

export interface SendSmsOptions {
  phone: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get the Telnyx SMS Lambda Function URL
 * This should be set as an environment variable or configured in your app
 */
function getTelnyxSmsFunctionUrl(): string | null {
  // Option 1: Use environment variable (recommended)
  const envUrl = import.meta.env.VITE_TELNYX_SMS_FUNCTION_URL;
  if (envUrl) {
    return envUrl;
  }

  // Option 2: Construct from known pattern (if using Amplify Function URLs)
  // This is a fallback - prefer environment variable
  return null;
}

/**
 * Send SMS via Telnyx
 * 
 * @param options - SMS options (phone number and message)
 * @returns Promise with send result
 */
export async function sendTelnyxSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const { phone, message } = options;

  if (!phone || !message) {
    return {
      success: false,
      error: 'Phone number and message are required',
    };
  }

  const functionUrl = getTelnyxSmsFunctionUrl();
  if (!functionUrl) {
    return {
      success: false,
      error: 'Telnyx SMS function URL is not configured. Set VITE_TELNYX_SMS_FUNCTION_URL environment variable.',
    };
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error('Error sending SMS via Telnyx:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
