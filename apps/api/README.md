# `@vassembly/api`

Central backend API gateway exposing REST and GraphQL endpoints.

## Task routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Create a task (requires authentication) |

### `POST /tasks`

Creates a user-owned task from the authenticated caller's identity.

**Request body:**

```json
{ "description": "Review quarterly report" }
```

**Response:** `201 Created` with `TaskResponse`:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "user-123",
  "description": "Review quarterly report",
  "type": "user",
  "status": "created",
  "agentAssignedId": null,
  "createdAt": "2026-05-26T12:00:00.000Z",
  "updatedAt": "2026-05-26T12:00:00.000Z"
}
```

**Errors:**

| Status | Cause |
|--------|-------|
| `400` | Invalid request body (empty or description over 5000 chars) |
| `401` | Missing or invalid authentication |
| `422` | Domain validation failure (e.g. sanitized description empty) |
| `429` | Rate limit exceeded — 5 tasks per minute per user |

Route implementation: [`src/routes/tasks/create.ts`](./src/routes/tasks/create.ts).

## Task queries (GraphQL)

Task data retrieval uses GraphQL per project conventions. Query field registered in [`src/graphql/resolvers/task.ts`](./src/graphql/resolvers/task.ts).

### `userTasks`

Returns a paginated list of tasks for the authenticated caller.

**Authentication:** Required. Resolver reads `context.authenticatedUserId`; throws `UnauthorizedError` when missing.

**Query variables:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `page` | `Int` | `0` | Zero-based page index |
| `size` | `Int` | `10` | Page size; domain caps at 50 |
| `search` | `String` | — | Optional case-insensitive filter on `description` or `title` |

**Response shape (`TasksList`):**

| Field | Type | Description |
|-------|------|-------------|
| `items` | `[Task]` | Task DTOs with ISO 8601 timestamps |
| `totalCount` | `Int` | Total matching tasks across all pages |
| `page` | `Int` | Current page index |
| `size` | `Int` | Effective page size |

**Example query:**

```graphql
query ListUserTasks($page: Int, $size: Int, $search: String) {
  userTasks(page: $page, size: $size, search: $search) {
    items {
      id
      userId
      description
      type
      status
      agentAssignedId
      title
      createdAt
      updatedAt
    }
    totalCount
    page
    size
  }
}
```

**Errors:**

| Error | When |
|-------|------|
| `UnauthorizedError` | Missing or invalid authentication token |
| `WrongParamError` | Invalid pagination arguments (e.g. negative `page`, `size` < 1) |
| `ValidationError` | Service-level validation failure (empty `userId`) |
