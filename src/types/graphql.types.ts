// GraphQL query variables
export interface GraphQLVariables {
  cursor?: string
  ids?: string[]
  limit?: number
  locale?: string[]
  orderBy?: Record<string, any>
  skip?: number
  track?: string
  usePinned?: any
  variation?: any
  where?: Record<string, any>
}

// GraphQL query response (generic)
export interface GraphQLResponse<T = any> {
  data?: {
    [key: string]: {
      items?: T[]
      item?: T
      total?: number
      cursor?: string
      facets?: any
      autocomplete?: any
    }
  }
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
    extensions?: Record<string, any>
  }>
}
