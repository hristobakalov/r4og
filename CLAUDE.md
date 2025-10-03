# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

REST API wrapper around a GraphQL CMS service. Built with Hono (TypeScript), it provides a RESTful interface to any GraphQL content type with dynamic routing and minimal validation.

## Package Management

- **Package Manager**: Yarn v4.9.1 (configured in packageManager field)
- **Install dependencies**: `yarn install`
- **Add package**: `yarn add <package-name>`
- **Add dev package**: `yarn add -D <package-name>`

## Development Commands

- **Development mode**: `yarn dev` (with hot reload via tsx)
- **Build**: `yarn build`
- **Production**: `yarn start`

## Dependencies

- **hono**: Fast web framework for building APIs
- **@hono/node-server**: Node.js adapter for Hono
- **graphql**: GraphQL language implementation
- **graphql-request**: Lightweight GraphQL client
- **qs**: Query string parser for nested objects
- **zod**: TypeScript-first schema validation

## Architecture

### Dynamic Routing

**Published Content Routes** (uses SingleKey authentication):
- **GET /api/published/:contentType** - Query published content by type
- **GET /api/published/:contentType/:id** - Get single published item by ID
- **GET /api/published/contentByPath** - Get published content by URL path

**Preview Content Routes** (requires authentication):
- **GET /api/preview/:contentType** - Query preview/draft content by type
- **GET /api/preview/:contentType/:id** - Get single preview item by ID
- **GET /api/preview/contentByPath** - Get preview content by URL path

**Other Routes**:
- **POST /graphql** - Raw GraphQL passthrough for power users
- **GET /health** - Health check endpoint
- **GET /health/test** - Test GraphQL connection

**Legacy Routes (Deprecated)**:
- **GET /api/:contentType** - Use /api/published or /api/preview instead
- **GET /api/:contentType/:id** - Use /api/published or /api/preview instead
- **GET /api/contentByPath** - Use /api/published or /api/preview instead

Content types are NOT hardcoded - the API accepts any content type name and passes it to GraphQL for validation.

### Request Flow
1. Parse query params with nested notation support (e.g., `where[Author][eq]=John`)
2. Transform REST params → GraphQL variables
3. Build GraphQL query dynamically
4. Execute against GraphQL endpoint
5. Format and return response

### File Structure
```
src/
├── config/          # GraphQL endpoint configuration
├── types/           # TypeScript type definitions
├── services/        # GraphQL client and query builder
├── middleware/      # Query parsing and error handling
├── utils/           # Query transformation and response formatting
└── routes/          # API route handlers
```

## Environment Variables

### Optimizely Graph (Primary)
- `OPTIMIZELY_GRAPH_GATEWAY` - Optimizely Graph gateway URL (e.g., https://cg.optimizely.com)
- `OPTIMIZELY_GRAPH_SINGLE_KEY` - Single key for public access
- `OPTIMIZELY_GRAPH_APP_KEY` - App key for authenticated access
- `OPTIMIZELY_GRAPH_SECRET` - Secret for mutations (optional for read-only)

### Generic GraphQL (Alternative)
- `GRAPHQL_ENDPOINT` - GraphQL API endpoint (default: http://localhost:4000/graphql)
- `GRAPHQL_API_KEY` - Optional auth token (sent as Bearer token)

### Server
- `PORT` - Server port (default: 3000)

**Note:** Optimizely Graph configuration takes precedence if both are set. See `.env.example` for setup.

## Query Parameter Support

### Pagination
```
?limit=20&skip=10&cursor=abc123
```

### Filtering (nested notation)
```
?where[Heading][eq]=Welcome
?where[Author][contains]=John
?where[_modified][gte]=2024-01-01
?where[_and][0][field1][eq]=value1&where[_and][1][field2][eq]=value2
```

### Sorting
```
?orderBy[_modified]=DESC&orderBy[Heading]=ASC
```

### Other
```
?locale=en,fr
?ids=id1,id2,id3
?fields=_id,Heading,Author
?expand=auto                    # Auto-expand scalar fields (excludes _fulltext)
?expand=auto_with_fulltext      # Auto-expand with _fulltext included
?expand=auto&depth=1            # Auto-expand with nested objects
?track=campaign_123
?fragments=Hero,Card            # For polymorphic fields
```

## Error Handling

The API passes through GraphQL errors and maps them to appropriate HTTP status codes:
- 400 - Invalid content type or query
- 404 - Content not found
- 503 - GraphQL service unavailable
- 504 - Gateway timeout

## Example Requests

List articles:
```
GET /api/ArticlePage?limit=10&orderBy[_modified]=DESC
```

Search with filter:
```
GET /api/Hero?where[Heading][contains]=Welcome&locale=en
```

Get single item:
```
GET /api/Product/abc123?fields=_id,Title,Price
```

Get content by URL path (routing):
```
GET /api/contentByPath?url=/products/laptop&base=en
```

Query with fragments (polymorphic types):
```
GET /api/LandingPage?fragments=Hero,Card,Button
```

Complex query:
```
GET /api/LandingPage?where[_and][0][SeoSettings][exist]=true&where[_and][1][_modified][gte]=2024-01-01&limit=5
```

Raw GraphQL:
```
POST /graphql
{ "query": "query { ArticlePage { items { _id Heading } } }" }
```

## Code Style

Per `.editorconfig`:
- Line endings: LF
- Charset: UTF-8
- Indent: 2 spaces
- Insert final newline

## Git

- Main branch: `main`
- Yarn PnP files (.pnp.*) are gitignored
