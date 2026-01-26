import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'companyId = :cid',
      expressionValues: { ':cid': util.dynamodb.toDynamoDB(ctx.args.companyId) },
    },
    limit: 100,
  };
}

export function response(ctx) {
  return ctx.result.Items || [];
}
