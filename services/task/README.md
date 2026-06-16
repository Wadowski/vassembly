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

### `pauseTask({ userId, taskId }): Promise<{ task: TaskResponse }>`

Pauses an in-progress task owned by the authenticated user. Signals cooperative abort via the in-process execution registry, then delegates to `@vassembly/domain-task` `pauseTask`. Idempotent when the task is already `paused`.

```typescript
import taskService from '@vassembly/service-task';

const result = await taskService.pauseTask({
  userId: 'user-123',
  taskId: 'task-456',
});
// Returns: { task: TaskResponse }
```

**Errors:**

| Error | When |
|-------|------|
| `NotFoundError` | Task not found or not owned by `userId` |
| `ConflictError` (`TASK_NOT_PAUSABLE`) | Task is not `in-progress` |

Implementation: [`src/handlers/pauseTask/index.ts`](./src/handlers/pauseTask/index.ts).

### `resumeTask({ userId, taskId }): Promise<{ task: TaskResponse }>`

Resumes a paused task. Updates status via the domain command, then re-fires `executeTask` in `resume` mode (fire-and-forget). Resume mode builds an augmented prompt from completed progress events as a checkpoint. Idempotent when the task is already `in-progress`.

```typescript
const result = await taskService.resumeTask({
  userId: 'user-123',
  taskId: 'task-456',
});
```

**Errors:**

| Error | When |
|-------|------|
| `NotFoundError` | Task not found or not owned by `userId` |
| `ConflictError` (`TASK_NOT_RESUMABLE`) | Task is not `paused` |

Implementation: [`src/handlers/resumeTask/index.ts`](./src/handlers/resumeTask/index.ts).

### `retryTask({ userId, taskId }): Promise<{ task: TaskResponse }>`

Retries a paused or failed task from scratch. Clears error fields via the domain command, then re-fires `executeTask` in `retry` mode (fire-and-forget).

```typescript
const result = await taskService.retryTask({
  userId: 'user-123',
  taskId: 'task-456',
});
```

**Errors:**

| Error | When |
|-------|------|
| `NotFoundError` | Task not found or not owned by `userId` |
| `ConflictError` (`TASK_NOT_RETRYABLE`) | Task is neither `paused` nor `failed` |

Implementation: [`src/handlers/retryTask/index.ts`](./src/handlers/retryTask/index.ts).

### `executeTask({ taskId, userId, mode? }): Promise<void>`

Runs async LLM task execution. Registers an `AbortSignal` in the execution registry, invokes the assigned agent via `@vassembly/service-agent`, and records progress events. Accepts an optional execution mode:

| Mode | Value | Behavior |
|------|-------|----------|
| Fresh (default) | `'fresh'` | New execution; calls `markInProgress` |
| Resume | `'resume'` | Continues from last completed progress event checkpoint |
| Retry | `'retry'` | Re-runs from original description; error fields already cleared by handler |

```typescript
import taskService from '@vassembly/service-task';

await taskService.executeTask({
  taskId: 'task-456',
  userId: 'user-123',
  mode: taskService.TaskExecutionMode.Resume,
});
```

Throws `ExecutionPausedError` when the LangChain tool loop is aborted due to pause. Implementation: [`src/handlers/executeTask/index.ts`](./src/handlers/executeTask/index.ts).

### Internal: `executionRegistry`

In-process `Map<taskId, AbortController>` singleton ([`src/executionRegistry/index.ts`](./src/executionRegistry/index.ts)). Not exported from the package entry point. Used by `pauseTask` (abort), `executeTask` (register/deregister signal), and cooperative cancellation in the agent tool loop.

| Method | Purpose |
|--------|---------|
| `register({ taskId })` | Creates/replaces an `AbortController`; returns its signal |
| `abort({ taskId })` | Aborts and removes the controller for a running task |
| `deregister({ taskId })` | Removes the controller after execution completes |
| `getSignal({ taskId })` | Returns the current signal, if any |

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
- **@vassembly/domain-task-progress** — progress event reads for resume checkpoint building
- **@vassembly/domain-system-agent** — user AI credential preference lookup
- **@vassembly/domain-ai-integration** — provider client resolution (via service-agent)
- **@vassembly/service-agent** — `runAgentInvokeWithTools` for LLM execution
- **@vassembly/errors** — domain and execution errors propagated to the API gateway
- **@vassembly/logger** — structured logging for unhandled execution failures
