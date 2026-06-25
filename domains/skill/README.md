# @vassembly/domain-skill

Backend foundation for the skill catalog — reusable skill definitions linked to specializations with rules and script metadata.

**Consumers:** `@vassembly/service-skill` (reads), `apps/api` GraphQL gateway and REST script endpoint.

**Architecture:** See [Skill — Architecture](../../docs/features/skill/architecture.md).

## Key features

- **`queries.getById`** — public DTO query by skill ID
- **`queries.getModelById`** — internal model query for REST script resolution
- **`queries.getBySpecializationId`** — list skills for a specialization, sorted by name
- **`mongodbIndexes`** — unique index on `{ specializationId, name }` plus list index
- **`scriptStorageClient`** — S3 (production) or local filesystem (development) script reads
- **`gqlSchema`** — GraphQL types for `Skill`, `SkillScript`, and `SkillScriptLanguage`

## Installation & usage

```bash
pnpm add @vassembly/domain-skill
```

```typescript
import skillDomain from '@vassembly/domain-skill';

const { data: skill } = await skillDomain.queries.getById({ id: '...' });
const { items } = await skillDomain.queries.getBySpecializationId({ specializationId: '...' });
```

## Exports

### Default export (`skillDomain`)

| Export | Description |
|--------|-------------|
| `queries` | Read operations (`getById`, `getModelById`, `getBySpecializationId`) |
| `mongodbIndexes` | Bootstrap indexes for the `skills` collection |
| `gqlSchema` | GraphQL schema builder for `Skill` types |

### Models

- `SkillModel` — skill entity (`specializationId`, `name`, `description`, `rule`, `scripts`)
- `skillFactory` — factory for creating model instances
- `toSkillResponse` — maps model to `SkillResponse` DTO (strips `storageKey` from scripts)

### Clients

- `skillMongodbDao` — MongoDB DAO for the `skills` collection
- `getSkillsCollection` — typed collection accessor
- `scriptStorageClient` — script content storage abstraction
