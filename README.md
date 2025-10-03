# r4og

REST API wrapper for GraphQL CMS services. Provides a clean RESTful interface with query string parameters for any GraphQL content type.

## Features

- 🚀 **Dynamic routing** - Works with any GraphQL content type (no hardcoded types)
- 🔍 **Powerful filtering** - Nested query params for complex queries
- 📄 **Full GraphQL support** - Pagination, sorting, localization, field selection
- ⚡ **Fast & lightweight** - Built with Hono and TypeScript
- 🛡️ **Error handling** - Automatic GraphQL error mapping to HTTP status codes

## Quick Start

### Installation

```bash
yarn install
```

### Configuration

#### Option 1: Optimizely Graph (Recommended)

For Optimizely CMS with Graph:

```bash
export OPTIMIZELY_GRAPH_GATEWAY=https://cg.optimizely.com
export OPTIMIZELY_GRAPH_SINGLE_KEY=your-single-key
export OPTIMIZELY_GRAPH_APP_KEY=your-app-key
export OPTIMIZELY_GRAPH_SECRET=your-secret  # Optional for read-only
export EXTERNAL_PREVIEW_ENABLED=true  # Enable preview mode
export PORT=3000
```

Or create a `.env` file (see `.env.example`):

```env
# Optimizely Graph
OPTIMIZELY_GRAPH_GATEWAY=https://cg.optimizely.com
OPTIMIZELY_GRAPH_SINGLE_KEY=your-single-key
OPTIMIZELY_GRAPH_APP_KEY=your-app-key
OPTIMIZELY_GRAPH_SECRET=your-secret
EXTERNAL_PREVIEW_ENABLED=true
PORT=3000
```

#### Option 2: Generic GraphQL Endpoint

For any other GraphQL API:

```bash
export GRAPHQL_ENDPOINT=https://your-graphql-api.com/graphql
export GRAPHQL_API_KEY=your-optional-api-key  # Sent as Bearer token
export PORT=3000
```

Or in `.env`:

```env
GRAPHQL_ENDPOINT=https://your-graphql-api.com/graphql
GRAPHQL_API_KEY=your-optional-api-key
PORT=3000
```

**Note:** Optimizely Graph configuration takes precedence if both are set.

### Run

```bash
# Development (with hot reload)
yarn dev

# Production build
yarn build
yarn start
```

## API Endpoints

### Published vs Preview Routes

The API is split into two route prefixes for clear authentication separation:

#### **Published Content** (`/api/published/*`)
- ✅ Uses `OPTIMIZELY_GRAPH_SINGLE_KEY` (public mode)
- ✅ Production-ready published content only
- ✅ Fastest, most cacheable
- ✅ No authentication headers needed

#### **Preview Content** (`/api/preview/*`)
- 🔒 Requires authentication (Bearer token, Basic auth, or query param)
- 🔒 Access to draft/preview content
- 🔒 Supports CMS editor preview and external preview modes
- 🔒 Returns 401 Unauthorized without valid authentication

### Health Check

```bash
GET /health
GET /health/test  # Test GraphQL connection
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "REST API Wrapper",
  "graphql": {
    "endpoint": "http://localhost:4000/graphql"
  }
}
```

### Query Content

**Published Routes:**
```bash
GET /api/published/:contentType              # List published content
GET /api/published/:contentType/:id          # Get single published content
GET /api/published/contentByPath?url=<path>  # Get published content by URL
```

**Preview Routes:**
```bash
GET /api/preview/:contentType                # List preview content
GET /api/preview/:contentType/:id            # Get single preview content
GET /api/preview/contentByPath?url=<path>    # Get preview content by URL
```

**Legacy Routes (Deprecated):**
```bash
GET /api/:contentType?mode=<mode>            # Use /api/published or /api/preview instead
GET /api/:contentType/:id?mode=<mode>        # Use /api/published or /api/preview instead
GET /api/contentByPath?url=<path>&mode=<mode> # Use /api/published or /api/preview instead
```

## REST API Examples

### Basic Examples

**Published Content:**
```bash
# List published articles
curl "http://localhost:3000/api/published/ArticlePage"

# Get single published article by ID
curl "http://localhost:3000/api/published/ArticlePage/abc123"

# Get published content by URL path (routing)
curl "http://localhost:3000/api/published/contentByPath?url=/products/laptop"

# With base URL
curl "http://localhost:3000/api/published/contentByPath?url=/about&base=en"
```

