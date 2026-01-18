import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { stripeCheckout } from './functions/stripeCheckout/resource';
import { stripePortal } from './functions/stripePortal/resource';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
  stripeCheckout,
  stripePortal,
});
