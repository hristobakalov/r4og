import { parse } from 'qs'
import type { Context } from 'hono'
import type { RestQueryParams } from '../types/api.types'

/**
 * Parse query string parameters and convert to RestQueryParams
 * Uses 'qs' library to handle nested objects like where[field][operator]=value
 */
export function parseQueryParams(c: Context): RestQueryParams {
  const queryString = c.req.url.split('?')[1] || ''

  // Parse with qs to handle nested notation
  const parsed = parse(queryString, {
    depth: 10, // Allow deep nesting for complex filters
    allowDots: true, // Support dot notation as well
    parseArrays: true, // Parse array parameters
    comma: true // Support comma-separated values
  })

  const params: RestQueryParams = {}

  // Pagination
  if (parsed.limit) params.limit = Number(parsed.limit)
  if (parsed.skip) params.skip = Number(parsed.skip)
  if (parsed.cursor) params.cursor = String(parsed.cursor)

  // Filtering
  if (parsed.where) params.where = parsed.where

  // Sorting
  if (parsed.orderBy) params.orderBy = parsed.orderBy

  // Direct ID lookup
  if (parsed.ids) {
    params.ids = Array.isArray(parsed.ids)
      ? parsed.ids.map(String)
      : [String(parsed.ids)]
  }

  // Localization
  if (parsed.locale) {
    params.locale = Array.isArray(parsed.locale)
      ? parsed.locale.map(String)
      : [String(parsed.locale)]
  }

  // Other params
  if (parsed.track) params.track = String(parsed.track)
  if (parsed.usePinned !== undefined) params.usePinned = parsed.usePinned === 'true' || parsed.usePinned === true
  if (parsed.variation) params.variation = String(parsed.variation)

  // Field selection
  if (parsed.fields) {
    params.fields = Array.isArray(parsed.fields)
      ? parsed.fields.map(String)
      : String(parsed.fields).split(',')
  }

  // Fragment selection
  if (parsed.fragments) {
    params.fragments = Array.isArray(parsed.fragments)
      ? parsed.fragments.map(String)
      : String(parsed.fragments).split(',')
  }

  // Auto field expansion
  if (parsed.expand) {
    const expandValue = String(parsed.expand)
    if (expandValue === 'auto' || expandValue === 'auto_with_fulltext' || expandValue === 'full') {
      params.expand = expandValue
    }
  }

  if (parsed.depth !== undefined) {
    const depthValue = Number(parsed.depth)
    // Validate depth is between 0 and 3
    if (!isNaN(depthValue) && depthValue >= 0 && depthValue <= 3) {
      params.depth = depthValue
    }
  }

  // Preview mode support
  if (parsed.mode) {
    const modeValue = String(parsed.mode)
    if (modeValue === 'edit' || modeValue === 'ext_preview' || modeValue === 'public') {
      params.mode = modeValue
    }
  }

  if (parsed.previewToken || parsed.preview_token) {
    params.previewToken = String(parsed.previewToken || parsed.preview_token)
  }

  if (parsed.useStoredQueries !== undefined) {
    params.useStoredQueries = parsed.useStoredQueries === 'true' || parsed.useStoredQueries === true
  }

  return params
}