**Preview Content (requires authentication):**
```bash
# With Bearer token (from CMS editor)
curl "http://localhost:3000/api/preview/ArticlePage" \
  -H "Authorization: Bearer YOUR_CMS_TOKEN"

# With preview token as query parameter
curl "http://localhost:3000/api/preview/ArticlePage?previewToken=YOUR_TOKEN"

# External preview mode (uses Basic auth with app key + secret)
curl "http://localhost:3000/api/preview/ArticlePage"
# Note: Requires EXTERNAL_PREVIEW_ENABLED=true and configured credentials
```

Response includes content type and metadata:
```json
{
  "item": {
    "__typename": "LandingPage",
    "_id": "abc123",
    "_metadata": {
      "key": "landing_page_abc",
      "version": "1.0",
      "locale": "en",
      "displayName": "Products - Laptop",
      "types": ["LandingPage", "_IPage", "_IContent"],
      "url": {
        "default": "/products/laptop/",
        "hierarchical": "/products/laptop/",
        "base": "en"
      }
    }
  },
  "meta": {
    "contentType": "_Content",
    "executionTime": 45
  }
}
```

**Limit results:**
```bash
curl "http://localhost:3000/api/Hero?limit=5"
```

**Pagination:**
```bash
curl "http://localhost:3000/api/Card?limit=10&skip=20"
```

### Filtering Examples

**Simple equality:**
```bash
# Find articles by specific author
curl "http://localhost:3000/api/ArticlePage?where[Author][eq]=John%20Doe"
```

**Text search (contains):**
```bash
# Search headlines containing "welcome"
curl "http://localhost:3000/api/Hero?where[Heading][contains]=welcome"
```

**Full-text search:**
```bash
# Search all text fields
curl "http://localhost:3000/api/ArticlePage?where[_fulltext][contains]=technology"
```

**Pattern matching (like):**
```bash
# Wildcard search
curl "http://localhost:3000/api/Product?where[Title][like]=%phone%"
```

**Date filtering:**
```bash
# Articles modified after specific date
curl "http://localhost:3000/api/ArticlePage?where[_modified][gte]=2024-01-01"

# Articles in date range
curl "http://localhost:3000/api/LandingPage?where[_modified][gte]=2024-01-01&where[_modified][lte]=2024-12-31"
```

**Numeric comparisons:**
```bash
# Products priced over $100
curl "http://localhost:3000/api/Product?where[Price][gt]=100"

# Items with at least 5 articles
curl "http://localhost:3000/api/ArticleList?where[NumberOfArticles][gte]=5"
```

**Array filtering:**
```bash
# Multiple values (OR condition)
curl "http://localhost:3000/api/Hero?where[Country][in]=US,CA,UK"
```

**Existence checks:**
```bash
# Only items with promo images
curl "http://localhost:3000/api/Card?where[PromoImage][exist]=true"

# Items without SEO settings
curl "http://localhost:3000/api/LandingPage?where[SeoSettings][exist]=false"
```

### Logical Operators

**AND condition:**
```bash
# Articles by John modified in 2024
curl "http://localhost:3000/api/ArticlePage?where[_and][0][Author][eq]=John&where[_and][1][_modified][gte]=2024-01-01"
```

**OR condition:**
```bash
# Articles by John OR Jane
curl "http://localhost:3000/api/ArticlePage?where[_or][0][Author][eq]=John&where[_or][1][Author][eq]=Jane"
```

**NOT condition:**
```bash
# All non-deleted items
curl "http://localhost:3000/api/Card?where[_not][0][_deleted][eq]=true"
```

**Complex nested logic:**
```bash
# (Category A OR B) AND (Price > 50) AND Published
curl "http://localhost:3000/api/Product?where[_and][0][_or][0][Category][eq]=A&where[_and][0][_or][1][Category][eq]=B&where[_and][1][Price][gt]=50&where[_and][2][_metadata][status][eq]=Published"
```

### Sorting Examples

**Single field sort:**
```bash
# Latest articles first
curl "http://localhost:3000/api/ArticlePage?orderBy[_modified]=DESC"
```

**Multiple field sort:**
```bash
# Sort by status, then date
curl "http://localhost:3000/api/LandingPage?orderBy[_metadata][status]=ASC&orderBy[_modified]=DESC"
```

