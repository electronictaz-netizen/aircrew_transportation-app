/**
 * Stripe Customer Portal Lambda Function
 * Creates Stripe Customer Portal sessions for subscription management
 */

import { defineFunction } from '@aws-amplify/backend';

export const stripePortal = defineFunction({
  name: 'stripePortal',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  },
});
