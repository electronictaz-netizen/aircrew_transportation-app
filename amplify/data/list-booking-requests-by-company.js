import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Convert to DynamoDB format
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
  const items = ctx.result.Items || [];
  
  // Return items - AppSync will automatically unmarshall if return type is a model
  return items;
}
