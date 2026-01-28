import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { stripeCheckout } from './functions/stripeCheckout/resource';
import { stripePortal } from './functions/stripePortal/resource';
import { sendInvitationEmail } from './functions/sendInvitationEmail/resource';
import { sendBookingEmail } from './functions/sendBookingEmail/resource';
import { publicBooking } from './functions/publicBooking/resource';
import { sendSms } from './functions/sendSms/resource';
import { sendTelnyxSms } from './functions/sendTelnyxSms/resource';
import { telnyxWebhook } from './functions/telnyxWebhook/resource';
import { customerPortal } from './functions/customerPortal/resource';
import { pushNotifications } from './functions/pushNotifications/resource';
import { getTripEta } from './functions/getTripEta/resource';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
  stripeCheckout,
  stripePortal,
  sendInvitationEmail,
  sendBookingEmail,
  publicBooking,
  sendSms,
  sendTelnyxSms,
  telnyxWebhook,
  customerPortal,
  pushNotifications,
  getTripEta,
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
  const tables = (backend.data.resources as { tables?: Record<string, { tableName: string; grantReadData: (grantee: unknown) => void; grantWriteData: (grantee: unknown) => void }> }).tables;
  const companyTable = tables?.['Company'] ?? tables?.['CompanyTable'];
  const bookingRequestTable = tables?.['BookingRequest'] ?? tables?.['BookingRequestTable'];
  
  if (companyTable) {
    backend.publicBooking.addEnvironment('COMPANY_TABLE_NAME', companyTable.tableName);
    companyTable.grantReadData(backend.publicBooking.resources.lambda);
  }
  
  // Grant write access to BookingRequest table for creating booking requests
  if (bookingRequestTable) {
    bookingRequestTable.grantWriteData(backend.publicBooking.resources.lambda);
  }
} catch (_) {
  // Skip: COMPANY_TABLE_NAME not set; Lambda DynamoDB fallback will be disabled.
}

