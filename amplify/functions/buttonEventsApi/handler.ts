import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

interface ButtonEventItem {
  device_id: string;
  timestamp: number;
  btn: string;
  action: string;
  owner: string;
  ts: number;
}

interface GraphQLResponse {
  data?: {
    listButtonEvents?: {
      items: ButtonEventItem[];
      nextToken?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

function floorToMinute(ts: number): number {
  return Math.floor(ts / 60000) * 60000;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  console.log('API_ENDPOINT:', GRAPHQL_ENDPOINT);
  
  const qs = event.queryStringParameters || {};
  
  // If no time range specified, default to last 30 days
  const defaultStartMs = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  
  // Timestamps in DB are stored in MILLISECONDS (despite a.timestamp() schema)
  // Grafana also sends timestamps in milliseconds - so no conversion needed
  const startTs = qs.start ? Number(qs.start) : defaultStartMs;
  const endTs = qs.end ? Number(qs.end) : Date.now();
  const deviceId = qs.device_id;

  console.log('Query params - startTs (ms):', startTs, 'endTs (ms):', endTs, 'deviceId:', deviceId);

  // Query without filter first to get all items, then filter client-side
  // This is more reliable with composite keys
  const query = `
    query ListButtonEvents($nextToken: String, $limit: Int) {
      listButtonEvents(nextToken: $nextToken, limit: $limit) {
        items {
          device_id
          timestamp
          btn
          action
          owner
          ts
        }
        nextToken
      }
    }
  `;

  const items: ButtonEventItem[] = [];
  let nextToken: string | undefined;

  try {
    do {
      console.log('Fetching with nextToken:', nextToken);
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': GRAPHQL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            nextToken,
            limit: 1000
          }
        })
      });

      const result = await response.json() as GraphQLResponse;
      console.log('GraphQL response:', JSON.stringify(result));
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return { 
          statusCode: 500, 
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'GraphQL error', details: result.errors }) 
        };
      }

      if (result.data?.listButtonEvents?.items) {
        items.push(...result.data.listButtonEvents.items);
      }
      nextToken = result.data?.listButtonEvents?.nextToken;
    } while (nextToken);
  } catch (err) {
    console.error('Fetch error', err);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'fetch error', message: String(err) }) 
    };
  }

  console.log('Total items fetched:', items.length);
  
  // Debug: show first few items to understand the data format
  if (items.length > 0) {
    console.log('Sample items (first 3):', JSON.stringify(items.slice(0, 3)));
    console.log('Timestamp range check - startTs:', startTs, 'endTs:', endTs);
    console.log('First item timestamp:', items[0].timestamp, 'type:', typeof items[0].timestamp);
  }

  // Filter by timestamp range (timestamp is in MILLISECONDS in DB)
  const filteredItems = items.filter(it => {
    const ts = it.timestamp;
    const inRange = ts >= startTs && ts <= endTs;
    const matchesDevice = !deviceId || it.device_id === deviceId;
    return inRange && matchesDevice;
  });

  console.log('Filtered items:', filteredItems.length);

  const leftMap: Record<number, number> = Object.create(null);
  const rightMap: Record<number, number> = Object.create(null);

  for (const it of filteredItems) {
    // Timestamp is already in milliseconds
    const minute = floorToMinute(it.timestamp);
    const btn = (it.btn || '').toUpperCase();
    if (btn === 'LEFT') leftMap[minute] = (leftMap[minute] || 0) + 1;
    if (btn === 'RIGHT') rightMap[minute] = (rightMap[minute] || 0) + 1;
  }

  const toDatapoints = (map: Record<number, number>): [number, number][] =>
    Object.keys(map)
      .map((k): [number, number] => [map[Number(k)], Number(k)])
      .sort((a, b) => a[1] - b[1]);

  const resp = [
    { target: 'left_presses', datapoints: toDatapoints(leftMap) },
    { target: 'right_presses', datapoints: toDatapoints(rightMap) }
  ];

  console.log('Response:', JSON.stringify(resp));

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(resp)
  };
};