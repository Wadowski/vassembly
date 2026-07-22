# Task Domain — Implementation Architecture

Product feature: authenticated users create tasks from a chat-like input on the home page. **Create-only v1** — no list/get queries, no GraphQL.

This plan incorporates a **librarian catalog pass**: reuse `domains/agent` (user-scoped MongoDB create), `services/agent` (thin handler), `apps/api/src/routes/agents/create.ts` (auth + REST), `@vassembly/service-auth` (`authorizeRequest`), and `ui/api-hooks` (`useHttpMutation`). Rate limiting and 429 handling are **greenfield** (documented in other feature PRDs but not implemented in code).

---

## Analysis

### Existing reuse

| Area | Reuse from | Notes |
|------|------------|-------|
| Domain scaffold | `.cursor/skills/create-domain/` | Package skeleton |
| Domain structure | `domains/agent/` | User-scoped `create`, Mongo DAO, indexes, DTO mapper |
| Structural reference | `domains/auth-token/` | Minimal commands-only shape (queries omitted for v1) |
| Service handler | `services/agent/src/handlers/createAgent/` | Inject `userId`, call domain, map DTO |
| REST route | `apps/api/src/routes/agents/create.ts` | `defineRoute` + Zod body + `authorizeRequest` |
| MongoDB | `@vassembly/client-mongodb` | `MongoDbDAO`, `initMongoDb` index registration |
| Commands helper | `@vassembly/commands` `createDb` | Persist + re-fetch pattern |
| Validation | Zod + `@vassembly/validation` `validatorFactory` | Route-level + domain command schema |
| Errors | `@vassembly/errors` | Typed errors → HTTP via `@vassembly/server` error handler |
| UI hook | `ui/api-hooks/src/systemAgents/useCreateSystemAgent.ts` | `useHttpMutation` with `withAuth: true` |
| Auth redirect | `apps/web/lib/layout/AuthLayout.tsx` | `/login?returnUrl=...` |
| Toasts | `@vassembly/ui-system-design/snackbar` | Same pattern as agents/settings pages |

### Gaps (new work)

- `@vassembly/domain-task` — new domain
- `@vassembly/service-task` — new service (required; API must not call domain directly)
- `apps/api/src/routes/tasks/` — new REST route
- `packages/server` — reusable in-memory per-user rate limiter utility
- `@vassembly/errors` — `TooManyRequestsError` (429) + `ErrorTypes.TOO_MANY_REQUESTS`
- `ui/api-hooks/src/tasks/` — `useCreateTask` hook
- `apps/web/app/page.tsx` — home page UI (separate UI task; architecture included for flow)

### New packages decision

| Package | Needed? | Justification |
|---------|---------|---------------|
| `domains/task` | **Yes** | Distinct entity with own lifecycle, Mongo collection, validation |
| `services/task` | **Yes** | All API-exposed features use service handlers; injects `userId`, applies mapper |
| New utility package for rate limit | **No** | Small reusable module in `@vassembly/server` suffices for v1 |

### Domain extension vs new domain

Task is a **distinct business entity** (not a field on `user` or `agent`). It has its own collection, status lifecycle, and future agent assignment. Cannot extend an existing domain without violating single-responsibility.

---

## 1. Domain Package Structure (`domains/task/`)

**Package name:** `@vassembly/domain-task`  
**Reference:** `domains/agent/` for MongoDB + user scoping; `domains/auth-token/` for minimal surface (commands only).

### File organization

```
domains/task/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── src/
    ├── index.ts                      # Export default { commands }, mongodbIndexes, toTaskResponse
    ├── clients/
    │   ├── index.ts                  # Export taskMongodbDao, mongodbIndexes
    │   └── mongodb.ts                # DAO + index definitions
    ├── commands/
    │   ├── index.ts                  # export { create }
    │   └── create/
    │       ├── index.ts              # create command implementation
    │       ├── types.ts              # CreateTaskCommandInput
    │       └── index.test.ts
    ├── commands/shared/
    │   └── sanitizeDescription.ts    # Input normalization (see Validation)
    └── model/
        ├── index.ts                  # Re-exports model, dto, factories, mapper
        ├── model.ts                  # TaskModel class + enums
        ├── dto.ts                    # TaskResponse interface (API DTO)
        ├── factories.ts              # taskFactory
        └── toTaskResponse.ts         # Model → TaskResponse mapper
```

