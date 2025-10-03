import type { Context } from 'hono'
import type { ErrorResponse } from '../types/api.types'

/**
 * Global error handler middleware
 * Maps various error types to appropriate HTTP status codes
 */
export function handleError(error: Error, c: Context): Response {
  console.error('Error:', error)

  let statusCode = 500
  let errorType = 'InternalServerError'
  let message = error.message || 'An unexpected error occurred'

  // Parse GraphQL-like errors
  if (message.includes('Cannot query field')) {
    statusCode = 400
    errorType = 'InvalidContentType'
  } else if (message.includes('Variable')) {
    statusCode = 400
    errorType = 'InvalidVariable'
  } else if (message.includes('No data returned')) {
    statusCode = 404
    errorType = 'NotFound'
  } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    statusCode = 504
    errorType = 'GatewayTimeout'
  } else if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
    statusCode = 503
    errorType = 'ServiceUnavailable'
  }

  const errorResponse: ErrorResponse = {
    error: errorType,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        stack: error.stack
      }
    })
  }

  return c.json(errorResponse, statusCode)
}
