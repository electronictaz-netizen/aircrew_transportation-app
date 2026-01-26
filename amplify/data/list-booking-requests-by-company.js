import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  
  // Try Query on GSI with the simplest possible syntax
  // GSI: gsi-Company.bookingRequests
  // Partition key: companyId
  // Based on AppSync resolver docs, Query should use keyConditionExpression
  return {
    operation: 'Query',
    index: 'gsi-Company.bookingRequests',
    keyConditionExpression: 'companyId = :cid',
    expressionAttributeValues: {
      ':cid': dynamoDbValue
    },
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  return items;
}
