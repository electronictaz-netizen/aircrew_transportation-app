import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // Use the transform utility to create the filter expression
  // This should properly format the DynamoDB filter
  const filter = util.transform.toDynamoDBFilterExpression({
    companyId: { eq: companyId }
  });
  
  return {
    operation: 'Scan',
    filter: JSON.parse(filter),
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  return items;
}
