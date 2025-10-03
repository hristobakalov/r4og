import type { GraphQLResponse } from '../types/graphql.types'
import type { RestResponse } from '../types/api.types'

/**
 * Format GraphQL response to REST API response
 */
export function formatGraphQLResponse(
  graphqlResponse: GraphQLResponse,
  contentType: string,
  executionTime: number
): RestResponse {
  // If there's an error, let the error handler deal with it
  if (graphqlResponse.errors) {
    throw new Error(graphqlResponse.errors[0]?.message || 'GraphQL query failed')
  }

  // Extract the data for the content type
  const data = graphqlResponse.data?.[contentType]

  if (!data) {
    throw new Error(`No data returned for content type: ${contentType}`)
  }

  // Build REST response
  const response: RestResponse = {
    meta: {
      contentType,
      executionTime
    }
  }

  // Copy over all fields from GraphQL response
  if (data.items !== undefined) response.items = data.items
  if (data.item !== undefined) response.item = data.item
  if (data.total !== undefined) response.total = data.total
  if (data.cursor !== undefined) response.cursor = data.cursor
  if (data.facets !== undefined) response.facets = data.facets
  if (data.autocomplete !== undefined) response.autocomplete = data.autocomplete

  return response
}
