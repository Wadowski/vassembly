# @vassembly/domain-specialization

Backend foundation for the specialization catalog — domain tags with name and description, used by the classifier flow and admin read UI.

**Consumers:** `@vassembly/service-specialization` (reads), `services/agent` internal tools (`classify-specialization`, `create-specialization`), `apps/api` GraphQL gateway.

**Architecture:** See [Specialization — Architecture](../../docs/features/specialization/architecture.md).

## Key features

- **`commands.create`** — case-insensitive upsert by name; returns `{ id, isNew }`
- **`queries.getList`** — paginated catalog with optional name search filter
- **`queries.getById` / `getByName`** — public DTO queries
- **`queries.getModelById` / `getModelByName`** — internal model queries for commands and services
- **`mongodbIndexes`** — case-insensitive unique index on `name`
- **`gqlSchema`** — GraphQL types for `Specialization` and `SpecializationPage`

## Installation & usage

```bash
pnpm add @vassembly/domain-specialization
```

```typescript
import specializationDomain from '@vassembly/domain-specialization';

const created = await specializationDomain.commands.create({
  name: 'email automation',
  description: 'Tasks involving email workflows and inbox management',
});

const page = await specializationDomain.queries.getList({ page: 0, size: 20, search: 'email' });
```

## Exports

### Default export (`specializationDomain`)

| Export | Description |
|--------|-------------|
| `commands` | Write operations (`create`) |
| `queries` | Read operations (`getList`, `getById`, `getByName`, `getModelById`, `getModelByName`) |
| `mongodbIndexes` | Bootstrap indexes for the `specializations` collection |
| `gqlSchema` | GraphQL schema builder for `Specialization` and `SpecializationPage` |

### Models

- `SpecializationModel` — specialization entity (`name`, `description`)
- `specializationFactory` — factory for creating model instances
- `toSpecializationResponse` — maps model to `SpecializationResponse` DTO (ISO 8601 dates)
- `SpecializationResponse` / `SpecializationPageResponse` — public DTO types

### Clients

- `specializationMongodbDao` — MongoDB DAO for the `specializations` collection
- `getSpecializationsCollection` — typed collection accessor
- `mongodbIndexes` — index bootstrap function

## Database schema

**Collection:** `specializations`

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Required; stored lowercase; unique (case-insensitive collation index) |
| `description` | `string` | Required; max 500 chars |
| `createdAt` | `Date` | Set on create |
| `updatedAt` | `Date` | Set on create |

### Indexes

```typescript
{ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }
```

## Testing

```bash
pnpm --filter @vassembly/domain-specialization test
pnpm --filter @vassembly/domain-specialization check-types
```

## Dependencies

- **@vassembly/client-mongodb** — `MongoDbDAO` for the `specializations` collection
- **@vassembly/commands** — `createDb` helper
- **@vassembly/errors** — `ConflictError`, `NotFoundError`, `ValidationError`
- **@vassembly/graphql** — GraphQL type definitions
- **@vassembly/mappers** — `assertRequiredFields`, `toIsoString`
- **@vassembly/model** — `Model` base class and `factory` helper
- **@vassembly/queries** — `getDbById` helper
- **@vassembly/validation** — input validation utilities
- **zod** — command and query input schemas
