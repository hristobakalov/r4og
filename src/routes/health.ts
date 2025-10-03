import { Hono } from 'hono'
import { graphqlConfig } from '../config/graphql.config'
import { executeGraphQLQuery } from '../services/graphql.client'

const health = new Hono()

/**
 * GET /health
 * Health check endpoint
 */
health.get('/', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'REST API Wrapper',
    graphql: {
      endpoint: graphqlConfig.endpoint
    }
  })
})

/**
 * GET /health/test
 * Test GraphQL connection
 */
health.get('/test', async (c) => {
  try {
    const testQuery = `{ __schema { queryType { name } } }`
    const response = await executeGraphQLQuery(testQuery, {})

    return c.json({
      status: 'GraphQL connection successful',
      endpoint: graphqlConfig.endpoint,
      response: response.data
    })
  } catch (error: any) {
    return c.json({
      status: 'GraphQL connection failed',
      endpoint: graphqlConfig.endpoint,
      error: error.message,
      stack: error.stack,
      cause: error.cause
    }, 503)
  }
})

export default health
