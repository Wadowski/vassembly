# @vassembly/domain-mcp

Backend foundation for the MCP (Model Context Protocol) discovery catalog — a read-only list of available MCPs with search, tag filtering, and pagination.

**Consumers:** `@vassembly/service-mcp` (Phase 2), `apps/api` GraphQL gateway (Phase 3), and any service that needs MCP catalog data.

**Architecture:** See [MCP Listing Page — Architecture](../../docs/features/mcp-listing-page/architecture.md).

## Key features

- **`queries.getList`** — paginated MCP catalog with case-insensitive name/description search and OR-based tag filtering
- **`seedMcps`** — idempotent JSON seed loader for API bootstrap
- **`mongodbIndexes`** — unique constraints and filter/sort indexes on the `mcps` collection
- **`gqlSchema`** — GraphQL type definitions for `Mcp` and `McpsList` (resolver wired in Phase 3)

## Installation & usage

```bash
pnpm add @vassembly/domain-mcp
```

Import in a service or API bootstrap:

```typescript
import mcpDomain from '@vassembly/domain-mcp';
```

The default export exposes `queries`, `mongodbIndexes`, `seedMcps`, and `gqlSchema`. Named exports are also available for models, DAOs, and constants.

## Exports

### Default export (`mcpDomain`)

| Export | Description |
|--------|-------------|
| `queries` | Read operations (`getList`) |
| `mongodbIndexes` | Bootstrap indexes for the `mcps` collection |
| `seedMcps` | Idempotent seed loader from `seed/mcps.json` |
| `gqlSchema` | GraphQL schema builder for `Mcp` and `McpsList` types |

### Models

- `McpModel` — MCP catalog entity
- `mcpFactory` — factory for creating `McpModel` instances
- `toMcpResponse` — maps model to `McpListItemResponse` DTO (ISO 8601 dates)
- `McpListItemResponse` — public list-item DTO type

### Clients

- `mcpMongodbDao` — MongoDB DAO for the `mcps` collection
- `getMcpsCollection` — typed collection accessor
- `mongodbIndexes` — index bootstrap function

### Constants

- `COLLECTION_NAME` — `'mcps'`
- `DEFAULT_PAGE_SIZE` — `20`
- `MAX_PAGE_SIZE` — `50`

## Query: `getList`

**Purpose:** Paginated list of MCPs with optional search and tag filtering.

**Signature:**

```typescript
getList(args: GetListParams): Promise<GetListResult>
```

The domain query is transport-agnostic and does not accept a service context; the service layer (`@vassembly/service-mcp`) adds context when exposing this to the API.

### Parameters

| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| `page` | `number` | no | `0` | Zero-based page index |
| `size` | `number` | no | `20` | Page size (capped at `50`) |
| `search` | `string` | no | — | Case-insensitive search on MCP `name` or `description` |
| `tags` | `string[]` | no | — | Filter: MCPs matching **any** selected tag (OR semantics) |

### Response

```typescript
interface GetListResult {
  items: McpListItemResponse[];
  total: number;
  page: number;
  size: number;
}

interface McpListItemResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Example usage

```typescript
// Fetch first page of all MCPs
const result = await mcpDomain.queries.getList({ page: 0, size: 20 });
console.log(`${result.total} MCPs available; showing ${result.items.length}`);

// Search for "email" with tag "productivity"
const filtered = await mcpDomain.queries.getList({
  page: 0,
  size: 20,
  search: 'email',
  tags: ['productivity'],
});

// Get page 2 (items 40–59, assuming size=20)
const page2 = await mcpDomain.queries.getList({ page: 1, size: 20 });
```

## Database schema

**Collection:** `mcps`

| Field | Type | Unique | Indexed | Notes |
|-------|------|--------|---------|-------|
| `_id` | `ObjectId` | yes | yes | MongoDB document ID |
| `name` | `string` | yes | yes | Display name (unique constraint) |
| `description` | `string` | — | text-index | Short summary |
| `tags` | `string[]` | — | yes (multikey) | Filter by any tag with `$in` |
| `iconPath` | `string` | — | — | Public path to icon SVG (e.g. `/mcps/gmail.svg`) |
| `slug` | `string` | yes | yes | Stable identifier for seed (unique) |
| `documentationUrl` | `string` | — | — | Optional external docs link |
| `repositoryUrl` | `string` | — | — | Optional GitHub/source link |
| `createdAt` | `Date` | — | — | Insert timestamp |
| `updatedAt` | `Date` | — | — | Update timestamp |

### Indexes

```typescript
// Unique constraints (prevent duplicates by slug/name)
{ slug: 1 }, { unique: true }
{ name: 1 }, { unique: true }

// Filter index (tags query)
{ tags: 1 }  // multikey: match MCPs by any tag

// Sort & search indexes
{ name: 1 }  // default sort
{ name: 'text', description: 'text' }  // optional text-search fallback
```

## Seed loader: `seedMcps`

**Purpose:** Idempotent seeding of the MCP catalog on API bootstrap.

**Strategy:**

- Load from `seed/mcps.json`
- Validate entries with Zod schema (required: `slug`, `name`, `description`, `tags`, `iconPath`)
- Insert-only: skip if the collection already has documents (prevents duplicates on re-runs)
- Non-blocking: logs errors; never fails API startup

**Signature:**

```typescript
seedMcps(): Promise<LoadMcpsResult>

