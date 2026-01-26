import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Query the GSI gsi-Company.bookingRequests using companyId as the partition key
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
