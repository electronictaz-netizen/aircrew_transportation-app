import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  
  // Use Query on the GSI instead of Scan with filter
  // GSI name: gsi-Company.bookingRequests
  // Partition key: companyId
  return {
    operation: 'Query',
    index: 'gsi-Company.bookingRequests',
    keyConditionExpression: 'companyId = :cid',
    expressionValues: {
      ':cid': dynamoDbValue
    },
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  return items;
}