interface LoadMcpsResult {
  insertedCount: number;
  skippedCount: number;
}
```

### Usage in API bootstrap

(`apps/api/src/routes/index.ts` — Phase 3 integration)

```typescript
import mcpDomain from '@vassembly/domain-mcp';

await initMongoDb({
  indexFunctions: [
    // ... other domains
    mcpDomain.mongodbIndexes,
  ],
});

// Seed MCPs after indexes
await mcpDomain.seedMcps();
```

### Seed data format

(`domains/mcp/seed/mcps.json`)

```json
[
  {
    "slug": "google-workspace-mcp",
    "name": "Gmail MCP",
    "description": "Email, calendar, documents, and chat management",
    "tags": ["productivity", "email", "google"],
    "iconPath": "/mcps/gmail.svg",
    "documentationUrl": "https://...",
    "repositoryUrl": "https://..."
  },
  {
    "slug": "brave-search-mcp",
    "name": "Brave Search MCP",
    "description": "Web, news, image, and video search with AI summarization",
    "tags": ["search", "web", "ai-summary"],
    "iconPath": "/mcps/brave-search.svg",
    "documentationUrl": "https://...",
    "repositoryUrl": "https://..."
  }
]
```

### Seed validation constraints

| Field | Constraints |
|-------|-------------|
| `slug` | 1–80 chars |
| `name` | 1–120 chars |
| `description` | 1–500 chars |
| `tags` | Non-empty array of strings |
| `iconPath` | Must start with `/mcps/` |
| `documentationUrl` | Optional valid URL |
| `repositoryUrl` | Optional valid URL |

## GraphQL integration

**Schema export:**

```typescript
const gqlSchema = mcpDomain.gqlSchema;
```

Register with the API GraphQL builder alongside other domain schemas. The `Query.mcps` field resolver is implemented in Phase 3.

**GraphQL types** (defined by `gqlSchema`):

```graphql
type Mcp {
  id: String!
  name: String!
  description: String!
  tags: [String!]!
  iconPath: String!
  slug: String!
  documentationUrl: String
  repositoryUrl: String
  createdAt: String!
  updatedAt: String!
}

type McpsList {
  items: [Mcp!]!
  total: Int!
  page: Int!
  size: Int!
}
```

**Planned query** (resolver in `apps/api/src/graphql/resolvers/mcp.ts`):

```graphql
type Query {
  mcps(page: Int, size: Int, search: String, tags: [String!]): McpsList!
}
```

## API integration checklist

When integrating this domain into the API:

- [ ] Add `@vassembly/domain-mcp` to `apps/api/package.json` dependencies
- [ ] Import `mcpDomain` in `apps/api/src/routes/index.ts`
- [ ] Register `mcpDomain.mongodbIndexes` in `initMongoDb`
- [ ] Call `await mcpDomain.seedMcps()` after index creation
- [ ] Create `apps/api/src/graphql/resolvers/mcp.ts` resolver
- [ ] Register resolver and schema in `apps/api/src/graphql/index.ts`
- [ ] Add `@vassembly/service-mcp` as bridge (Phase 2)

## Performance & scaling notes

- **Pagination:** Max 50 MCPs per page (enforced); skip-based offset for efficient access up to ~1000 documents
- **Search:** Regex on `name` + `description` with escaping (safe for hundreds of MCPs); text index available as fallback for full-text search
- **Tag filter:** Uses `$in` on indexed `tags` array; O(log n) lookup
- **Total count:** Parallel fetch of count and paginated results via `Promise.all`

## Testing

**Unit tests:** `src/queries/getList/index.test.ts`, `src/seed/loadMcps.test.ts` (29 tests, all passing)

**Run tests:**

```bash
pnpm --filter @vassembly/domain-mcp test
```

**Coverage includes:**

- Pagination boundaries, case-insensitive search, tag filtering (OR), combined filters
- Seed JSON parsing, Zod validation, idempotent insert-only logic, error handling

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Seed data not loading | Check `seed/mcps.json` format matches schema; review API bootstrap logs for validation errors |
| Search returns no results | Verify search term matches `name` or `description`; regex escape may filter special characters |
| Tag filter shows no results | Confirm tags use lowercase slugs (e.g. `productivity`, not `Productivity`); uses OR semantics |
| Duplicate MCPs after re-seed | Expected: insert-only strategy skips when collection is non-empty; safe to re-run API startup |

## Dependencies

- **@vassembly/client-mongodb** — `MongoDbDAO` for the `mcps` collection
- **@vassembly/errors** — domain error types (reserved for future commands)
- **@vassembly/graphql** — `defineModelSchema` and GraphQL type builder for `Mcp` / `McpsList`
- **@vassembly/mappers** — `assertRequiredFields`, `toIsoString` in `toMcpResponse`
- **@vassembly/model** — `Model` base class and `factory` helper
- **@vassembly/validation** — shared validation utilities
- **zod** — seed entry schema validation in `src/seed/schema.ts`

## Future enhancements

- Extract shared helpers (`buildNameDescriptionSearchFilter`, `resolvePagination`, `escapeRegex`) to `@vassembly/query-helpers` if a third domain adopts them
- Add `getById` query for MCP detail view
- Add text-search operator via Atlas Search (optional; text index already created)
- Add command operations (admin create/update/delete MCPs) if a management UI is added
