import type { GraphQLVariables } from '../types/graphql.types'
import { getFragments, buildInlineFragments } from './fragments'
import { buildFieldSelection } from './introspection'

/**
 * Build a GraphQL query string for a given content type
 * Supports fragment injection for polymorphic fields and auto field expansion
 */
export async function buildGraphQLQuery(
  contentType: string,
  variables: GraphQLVariables,
  requestedFields?: string[],
  fragmentNames?: string[],
  expand?: 'auto' | 'auto_with_fulltext' | 'full',
  depth: number = 0
): Promise<string> {
  // Build the variable definitions
  const varDefs: string[] = []
  const varNames: string[] = []

  if (variables.cursor !== undefined) {
    varDefs.push('$cursor: String')
    varNames.push('cursor: $cursor')
  }
  if (variables.ids !== undefined) {
    varDefs.push('$ids: [String]')
    varNames.push('ids: $ids')
  }
  if (variables.limit !== undefined) {
    varDefs.push('$limit: Int')
    varNames.push('limit: $limit')
  }
  if (variables.locale !== undefined) {
    varDefs.push('$locale: [Locales]')
    varNames.push('locale: $locale')
  }
  if (variables.orderBy !== undefined) {
    varDefs.push(`$orderBy: ${contentType}OrderByInput`)
    varNames.push('orderBy: $orderBy')
  }
  if (variables.skip !== undefined) {
    varDefs.push('$skip: Int')
    varNames.push('skip: $skip')
  }
  if (variables.track !== undefined) {
    varDefs.push('$track: String')
    varNames.push('track: $track')
  }
  if (variables.usePinned !== undefined) {
    varDefs.push('$usePinned: usePinnedInput')
    varNames.push('usePinned: $usePinned')
  }
  if (variables.variation !== undefined) {
    varDefs.push('$variation: VariationInput')
    varNames.push('variation: $variation')
  }
  if (variables.where !== undefined) {
    varDefs.push(`$where: ${contentType}WhereInput`)
    varNames.push('where: $where')
  }

  // Build the query
  const queryHeader = varDefs.length > 0
    ? `query ${contentType}Query(${varDefs.join(', ')})`
    : `query ${contentType}Query`

  const queryArgs = varNames.length > 0
    ? `(${varNames.join(', ')})`
    : ''

  // Build field selection
  let fieldsSelection: string

  if (requestedFields && requestedFields.length > 0) {
    // User specified fields
    fieldsSelection = requestedFields.join('\n        ')
  } else if (expand === 'auto' || expand === 'auto_with_fulltext' || expand === 'full') {
    // Auto-expand fields using introspection
    const autoFields = await buildFieldSelection(contentType, depth, new Set(), expand)

    // If fragments are also specified, combine them
    if (fragmentNames && fragmentNames.length > 0) {
      const inlineFragments = buildInlineFragments(fragmentNames)

      fieldsSelection = `
        items {
          ${autoFields.split('\n').join('\n          ')}
          ${inlineFragments}
        }
        total
        cursor
      `.trim()
    } else {
      fieldsSelection = `
        items {
          ${autoFields.split('\n').join('\n          ')}
        }
        total
        cursor
      `.trim()
    }
  } else {
    // Default fields with smart fragment injection
    if (fragmentNames && fragmentNames.length > 0) {
      const inlineFragments = buildInlineFragments(fragmentNames)

      fieldsSelection = `
        items {
          _id
          __typename
          ${inlineFragments}
        }
        item {
          _id
          __typename
          ${inlineFragments}
        }
        total
        cursor
      `.trim()
    } else {
      // Default minimal fields when no fragments specified
      fieldsSelection = `
        items {
          _id
          __typename
        }
        total
        cursor
      `.trim()
    }
  }

  // Get fragment definitions if needed
  const fragmentDefs = fragmentNames && fragmentNames.length > 0
    ? getFragments(fragmentNames).join('\n\n')
    : ''

  // Build final query
  const query = `
    ${fragmentDefs ? fragmentDefs + '\n\n' : ''}${queryHeader} {
      ${contentType}${queryArgs} {
        ${fieldsSelection}
      }
    }
  `.trim()

  return query
}
