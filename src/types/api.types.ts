// REST API query parameters (parsed from query string)
export interface RestQueryParams {
  // Pagination
  limit?: number
  skip?: number
  cursor?: string

  // Filtering
  where?: Record<string, any>

  // Sorting
  orderBy?: Record<string, 'ASC' | 'DESC'>

  // Direct ID lookup
  ids?: string[]

  // Localization
  locale?: string[]

  // Other GraphQL params
  track?: string
  usePinned?: boolean
  variation?: string

  // Field selection
  fields?: string[]

  // Fragment selection for polymorphic types
  fragments?: string[]

  // Auto field expansion
  expand?: 'auto' | 'auto_with_fulltext' | 'full'
  depth?: number

  // Preview mode support
  mode?: 'edit' | 'ext_preview' | 'public'
  previewToken?: string
  useStoredQueries?: boolean
}

// REST API response format
export interface RestResponse<T = any> {
  items?: T[]
  item?: T
  total?: number
  cursor?: string
  limit?: number
  skip?: number
  facets?: any
  autocomplete?: any
  meta?: {
    contentType: string
    executionTime: number
  }
}

// Error response
export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  details?: any
}
