import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { stripeCheckout } from './functions/stripeCheckout/resource';
import { stripePortal } from './functions/stripePortal/resource';
import { sendInvitationEmail } from './functions/sendInvitationEmail/resource';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
  stripeCheckout,
  stripePortal,
  sendInvitationEmail,
});

// Add Function URL for sendInvitationEmail
backend.sendInvitationEmail.addFunctionUrl({
  authType: 'NONE', // Public endpoint (frontend will call it)
  cors: {
    allowedOrigins: ['*'], // Allow all origins (adjust for production)
    allowedMethods: ['POST'],
    allowedHeaders: ['content-type'],
  },
});
