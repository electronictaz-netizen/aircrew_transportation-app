import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Enhanced logging for debugging
  util.log('=== listBookingRequestsForCompany REQUEST ===');
  util.log('companyId (raw):', companyId);
  util.log('companyId (type):', typeof companyId);
  util.log('companyId (length):', companyId?.length);
  
  // Convert to DynamoDB format
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  util.log('companyId (DynamoDB format):', JSON.stringify(dynamoDbValue));
  
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
  // Enhanced logging for debugging
  util.log('=== listBookingRequestsForCompany RESPONSE ===');
  util.log('Scan result:', JSON.stringify({
    Count: ctx.result.Count,
    ScannedCount: ctx.result.ScannedCount,
    ItemsCount: ctx.result.Items?.length ?? 0,
  }));
  
  const items = ctx.result.Items || [];
  util.log(`Found ${items.length} booking requests for companyId: ${ctx.args.companyId}`);
  
  // Log first item's companyId for comparison (if any)
  if (items.length > 0 && items[0].companyId) {
    util.log('First item companyId:', JSON.stringify(items[0].companyId));
    util.log('First item companyId (unmarshalled):', util.dynamodb.fromDynamoDB(items[0].companyId));
  }
  
  // Return items - AppSync will automatically unmarshall if return type is a model
  return items;
}
