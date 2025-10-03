import { Hono } from 'hono'
import { handleError } from '../middleware/errorHandler'
import { executeGraphQLQuery } from '../services/graphql.client'
import { formatGraphQLResponse } from '../utils/responseFormatter'

const graphql = new Hono()

/**
 * POST /graphql
 * Raw GraphQL passthrough endpoint for power users
 * Accepts raw GraphQL queries and variables
 */
graphql.post('/', async (c) => {
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await c.req.json()

    if (!body.query || typeof body.query !== 'string') {
      return c.json({
        error: 'BadRequest',
        message: 'Missing or invalid "query" field in request body',
        statusCode: 400
      }, 400)
    }

    const query = body.query
    const variables = body.variables || {}

    console.log('Raw GraphQL Query:', query)
    console.log('Raw GraphQL Variables:', JSON.stringify(variables, null, 2))

    // Execute GraphQL query
    const graphqlResponse = await executeGraphQLQuery(query, variables)

    // Check for errors
    if (graphqlResponse.errors) {
      return c.json({
        errors: graphqlResponse.errors,
        data: graphqlResponse.data || null
      }, 400)
    }

    // Return raw GraphQL response with execution time
    return c.json({
      data: graphqlResponse.data,
      meta: {
        executionTime: Date.now() - startTime
      }
    })
  } catch (error) {
    return handleError(error as Error, c)
  }
})

/**
 * GET /graphql
 * Info endpoint for GraphQL passthrough
 */
graphql.get('/', (c) => {
  return c.json({
    message: 'GraphQL Passthrough Endpoint',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        query: 'string (required) - GraphQL query',
        variables: 'object (optional) - GraphQL variables'
      },
      example: {
        query: 'query { ArticlePage(limit: 5) { items { _id Heading } } }',
        variables: {}
      }
    },
    docs: 'See README.md for more information'
  })
})

export default graphql
