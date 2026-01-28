import { defineFunction } from '@aws-amplify/backend';

export const pushNotifications = defineFunction({
  name: 'pushNotifications',
  entry: './handler.ts',
});
