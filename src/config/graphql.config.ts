/**
 * GraphQL Configuration
 * Supports both generic GraphQL endpoints and Optimizely Graph
 */

// Build Optimizely Graph endpoint if gateway is provided
function getGraphQLEndpoint(): string {
  const gateway = process.env.OPTIMIZELY_GRAPH_GATEWAY
  const singleKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY

  // If Optimizely Graph gateway is configured, use it
  if (gateway && singleKey) {
    return `${gateway}/content/v2?auth=${singleKey}`
  }

  // Fall back to generic GRAPHQL_ENDPOINT
  return process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
}

export const graphqlConfig = {
  endpoint: getGraphQLEndpoint(),
  timeout: 30000, // 30 seconds
}

// Helper to get headers (can include dynamic auth tokens)
export function getGraphQLHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Optimizely Graph authentication (app key or secret)
  if (process.env.OPTIMIZELY_GRAPH_APP_KEY) {
    headers['X-Graph-App-Key'] = process.env.OPTIMIZELY_GRAPH_APP_KEY
  }

  if (process.env.OPTIMIZELY_GRAPH_SECRET) {
    headers['X-Graph-Secret'] = process.env.OPTIMIZELY_GRAPH_SECRET
  }

  // Generic GraphQL API key (Bearer token)
  if (process.env.GRAPHQL_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.GRAPHQL_API_KEY}`
  }

  return headers
}
