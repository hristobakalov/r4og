import { Hono } from 'hono'
import { parseQueryParams } from '../middleware/queryParser'
import { handleError } from '../middleware/errorHandler'
import { transformRestToGraphQL } from '../utils/queryTransformer'
import { formatGraphQLResponse } from '../utils/responseFormatter'
import { buildGraphQLQuery } from '../services/query.builder'
import { executeGraphQLQuery } from '../services/graphql.client'

const content = new Hono()

// Add deprecation warning to all legacy routes
content.use('*', async (c, next) => {
  console.warn('DEPRECATED: Legacy /api routes are deprecated. Use /api/published or /api/preview instead.')
  c.header('X-API-Deprecated', 'true')
  c.header('X-API-Deprecation-Message', 'Use /api/published or /api/preview routes instead')
  return next()
})

/**
 * GET /api/contentByPath (DEPRECATED)
 * Get content by URL path (for routing)
 * Queries _Content with url matching
 *
 * @deprecated Use /api/published/contentByPath or /api/preview/contentByPath instead
 */
content.get('/contentByPath', async (c) => {
  const startTime = Date.now()

  try {
    // Parse query parameters for preview mode support
    const restParams = parseQueryParams(c)

    // Get query parameters
    const url = c.req.query('url')
    const base = c.req.query('base') || ''

    if (!url) {
      return c.json({
        error: 'BadRequest',
        message: 'Missing required query parameter: url',
        statusCode: 400
      }, 400)
    }

    // Prepare URL variations (with and without trailing slash)
    const urlNoSlash = url.endsWith('/') ? url.slice(0, -1) : url
    const urlWithSlash = url.endsWith('/') ? url : `${url}/`

    // Build GraphQL query for path-based lookup
    const graphqlQuery = `
      query contentByPath($base: String, $url: String!, $urlNoSlash: String!) {
        _Content(
          where: {
            _metadata: { url: { base: { eq: $base } } }
            _and: [
              {
                _or: [
                  { _metadata: { url: { default: { eq: $url } } } }
                  { _metadata: { url: { default: { eq: $urlNoSlash } } } }
                  { _metadata: { url: { hierarchical: { eq: $url } } } }
                  { _metadata: { url: { hierarchical: { eq: $urlNoSlash } } } }
                ]
              }
            ]
          }
        ) {
          item {
            __typename
            _id
            _metadata {
              key
              version
              locale
              displayName
              types
              url {
                default
                hierarchical
                base
              }
            }
          }
        }
      }
    `.trim()

    const variables = {
      base,
      url: urlWithSlash,
      urlNoSlash
    }

    console.log('ContentByPath Query:', graphqlQuery)
    console.log('ContentByPath Variables:', JSON.stringify(variables, null, 2))

    // Execute GraphQL query with preview mode support
    const graphqlResponse = await executeGraphQLQuery(graphqlQuery, variables, {
      mode: restParams.mode,
      previewToken: restParams.previewToken,
      useStoredQueries: restParams.useStoredQueries
    })

    // Format response
    const executionTime = Date.now() - startTime
    const restResponse = formatGraphQLResponse(graphqlResponse, '_Content', executionTime)

    // Return 404 if no content found
    if (!restResponse.item) {
      return c.json({
        error: 'NotFound',
        message: `No content found for path: ${url}`,
        statusCode: 404
      }, 404)
    }

    return c.json(restResponse)
  } catch (error) {
    return handleError(error as Error, c)
  }
})

/**
 * GET /api/:contentType
 * Catch-all route for any content type
 * Dynamically queries GraphQL and returns results
 */
content.get('/:contentType', async (c) => {
  const startTime = Date.now()

  try {
    // Get content type from path (e.g., "ArticlePage", "Hero", etc.)
    const contentType = c.req.param('contentType')

    // Parse query parameters
    const restParams = parseQueryParams(c)

    // Transform to GraphQL variables
    const graphqlVariables = transformRestToGraphQL(restParams)

    // Build GraphQL query with fragment support and auto-expansion
    const graphqlQuery = await buildGraphQLQuery(
      contentType,
      graphqlVariables,
      restParams.fields,
      restParams.fragments,
      restParams.expand,
      restParams.depth || 0
    )

    console.log('GraphQL Query:', graphqlQuery)
    console.log('GraphQL Variables:', JSON.stringify(graphqlVariables, null, 2))

    // Execute GraphQL query with preview mode support
    const graphqlResponse = await executeGraphQLQuery(graphqlQuery, graphqlVariables, {
      mode: restParams.mode,
      previewToken: restParams.previewToken,
      useStoredQueries: restParams.useStoredQueries
    })

    // Format response
    const executionTime = Date.now() - startTime
    const restResponse = formatGraphQLResponse(graphqlResponse, contentType, executionTime)

    return c.json(restResponse)
  } catch (error) {
    return handleError(error as Error, c)
  }
})

/**
 * GET /api/:contentType/:id
 * Get a single item by ID
 */
content.get('/:contentType/:id', async (c) => {
  const startTime = Date.now()

  try {
    const contentType = c.req.param('contentType')
    const id = c.req.param('id')

    // Parse query parameters (for field selection, locale, etc.)
    const restParams = parseQueryParams(c)

    // Force IDs parameter to single ID
    restParams.ids = [id]

    // Transform to GraphQL variables
    const graphqlVariables = transformRestToGraphQL(restParams)

    // Build GraphQL query with fragment support and auto-expansion
    const graphqlQuery = await buildGraphQLQuery(
      contentType,
      graphqlVariables,
      restParams.fields,
      restParams.fragments,
      restParams.expand,
      restParams.depth || 0
    )

    console.log('GraphQL Query:', graphqlQuery)
    console.log('GraphQL Variables:', JSON.stringify(graphqlVariables, null, 2))

    // Execute GraphQL query with preview mode support
    const graphqlResponse = await executeGraphQLQuery(graphqlQuery, graphqlVariables, {
      mode: restParams.mode,
      previewToken: restParams.previewToken,
      useStoredQueries: restParams.useStoredQueries
    })

    // Format response
    const executionTime = Date.now() - startTime
    const restResponse = formatGraphQLResponse(graphqlResponse, contentType, executionTime)

    // For single item lookup, return 404 if no items found
    if (!restResponse.items || restResponse.items.length === 0) {
      return c.json({
        error: 'NotFound',
        message: `${contentType} with id '${id}' not found`,
        statusCode: 404
      }, 404)
    }

    // Return the single item
    return c.json({
      ...restResponse,
      item: restResponse.items[0]
    })
  } catch (error) {
    return handleError(error as Error, c)
  }
})

export default content
