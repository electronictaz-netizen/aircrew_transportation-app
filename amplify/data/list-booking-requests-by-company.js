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
  const items = ctx.result.Items || [];
  return items;
}
