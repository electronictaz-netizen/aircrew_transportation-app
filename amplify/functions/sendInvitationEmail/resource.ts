/**
 * Send Invitation Email Lambda Function
 * Sends invitation emails via Postmark API
 */

import { defineFunction } from '@aws-amplify/backend';

export const sendInvitationEmail = defineFunction({
  name: 'sendInvitationEmail',
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
