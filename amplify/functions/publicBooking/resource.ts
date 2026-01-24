import { defineFunction } from '@aws-amplify/backend';
import { data } from '../../data/resource';

export const publicBooking = defineFunction({
  name: 'publicBooking',
  entry: './handler.ts',
  timeoutSeconds: 30,
  // Grant access to the data API
  // The function will automatically have IAM permissions to access the data resource
});
