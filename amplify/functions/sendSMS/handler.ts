import type { Handler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Request interface for SMS sending
 */
interface SendSMSRequest {
  phoneNumber: string;
  message: string;
  senderId?: string; // Optional sender ID (if supported by your AWS account)
}

/**
 * Response interface
 */
interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Validate and format phone number for SMS
 * Converts to E.164 format required by SNS
 */
function formatPhoneNumber(phone: string): string {
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
function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}

/**
 * Lambda handler for sending SMS via AWS SNS
 * 
 * @param event - Lambda event containing phoneNumber and message
 * @returns Promise with success status and message ID or error
 */
export const handler: Handler<SendSMSRequest, SendSMSResponse> = async (event) => {
  console.log('SMS send request received:', { 
    phoneNumber: event.phoneNumber?.substring(0, 4) + '***', // Log partial for privacy
    messageLength: event.message?.length 
  });

  try {
    // Validate input
    if (!event.phoneNumber || !event.message) {
      return {
        success: false,
        error: 'Missing required fields: phoneNumber and message are required',
      };
    }

    // Validate and format phone number
    if (!isValidPhoneNumber(event.phoneNumber)) {
      return {
        success: false,
        error: `Invalid phone number format: ${event.phoneNumber}. Must be in E.164 format (e.g., +1234567890)`,
      };
    }

    const formattedPhone = formatPhoneNumber(event.phoneNumber);

    // Validate message length (SMS has a 160 character limit per message, but SNS can handle longer)
    if (event.message.length === 0) {
      return {
        success: false,
        error: 'Message cannot be empty',
      };
    }

    // Prepare SNS publish command
    const publishParams = {
      PhoneNumber: formattedPhone,
      Message: event.message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Use 'Promotional' for marketing messages
        },
      },
    };

    // Send SMS via SNS
    const command = new PublishCommand(publishParams);
    const response = await snsClient.send(command);

    console.log('SMS sent successfully:', {
      messageId: response.MessageId,
      phoneNumber: formattedPhone.substring(0, 4) + '***',
    });

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
    // Handle specific AWS errors
    if (error.name === 'InvalidParameter') {
      return {
        success: false,
        error: `Invalid phone number: ${error.message}`,
      };
    }
    
    if (error.name === 'Throttling') {
      return {
        success: false,
        error: 'SMS sending rate limit exceeded. Please try again later.',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending SMS',
    };
  }
};
