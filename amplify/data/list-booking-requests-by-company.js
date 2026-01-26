import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const companyId = ctx.args.companyId;
  
  // First, let's test if Scan works at all - scan without filter to get all items
  // This will help us debug if the resolver is working
  // We'll filter in the response function for now
  return {
    operation: 'Scan',
    limit: 100,
  };
}

export function response(ctx) {
  const items = ctx.result.Items || [];
  const companyId = ctx.args.companyId;
  
  // Filter items by companyId in JavaScript
  // This will help us verify if the data is being returned
  const filtered = items.filter(item => {
    const itemCompanyId = util.dynamodb.fromDynamoDB(item.companyId);
    return itemCompanyId === companyId;
  });
  
  return filtered;
}
