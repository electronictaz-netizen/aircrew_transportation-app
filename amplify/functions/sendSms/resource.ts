/**
 * Send SMS Lambda Function
 * Sends SMS via AWS End User Messaging (Pinpoint SMS Voice v2 / SendTextMessage).
 * See docs/AWS_END_USER_MESSAGING_SMS_SETUP.md for full setup (pool, config set, 10DLC, etc.).
 */

import { defineFunction } from '@aws-amplify/backend';

export const sendSms = defineFunction({
  name: 'sendSms',
  entry: './handler.ts',
  timeoutSeconds: 15,
  environment: {
    MESSAGE_TYPE: 'TRANSACTIONAL',
  },
});
