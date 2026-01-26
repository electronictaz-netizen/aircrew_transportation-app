import { defineFunction } from '@aws-amplify/backend';

export const listBookingRequests = defineFunction({
  name: 'listBookingRequests',
  entry: './handler.ts',
  timeoutSeconds: 15,
});