// Explicit IAM permissions for publicBooking Lambda
// Amplify Gen 2 should grant these automatically, but we add them explicitly to ensure they exist
backend.publicBooking.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowAppSyncGraphQL',
    effect: iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${cfn.cfnGraphqlApi.attrArn}/*`],
  })
);

// Additional DynamoDB permissions for fallback mechanism and booking request creation
// These complement the grantReadData/grantWriteData calls above
const stack = Stack.of(backend.data);
backend.publicBooking.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowDynamoDBOperations',
    effect: iam.Effect.ALLOW,
    actions: [
      'dynamodb:Scan',      // For scanning Company table when AppSync query fails
      'dynamodb:Query',     // For querying DynamoDB tables
      'dynamodb:GetItem',   // For reading items from DynamoDB
      'dynamodb:PutItem',   // For creating booking requests
    ],
    resources: [
      // Company table (for fallback lookup) - use pattern matching for table name
      `arn:aws:dynamodb:${stack.region}:${stack.account}:table/Company-*`,
      // BookingRequest table (for creating bookings)
      `arn:aws:dynamodb:${stack.region}:${stack.account}:table/BookingRequest-*`,
    ],
  })
);

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

// Telnyx SMS: Set environment variables in Amplify Console → App Settings → Environment Variables
// TELNYX_API_KEY, TELNYX_MESSAGING_PROFILE_ID, TELNYX_PHONE_NUMBER
backend.sendTelnyxSms.addEnvironment('TELNYX_API_KEY', process.env.TELNYX_API_KEY || '');
backend.sendTelnyxSms.addEnvironment('TELNYX_MESSAGING_PROFILE_ID', process.env.TELNYX_MESSAGING_PROFILE_ID || '');
backend.sendTelnyxSms.addEnvironment('TELNYX_PHONE_NUMBER', process.env.TELNYX_PHONE_NUMBER || '');

// Pass sendTelnyxSms Function URL to publicBooking and telnyxWebhook for SMS sending
// Note: This will be set after Function URL is created - set TELNYX_SMS_FUNCTION_URL in Amplify env
// For now, we'll use a placeholder that can be updated after deployment
backend.publicBooking.addEnvironment('TELNYX_SMS_FUNCTION_URL', process.env.TELNYX_SMS_FUNCTION_URL || '');
backend.telnyxWebhook.addEnvironment('TELNYX_SMS_FUNCTION_URL', process.env.TELNYX_SMS_FUNCTION_URL || '');

// Telnyx Webhook: Optional webhook secret for signature verification
backend.telnyxWebhook.addEnvironment('TELNYX_WEBHOOK_SECRET', process.env.TELNYX_WEBHOOK_SECRET || '');
// Pass GraphQL endpoint to telnyxWebhook for database access
backend.telnyxWebhook.addEnvironment('AMPLIFY_DATA_GRAPHQL_ENDPOINT', graphqlEndpoint);
backend.telnyxWebhook.addEnvironment('AMPLIFY_DATA_REGION', region);
// Grant AppSync permissions to telnyxWebhook
backend.telnyxWebhook.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowAppSyncGraphQL',
    effect: iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${cfn.cfnGraphqlApi.attrArn}/*`],
  })
);

// Customer Portal: Pass GraphQL endpoint and region
backend.customerPortal.addEnvironment('AMPLIFY_DATA_GRAPHQL_ENDPOINT', graphqlEndpoint);
backend.customerPortal.addEnvironment('AMPLIFY_DATA_REGION', region);

// Pass Function URLs for email and SMS sending (set after Function URLs are created)
// Set SEND_BOOKING_EMAIL_FUNCTION_URL and SEND_TELNYX_SMS_FUNCTION_URL in Amplify env
backend.customerPortal.addEnvironment('SEND_BOOKING_EMAIL_FUNCTION_URL', process.env.SEND_BOOKING_EMAIL_FUNCTION_URL || '');
backend.customerPortal.addEnvironment('SEND_TELNYX_SMS_FUNCTION_URL', process.env.SEND_TELNYX_SMS_FUNCTION_URL || '');
backend.customerPortal.addEnvironment('SEND_SMS_FUNCTION_URL', process.env.SEND_SMS_FUNCTION_URL || ''); // Fallback to AWS SMS
backend.customerPortal.addEnvironment('PORTAL_BASE_URL', process.env.PORTAL_BASE_URL || 'https://onyxdispatch.us/portal');

// Grant AppSync permissions to customerPortal
backend.customerPortal.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowAppSyncGraphQL',
    effect: iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${cfn.cfnGraphqlApi.attrArn}/*`],
  })
);

// Push Notifications: Pass GraphQL endpoint and region
backend.pushNotifications.addEnvironment('AMPLIFY_DATA_GRAPHQL_ENDPOINT', graphqlEndpoint);
backend.pushNotifications.addEnvironment('AMPLIFY_DATA_REGION', region);

// Grant AppSync permissions to pushNotifications
backend.pushNotifications.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: 'AllowAppSyncGraphQL',
    effect: iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${cfn.cfnGraphqlApi.attrArn}/*`],
  })
);

// VAPID keys for push notifications
backend.pushNotifications.addEnvironment('VAPID_PUBLIC_KEY', process.env.VAPID_PUBLIC_KEY || '');
backend.pushNotifications.addEnvironment('VAPID_PRIVATE_KEY', process.env.VAPID_PRIVATE_KEY || '');
backend.pushNotifications.addEnvironment('VAPID_EMAIL', process.env.VAPID_EMAIL || 'noreply@onyxdispatch.us');

// VehicleLocation data retention: enable DynamoDB TTL so items expire after 60 days
// CDK assembly transform fails on complex type assertions; use any for TTL access
const dataResources = backend.data.resources as any;
const amplifyTables = dataResources.cfnResources?.amplifyDynamoDbTables;
if (amplifyTables?.['VehicleLocation']) {
  amplifyTables['VehicleLocation'].timeToLiveAttribute = { attributeName: 'ttl', enabled: true };
}

// Add Function URL for sendInvitationEmail
// Note: Function URLs need to be created manually in AWS Lambda Console
// or via AWS CLI/CDK. The URL will be available after first deployment.
// See EMAIL_FUNCTION_URL_SETUP.md for instructions.
