/**
 * SMS Service Utility
 * 
 * Handles sending SMS messages via AWS Amplify function (which uses AWS SNS).
 * Provides a clean interface for sending SMS notifications to drivers.
 */

import { invoke } from 'aws-amplify/api';

export interface SendSMSRequest {
  phoneNumber: string;
  message: string;
  senderId?: string;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS message via AWS SNS through Amplify function
 * 
 * @param request - SMS request with phone number and message
 * @returns Promise with success status and message ID or error
 */
export async function sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
  try {
    // Validate input
    if (!request.phoneNumber || !request.message) {
      return {
        success: false,
        error: 'Phone number and message are required',
      };
    }

    // Call the Amplify function
    const response = await invoke({
      functionName: 'sendSMS',
      payload: {
        phoneNumber: request.phoneNumber,
        message: request.message,
        senderId: request.senderId,
      },
    });

    // Handle response (response is already parsed JSON)
    const result = response as SendSMSResponse;
    return result;
  } catch (error: any) {
    console.error('Error calling SMS service:', error);
    
    // Handle network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to SMS service. Please check your internet connection.',
      };
    }

    // Handle authentication errors
    if (error.name === 'UnauthorizedException' || error.statusCode === 401) {
      return {
        success: false,
        error: 'Authentication error: Please log in again.',
      };
    }

    // Handle function not found errors
    if (error.message?.includes('not found') || error.message?.includes('Function')) {
      return {
        success: false,
        error: 'SMS service is not configured. Please contact your administrator.',
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending SMS',
    };
  }
}

/**
 * Format phone number for SMS (basic validation)
 * Ensures phone number is in a format that can be processed
 */
export function formatPhoneForSMS(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '+1' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }
  
  const formatted = formatPhoneForSMS(phone);
  // E.164 format: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}