**Queries:** **Omit entirely for v1.** Do not create stub query files. Domain `index.ts` exports only `commands` (no `queries` namespace). Add queries when list/get is in scope.

### Model layer (`src/model/model.ts`)

```typescript
import { Model } from '@vassembly/model';

export enum TaskType {
  User = 'user',
  Agent = 'agent',
}

export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Done = 'done',
}

export class TaskModel extends Model {
  userId?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  agentAssignedId?: string | null;
}
```

- Extends `@vassembly/model` `Model` (inherits `id`, `createdAt`, `updatedAt`).
- Enums use string values matching the PRD contract.
- `agentAssignedId` defaults to `null` on create.

### DTO (`src/model/dto.ts`)

```typescript
export interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: 'user' | 'agent';
  status: 'created' | 'in-progress' | 'done';
  agentAssignedId: string | null;
  createdAt: string;   // ISO 8601
  updatedAt: string;
}
```

This matches the user-facing `Task` interface from requirements (serialized timestamps).

### Factories (`src/model/factories.ts`)

```typescript
import { factory } from '@vassembly/model';
import { TaskModel } from './model';

export const taskFactory = factory(TaskModel);
```

### Mapper (`src/model/toTaskResponse.ts`)

Mirror `domains/agent/src/model/toAgentResponse.ts`:

- Params interface: `ToTaskResponseParams { task: TaskModel }`
- Use `assertRequiredFields`, `toIsoString` from `@vassembly/mappers`
- Required fields: `id`, `userId`, `description`, `type`, `status`, `createdAt`, `updatedAt`
- `agentAssignedId`: `task.agentAssignedId ?? null`

### Clients layer (`src/clients/mongodb.ts`)

```typescript
export const TASK_COLLECTION_NAME = 'tasks';

export const taskMongodbDao = MongoDbDAO<TaskModel>({
  collectionName: TASK_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_COLLECTION_NAME);
  await collection.createIndex({ userId: 1, createdAt: -1 });
};
```

- Collection name: **`tasks`**
- Compound index `{ userId: 1, createdAt: -1 }` supports future list-by-user (newest first).

### Validation / sanitization layer

**Location:** `src/commands/shared/sanitizeDescription.ts`

**Library decision:** No HTML sanitization library exists in the monorepo today, and task descriptions are **plain text** (chat input, not rich text). Do **not** add DOMPurify/he for v1.

**Approach:**

1. **Zod** in command schema: `.trim().min(1).max(5000)`
2. **Pre-parse transform** via `sanitizeDescription()`:
   - Trim whitespace
   - Strip ASCII control characters (except `\n`, `\t` if multi-line desired — default: allow `\n`)
   - Reject empty after trim (Zod `.min(1)` handles)
3. **Storage:** plain UTF-8 string in MongoDB
4. **Display:** React text nodes only — never `dangerouslySetInnerHTML`

If product later requires HTML-rich descriptions, add `he` (encode) or `sanitize-html` at this layer only — not in v1.

```typescript
// commands/shared/sanitizeDescription.ts
export const sanitizeDescription = ({ value }: { value: string }): string => {
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};
```

Use in Zod: `z.string().transform((v) => sanitizeDescription({ value: v })).pipe(z.string().min(1).max(5000))`

### Command: `create`

**Signature:**

```typescript
// commands/create/types.ts
export interface CreateTaskCommandInput {
  userId: string;
  description: string;
}

// commands/create/index.ts — returns Model via createDb
export const create = async (input: CreateTaskCommandInput): Promise<{ data: TaskModel }>
```

**Zod schema (domain command):**

```typescript
const CREATE_SCHEMA = z.object({
  userId: z.string().min(1),
  description: z
    .string()
    .transform((v) => sanitizeDescription({ value: v }))
    .pipe(z.string().min(1).max(5000)),
  type: z.literal(TaskType.User).default(TaskType.User),
  status: z.literal(TaskStatus.Created).default(TaskStatus.Created),
  agentAssignedId: z.null().default(null),
});
```

**Implementation:** `createDb<TaskModel>({ dao, factory, validationSchema })` — same as `domains/agent/src/commands/create/index.ts`.

**Defaults applied in command wrapper:**

```typescript
export const create = async (input: CreateTaskCommandInput) =>
  createDbTask({
    ...input,
    type: TaskType.User,
    status: TaskStatus.Created,
    agentAssignedId: null,
  });
```

