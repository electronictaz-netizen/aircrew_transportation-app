import { defineFunction } from '@aws-amplify/backend';

export const publicBooking = defineFunction({
  name: 'publicBooking',
  entry: './handler.ts',
  timeoutSeconds: 30,
  // Data access: allow.resource(publicBooking) on Company and BookingRequest in the data schema
  // grants this function explicit read (query) and create (mutate) so listCompanies returns
  // all booking-enabled companies (Cognito and IAM were seeing different subsets).
});
