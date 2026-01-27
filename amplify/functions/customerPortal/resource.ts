import { defineFunction } from '@aws-amplify/backend';

export const customerPortal = defineFunction({
  name: 'customerPortal',
  entry: './handler.ts',
});
