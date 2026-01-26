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
  // Handle errors first
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  // If no result, return empty array
  if (!ctx.result) {
    return [];
  }
  
  // ddb.query() returns { items: [...], nextToken: ... }
  // The items property contains the array of results
  // Handle both possible property names for compatibility
  let items = null;
  if (ctx.result.items) {
    items = ctx.result.items;
  } else if (ctx.result.Items) {
    items = ctx.result.Items;
  } else if (Array.isArray(ctx.result)) {
    // If result is already an array, return it directly
    return ctx.result;
  }
  
  // Return items array or empty array if items is null/undefined
  if (items && Array.isArray(items)) {
    return items;
  }
  
  // Fallback: return empty array
  return [];
}
