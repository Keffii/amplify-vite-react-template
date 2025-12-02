import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const dynamo = DynamoDBDocumentClient.from(client);

function floorToMinute(ts: number): number {
  return Math.floor(ts / 60000) * 60000;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters || {};
  const start = qs.start ? Number(qs.start) : Date.now() - 60 * 60 * 1000;
  const end = qs.end ? Number(qs.end) : Date.now();
  const deviceId = qs.device_id;

  const TableName = process.env.BUTTON_EVENTS_TABLE || 'ButtonEvents';

  const params = {
    TableName,
    FilterExpression: '#ts BETWEEN :start AND :end',
    ExpressionAttributeNames: { '#ts': 'timestamp' },
    ExpressionAttributeValues: { ':start': start, ':end': end }
  };

  if (deviceId) {
    params.FilterExpression = '#device = :device AND #ts BETWEEN :start AND :end';
    params.ExpressionAttributeNames['#device'] = 'device_id';
    params.ExpressionAttributeValues[':device'] = deviceId;
  }

  let items = [];
  try {
    let lastEvaluatedKey;
    do {
      if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
      const data = await dynamo.send(new ScanCommand(params));
      items = items.concat(data.Items || []);
      lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  } catch (err) {
    console.error('Scan error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'dynamo error' }) };
  }

  const leftMap = Object.create(null);
  const rightMap = Object.create(null);

  for (const it of items) {
    const tsMs = typeof it.timestamp === 'number' ? it.timestamp : Date.parse(it.timestamp);
    const minute = floorToMinute(tsMs);
    const btn = (it.btn || '').toUpperCase();
    if (btn === 'LEFT') leftMap[minute] = (leftMap[minute] || 0) + 1;
    if (btn === 'RIGHT') rightMap[minute] = (rightMap[minute] || 0) + 1;
  }

  const toDatapoints = (map) =>
    Object.keys(map)
      .map((k) => [map[k], Number(k)])
      .sort((a, b) => a[1] - b[1]);

  const resp = [
    { target: 'left_presses', datapoints: toDatapoints(leftMap) },
    { target: 'right_presses', datapoints: toDatapoints(rightMap) }
  ];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resp)
  };
};
