import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { stripeCheckout } from './functions/stripeCheckout/resource';
import { stripePortal } from './functions/stripePortal/resource';
import { sendInvitationEmail } from './functions/sendInvitationEmail/resource';
import { publicBooking } from './functions/publicBooking/resource';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
  stripeCheckout,
  stripePortal,
  sendInvitationEmail,
  publicBooking,
});

// Pass the GraphQL endpoint to the publicBooking function
// This allows the function to configure Amplify client properly
backend.publicBooking.addEnvironment(
  'AMPLIFY_DATA_GRAPHQL_ENDPOINT',
  backend.data.resources.graphqlApi.graphqlUrl
);
backend.publicBooking.addEnvironment(
  'AMPLIFY_DATA_REGION',
  backend.data.resources.graphqlApi.region
);

// Note: In Amplify Gen 2, functions defined in the backend automatically get
// IAM permissions to access the data resource. No additional configuration needed.

// Add Function URL for sendInvitationEmail
// Note: Function URLs need to be created manually in AWS Lambda Console
// or via AWS CLI/CDK. The URL will be available after first deployment.
// See EMAIL_FUNCTION_URL_SETUP.md for instructions.
