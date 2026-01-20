/**
 * Send Invitation Email Lambda Function
 * Sends invitation emails via AWS SES
 */

import { defineFunction } from '@aws-amplify/backend';

export const sendInvitationEmail = defineFunction({
  name: 'sendInvitationEmail',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    // Optional: Configure sender email (defaults to support@tazsoftware.biz)
    SES_SENDER_EMAIL: process.env.SES_SENDER_EMAIL || 'support@tazsoftware.biz',
  },
});
