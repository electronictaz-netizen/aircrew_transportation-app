/**
 * Stripe Webhook Handler Lambda Function
 * Processes Stripe webhook events and updates subscription status in the database
 */

import { defineFunction } from '@aws-amplify/backend';

export const stripeWebhook = defineFunction({
  name: 'stripeWebhook',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
});
