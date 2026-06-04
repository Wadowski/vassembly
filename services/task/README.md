# `@vassembly/service-task`

Application-layer service that coordinates the task domain with caller context. Handlers accept authenticated user identity and request payloads from the API gateway, invoke domain commands, and return serialized responses for REST routes.

## Handlers

### `createTask({ userId, body }): Promise<{ task: TaskResponse }>`

Creates a task for the authenticated user. Delegates validation and persistence to `@vassembly/domain-task`, then maps the result to `TaskResponse`.

```typescript
import taskService from '@vassembly/service-task';

const result = await taskService.createTask({
  userId: 'user-123',
  body: { description: 'My task' },
});
// Returns: { task: TaskResponse }
```

**Input** ([`src/handlers/createTask/types.ts`](./src/handlers/createTask/types.ts)):

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Authenticated user ID (provided by API gateway) |
| `body.description` | `string` | Task description |

**Output:** `{ task: TaskResponse }` with ISO 8601 timestamps.

Implementation: [`src/handlers/createTask/index.ts`](./src/handlers/createTask/index.ts).

### `listUserTasks({ userId, page, size, search? }): Promise<ListUserTasksHandlerOutput>`

Returns a paginated list of tasks for the authenticated user. Delegates filtering, pagination, and persistence to `@vassembly/domain-task`.

```typescript
import taskService from '@vassembly/service-task';

const result = await taskService.listUserTasks({
  userId: 'user-123',
  page: 0,
  size: 10,
  search: 'invoice',
});
// Returns: { items: TaskModel[], totalCount, page, size }
```

**Input** ([`src/handlers/listUserTasks/types.ts`](./src/handlers/listUserTasks/types.ts)):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | yes | Authenticated user ID (provided by API gateway) |
| `page` | `number` | yes | Zero-based page index |
| `size` | `number` | yes | Page size; domain caps at 50 |
| `search` | `string` | no | Case-insensitive filter on task `description` or `title` |

**Output** (`ListUserTasksHandlerOutput`):

| Field | Type | Description |
|-------|------|-------------|
| `items` | `TaskModel[]` | Tasks for the requested page |
| `totalCount` | `number` | Total matching tasks |
| `page` | `number` | Current page index |
| `size` | `number` | Effective page size |

**Errors:**

| Error | When |
|-------|------|
| `ValidationError` | Missing or empty `userId` |
| `WrongParamError` | Invalid pagination input from domain validation |

Implementation: [`src/handlers/listUserTasks/index.ts`](./src/handlers/listUserTasks/index.ts).

## Usage

Default export exposes all handlers:

```typescript
import taskService from '@vassembly/service-task';

const { task } = await taskService.createTask({
  userId: 'user-123',
  body: { description: 'Review quarterly report' },
});
```

Entry point: [`src/index.ts`](./src/index.ts).

## Authentication

This service does not perform auth itself. The API gateway resolves the caller via `@vassembly/service-auth` and passes `userId` into handlers. Keeps the service transport-agnostic and reusable from non-HTTP callers.

## Testing

```bash
pnpm test
```

Handler tests mock the domain layer and validate orchestration behavior. See [`src/handlers/createTask/index.test.ts`](./src/handlers/createTask/index.test.ts) and [`src/handlers/listUserTasks/index.test.ts`](./src/handlers/listUserTasks/index.test.ts).

## Dependencies

- **@vassembly/domain-task** — task commands, model, and `toTaskResponse` mapper
- **@vassembly/errors** — domain errors propagated to the API gateway
