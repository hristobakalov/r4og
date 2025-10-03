import type { RestQueryParams } from '../types/api.types'
import type { GraphQLVariables } from '../types/graphql.types'

/**
 * Transform REST query parameters to GraphQL variables
 * Passes through most parameters directly to GraphQL
 */
export function transformRestToGraphQL(params: RestQueryParams): GraphQLVariables {
  const variables: GraphQLVariables = {}

  // Pagination
  if (params.limit !== undefined) variables.limit = params.limit
  if (params.skip !== undefined) variables.skip = params.skip
  if (params.cursor) variables.cursor = params.cursor

  // Direct ID lookup
  if (params.ids && params.ids.length > 0) {
    variables.ids = params.ids
  }

  // Filtering - pass through as-is
  if (params.where) {
    variables.where = params.where
  }

  // Sorting - pass through as-is
  if (params.orderBy) {
    variables.orderBy = params.orderBy
  }

  // Localization
  if (params.locale && params.locale.length > 0) {
    variables.locale = params.locale
  }

  // Other params
  if (params.track) variables.track = params.track
  if (params.usePinned !== undefined) variables.usePinned = params.usePinned
  if (params.variation) variables.variation = params.variation

  return variables
}