### Type definitions — naming conventions

| Kind | Location | Naming |
|------|----------|--------|
| Model class | `model/model.ts` | `TaskModel`, `TaskType`, `TaskStatus` |
| API DTO | `model/dto.ts` | `TaskResponse` |
| Command input | `commands/create/types.ts` | `CreateTaskCommandInput` |
| Mapper params | `model/toTaskResponse.ts` | `ToTaskResponseParams` |
| Handler types | `services/task/.../types.ts` | `CreateTaskHandlerInput`, `CreateTaskHandlerOutput` |
| Route body | `apps/api/.../create.ts` | `taskCreateBodySchema` |

Per code rules: argument types in separate interfaces, not inline.

### Domain errors thrown by `createTask`

| Error | When | HTTP (via framework) |
|-------|------|----------------------|
| `ValidationError` | Zod/model validation fails in `createDb` / `isValid` | 422 |
| `WrongParamError` | DAO `create` returns no id | 400 |
| Mongo/driver errors | Uncaught → wrapped as `InternalError` | 500 |

Domain does **not** throw auth errors — `userId` is required in schema; missing/empty `userId` → `ValidationError`/`WrongParamError` at domain boundary (service always passes valid id from auth).

### Domain entry (`src/index.ts`)

```typescript
import * as commands from './commands';
import { mongodbIndexes } from './clients';

const taskDomain = { commands, mongodbIndexes };

export { commands, mongodbIndexes, toTaskResponse };
export type { TaskModel, TaskResponse } from './model';
export default taskDomain;
```

---

## 2. Service Layer

**Yes — `@vassembly/service-task` is required.**

### Why not domain-only?

- API gateway rules: routes call **service handlers**, not domains directly (`api-gateway-package-structure.mdc`).
- Established pattern: `apps/api` → `@vassembly/service-*` → `@vassembly/domain-*`.
- Service injects **`userId` from auth** — never from request body.
- Service applies **`toTaskResponse`** mapper before returning to API.

`auth-token` is domain-only because it is a **leaf** consumed by `service-auth`, never exposed via its own REST route. Tasks are API-facing.

### Service structure

```
services/task/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── src/
    ├── index.ts
    └── handlers/
        ├── index.ts
        └── createTask/
            ├── index.ts
            ├── types.ts
            └── index.test.ts
```

### Handler: `createTask`

```typescript
// handlers/createTask/types.ts
export interface CreateTaskHandlerInput {
  userId: string;
  body: { description: string };
}

export interface CreateTaskHandlerOutput {
  task: TaskResponse;
}

// handlers/createTask/index.ts
import taskDomain, { toTaskResponse } from '@vassembly/domain-task';

export const createTask = async ({ userId, body }: CreateTaskHandlerInput) => {
  const result = await taskDomain.commands.create({
    userId,
    description: body.description,
  });
  return { task: toTaskResponse({ task: result.data }) };
};
```

No cross-domain orchestration in v1. Future: assign agent → extend handler to validate `agentAssignedId` via `domain-agent`.

---

## 3. REST API Endpoint Design

**Registration:** `routesWithPrefix('/tasks', taskRoutesList)` in `apps/api/src/routes/index.ts`.

**Public path:** `POST /tasks` on the API server (`http://localhost:5000/tasks`). PRD/docs may refer to this as `POST /api/tasks` when an edge proxy adds the `/api` prefix — match existing agent convention.

### Route file: `apps/api/src/routes/tasks/create.ts`

```typescript
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';
import { handlers as authHandlers } from '@vassembly/service-auth';
import taskService from '@vassembly/service-task';
import { assertUserRateLimit } from '@vassembly/server'; // new utility

export const taskCreateBodySchema = z.object({
  description: z.string().min(1).max(5000),
});

export const taskCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: { body: taskCreateBodySchema },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    assertUserRateLimit({ userId, limit: 5, windowMs: 60_000 });
    const { task } = await taskService.createTask({ userId, body });
    return task;
  },
});
```

### Request body (Zod)

| Field | Type | Rules |
|-------|------|-------|
| `description` | `string` | Required, min 1, max 5000 (route-level); domain re-sanitizes |

**Note:** `userId` is **not** in the body.

### Response contract

