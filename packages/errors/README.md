# `@vassembly/errors`

Shared error types for the vassembly monorepo. Provides a consistent `CommonError` base class, HTTP status mapping via `ErrorTypes`, and typed error subclasses thrown by domains, services, and API gateways.

## Exports

### `CommonError`
Base error class with `statusCode`, `type` (`ErrorTypes`), `message`, and optional nested `error`. All package-specific errors extend this.

### `ErrorTypes`
Enum of error type codes mapped to HTTP status codes in `ErrorStatusCodes`.

### `WrongParamError`
HTTP 400 — invalid or missing request parameters.

### `ValidationError`
HTTP 422 — input failed schema or business validation.

### `NotFoundError`
HTTP 404 — requested resource does not exist.

### `UnauthorizedError`
HTTP 401 — caller is not authenticated.

### `ForbiddenError`
HTTP 403 — caller lacks permission for the operation.

### `ConflictError`
HTTP 409 — operation conflicts with current entity state. Domain task commands attach a `code` in the nested error object (e.g. `TASK_NOT_PAUSABLE`, `TASK_NOT_RESUMABLE`, `TASK_NOT_RETRYABLE`).

### `ExecutionPausedError`
HTTP 499 — thrown when LangChain tool-loop execution is cooperatively aborted because a task was paused. Extends `CommonError` with `code: 'EXECUTION_PAUSED'`. Used by `@vassembly/service-task` `executeTask` when the execution registry signal fires; not intended for direct API responses.

```typescript
import { ExecutionPausedError } from '@vassembly/errors';

try {
  await runToolCallLoop({ signal });
} catch (error) {
  if (error instanceof ExecutionPausedError) {
    // Execution stopped cleanly due to pause — do not mark task as failed
  }
}
```

### `InternalError`
HTTP 500 — unexpected server failure.

### `TimeoutError`
HTTP 408 — operation exceeded time limit.

### `TooManyRequestsError`
HTTP 429 — rate limit exceeded. Accepts optional `TooManyRequestsErrorOptions`.

## Dependencies

No runtime npm dependencies. Consumed by domains, services, API gateways, and UI hooks for typed error handling.