**Relevance scoring:**
```bash
# Search and sort by relevance
curl "http://localhost:3000/api/ArticlePage?where[_fulltext][contains]=technology&orderBy[_score]=DESC"
```

### Localization Examples

**Single locale:**
```bash
curl "http://localhost:3000/api/Hero?locale=en"
```

**Multiple locales:**
```bash
curl "http://localhost:3000/api/Product?locale=en,fr,de"
```

**Locale with filtering:**
```bash
curl "http://localhost:3000/api/LandingPage?locale=en&where[_metadata][status][eq]=Published"
```

### Field Selection

**Select specific fields:**
```bash
curl "http://localhost:3000/api/ArticlePage?fields=_id,Heading,Author,_modified"
```

**Nested field selection:**
```bash
curl "http://localhost:3000/api/Hero?fields=_id,Heading,Image,_metadata"
```

**Auto-expand all scalar fields:**
```bash
# Automatically includes all primitive fields (String, Int, Boolean, etc.)
curl "http://localhost:3000/api/ArticlePage?expand=auto&limit=5"
```

**Auto-expand with depth (includes nested objects):**
```bash
# depth=1: Include scalar fields from nested objects
curl "http://localhost:3000/api/ArticlePage?expand=auto&depth=1&limit=5"

# depth=2: Two levels deep
curl "http://localhost:3000/api/LandingPage?expand=auto&depth=2&limit=3"
```

**Combine auto-expand with fragments:**
```bash
# Auto-expand scalars + fragments for polymorphic fields
curl "http://localhost:3000/api/LandingPage?expand=auto&fragments=Hero,Card&limit=3"
```

### GraphQL Fragments (Polymorphic Types)

When querying content with polymorphic fields (like `MainContentArea: [_IContent]`), use fragments to specify which nested types to expand:

**Query landing page with Hero and Card fragments:**
```bash
curl "http://localhost:3000/api/LandingPage?fragments=Hero,Card,Button"
```

This automatically expands polymorphic fields with the requested content types:
```graphql
# Generated GraphQL:
query {
  LandingPage {
    items {
      _id
      __typename
      ... on Hero {
        _id
        Heading
        SubHeading
        Image
      }
      ... on Card {
        _id
        Heading
        Body
        Links
      }
      ... on Button {
        _id
        ButtonLabel
        ButtonLink
      }
    }
  }
}
```

**Available fragments:**
- `Hero`, `Card`, `Button`, `ArticleList`, `Paragraph`
- `Image`, `Video`, `Carousel`, `Grid`, `CallToAction`
- `Collapse`, `Divider`, `Text`, `Iframe`
- `ArticlePage`, `LandingPage`, `Product`
- And more (see `src/services/fragments.ts`)

**Multiple fragments for nested content:**
```bash
curl "http://localhost:3000/api/BlankExperience?fragments=Hero,Card,Grid,ArticleList"
```

### Raw GraphQL Queries

For power users who need full GraphQL control:

```bash
curl -X POST "http://localhost:3000/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { LandingPage(limit: 5) { items { _id MainContentArea { ... on Hero { Heading Image { url { default } } } } } } }",
    "variables": {}
  }'
```

Response:
```json
{
  "data": {
    "LandingPage": {
      "items": [...]
    }
  },
  "meta": {
    "executionTime": 125
  }
}
```

### Advanced Examples

**Search published articles by author, sorted by date, with pagination:**
```bash
curl "http://localhost:3000/api/ArticlePage?where[Author][contains]=Smith&where[_metadata][status][eq]=Published&orderBy[_modified]=DESC&limit=20&skip=0"
```

**Get English heroes with images, sorted by relevance:**
```bash
curl "http://localhost:3000/api/Hero?locale=en&where[Image][exist]=true&where[Heading][contains]=Welcome&orderBy[_score]=DESC&limit=5"
```

**Complex product search:**
```bash
curl "http://localhost:3000/api/Product?where[_and][0][Price][gte]=50&where[_and][0][Price][lte]=200&where[_and][1][_metadata][status][eq]=Published&where[_and][2][ProductCategories][in]=Electronics,Gadgets&orderBy[Price]=ASC&locale=en&limit=10"
```

**Fetch by multiple IDs:**
```bash
curl "http://localhost:3000/api/Card?ids=abc123,def456,ghi789"
```