**201 Created** — body is `TaskResponse` directly (same as agent create returning agent object):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "user-abc",
  "description": "Review quarterly report",
  "type": "user",
  "status": "created",
  "agentAssignedId": null,
  "createdAt": "2026-05-26T12:00:00.000Z",
  "updatedAt": "2026-05-26T12:00:00.000Z"
}
```

### Error responses

| Status | Error type | When | Example message |
|--------|------------|------|-----------------|
| 400 | `WRONG_PARAM` | Malformed body (Zod/Fastify) | `Request doesn't match the schema` |
| 401 | `UNAUTHORIZED` | Missing/invalid token | `Unauthorized` |
| 422 | `VALIDATION` | Domain validation after route pass | `Validation failed` |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded | `Too many requests. Please try again later.` |
| 500 | `INTERNAL_ERROR` | Unexpected errors | `Internal Server Error` |

Error shape (from `@vassembly/server` error handler):

```json
{
  "type": "UNAUTHORIZED",
  "message": "Unauthorized",
  "error": { ... }
}
```

### Auth middleware

Uses existing **`authHandlers.authorizeRequest({ headers })`** from `@vassembly/service-auth`:

1. Reads `Authorization: Bearer <token>` or custom auth header
2. Verifies via `domain-auth-token`
3. Returns `{ userId, role }`
4. Throws `UnauthorizedError` if invalid

No new auth middleware needed.

---

## 4. Rate Limiting Strategy

### Placement

| Layer | Responsibility |
|-------|----------------|
| **`@vassembly/server`** | Reusable `assertUserRateLimit` utility (in-memory store) |
| **Route handler** | Call after `authorizeRequest`, before service handler |
| **Domain** | No rate limiting (transport/edge concern) |

### v1: In-memory (not Redis)

- **Store:** `Map<string, number[]>` keyed by `userId`
- **Window:** Rolling 60 seconds — filter timestamps `> now - 60000`
- **Limit:** 5 requests per window per user
- **Cleanup:** Prune expired timestamps on each check (lazy per-key)

```typescript
// packages/server/src/rateLimit/assertUserRateLimit.ts
export interface AssertUserRateLimitParams {
  userId: string;
  limit: number;
  windowMs: number;
}

export const assertUserRateLimit = ({ userId, limit, windowMs }: AssertUserRateLimitParams): void => {
  // if count >= limit → throw new TooManyRequestsError(..., { retryAfterSeconds })
};
```

### Response on limit exceeded

- **Status:** 429
- **Header:** `Retry-After: <seconds>` (integer, seconds until slot opens)
- **Body:** `TooManyRequestsError` via standard error handler

Requires extending `registerRoutes` or error handler to set `Retry-After` when error carries `retryAfterSeconds` — small addition to `packages/server/src/errorHandler.ts` for `TooManyRequestsError`.

### Future: Redis

When running multiple API instances, replace in-memory store with Redis-backed limiter (`@fastify/rate-limit` + Redis). v1 single-instance in-memory is acceptable per requirements.

---

## 5. User-Scoped Data Access

### Enforcement layers

| Layer | Enforcement |
|-------|-------------|
| **API route** | `authorizeRequest` → `userId`; rate limit keyed by `userId` |
| **Service** | Passes `userId` into domain command; **never** reads `userId` from body |
| **Domain command** | `userId` required in Zod schema; persisted on document |
| **Future queries** | Filter `{ userId }` in DAO; ownership check on get-by-id |

### Missing userId

- **At API:** `authorizeRequest` throws `UnauthorizedError` (401) — handler never runs without auth.
- **At service:** TypeScript requires `userId: string`; no optional path.
- **At domain:** Empty `userId` fails Zod → `ValidationError` (422).

### Security assumption

**Authenticated requests always carry a verified `userId`.** The API does not accept identity from the client body. Trust boundary is `authorizeRequest` + signed JWT.

---

## 6. Database Design

| Decision | Value |
|----------|-------|
| Collection | `tasks` |
| Primary key | MongoDB `_id` → serialized `id` via `@vassembly/model` |
| Index (v1) | `{ userId: 1, createdAt: -1 }` |
| Unique constraints | None for v1 |
| TTL | None — tasks are persistent |
| Sharding key | N/A for v1 |

**Connection:** Reuse `@vassembly/client-mongodb` — same `initMongoDb` in `apps/api/src/routes/index.ts` with `taskMongodbIndexes` in `indexFunctions` array.

**Future indexes:** `{ status: 1 }`, `{ agentAssignedId: 1 }` when agent assignment ships.

