import type { Context, Next } from 'hono'

/**
 * Preview authentication middleware
 * Detects authentication method and sets preview mode
 *
 * Priority:
 * 1. Authorization: Bearer <token> → edit mode
 * 2. Authorization: Basic <base64> → ext_preview mode
 * 3. ?previewToken=<token> query param → edit mode
 * 4. Default → ext_preview mode (if EXTERNAL_PREVIEW_ENABLED)
 *
 * Rejects requests without valid authentication
 */
export async function previewAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const previewTokenParam = c.req.query('previewToken') || c.req.query('preview_token')
  const externalPreviewEnabled = process.env.EXTERNAL_PREVIEW_ENABLED === 'true'
  const appKey = process.env.OPTIMIZELY_GRAPH_APP_KEY
  const secret = process.env.OPTIMIZELY_GRAPH_SECRET

  // Priority 1: Bearer token (from CMS editor)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    c.set('mode', 'edit')
    c.set('previewToken', token)
    c.set('authMethod', 'bearer-token')
    return next()
  }

  // Priority 2: Query param preview token
  if (previewTokenParam) {
    c.set('mode', 'edit')
    c.set('previewToken', previewTokenParam)
    c.set('authMethod', 'query-param-token')
    return next()
  }

  // Priority 3: Basic auth (external preview)
  if (authHeader?.startsWith('Basic ')) {
    if (externalPreviewEnabled && appKey && secret) {
      c.set('mode', 'ext_preview')
      c.set('previewToken', undefined)
      c.set('authMethod', 'basic-auth')
      return next()
    } else {
      return c.json({
        error: 'Unauthorized',
        message: 'External preview is not enabled or not configured',
        statusCode: 401
      }, 401)
    }
  }

  // Priority 4: Default to ext_preview (if enabled and configured)
  if (externalPreviewEnabled && appKey && secret) {
    c.set('mode', 'ext_preview')
    c.set('previewToken', undefined)
    c.set('authMethod', 'ext-preview-default')
    return next()
  }

  // No valid authentication found
  return c.json({
    error: 'Unauthorized',
    message: 'Preview access requires authentication. Provide Authorization header or previewToken parameter.',
    statusCode: 401,
    details: {
      supportedMethods: [
        'Authorization: Bearer <token> (from CMS editor)',
        'Authorization: Basic <base64> (external preview)',
        '?previewToken=<token> (query parameter)'
      ]
    }
  }, 401)
}
