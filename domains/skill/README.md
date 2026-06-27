# @vassembly/domain-skill

Backend foundation for the skill catalog — reusable skill definitions linked to specializations with rules and script metadata.

**Consumers:** `@vassembly/service-skill`, `apps/api` (GraphQL queries and REST commands), `@vassembly/service-agent` (catalog injection and `skill-resolve` tool).

**Architecture:** See [Skill — Architecture](../../docs/features/skill/architecture.md).

## Exports

### Default export (`skillDomain`)

Object with `commands`, `queries`, `mongodbIndexes`, and `gqlSchema`.

```typescript
import skillDomain from '@vassembly/domain-skill';

const { data: skill } = await skillDomain.queries.getById({ id: '...' });
await skillDomain.commands.removeSoft({ id: skill.data.id });
```

### Commands

#### `commands.create(input): CreateSkillCommandResult`
Creates a skill with rule and scripts; persists script content to storage. Use `onDuplicate: 'error' | 'returnExisting'` to control name conflicts within a specialization.

#### `commands.update(input): UpdateSkillCommandResult`
Updates description, rule, enabled flag, and/or scripts for an existing skill.

#### `commands.removeSoft({ id }): RemoveSoftResult`
Soft-archives a skill by setting `removedAt`. Rejects already-archived skills (`WrongParamError`).

### Queries

#### `queries.getById({ id }): GetByIdResult`
Returns a single skill as `SkillResponse` DTO (includes archived skills).

#### `queries.getModelById({ id }): GetModelByIdResult`
Internal query returning the raw `SkillModel` (used by commands and REST script resolution).

#### `queries.getBySpecializationId(input): GetBySpecializationIdResult`
Paginated list for a specialization, sorted by name. **Excludes archived** skills (`removedAt` null or unset). Supports optional `search`, `page`, and `size`.

#### `queries.getCatalogBySpecializationId({ specializationId }): GetCatalogBySpecializationIdResult`
Lightweight catalog for agent prompts: **enabled, non-archived** skills only, returning `{ name, description }[]` sorted by name.

#### `queries.getActiveRuleByName({ specializationId, skillName }): GetActiveRuleByNameResult`
Resolves the rule text for an **enabled, non-archived** skill by name within a specialization. Throws `NotFoundError` when no match.

### `formatSkillsCatalogSection({ items }): string`
Formats catalog items into a `## Available Skills` markdown section for system-prompt injection. Returns an empty string when `items` is empty.

### Models & clients

- `SkillModel`, `skillFactory`, `toSkillResponse` — entity, factory, and public DTO mapper (strips `storageKey` from scripts)
- `skillMongodbDao`, `getSkillsCollection` — MongoDB access; script storage is internal to domain clients
- `mongodbIndexes` — unique `{ specializationId, name }` plus list index
- `gqlSchema` — GraphQL types for `Skill`, `SkillScript`, and `SkillScriptLanguage`
- Constants: `SKILL_NAME_MAX_LENGTH`, `SKILL_SCRIPT_LANGUAGES`, etc.

## Dependencies

- **@vassembly/client-mongodb**: MongoDB DAO for the `skills` collection
- **@vassembly/client-aws-s3**: Production script storage reads/writes
- **@vassembly/commands**: `createDb`, `updateDb`, `removeSoftDb` helpers for write operations
- **@vassembly/queries**: `getDbById` helper for internal reads
- **@vassembly/model**: `Model` base class and factory utilities
- **@vassembly/mappers**: Date serialization in DTO mappers
- **@vassembly/graphql**: GraphQL schema builder for skill types
- **@vassembly/errors**, **@vassembly/validation**, **@vassembly/config**: Errors, input validation, and storage config
- **zod**: Command and query input schemas
