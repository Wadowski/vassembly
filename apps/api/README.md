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
