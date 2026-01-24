import { defineFunction } from '@aws-amplify/backend';

export const publicBooking = defineFunction({
  name: 'publicBooking',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
