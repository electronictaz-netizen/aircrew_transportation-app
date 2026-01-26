/**
 * Send Booking Email Lambda Function
 * Sends booking confirmation emails to customers and notifications to managers
 */

import { defineFunction } from '@aws-amplify/backend';

export const sendBookingEmail = defineFunction({
  name: 'sendBookingEmail',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    // Email service configuration
    // EMAIL_FROM: defaults to noreply@onyxdispatch.us
    // NOTE: Do NOT hardcode API keys here. Set them as secure env vars
    // in the Lambda console so they are not committed.
    // Prefer SENDGRID_API_KEY (faster), fallback to POSTMARK_API_KEY
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@onyxdispatch.us',
  },
});
