import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendSMS } from './functions/sendSMS/resource';

export const backend = defineBackend({
  auth,
  data,
  sendSMS,
});

// Grant the sendSMS function permission to publish SMS messages via SNS
backend.sendSMS.resources.lambda.addToRolePolicy({
  effect: 'Allow',
  actions: ['sns:Publish'],
  resources: ['*'], // SNS doesn't require specific resource ARNs for SMS
});
