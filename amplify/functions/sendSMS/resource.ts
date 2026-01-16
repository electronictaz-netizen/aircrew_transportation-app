import { defineFunction } from '@aws-amplify/backend';

/**
 * Lambda function for sending SMS messages via AWS SNS
 * 
 * This function handles sending SMS notifications to drivers for:
 * - Trip assignments/reassignments
 * - Daily assignment summaries
 * 
 * Requires AWS SNS permissions and phone number validation.
 */
export const sendSMS = defineFunction({
  name: 'sendSMS',
  entry: './handler.ts',
  environment: {
    // Optional: Add any environment variables needed
  },
});
