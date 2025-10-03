import { Hono } from 'hono'
import { publishedAuth } from '../middleware/publishedAuth'
import {
  handleContentByPath,
  handleContentTypeList,
  handleContentTypeById
} from './handlers/content.handlers'

const published = new Hono()

// Apply published authentication middleware to all routes
published.use('*', publishedAuth)

/**
 * GET /api/published/contentByPath
 * Get published content by URL path (for routing)
 */
published.get('/contentByPath', handleContentByPath)

/**
 * GET /api/published/:contentType
 * Get published content list by type
 */
published.get('/:contentType', handleContentTypeList)

/**
 * GET /api/published/:contentType/:id
 * Get single published content by ID
 */
published.get('/:contentType/:id', handleContentTypeById)

export default published
