/**
 * Send SMS via Telnyx Lambda Function
 * Sends SMS messages using the Telnyx API.
 * See docs/TELNYX_SMS_SETUP.md for full setup instructions.
 */

import { defineFunction } from '@aws-amplify/backend';

export const sendTelnyxSms = defineFunction({
  name: 'sendTelnyxSms',
  entry: './handler.ts',
  timeoutSeconds: 15,
});
