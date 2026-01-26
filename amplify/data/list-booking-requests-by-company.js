import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  
  return {
    operation: 'Scan',
    filter: {
      expression: 'companyId = :cid',
      expressionValues: { 
        ':cid': dynamoDbValue
      },
    },
    limit: 100,
  };
}

export function response(ctx) {
  const scannedCount = ctx.result.ScannedCount || 0;
  const count = ctx.result.Count || 0;
  const items = ctx.result.Items || [];
  
  // Log using string concatenation (AppSync might not support multiple arguments)
  util.log('Scan result - Scanned: ' + scannedCount + ' Matched: ' + count + ' Returned: ' + items.length);
  
  return items;
}
