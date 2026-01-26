import { defineFunction } from '@aws-amplify/backend';

export const publicBooking = defineFunction({
  name: 'publicBooking',
  entry: './handler.ts',
  timeoutSeconds: 30,
  // Uses IAM-signed AppSync (listCompanies, createBookingRequest). When listCompanies omits
  // a company, getCompanyByCode falls back to DynamoDB Scan on Company (COMPANY_TABLE_NAME).
});
