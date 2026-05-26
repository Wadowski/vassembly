# `@vassembly/domain-task`

Domain package for user-owned tasks. Encapsulates task creation, validation, sanitization, and MongoDB persistence so services can orchestrate task workflows without duplicating business rules.

## Features

- **Create task command** — user-scoped task creation with validated input
- **List user tasks query** — paginated, searchable list scoped to a user
- **Task model** — status lifecycle (`created`, `in-progress`, `done`, `failed`)
- **GraphQL schema** — `Task` and `TasksList` types for API gateway registration
- **MongoDB persistence** — `tasks` collection with user-scoped index
- **Future extensibility** — `agentAssignedId` and `type` reserved for agent assignment workflows

## Usage

```typescript
import taskDomain from '@vassembly/domain-task';

const created = await taskDomain.commands.create({
  userId: 'user-123',
  description: 'Review quarterly report',
});
// Returns: { data: TaskModel }

const list = await taskDomain.queries.listUserTasks({
  userId: 'user-123',
  page: 0,
  size: 10,
  search: 'quarterly',
});
// Returns: { items: TaskModel[], totalCount, page, size }
```

See [`src/index.ts`](./src/index.ts) for the full public API.

## Exports

### `commands.create(input): Promise<{ data: TaskModel }>`

Creates a task owned by the given user. Applies sanitization, sets defaults, and persists to MongoDB.

```typescript
import { commands } from '@vassembly/domain-task';

await commands.create({ userId: 'user-123', description: 'My task' });
```

**Input** ([`src/commands/create/types.ts`](./src/commands/create/types.ts)):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | yes | Task owner |
| `description` | `string` | yes | User input; trimmed and sanitized before persist |

**Defaults on create:**

- `type`: `'user'`
- `status`: `'created'`
- `agentAssignedId`: `null`

## Queries

### `queries.listUserTasks(input): Promise<ListUserTasksQueryResult>`

Returns a paginated page of tasks for the given user, sorted by `createdAt` descending. Supports optional case-insensitive search on `description` and `title`.

```typescript
import taskDomain from '@vassembly/domain-task';

const result = await taskDomain.queries.listUserTasks({
  userId: 'user-123',
  page: 0,
  size: 10,
  search: 'invoice',
});
// Returns: { items: TaskModel[], totalCount, page, size }
```

**Input** ([`src/queries/listUserTasks/types.ts`](./src/queries/listUserTasks/types.ts)):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | yes | Task owner |
| `page` | `number` | yes | Zero-based page index (`>= 0`) |
| `size` | `number` | yes | Page size (`>= 1`); capped at **50** |
| `search` | `string` | no | Case-insensitive filter on `description` or `title`; whitespace-only values are ignored |

**Output** (`ListUserTasksQueryResult`):

| Field | Type | Description |
|-------|------|-------------|
| `items` | `TaskModel[]` | Tasks for the requested page |
| `totalCount` | `number` | Total matching tasks across all pages |
| `page` | `number` | Echo of requested page index |
| `size` | `number` | Effective page size after cap |

**Auth:** None at the domain layer. Callers must pass the authenticated user's ID.

Implementation: [`src/queries/listUserTasks/index.ts`](./src/queries/listUserTasks/index.ts).

### `toTaskResponse({ task }): TaskResponse`

Maps a `TaskModel` to an API-safe DTO with ISO 8601 timestamps. Used by the service layer before returning data to clients.

See [`src/model/toTaskResponse.ts`](./src/model/toTaskResponse.ts).

### `mongodbIndexes(): Promise<void>`

Bootstraps MongoDB indexes for the `tasks` collection. Call during application startup.

See [`src/clients/mongodb.ts`](./src/clients/mongodb.ts).

### Types and enums

- `TaskModel` — domain entity ([`src/model/model.ts`](./src/model/model.ts))
- `TaskResponse` — external DTO ([`src/model/dto.ts`](./src/model/dto.ts))
- `TaskType` — `'user' | 'agent'`
- `TaskStatus` — `'created' | 'in-progress' | 'done' | 'failed'`
- `ListUserTasksQueryInput`, `ListUserTasksQueryResult` — list query types ([`src/queries/listUserTasks/types.ts`](./src/queries/listUserTasks/types.ts))

### GraphQL schema

- `gqlSchema(builder)` — registers `Task` and `TasksList` GraphQL object types ([`src/model/graphql.ts`](./src/model/graphql.ts))
- **`Task` fields:** `id`, `userId`, `description`, `type`, `status`, `agentAssignedId`, `title`, `createdAt`, `updatedAt`
- **`TasksList` fields:** `items`, `totalCount`, `page`, `size`

## Errors

| Error | When |
|-------|------|
| `ValidationError` | Create: empty, whitespace-only, control-only description, exceeds 5000 chars, or missing `userId` |
| `WrongParamError` | List: invalid pagination input (negative `page`, `size` < 1, empty `userId`) |

Implementation: [`src/commands/create/index.ts`](./src/commands/create/index.ts), [`src/commands/shared/sanitizeDescription.ts`](./src/commands/shared/sanitizeDescription.ts), [`src/queries/listUserTasks/index.ts`](./src/queries/listUserTasks/index.ts).

## Data model

```typescript
interface Task {
  _id: ObjectId;
  userId: string;
  description: string;
  type: 'user' | 'agent';
  status: 'created' | 'in-progress' | 'done' | 'failed';
  agentAssignedId: string | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Internal model class: [`src/model/model.ts`](./src/model/model.ts).

## Sanitization

Descriptions are sanitized before persistence ([`src/commands/shared/sanitizeDescription.ts`](./src/commands/shared/sanitizeDescription.ts)):

- Trimmed; leading and trailing whitespace removed
- Control characters removed (`\x00-\x09`, `\x0B-\x1F`, `\x7F-\x9F`); newlines preserved
- Max length: 5000 characters
- Rejected when empty after sanitization

## Future extensibility

- `agentAssignedId` — reserved for future agent assignment
- `type` — `'user'` today; `'agent'` for system-generated tasks later
- `status` — `'in-progress'` and `'done'` support future workflow transitions

## MongoDB

| Setting | Value |
|---------|-------|
| Collection | `tasks` |
| Index | `{ userId: 1, createdAt: -1 }` — supports list-by-user queries |

## Testing

Run tests from this package:

```bash
pnpm test
```

Covers happy path, validation, sanitization, and database interaction. Tests live next to implementation (e.g. [`src/commands/create/index.test.ts`](./src/commands/create/index.test.ts)).

## Dependencies

- **@vassembly/client-mongodb** — MongoDB DAO and index bootstrap
- **@vassembly/commands** — `createDb` helper for persisted creates
- **@vassembly/errors** — `ValidationError` for invalid input
- **@vassembly/mappers** — DTO mapping primitives (`assertRequiredFields`, `toIsoString`)
- **@vassembly/model** — base `Model` class and factory helpers
- **@vassembly/queries** — shared query utilities
- **@vassembly/validation** — `validatorFactory` for list query input validation
- **@vassembly/graphql** — GraphQL schema builder for `Task` and `TasksList` types
- **zod** — description validation and sanitization schema
