/**
 * Telnyx Webhook Lambda Function
 * Handles inbound SMS messages and delivery status updates from Telnyx.
 * See docs/TELNYX_SMS_SETUP.md for webhook configuration.
 */

import { defineFunction } from '@aws-amplify/backend';

export const telnyxWebhook = defineFunction({
  name: 'telnyxWebhook',
  entry: './handler.ts',
  timeoutSeconds: 15,
});
