import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters || {};
  const limit = qs.limit ? Number(qs.limit) : 10;
  const TableName = process.env.HIGHSCORE_TABLE || 'HighScore';

  try {
    let items = [];
    let lastEvaluatedKey;
    const params = { TableName };
    do {
      if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
      const data = await dynamo.send(new ScanCommand(params));
      items = items.concat(data.Items || []);
      lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    items.sort((a, b) => (b.score || 0) - (a.score || 0));
    const top = items.slice(0, limit);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: top })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'dynamo error' }) };
  }
};
