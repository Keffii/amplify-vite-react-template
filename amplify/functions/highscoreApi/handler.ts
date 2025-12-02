import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;

interface HighScoreItem {
  username: string;
  score: number;
  timestamp: number;
  owner?: string;
}

interface GraphQLResponse {
  data?: {
    listHighScores?: {
      items: HighScoreItem[];
      nextToken?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters || {};
  // Default to top 5 unique owners for leaderboard use
  const limit = qs.limit ? Number(qs.limit) : 5;

  const query = `
    query ListHighScores($nextToken: String) {
      listHighScores(nextToken: $nextToken, limit: 1000) {
        items {
          username
          score
          timestamp
          owner
        }
        nextToken
      }
    }
  `;

  const items: HighScoreItem[] = [];
  let nextToken: string | undefined;

  try {
    do {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': GRAPHQL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { nextToken }
        })
      });

      const result = await response.json() as GraphQLResponse;
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return { statusCode: 500, body: JSON.stringify({ error: 'GraphQL error', details: result.errors }) };
      }

      if (result.data?.listHighScores?.items) {
        items.push(...result.data.listHighScores.items);
      }
      nextToken = result.data?.listHighScores?.nextToken;
    } while (nextToken);
  } catch (err) {
    console.error('Fetch error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'fetch error' }) };
  }

  // Deduplicate by owner (fallback to username) so each owner has only one entry.
  // Keep the highest score per owner; on tie keep the newest timestamp.
  const byOwner = new Map<string, HighScoreItem>();
  for (const it of items) {
    if (!it) continue;
    const key = it.owner ?? it.username;
    if (!key) continue;
    const existing = byOwner.get(key);
    if (!existing) {
      byOwner.set(key, it);
      continue;
    }

    // Replace if this item has a higher score, or same score but newer timestamp
    if ((it.score || 0) > (existing.score || 0) || ((it.score || 0) === (existing.score || 0) && (it.timestamp || 0) > (existing.timestamp || 0))) {
      byOwner.set(key, it);
    }
  }

  const unique = Array.from(byOwner.values());
  unique.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.timestamp || 0) - (a.timestamp || 0));
  const top = unique.slice(0, limit);

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ scores: top })
  };
};