---

## 7. Error Handling

### Layer responsibilities

| Layer | Behavior |
|-------|----------|
| **Route (Fastify/Zod)** | Invalid body → `WrongParamError` (400) via framework error handler |
| **Route (auth)** | `UnauthorizedError` bubbles up (401) |
| **Route (rate limit)** | `TooManyRequestsError` (429) |
| **Service** | Let domain errors bubble; no silent catch |
| **Domain** | Throw `ValidationError`, `WrongParamError` |
| **Framework** | `packages/server/src/errorHandler.ts` maps `CommonError` → HTTP |

### New error type required

Add to `packages/errors`:

```typescript
// TooManyRequestsError.ts
export class TooManyRequestsError extends CommonError {
  retryAfterSeconds?: number;
  constructor(message: string, error?: { retryAfterSeconds?: number }) { ... } // status 429
}
```

Add `ErrorTypes.TOO_MANY_REQUESTS` and mapping in `ErrorStatusCodes`.

Update `ui/api-hooks/src/http/mapHttpStatusToError.ts` — add `429` branch (returns `TooManyRequestsError` or generic 4xx with status preserved).

---

## 8. Test Structure (TDD handoff)

### Domain tests

**Path:** `domains/task/src/commands/create/index.test.ts`

Mirror `domains/agent/src/commands/create/index.test.ts`:

| Case | Expectation |
|------|-------------|
| Happy path | Persists with `userId`, `type: 'user'`, `status: 'created'`, `agentAssignedId: null` |
| Empty description | `ValidationError` |
| Description > 5000 chars | `ValidationError` |
| Whitespace-only | `ValidationError` (after sanitize + min(1)) |
| Control characters stripped | Sanitized output persisted |

Mock `taskMongodbDao` / `createDb` — black-box input/output.

**Optional:** `commands/shared/sanitizeDescription.test.ts` for sanitization edge cases.

### Service tests

**Path:** `services/task/src/handlers/createTask/index.test.ts`

| Case | Expectation |
|------|-------------|
| Happy path | Calls domain with `userId` + description; returns `TaskResponse` |
| Domain validation error | Propagates |

Mock `@vassembly/domain-task`.

### API route tests

**Path:** `apps/api/src/routes/tasks/create.test.ts`

Mirror `apps/api/src/routes/agents/create.test.ts`:

| Case | Expectation |
|------|-------------|
| Happy path | Authorize → rate limit pass → service → 201 payload |
| Unauthenticated | `UnauthorizedError` before service |
| Body too long | Zod rejects via `validatorFactory` |
| Rate limited | `TooManyRequestsError` when limit exceeded |

Mock `@vassembly/service-auth`, `@vassembly/service-task`, rate limiter.

### Rate limiter unit tests

**Path:** `packages/server/src/rateLimit/assertUserRateLimit.test.ts`

| Case | Expectation |
|------|-------------|
| Under limit | No throw |
| 6th request in 60s | Throws 429 |
| Window expiry | Request allowed after timestamps age out |
| Concurrency | Two rapid calls — both counted (sequential test) |

### UI tests

Out of scope for this architecture — separate task.

---

## 9. Implementation Order

```
Phase 1 — Foundation (parallel where noted)
├── 1a. packages/errors — TooManyRequestsError + ErrorTypes
├── 1b. packages/server — assertUserRateLimit + error handler Retry-After
└── 1c. domains/task — scaffold package (create-domain skill)

Phase 2 — Domain (depends on 1c)
├── Model, factories, dto, mapper
├── Mongo client + indexes
├── sanitizeDescription + create command
└── Domain unit tests (TDD: tests first)

Phase 3 — Service (depends on Phase 2)
├── services/task scaffold
├── createTask handler + tests

Phase 4 — API (depends on Phase 1a, 1b, Phase 3)
├── apps/api routes/tasks/
├── Wire routes + mongodbIndexes in routes/index.ts
├── apps/api package.json deps
└── Route tests

Phase 5 — UI (depends on Phase 4)
├── ui/api-hooks useCreateTask
├── apps/web home page + sessionStorage draft
└── mapHttpStatusToError 429 branch

Phase 6 — Documentation
└── domain + service README updates
```

**Critical path:** errors → server rate limit → domain → service → API → UI.

---

## 10. Open Questions / Decisions