**Cursor-based pagination:**
```bash
# First page
curl "http://localhost:3000/api/ArticlePage?limit=20"
# Returns: { "cursor": "next_xyz", ... }

# Next page using cursor
curl "http://localhost:3000/api/ArticlePage?limit=20&cursor=next_xyz"
```

## Auto Field Expansion (GraphQL Introspection)

The API can automatically discover and include fields using GraphQL introspection, eliminating the need to manually specify every field.

### How It Works

When `expand=auto` is enabled, the API:
1. **Introspects** the GraphQL schema to discover all fields for the content type
2. **Categorizes** fields by type (scalars, objects, interfaces, lists)
3. **Auto-includes** all scalar fields (String, Int, Boolean, Date, etc.)
4. **Excludes** the `_fulltext` field by default (use `auto_with_fulltext` to include it)
5. **Caches** the schema for 24 hours to avoid repeated introspection

### Expansion Modes

**1. Auto-expand scalars only (`expand=auto`)**
- Includes all primitive fields automatically
- Skips complex objects and interfaces
- Excludes `_fulltext` field (not useful unless performing search)
- Fast and safe, no circular reference risk
```bash
curl "http://localhost:3000/api/ArticlePage?expand=auto"
# Returns: _id, Heading, SubHeading, Author, _modified, etc. (no _fulltext)
```

**2. Auto-expand with fulltext (`expand=auto_with_fulltext`)**
- Same as `auto` mode but includes the `_fulltext` field
- Useful when you need fulltext content for search operations
```bash
curl "http://localhost:3000/api/ArticlePage?expand=auto_with_fulltext"
# Returns: All scalars including _fulltext
```

**3. Auto-expand with depth (`expand=auto&depth=N`)**
- `depth=0`: Scalars only (same as no depth parameter)
- `depth=1`: Scalars + one level of nested object scalars
- `depth=2-3`: Recursively expand up to N levels deep
- Circular reference protection prevents infinite loops
```bash
# Include nested object fields (SeoSettings, PageAdminSettings, etc.)
curl "http://localhost:3000/api/ArticlePage?expand=auto&depth=1"
```

**4. Combine with fragments (`expand=auto&fragments=...`)**
- Auto-expand handles scalars and simple objects
- Fragments handle polymorphic fields (interfaces/unions)
```bash
curl "http://localhost:3000/api/LandingPage?expand=auto&depth=1&fragments=Hero,Card"
```

### Field Type Handling

| Field Type | Auto-Expand Behavior |
|-----------|---------------------|
| **Scalars** (String, Int, Boolean, Date) | ✅ Always included |
| **`_fulltext` field** | ⚠️ Excluded in `auto` mode, included in `auto_with_fulltext` |
| **Scalar Lists** ([String], [Int]) | ✅ Always included |
| **Objects** (ContentReference, etc.) | ✅ Included if depth > 0 |
| **Interfaces/Unions** (_IContent, IData) | ❌ Requires explicit fragments |
| **Polymorphic Lists** ([_IContent]) | ❌ Requires explicit fragments |

### Performance & Caching

- **First request**: Introspects the schema (~1-2s for complex types)
- **Subsequent requests**: Uses cached schema (<100ms)
- **Cache TTL**: 24 hours per content type
- **Max depth**: Limited to 3 to prevent performance issues

### When to Use

✅ **Use auto-expand when:**
- You want all available data without manually listing fields
- Exploring a new content type
- Building generic data browsers or admin interfaces
- You don't know all available fields

❌ **Use explicit fields when:**
- You need minimal data for performance
- You know exactly which fields you need
- Building production APIs with specific requirements

## Preview Modes & Authentication (Optimizely Graph)

The API supports multiple authentication methods for preview content:

### Published Content (`/api/published/*`)
- Always uses `OPTIMIZELY_GRAPH_SINGLE_KEY`
- No authentication headers needed
- Returns published content only

```bash
curl "http://localhost:3000/api/published/ArticlePage"
```

### Preview Content (`/api/preview/*`)

The preview routes support multiple authentication methods (checked in this order):

#### 1. Edit Mode - Bearer Token (from CMS editor)
```bash
curl "http://localhost:3000/api/preview/ArticlePage" \
  -H "Authorization: Bearer YOUR_CMS_TOKEN"
```

