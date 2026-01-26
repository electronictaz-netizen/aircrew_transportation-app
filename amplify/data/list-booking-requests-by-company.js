import * as ddb from '@aws-appsync/utils/dynamodb';
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Query the GSI gsi-Company.bookingRequests using companyId as the partition key
  return ddb.query({
    query: {
      companyId: { eq: companyId }
    },
    index: 'gsi-Company.bookingRequests',
    limit: 100,
  });
}

export function response(ctx) {
  // ddb.query() returns { items: [...], nextToken: ... }
  // Extract the items array to match the GraphQL schema which expects an array
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items || [];
}
