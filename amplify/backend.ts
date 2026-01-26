import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { stripeCheckout } from './functions/stripeCheckout/resource';
import { stripePortal } from './functions/stripePortal/resource';
import { sendInvitationEmail } from './functions/sendInvitationEmail/resource';
import { publicBooking } from './functions/publicBooking/resource';
import { sendSms } from './functions/sendSms/resource';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
  stripeCheckout,
  stripePortal,
  sendInvitationEmail,
  publicBooking,
  sendSms,
});

// Pass GraphQL endpoint to publicBooking function. Use the L1 CfnGraphqlApi.attrGraphQlUrl
// so the Lambda always gets the URL of the AppSync API deployed in this stack (avoids
// ENOTFOUND when graphqlApi.apiId/graphqlUrl pointed at a different or deleted API).
const cfn = backend.data.resources.cfnResources;
const graphqlEndpoint = cfn.cfnGraphqlApi.attrGraphQlUrl;
const region = Stack.of(backend.data).region;

backend.publicBooking.addEnvironment('AMPLIFY_DATA_GRAPHQL_ENDPOINT', graphqlEndpoint);
backend.publicBooking.addEnvironment('AMPLIFY_DATA_REGION', region);

// DynamoDB fallback: when listCompanies (IAM) doesn't return a company, the Lambda can Scan the
// Company table by bookingEnabled and bookingCode. Pass table name and grant Scan.
// Optional chaining: resources.tables may be missing or use different keys in some Amplify versions.
try {
  const tables = (backend.data.resources as { tables?: Record<string, { tableName: string; grantReadData: (grantee: unknown) => void }> }).tables;
  const companyTable = tables?.['Company'] ?? tables?.['CompanyTable'];
  if (companyTable) {
    backend.publicBooking.addEnvironment('COMPANY_TABLE_NAME', companyTable.tableName);
    companyTable.grantReadData(backend.publicBooking.resources.lambda);
  }
} catch (_) {
  // Skip: COMPANY_TABLE_NAME not set; Lambda DynamoDB fallback will be disabled.
}

// Function URL for publicBooking: create and manage in Lambda Console (Configuration → Function URL).
// CDK addFunctionUrl caused "Properties validation failed" (publicBookinglambdaFunctionUrl65375A8A).
// Set the URL in Amplify env as VITE_BOOKING_API_URL. See PUBLIC_BOOKING_LAMBDA_SETUP.md.

// IAM: allow sendSms to use AWS End User Messaging (SendTextMessage)
backend.sendSms.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowSendSMS',
    effect: iam.Effect.ALLOW,
    actions: ['sms-voice:SendTextMessage'],
    resources: ['*'],
  })
);

// SMS: origination identity (pool ID, E.164 number, or ARN). Set SMS_ORIGINATION_IDENTITY in Amplify env or `export` before `ampx sandbox`.
backend.sendSms.addEnvironment('ORIGINATION_IDENTITY', process.env.SMS_ORIGINATION_IDENTITY || '');
backend.sendSms.addEnvironment('CONFIGURATION_SET_NAME', process.env.SMS_CONFIGURATION_SET_NAME || '');
backend.sendSms.addEnvironment('PROTECT_CONFIGURATION_ID', process.env.SMS_PROTECT_CONFIGURATION_ID || '');

// Note: In Amplify Gen 2, functions defined in the backend automatically get
// IAM permissions to access the data resource. No additional configuration needed.

// Add Function URL for sendInvitationEmail
// Note: Function URLs need to be created manually in AWS Lambda Console
// or via AWS CLI/CDK. The URL will be available after first deployment.
// See EMAIL_FUNCTION_URL_SETUP.md for instructions.
