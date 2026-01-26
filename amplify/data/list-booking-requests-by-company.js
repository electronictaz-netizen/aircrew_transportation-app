import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Enhanced logging for debugging
  util.log('=== listBookingRequestsForCompany REQUEST ===');
  util.log('companyId (raw):', companyId);
  util.log('companyId (type):', typeof companyId);
  util.log('companyId (length):', companyId && companyId.length);
  
  // Convert to DynamoDB format
  const dynamoDbValue = util.dynamodb.toDynamoDB(companyId);
  util.log('companyId (DynamoDB format):', dynamoDbValue);
  
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
  const itemsCount = (ctx.result.Items && ctx.result.Items.length) || 0;
  util.log('Scan result Count:', ctx.result.Count);
  util.log('Scan result ScannedCount:', ctx.result.ScannedCount);
  util.log('Scan result ItemsCount:', itemsCount);
  
  const items = ctx.result.Items || [];
  util.log('Found booking requests:', items.length, 'for companyId:', ctx.args.companyId);
  
  // Log first item's companyId for comparison (if any)
  if (items.length > 0 && items[0].companyId) {
    util.log('First item companyId:', items[0].companyId);
    util.log('First item companyId (unmarshalled):', util.dynamodb.fromDynamoDB(items[0].companyId));
  }
  
  // Return items - AppSync will automatically unmarshall if return type is a model
  return items;
}
