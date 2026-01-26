import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Use Query on the GSI instead of Scan with filter
  // GSI name: gsi-Company.bookingRequests
  // Partition key: companyId
  return ddb.query({
    index: 'gsi-Company.bookingRequests',
    key: {
      companyId: companyId
    },
    limit: 100,
  });
}

export function response(ctx) {
  return ctx.result;
}