#### 2. Edit Mode - Query Parameter Token
```bash
curl "http://localhost:3000/api/preview/ArticlePage?previewToken=YOUR_TOKEN"
```

#### 3. External Preview Mode - Basic Auth
```bash
# Uses OPTIMIZELY_GRAPH_APP_KEY and OPTIMIZELY_GRAPH_SECRET
curl "http://localhost:3000/api/preview/ArticlePage"
```

**Requirements for External Preview:**
- `EXTERNAL_PREVIEW_ENABLED=true` in environment
- `OPTIMIZELY_GRAPH_APP_KEY` and `OPTIMIZELY_GRAPH_SECRET` configured

### Stored Queries
Enable stored query templates for performance optimization:
```bash
curl "http://localhost:3000/api/published/LandingPage?useStoredQueries=true"
curl "http://localhost:3000/api/preview/Hero?useStoredQueries=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Headers
All responses include mode information:
```
X-Content-Mode: published | preview
X-Auth-Method: single-key | bearer-token | query-param-token | basic-auth | ext-preview-default
```

## Query Parameter Reference

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Maximum items to return | `?limit=10` |
| `skip` | number | Number of items to skip (offset) | `?skip=20` |
| `cursor` | string | Cursor for pagination | `?cursor=abc123` |
| `where` | object | Filter conditions | `?where[field][eq]=value` |
| `orderBy` | object | Sort order | `?orderBy[field]=DESC` |
| `locale` | array | Content locales | `?locale=en,fr` |
| `ids` | array | Get specific IDs | `?ids=id1,id2` |
| `fields` | array | Select specific fields | `?fields=_id,Title` |
| `fragments` | array | GraphQL fragments for polymorphic types | `?fragments=Hero,Card` |
| `expand` | string | Auto-expand fields (`auto`, `auto_with_fulltext`, `full`) | `?expand=auto` |
| `depth` | number | Recursion depth for nested objects (0-3) | `?depth=1` |
| `track` | string | Analytics tracking | `?track=campaign_123` |
| `mode` | string | Preview mode (`edit`, `ext_preview`, `public`) | `?mode=edit` |
| `previewToken` | string | CMS preview token (for edit mode) | `?previewToken=token123` |
| `useStoredQueries` | boolean | Use stored query templates | `?useStoredQueries=true` |

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `?where[Author][eq]=John` |
| `contains` | Text search | `?where[Title][contains]=news` |
| `like` | Pattern match | `?where[Title][like]=%news%` |
| `startsWith` | Starts with | `?where[Email][startsWith]=admin` |
| `endsWith` | Ends with | `?where[Email][endsWith]=@example.com` |
| `gt` | Greater than | `?where[Price][gt]=100` |
| `gte` | Greater or equal | `?where[Price][gte]=100` |
| `lt` | Less than | `?where[Price][lt]=50` |
| `lte` | Less or equal | `?where[Price][lte]=50` |
| `in` | In array | `?where[Status][in]=Active,Published` |
| `exist` | Field exists | `?where[Image][exist]=true` |
| `_and` | Logical AND | `?where[_and][0][field1][eq]=value1` |
| `_or` | Logical OR | `?where[_or][0][field1][eq]=value1` |
| `_not` | Logical NOT | `?where[_not][0][deleted][eq]=true` |

## Response Format

```json
{
  "items": [...],
  "total": 150,
  "cursor": "next_page_cursor",
  "meta": {
    "contentType": "ArticlePage",
    "executionTime": 45
  }
}
```

Single item response (GET /api/:contentType/:id):
```json
{
  "item": {...},
  "meta": {
    "contentType": "ArticlePage",
    "executionTime": 32
  }
}
```

Error response:
```json
{
  "error": "NotFound",
  "message": "ArticlePage with id 'abc123' not found",
  "statusCode": 404
}
```

## Architecture

```
REST Request → Query Parser → GraphQL Query Builder → GraphQL Service → Response Formatter → REST Response
```

The API dynamically accepts any content type and constructs the appropriate GraphQL query, delegating all validation to the GraphQL service.

## Development

- Built with [Hono](https://hono.dev/) - Fast web framework
- TypeScript for type safety
- GraphQL client via [graphql-request](https://github.com/jasonkuhrt/graphql-request)
- Query string parsing with [qs](https://github.com/ljharb/qs)

## License

MIT
