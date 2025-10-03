import { Hono } from 'hono'
import { previewAuth } from '../middleware/previewAuth'
import {
  handleContentByPath,
  handleContentTypeList,
  handleContentTypeById
} from './handlers/content.handlers'

const preview = new Hono()

// Apply preview authentication middleware to all routes
preview.use('*', previewAuth)

/**
 * GET /api/preview/contentByPath
 * Get preview content by URL path (for routing)
 */
preview.get('/contentByPath', handleContentByPath)

/**
 * GET /api/preview/:contentType
 * Get preview content list by type
 */
preview.get('/:contentType', handleContentTypeList)

/**
 * GET /api/preview/:contentType/:id
 * Get single preview content by ID
 */
preview.get('/:contentType/:id', handleContentTypeById)

export default preview
