/**
 * listBookingRequests Lambda – used by custom query listBookingRequestsByCompany.
 * Scans the BookingRequest DynamoDB table filtered by companyId and returns items.
 * Invoked by AppSync with event.arguments.companyId.
 */

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const tableName = process.env.BOOKING_REQUEST_TABLE_NAME;
const region = process.env.AWS_REGION || 'us-east-1';

export const handler = async (event: { arguments?: { companyId?: string } }): Promise<unknown[]> => {
  const companyId = event.arguments?.companyId;
  if (!companyId) {
    throw new Error('companyId is required');
  }
  if (!tableName) {
    throw new Error('BOOKING_REQUEST_TABLE_NAME is not set');
  }

  const ddb = new DynamoDBClient({ region });
  const collected: unknown[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'companyId = :cid',
        ExpressionAttributeValues: { ':cid': { S: companyId } },
        ExclusiveStartKey: lastKey as Record<string, never> | undefined,
      })
    );
    const items = (res.Items || []).map((it) => unmarshall(it) as unknown);
    collected.push(...items);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return collected;
};
