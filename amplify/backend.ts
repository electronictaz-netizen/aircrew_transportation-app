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

// Pass GraphQL endpoint to publicBooking function
// The GraphQL endpoint should be: https://{api-id}.appsync-api.{region}.amazonaws.com/graphql
// Try to get it from graphqlUrl property, or construct from apiId
const region = backend.data.resources.graphqlApi.region || 'us-east-1';
let graphqlEndpoint: string;

// Try graphqlUrl first (if available)
if ('graphqlUrl' in backend.data.resources.graphqlApi && backend.data.resources.graphqlApi.graphqlUrl) {
  graphqlEndpoint = backend.data.resources.graphqlApi.graphqlUrl as string;
} else if ('apiId' in backend.data.resources.graphqlApi && backend.data.resources.graphqlApi.apiId) {
  // Fallback: construct from API ID
  const apiId = backend.data.resources.graphqlApi.apiId as string;
  graphqlEndpoint = `https://${apiId}.appsync-api.${region}.amazonaws.com/graphql`;
} else {
  throw new Error('Could not determine GraphQL endpoint. Check backend.data.resources.graphqlApi properties.');
}

backend.publicBooking.addEnvironment('AMPLIFY_DATA_GRAPHQL_ENDPOINT', graphqlEndpoint);
backend.publicBooking.addEnvironment('AMPLIFY_DATA_REGION', region);

// Note: In Amplify Gen 2, functions defined in the backend automatically get
// IAM permissions to access the data resource. No additional configuration needed.

// Add Function URL for sendInvitationEmail
// Note: Function URLs need to be created manually in AWS Lambda Console
// or via AWS CLI/CDK. The URL will be available after first deployment.
// See EMAIL_FUNCTION_URL_SETUP.md for instructions.
