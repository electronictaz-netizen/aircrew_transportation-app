/**
 * Stripe Checkout Lambda Function
 * Creates Stripe Checkout sessions for subscription upgrades
 */

import { defineFunction } from '@aws-amplify/backend';

export const stripeCheckout = defineFunction({
  name: 'stripeCheckout',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  },
});