| Topic | Decision | Notes |
|-------|----------|-------|
| Service package | **Create `@vassembly/service-task`** | Consistent with all API-facing features |
| Sanitization library | **None for v1** | Zod + trim + control-char strip; plain text storage |
| Rate limit store | **In-memory Map** | Document multi-instance limitation |
| Queries folder | **Omit** | Add when list/get is scoped |
| API path prefix | **`/tasks`** on API server | Align with `/agents`; `/api` is edge/docs naming |
| Response includes `userId` | **Yes** | Matches agent response pattern |
| Multi-line input | **Allow `\n`** | Chat-like input; strip other control chars |
| sessionStorage key | **`task:draftDescription`** | Separate from auth tokens (`localStorage`) |
| Home page auth | **Show input to all; redirect on submit if guest** | Per requirements; reuse `AuthLayout` login redirect |
| GraphQL | **None for v1** | Create-only; queries deferred |

### Clarifications for product (non-blocking)

1. **Success UX:** Clear input after create, or keep text? (Recommend clear + success toast.)
2. **Post-login repopulate:** Clear sessionStorage after successful create only, or also after successful submit? (Recommend clear on successful create.)
3. **429 copy:** Generic retry message vs show `Retry-After` hint? (Recommend generic user-facing copy.)

---

## Architecture & Package Placement (data flow)

```
apps/web (home page)
  → useCreateTask (ui/api-hooks) — POST /tasks, withAuth
  → apps/api POST /tasks
      → authorizeRequest (service-auth) → userId
      → assertUserRateLimit (server)
      → createTask (service-task)
          → taskDomain.commands.create (domain-task)
              → taskMongodbDao → MongoDB `tasks`
          → toTaskResponse
      ← 201 TaskResponse
```

---

## Recommendation

**Most conservative approach:** Copy the proven **agent create** vertical slice with these deltas:

1. Smaller model (description-only input)
2. No queries
3. Add rate limiter utility + 429 error (first consumer in repo)
4. Home page UI as thin client over `useCreateTask`

This minimizes new patterns, keeps business logic in the domain, and respects API gateway boundaries.

---

## Todo Plan

1. **`@vassembly/errors`** — [Type: utility extension]
   - Changes: Add `TooManyRequestsError`, `ErrorTypes.TOO_MANY_REQUESTS`, status mapping
   - Files: `packages/errors/src/TooManyRequestsError.ts`, `errorTypes.ts`, `index.ts`
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: None

2. **`@vassembly/server`** — [Type: utility extension]
   - Changes: `assertUserRateLimit` in-memory; optional `Retry-After` in error handler
   - Files: `packages/server/src/rateLimit/assertUserRateLimit.ts`, `errorHandler.ts`, `index.ts`
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: Todo 1

3. **`@vassembly/domain-task`** — [Type: new domain]
   - Changes: Scaffold + model, DAO, indexes, sanitize, create command, mapper, README
   - Files: `domains/task/**` per §1
   - Workflow: create-domain skill → unit-test-writer → coder → code-reviewer → documentation-writer
   - Dependencies: None (parallel with 1–2)

4. **`@vassembly/service-task`** — [Type: new service]
   - Changes: Scaffold + `createTask` handler
   - Files: `services/task/**` per §2
   - Workflow: create-service skill → unit-test-writer → coder → code-reviewer → documentation-writer
   - Dependencies: Todo 3

5. **`@vassembly/api`** — [Type: app extension]
   - Changes: `POST /tasks` route, register prefix, Mongo index init, package deps
   - Files: `apps/api/src/routes/tasks/create.ts`, `index.ts`, `apps/api/src/routes/index.ts`, `package.json`
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: Todos 1, 2, 4

6. **`@vassembly/ui-api-hooks`** — [Type: UI package extension]
   - Changes: `useCreateTask` hook + exports; 429 in `mapHttpStatusToError`
   - Files: `ui/api-hooks/src/tasks/**`, `mapHttpStatusToError.ts`
   - Workflow: coder → code-reviewer
   - Dependencies: Todo 5

7. **`@vassembly/web`** — [Type: app extension]
   - Changes: Home page H1/H2 + task input, sessionStorage draft, auth redirect, toasts
   - Files: `apps/web/app/page.tsx`, `page.module.css`, optional `_components/`, `lib/tasks/taskDraftStorage.ts`
   - Workflow: ui-designer (if needed) → coder → code-reviewer
   - Dependencies: Todo 6
