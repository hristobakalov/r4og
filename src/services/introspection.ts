import { executeGraphQLQuery } from './graphql.client'

// Cache for type introspection results
const typeCache = new Map<string, TypeIntrospection>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export interface FieldInfo {
  name: string
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'LIST' | 'ENUM'
  typeName: string | null
  ofType?: {
    kind: string
    typeName: string | null
  }
}

export interface TypeIntrospection {
  typeName: string
  scalars: FieldInfo[]
  objects: FieldInfo[]
  interfaces: FieldInfo[]
  lists: FieldInfo[]
  timestamp: number
}

/**
 * Introspect a GraphQL type to get its field definitions
 */
export async function introspectType(typeName: string): Promise<TypeIntrospection | null> {
  // Check cache first
  const cached = typeCache.get(typeName)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached introspection for ${typeName}`)
    return cached
  }

  try {
    const query = `
      query IntrospectType($name: String!) {
        __type(name: $name) {
          name
          kind
          fields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    `

    const response = await executeGraphQLQuery(query, { name: typeName })

    if (!response.data?.__type) {
      console.error(`Type ${typeName} not found in schema`)
      return null
    }

    const typeInfo = response.data.__type
    const fields = typeInfo.fields || []

    // Categorize fields by type
    const scalars: FieldInfo[] = []
    const objects: FieldInfo[] = []
    const interfaces: FieldInfo[] = []
    const lists: FieldInfo[] = []

    for (const field of fields) {
      const fieldType = field.type
      const kind = fieldType.kind
      const typeName = fieldType.name

      // Handle NON_NULL wrapper
      const unwrappedType = kind === 'NON_NULL' ? fieldType.ofType : fieldType
      const unwrappedKind = unwrappedType.kind
      const unwrappedTypeName = unwrappedType.name

      const fieldInfo: FieldInfo = {
        name: field.name,
        kind: unwrappedKind as any,
        typeName: unwrappedTypeName,
      }

      // Handle LIST type - check what's inside the list
      if (unwrappedKind === 'LIST') {
        const listItemType = unwrappedType.ofType
        fieldInfo.ofType = {
          kind: listItemType.kind,
          typeName: listItemType.name
        }
        lists.push(fieldInfo)
      } else if (unwrappedKind === 'SCALAR' || unwrappedKind === 'ENUM') {
        scalars.push(fieldInfo)
      } else if (unwrappedKind === 'OBJECT') {
        objects.push(fieldInfo)
      } else if (unwrappedKind === 'INTERFACE' || unwrappedKind === 'UNION') {
        interfaces.push(fieldInfo)
      }
    }

    const introspection: TypeIntrospection = {
      typeName,
      scalars,
      objects,
      interfaces,
      lists,
      timestamp: Date.now()
    }

    // Cache the result
    typeCache.set(typeName, introspection)
    console.log(`Introspected ${typeName}: ${scalars.length} scalars, ${objects.length} objects, ${interfaces.length} interfaces, ${lists.length} lists`)

    return introspection
  } catch (error) {
    console.error(`Failed to introspect type ${typeName}:`, error)
    return null
  }
}

/**
 * Build field selection string from introspection with depth control
 */
export async function buildFieldSelection(
  typeName: string,
  depth: number = 0,
  visitedTypes: Set<string> = new Set(),
  expandMode?: 'auto' | 'auto_with_fulltext' | 'full'
): Promise<string> {
  // Prevent circular references
  if (visitedTypes.has(typeName)) {
    console.log(`Circular reference detected for ${typeName}, returning minimal fields`)
    return '_id\n__typename'
  }

  const introspection = await introspectType(typeName)
  if (!introspection) {
    // Fallback to minimal fields if introspection fails
    return '_id\n__typename'
  }

  const fields: string[] = []
  visitedTypes.add(typeName)

  // Always include scalars (skip _fulltext in 'auto' mode)
  for (const scalar of introspection.scalars) {
    // Skip _fulltext field in 'auto' mode
    if (scalar.name === '_fulltext' && expandMode === 'auto') {
      continue
    }
    fields.push(scalar.name)
  }

  // Include scalar lists (arrays of primitives)
  for (const list of introspection.lists) {
    if (list.ofType?.kind === 'SCALAR' || list.ofType?.kind === 'ENUM') {
      // Skip _fulltext list in 'auto' mode
      if (list.name === '_fulltext' && expandMode === 'auto') {
        continue
      }
      fields.push(list.name)
    } else if (list.ofType?.kind === 'INTERFACE' || list.ofType?.kind === 'UNION') {
      // Skip polymorphic lists - they need fragments
      console.log(`Skipping polymorphic list field ${list.name} - requires fragments`)
    }
  }

  // Include objects if depth > 0
  if (depth > 0) {
    for (const obj of introspection.objects) {
      if (obj.typeName && !visitedTypes.has(obj.typeName)) {
        const nestedFields = await buildFieldSelection(obj.typeName, depth - 1, new Set(visitedTypes), expandMode)
        // Only include the object if it has fields (not empty)
        if (nestedFields && nestedFields.trim().length > 0) {
          fields.push(`${obj.name} {\n  ${nestedFields.split('\n').join('\n  ')}\n}`)
        } else {
          console.log(`Skipping object field ${obj.name} (${obj.typeName}) - no accessible fields`)
        }
      } else if (obj.typeName && visitedTypes.has(obj.typeName)) {
        // Circular reference - just include ID
        fields.push(`${obj.name} { _id __typename }`)
      }
    }
  }

  // Skip interfaces/unions - they require fragments
  if (introspection.interfaces.length > 0) {
    console.log(`Type ${typeName} has ${introspection.interfaces.length} interface/union fields - these require explicit fragments`)
  }

  return fields.join('\n')
}

/**
 * Clear the type cache (useful for testing or when schema changes)
 */
export function clearIntrospectionCache(): void {
  typeCache.clear()
  console.log('Introspection cache cleared')
}
