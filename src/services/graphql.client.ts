import { GraphQLClient } from 'graphql-request'
import { graphqlConfig, getGraphQLHeaders } from '../config/graphql.config'
import type { GraphQLVariables, GraphQLResponse } from '../types/graphql.types'

export interface GraphQLRequestOptions {
  mode?: 'edit' | 'ext_preview' | 'public'
  previewToken?: string
  useStoredQueries?: boolean
}

/**
 * Get GraphQL client with preview mode support
 */
function getClient(options: GraphQLRequestOptions = {}): GraphQLClient {
  const { mode = 'public', previewToken, useStoredQueries = false } = options

  const gateway = process.env.OPTIMIZELY_GRAPH_GATEWAY
  const singleKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY
  const appKey = process.env.OPTIMIZELY_GRAPH_APP_KEY
  const secret = process.env.OPTIMIZELY_GRAPH_SECRET
  const externalPreviewEnabled = process.env.EXTERNAL_PREVIEW_ENABLED === 'true'

  // Build endpoint based on mode
  let endpoint = graphqlConfig.endpoint
  let headers: Record<string, string> = { ...getGraphQLHeaders() }

  // Handle Optimizely Graph preview modes
  if (gateway) {
    // Edit mode - use preview token (from CMS editor)
    if (mode === 'edit' && previewToken) {
      endpoint = `${gateway}/content/v2${useStoredQueries ? '?stored=true' : ''}`
      headers = {
        'Authorization': `Bearer ${previewToken}`,
        'Content-Type': 'application/json',
        ...(useStoredQueries && { 'cg-stored-query': 'template' })
      }
    }
    // External preview mode - use basic auth with app key + secret
    else if (mode === 'ext_preview' && externalPreviewEnabled && appKey && secret) {
      const extPreviewToken = Buffer.from(`${appKey}:${secret}`).toString('base64')
      endpoint = `${gateway}/content/v2${useStoredQueries ? '?stored=true' : ''}`
      headers = {
        'Authorization': `Basic ${extPreviewToken}`,
        'Content-Type': 'application/json',
        ...(useStoredQueries && { 'cg-stored-query': 'template' })
      }
    }
    // Public mode - use single key
    else if (singleKey) {
      endpoint = `${gateway}/content/v2?auth=${singleKey}`
      headers = {
        'Content-Type': 'application/json'
      }
    }
  }

  return new GraphQLClient(endpoint, {
    headers,
    timeout: graphqlConfig.timeout
  })
}

/**
 * Execute a GraphQL query with optional preview mode support
 * @param query - GraphQL query string
 * @param variables - GraphQL variables
 * @param options - Request options (mode, preview token, etc.)
 * @returns GraphQL response with data or errors
 */
export async function executeGraphQLQuery(
  query: string,
  variables: GraphQLVariables,
  options: GraphQLRequestOptions = {}
): Promise<GraphQLResponse> {
  const startTime = Date.now()

  try {
    const client = getClient(options)
    const response = await client.rawRequest(query, variables)

    return {
      data: response.data,
    }
  } catch (error: any) {
    // GraphQL errors come back in the response
    if (error.response?.errors) {
      console.error('GraphQL errors:', error.response.errors)
      return {
        errors: error.response.errors,
        data: error.response.data || null
      }
    }

    // Network or other errors
    const errorMessage = `GraphQL request failed: ${error.message}`
    console.error(errorMessage)
    console.error('Error details:', error)
    console.error('Query:', query)
    console.error('Variables:', variables)
    throw new Error(errorMessage)
  } finally {
    const executionTime = Date.now() - startTime
    const modeInfo = options.mode ? ` [${options.mode} mode]` : ''
    console.log(`GraphQL query executed in ${executionTime}ms${modeInfo}`)
  }
}
