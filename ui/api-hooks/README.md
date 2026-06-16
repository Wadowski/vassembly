# `@vassembly/ui-api-hooks`

React hooks package that provides typed HTTP and GraphQL request abstractions for web applications. Wraps `@apollo/client` for queries and a shared HTTP client for REST commands.

## Exports

### Tasks

Task hooks live under `src/tasks/` and are re-exported from the package entry point.

#### `useCreateTask()`
Creates a task via `POST /api/tasks`. Returns `{ createTask, isLoading, error }`.

#### `usePauseTask()`
Pauses an in-progress task via `PATCH /api/tasks/:id/pause`. Returns `{ pauseTask, isLoading, error }`.

```typescript
import { usePauseTask } from '@vassembly/ui-api-hooks';

const { pauseTask, isLoading, error } = usePauseTask();

await pauseTask({ id: taskId });
// Returns: TaskResponse
```

#### `useResumeTask()`
Resumes a paused task via `PATCH /api/tasks/:id/resume`. Returns `{ resumeTask, isLoading, error }`.

#### `useRetryTask()`
Retries a paused or failed task via `PATCH /api/tasks/:id/retry`. Returns `{ retryTask, isLoading, error }`.

#### `useTaskDetail({ id })`
GraphQL query hook for a single task by ID.

#### `useUserTasks({ page, size, search? })`
GraphQL query hook for the authenticated user's paginated task list.

#### Task types

- `TaskStatus` — `'created' | 'in-progress' | 'paused' | 'done' | 'failed'`
- `TaskStatus.Paused` — `'paused'`
- `TaskDto` / `TaskResponse` — include optional `pausedAt?: string | null` (ISO 8601)
- `TaskType`, `UserTasksListResponse`, `CreateTaskBody`, and related GraphQL row types

### Other modules

Also exports hooks for auth, user, agents, AI integrations, system agents, MCPs, internal tools, plus `GraphQLProvider`, `HttpClientProvider`, `useHttpClient`, and `usePolling`.

## Dependencies

- **@apollo/client** — GraphQL query hooks
- **@vassembly/domain-task** — shared task status/type enums for mapping
- **@vassembly/domain-auth-token** — auth token types
- **@vassembly/domain-system-agent** — system agent types
- **@vassembly/errors** — `CommonError` for hook error state
- **@vassembly/validation** — input validation helpers
- **@vassembly/constants** — shared constants
- **graphql** — query document parsing
- **zod** — runtime validation
- **react** (peer) — hook runtime
