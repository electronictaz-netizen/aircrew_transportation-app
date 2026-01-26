import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  
  // Scan the main table with filter
  // The GSI exists but Query syntax isn't working, so use Scan for now
  // Filter should match companyId attribute
  return {
    operation: 'Scan',
    filter: {
      expression: 'companyId = :cid',
      expressionValues: {
        ':cid': dynamoDbValue
      }
    },
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  return items;
}
