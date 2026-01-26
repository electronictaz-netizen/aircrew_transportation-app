import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Use Query on the GSI instead of Scan with filter
  // GSI name: gsi-Company.bookingRequests
  // Partition key: companyId
  // For Query operations, use the key value directly
  return {
    operation: 'Query',
    index: 'gsi-Company.bookingRequests',
    key: {
      companyId: util.dynamodb.toDynamoDB(companyId)
    },
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  return items;
}
