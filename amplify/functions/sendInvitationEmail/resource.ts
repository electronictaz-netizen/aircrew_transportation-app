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
    // Postmark configuration
    // POSTMARK_FROM_EMAIL: defaults to noreply@onyxdispatch.us
    // NOTE: Do NOT hardcode POSTMARK_API_KEY here. Set it as a secure env var
    // in the Amplify console or via `amplify function update` so it is not committed.
    POSTMARK_FROM_EMAIL: process.env.POSTMARK_FROM_EMAIL || 'noreply@onyxdispatch.us',
  },
});
