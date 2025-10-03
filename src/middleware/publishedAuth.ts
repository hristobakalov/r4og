import type { Context, Next } from 'hono'

/**
 * Published authentication middleware
 * Always uses public mode with SingleKey
 * Validates configuration and ignores any auth headers/params for security
 */
export async function publishedAuth(c: Context, next: Next) {
  const singleKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY
  const gateway = process.env.OPTIMIZELY_GRAPH_GATEWAY

  // Validate SingleKey is configured
  if (!singleKey || !gateway) {
    return c.json({
      error: 'Configuration Error',
      message: 'Published API requires OPTIMIZELY_GRAPH_SINGLE_KEY and OPTIMIZELY_GRAPH_GATEWAY to be configured',
      statusCode: 500
    }, 500)
  }

  // Always use public mode
  c.set('mode', 'public')
  c.set('previewToken', undefined)
  c.set('authMethod', 'single-key')

  // Security: Ignore any auth headers or preview tokens
  // Published content should never use preview authentication

  return next()
}
