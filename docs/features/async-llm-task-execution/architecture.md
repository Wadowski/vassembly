# Async LLM Task Execution — Architecture

**Status:** Engineering handoff (Option A: in-process fire-and-forget)  
**Last updated:** 2026-06-04  
**Related:** [PRD](./prd.md) · [Task Agent Assignment](../task-agent-assignment/architecture.md) · [Task Detail Page](../task-detail-page/prd.md)

---

## Analysis

### Librarian findings (incorporated)

| Finding | Implication |
|---------|-------------|
| `@vassembly/domain-task`, `@vassembly/service-task`, task API, and web task UI **already exist** | Extend in place; **no new domain/service packages** for MVP |
| LLM path is proven: `invokeSystemAgent` → `resolveAndBuildClient` → `systemAgentDomain.commands.invoke` | `executeTask` mirrors this; domains stay LangChain-free |
| **No** backend fire-and-forget pattern exists today | Option A introduces the first; document operational risk |
| `@vassembly/logger` used only in infra clients today | `executeTask` becomes first service-layer consumer; use `sessionId: 'TASK_EXECUTION'` |
| `@vassembly/client-aws-sqs` exists, **zero consumers** | Phase 2 migration target |
| PRD says “pending”; codebase uses `created` | New tasks skip persistent `created`; enum kept for legacy rows |

### Reuse vs new

| Layer | Reuse | New |
|-------|-------|-----|
| `domains/task` | Model, create, queries, GraphQL registration | Fields on `TaskModel`; `complete` / `fail` commands; `getModelById` query; mapper/DTO/GraphQL fields |
| `domains/system-agent` | `commands.invoke`, `queries.getPreferenceByUserId`, `getActiveById` | None |
| `domains/ai-integration` | `commands.resolveAndBuildClient` | None |
| `services/task` | `createTask`, `getTask`, `listUserTasks` | `executeTask`; fire-and-forget from `createTask`; transition logging |
| `services/agent` | `invokeSystemAgent` as reference | Optional shared `resolveSystemCallConnection` helper (Phase 1 optional) |
| `apps/api` | `POST /tasks`, GraphQL task resolvers | Extended Zod/response fields only (**no** duplicate async trigger) |
| `ui/api-hooks` | `useCreateTask`, `useTaskDetail`, mappers | Extended types, GraphQL selection set |
| `apps/web` | Task detail page, status badges, timeline | Polling, AI Response / error sections, timeline events |

### Trigger placement (single source of truth)

**Fire-and-forget runs in `@vassembly/service-task` `createTask`**, not in `apps/api`.

| Reason |
|--------|
| API gateway stays thin (orchestration in services per `api-gateway-package-structure.mdc`) |
| Phase 2 worker calls `taskService.executeTask` without HTTP |
| Avoids double-trigger if both route and handler schedule execution |

The PRD pseudocode in §8.3 shows the API route; behavior is equivalent because `createTask` returns before `executeTask` resolves.

---

## Architecture Overview Diagram

### End-to-end flow (Option A)

```
┌──────────┐  POST /tasks          ┌──────────┐   createTask (sync)     ┌───────────────┐
│ apps/web │ ─────────────────────► │ apps/api │ ───────────────────────►│ service-task  │
│ composer │ ◄── 201 TaskResponse   │          │                         │  createTask   │
└────┬─────┘     status: in-progress└──────────┘                         └───────┬───────┘
     │                                                                          │
     │                                                                          │ persist task
     │                                                                          │ (in-progress + startedAt)
     │                                                                          │
     │                                                                          │ void executeTask({ taskId, userId })
     │                                                                          │      .catch(log unhandled)
     │                                                                          ▼
     │                                                                   ┌───────────────┐
     │                                                                   │ executeTask   │
     │                                                                   │  (async)      │
     │                                                                   └───────┬───────┘
     │                                                                           │
     │ navigate /tasks/[id]                                                      │
     ▼                                                                           ▼
┌──────────┐  GraphQL task(id)      ┌──────────┐                         ┌────────────────────────────┐
│  detail  │ ◄── poll every 3s ──── │ apps/api │ ◄── getTask ─────────── │ preference → credential  │
│   page   │     while in-progress  │ GraphQL  │                         │ → invoke → complete/fail │
└──────────┘                          └──────────┘                         └────────────────────────────┘
```

### Status lifecycle (within one API process)

```
                    ┌─────────────────────────────────────────┐
                    │  POST /tasks → createTask              │
                    │  domain.commands.create                 │
                    │  status: in-progress                    │
                    │  startedAt: now                         │
                    │  HTTP 201 returned (LLM not awaited)    │
                    └──────────────────┬──────────────────────┘
                                       │
                         void executeTask (same Node process)
                                       │
              ┌────────────────────────┴────────────────────────┐
              ▼                                                 ▼
     ┌─────────────────┐                               ┌─────────────────┐
     │  commands.complete│                               │  commands.fail  │
     │  status: done     │                               │  status: failed │
     │  llmResponse      │                               │  errorMessage   │
     │  completedAt      │                               │  errorCode      │
     │                   │                               │  failedAt       │
     └─────────────────┘                               └─────────────────┘
```

### Package dependency graph (Phase 1)

```
domains/task (model + complete/fail + getModelById)
        ↓
services/task (+ domain-ai-integration dep)
        ↓
apps/api (schemas) ──→ ui/api-hooks ──→ apps/web
```

---

## Architecture & Package Placement

| Package | Responsibility |
|---------|----------------|
| `domains/task` | Persistence, status terminal updates, DTO/GraphQL shape |
| `domains/system-agent` | Prompt (`rule` + message), `invoke` |
| `domains/ai-integration` | Credential resolution + LangChain client |
| `services/task` | `executeTask` orchestration, logging, fire-and-forget |
| `apps/api` | REST create + GraphQL reads; extended schemas |
| `ui/api-hooks` | Client types and GraphQL documents |
| `apps/web` | Polling UX, response/error UI |

**Domains do not import each other.** `service-task` composes domains (same boundary as `service-agent`).

---

## Recommendation

**Most conservative approach:** Extend existing packages only. Set `in-progress` at create, trigger `executeTask` once from `createTask`, reuse `invokeSystemAgent`’s credential + invoke chain inside `executeTask`, persist via small domain commands, poll on the detail page.

**Trade-offs:**

| Choice | Benefit | Cost |
|--------|---------|------|
| Option A (in-process) | Fastest MVP; no new infra | Work lost on crash/scale-in; no retry |
| Trigger in `service-task` only | One orchestration path | PRD §A-1 route pseudocode differs (documented here) |
| `llmResponse` vs `title` | Full text on detail; list unchanged | Extra field + UI section |
| No REST status API | No client tampering | Only internal transitions |

---

## Package-by-Package Implementation Guide

### 1. `@vassembly/domain-task` (`domains/task/`)

#### What to change

| Area | Action |
|------|--------|
| `TaskModel` | Add execution fields |
| `commands.create` | Default `status: in-progress`, set `startedAt` |
| New commands | `complete`, `fail` (internal lifecycle writes) |
| New query | `getModelById` for `executeTask` (no DTO mapping) |
| DTO / mapper / GraphQL | Expose new fields |
| README | Update defaults and command list |

#### Files

| File | Lines (current) | Changes |
|------|-----------------|---------|
| `src/model/model.ts` | 15–27 | Add optional fields: `llmResponse`, `errorMessage`, `errorCode`, `startedAt`, `completedAt`, `failedAt` |
| `src/model/dto.ts` | 3–13 | Extend `TaskResponse` with same fields as ISO strings (nullable) |
| `src/model/toTaskResponse.ts` | 19–29 | Map new fields via `toIsoString` / `toNullableIsoString` |
| `src/model/graphql.ts` | 8–17 | Add `exposeString` fields (nullable where appropriate) |
| `src/commands/create/index.ts` | 33–39 | Pass `status: TaskStatus.InProgress`, `startedAt: new Date()` |
| `src/commands/complete/` | **new** | `updateDbById` patch: `status: done`, `llmResponse`, `completedAt` |
| `src/commands/fail/` | **new** | `updateDbById` patch: `status: failed`, `errorMessage`, `errorCode`, `failedAt` |
| `src/commands/index.ts` | 1–2 | Export `complete`, `fail` |
| `src/queries/getModelById/` | **new** | `getDbById` — internal Model return |
| `src/queries/index.ts` | — | Export `getModelById` |
| `src/commands/create/index.test.ts` | — | Expect `in-progress` + `startedAt` |

#### Code patterns

Follow `domains/user/src/commands/update/index.ts` for `updateDbById`:

```typescript
import { updateDbById } from '@vassembly/commands';
import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus } from '../../model';

const persistComplete = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: COMPLETE_TASK_SCHEMA, // zod: llmResponse max 5000
});

export const complete = async ({ taskId, llmResponse }: CompleteTaskInput) => {
  return persistComplete({
    id: taskId,
    data: {
      status: TaskStatus.Done,
      llmResponse,
      completedAt: new Date(),
    },
  });
};
```

`fail` mirrors with `TaskStatus.Failed`, `failedAt`, sanitized `errorMessage` / `errorCode`.

**Create command** (`domains/task/src/commands/create/index.ts` ~line 37):

```typescript
return createDbTask({
  userId: input.userId,
  description,
  type: TaskType.User,
  status: TaskStatus.InProgress,
  startedAt: new Date(),
  agentAssignedId: input.agentAssignedId ?? null,
});
```

#### Integration points

- Consumed by `service-task` handlers only (no LangChain imports).
- GraphQL schema consumed by `apps/api` via existing `gqlTaskSchema` registration.

---

### 2. `@vassembly/service-task` (`services/task/`)

#### What to change

| Area | Action |
|------|--------|
| Dependencies | Add `@vassembly/domain-ai-integration`, `@vassembly/logger` |
| `executeTask` | New handler directory |
| `createTask` | Fire-and-forget after successful create |
| `handlers/index.ts` | Export `executeTask` |

#### Files

| File | Action |
|------|--------|
| `package.json` | Add `domain-ai-integration`, `logger` workspace deps |
| `src/handlers/executeTask/index.ts` | **new** — orchestration |
| `src/handlers/executeTask/types.ts` | **new** |
| `src/handlers/executeTask/mapExecutionError.ts` | **new** — error → `errorMessage` / `errorCode` |
| `src/handlers/executeTask/logTaskTransition.ts` | **new** — structured logger wrapper |
| `src/handlers/executeTask/index.test.ts` | **new** |
| `src/handlers/createTask/index.ts` | After `toTaskResponse`, schedule `executeTask` |
| `src/handlers/createTask/index.test.ts` | Assert `executeTask` scheduled, not awaited |
| `src/handlers/index.ts` | Export handler + types |

#### Fire-and-forget in `createTask`

After line 18–20 in `services/task/src/handlers/createTask/index.ts`:

```typescript
import { logger } from '@vassembly/logger';
import { executeTask } from '../executeTask';

// ... existing create logic ...
const response = {
  task: toTaskResponse({ task: result.data }),
};

void executeTask({
  taskId: result.data.id!,
  userId,
}).catch((error: unknown) => {
  logger('task.execute.unhandled', {
    meta: { sessionId: 'TASK_EXECUTION', taskId: result.data.id, userId },
    data: { error: error instanceof Error ? error.message : String(error) },
  });
});

return response;
```

#### `executeTask` structure

Mirror `services/agent/src/handlers/invokeSystemAgent/index.ts` (lines 8–41) without admin override:

```typescript
export const executeTask = async ({ taskId, userId }: ExecuteTaskParams): Promise<void> => {
  const startedAt = Date.now();
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (!task?.agentAssignedId || task.status !== TaskStatus.InProgress) {
    await taskDomain.commands.fail({
      taskId,
      errorMessage: 'Task cannot be executed in its current state.',
      errorCode: 'INVALID_STATE',
    });
    logTaskTransition({ event: 'task.status.failed', taskId, userId, errorCode: 'INVALID_STATE', durationMs: Date.now() - startedAt });
    return;
  }

  try {
    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const credentialId = preference.data?.integrationCredentialId;
    if (!credentialId) {
      await taskDomain.commands.fail({
        taskId,
        errorMessage: 'Configure a “preferred for system calls” AI credential in Settings.',
        errorCode: 'MISSING_CREDENTIAL',
      });
      logTaskTransition({ event: 'task.status.failed', taskId, userId, errorCode: 'MISSING_CREDENTIAL', durationMs: Date.now() - startedAt });
      return;
    }

    const { modeledProviderClient } = await aiIntegrationDomain.commands.resolveAndBuildClient({
      userId,
      connectionOverride: { integrationCredentialId: credentialId },
    });

    const invokeResult = await systemAgentDomain.commands.invoke({
      modeledProviderClient,
      systemAgentId: task.agentAssignedId,
      message: task.description!,
    });

    await taskDomain.commands.complete({ taskId, llmResponse: invokeResult.message });
    logTaskTransition({
      event: 'task.status.done',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
      provider: invokeResult.metadata?.provider,
      model: invokeResult.metadata?.model,
    });
  } catch (error) {
    const mapped = mapExecutionError(error);
    await taskDomain.commands.fail({ taskId, ...mapped });
    logTaskTransition({
      event: 'task.status.failed',
      taskId,
      userId,
      errorCode: mapped.errorCode,
      durationMs: Date.now() - startedAt,
    });
  }
};
```

#### Error mapping (`mapExecutionError.ts`)

| Source | `errorCode` | User message |
|--------|-------------|--------------|
| `ValidationError` with `SYSTEM_AGENT_CONNECTION_*` | `INVALID_CREDENTIAL` | Use `error.message` (already user-safe in ai-integration) |
| `NotFoundError` (agent) | `AGENT_UNAVAILABLE` | Agent unavailable |
| `TimeoutError` | `PROVIDER_TIMEOUT` | Request timed out |
| Provider / generic | `PROVIDER_ERROR` | Sanitized message |
| Unknown | `INTERNAL_ERROR` | Generic safe message; log stack in `data` |

Reuse error codes from `@vassembly/domain-system-agent` where applicable (`invokeSystemAgent` tests in `services/agent/src/handlers/invokeSystemAgent/index.test.ts`).

#### Logging pattern

```typescript
logger('task.status.done', {
  meta: { sessionId: 'TASK_EXECUTION', taskId, userId, event: 'task.status.done' },
  data: { durationMs, provider, model },
});
```

Emit on create (in `createTask` or domain): `task.status.created` with `status: in-progress`.

#### Integration points

- **Upstream:** `apps/api` → `createTask` only.
- **Downstream:** `domain-task`, `domain-system-agent`, `domain-ai-integration`.
- **Must not** import `@vassembly/client-langchain` in service.

---

### 3. `@vassembly/service-agent` (optional)

#### What to change

Extract shared preference resolution used by `invokeSystemAgent` (lines 24–29) and `executeTask`:

| File | Action |
|------|--------|
| `src/handlers/shared/resolveSystemCallCredentialId.ts` | **new** (optional) |

**Dependencies:** None blocking MVP; skip if duplication is ~10 lines.

---

### 4. `apps/api`

#### What to change

| File | Lines | Action |
|------|-------|--------|
| `src/routes/tasks/create.ts` | 12–22 | Extend `taskResponseSchema` with `llmResponse`, `errorMessage`, `errorCode`, `startedAt`, `completedAt`, `failedAt` |
| `src/routes/tasks/create.ts` | 42–43 | **No** `void executeTask` here — handled in service |
| `src/graphql/resolvers/task.ts` | 52, 73 | Already uses `toTaskResponse`; picks up new fields automatically after domain GraphQL update |

#### Patterns

- REST = command (`POST /tasks` unchanged URL).
- GraphQL = query only; no mutation for execution.

#### Integration

`taskService.createTask` return type flows through Zod response schema; ensure OpenAPI/docs stay aligned if generated.

---

### 5. `@vassembly/ui-api-hooks` (`ui/api-hooks/src/tasks/`)

| File | Action |
|------|--------|
| `types.ts` | Extend `TaskResponse`, `TaskDto`, `GraphQLTaskRow` |
| `graphql/getTaskQuery.ts` | Add selection fields (lines 4–12) |
| `graphql/listUserTasksQuery.ts` | Optional: add fields for list badges later; MVP can omit `llmResponse` on list |
| `mapTaskData.ts` | Map new fields in `toTaskDto` (lines 18–28) |
| `useCreateTask.ts` | No body change; parse extended 201 response if needed |
| `useTaskDetail.ts` / tests | Update fixtures |

---

### 6. `apps/web` (`apps/web/app/tasks/[id]/`)

| File | Action |
|------|--------|
| `useTaskDetailPage.ts` | Second `useEffect`: poll every 3s while `task?.status === 'in-progress'`; reuse `fetch`; cleanup on unmount |
| `_components/TaskDetailAiResponse.tsx` | **new** — loading / full text / hidden when failed |
| `_components/TaskDetailExecutionError.tsx` | **new** — `errorMessage`, link to AI settings |
| `page.tsx` | Render new sections between description and timeline (lines 25–28) |
| `lib/buildSyntheticTimelineEvents.ts` | Add events for `startedAt`, `completedAt`, `failedAt` |
| `lib/buildSyntheticTimelineEvents.test.ts` | Cover new events |
| `useTaskDetailPage.test.ts` | Polling stop conditions |

#### Polling pattern

```typescript
useEffect(() => {
  if (task?.status !== TaskStatus.InProgress) {
    return;
  }

  const intervalId = setInterval(() => {
    void fetch(taskIdParam).then((loaded) => {
      if (!cancelled) setTask(loaded);
    });
  }, 3000);

  return () => clearInterval(intervalId);
}, [task?.status, fetch, taskIdParam]);
```

Use `fetchPolicy: 'no-cache'` already in `useTaskDetail` if configured.

#### Integration

- Status labels: reuse `apps/web/app/_components/TaskList/taskStatusDisplay.ts`.
- Errors: reuse `getRequestErrorMessage` pattern from `useTaskDetailPage.ts` line 10.

---

## Detailed Step-by-Step Implementation Order

### Phase 1A — Domain foundation

**Build:** `domains/task` model, commands, query, DTO, GraphQL.

**Exit criteria:**
- Unit tests pass for create (`in-progress` + `startedAt`), `complete`, `fail`, `getModelById`.
- `toTaskResponse` includes all new fields.
- README reflects new defaults.

**Tests:**
- `domains/task/src/commands/create/index.test.ts`
- `domains/task/src/commands/complete/index.test.ts` (new)
- `domains/task/src/commands/fail/index.test.ts` (new)

---

### Phase 1B — Service orchestration

**Build:** `executeTask`, wire `createTask`, logging, error mapping.

**Depends on:** Phase 1A.

**Exit criteria:**
- `executeTask` unit tests: happy path, missing credential, invoke failure, invalid task state.
- `createTask` test verifies `executeTask` called without await.
- Manual: mock domains, run handler in isolation.

**Tests:**
- `services/task/src/handlers/executeTask/index.test.ts`
- Update `services/task/src/handlers/createTask/index.test.ts`

---

### Phase 1C — API contracts

**Build:** Extended Zod schema on `POST /tasks`; verify GraphQL `task` returns new fields.

**Depends on:** Phase 1A (GraphQL fields).

**Exit criteria:**
- `POST /tasks` 201 body includes null execution fields + `in-progress`.
- GraphQL introspection shows new `Task` fields.

**Tests:**
- API route test if present; else manual `curl` / integration test in Phase 1E.

---

### Phase 1D — Frontend

**Build:** `ui/api-hooks` then `apps/web` polling + UI.

**Depends on:** Phase 1C.

**Exit criteria:**
- Detail page polls until `done` or `failed`.
- AI Response section shows `llmResponse` with preserved whitespace.
- Failed tasks show `errorMessage`.

**Tests:**
- `mapTaskData` / `getTaskQuery.test.ts`
- `buildSyntheticTimelineEvents.test.ts`
- `useTaskDetailPage.test.ts` (polling behavior)

---

### Phase 1E — End-to-end validation

**Manual test plan:**
1. User with valid system-call credential creates task from homepage.
2. Confirm 201 &lt; 500ms, status `in-progress`.
3. Open `/tasks/[id]` — loading state, then response within poll window.
4. User without credential — task created, transitions to `failed` with `MISSING_CREDENTIAL`.
5. Logs contain `task.status.done` or `task.status.failed`.

---

## Code Patterns and Examples

### Fire-and-forget (authoritative: `createTask`)

See §2 `createTask` snippet. **Do not** also call `executeTask` from `apps/api/src/routes/tasks/create.ts` (lines 42–43).

### `executeTask` handler layout

```
executeTask/
├── index.ts          # orchestration
├── types.ts          # ExecuteTaskParams
├── mapExecutionError.ts
├── logTaskTransition.ts
└── index.test.ts
```

### Error handling rules

1. **Always** attempt `commands.fail` in `catch` (never silent rejection).
2. **Outer** `.catch` on `void executeTask` only for failures *after* `fail` command itself throws (DB down).
3. Do not persist partial `llmResponse` on failure.
4. Truncate or reject `llmResponse` &gt; 5000 chars in `complete` command (Zod).
5. Never log API keys; log `errorCode` + `taskId` only.

### Logging events (MVP)

| Event | When |
|-------|------|
| `task.status.created` | After Mongo insert in create flow |
| `task.status.done` | After `commands.complete` |
| `task.status.failed` | After `commands.fail` |

---

## Database Migrations

### MongoDB schema

**No migration script required** for MVP. MongoDB is schemaless; new fields appear on write.

| Collection | Change |
|------------|--------|
| `tasks` | New optional fields on documents |

### Index changes

**Optional (not required MVP):** `{ status: 1, updatedAt: -1 }` for operator “stuck in-progress” queries.

Add in `domains/task/src/clients/mongodb.ts` `mongodbIndexes()` if adopted:

```typescript
await collection.createIndex({ status: 1, updatedAt: -1 });
```

### Legacy data

| Scenario | Handling |
|----------|----------|
| Existing rows with `status: created` | UI already supports label; no backfill required |
| Old tasks without `llmResponse` | GraphQL returns `null` |
| Re-run execution on old tasks | Out of scope MVP (no retry endpoint) |

### Application startup

Ensure `mongodbIndexes()` runs on deploy (existing bootstrap pattern).

---

## Risk Analysis

### In-process fire-and-forget risks

| Risk | Impact | Mitigation (MVP) |
|------|--------|------------------|
| Process crash mid-LLM | Task stuck `in-progress` forever | Ops runbook: query `tasks` where `status=in-progress` and `updatedAt` stale; manual fail or re-deploy |
| Horizontal scale / serverless freeze | Same as crash | Document; Phase 2 queue |
| Double execution | Duplicate LLM cost | Low volume; idempotency in Phase 2 |
| Unhandled rejection | Silent failure | `void executeTask().catch(log)` + inner `fail` |
| Long LLM call blocks event loop | API latency under load | Accept at MVP volume; monitor p95 |
| 16MB document limit | Huge model output | Cap `llmResponse` at 5000 chars in domain |
| Credential missing after create | User sees failed task | Product-approved: create + async fail |

### Monitoring / alerting (MVP)

| Signal | How |
|--------|-----|
| Stuck tasks | Log query: `in-progress` and `startedAt` &lt; now - 10m |
| Failure rate | Count `task.status.failed` / `task.status.done` in logs |
| Create latency | `POST /tasks` p95 (no LLM in path) |
| Unhandled errors | Alert on `task.execute.unhandled` |

Phase 2: counters `tasks_completed_total`, histogram `task_execution_duration_seconds`.

### Migration path to Option B (SQS)

```
Today:  createTask → void executeTask (in-process)

Phase 2: createTask → AwsSqsClient.send({ taskId, userId })
                      → apps/worker consumer → executeTask (same handler)
```

| Step | Package |
|------|---------|
| 1 | `packages/client-aws-sqs` — wire enqueue in `createTask` behind feature flag |
| 2 | New `apps/worker` (or Lambda) — poll queue, call `taskService.executeTask` |
| 3 | Remove `void executeTask` from API process |
| 4 | Idempotency: message dedupe key = `taskId`; skip if terminal status |
| 5 | DLQ + retry policy for `PROVIDER_TIMEOUT` |

`executeTask` handler **unchanged** — only trigger moves.

---

## Testing Strategy

### Unit tests by layer

| Package | Focus | Mock pattern |
|---------|-------|--------------|
| `domain-task` | Validation, status patches, `llmResponse` max length | Mock `taskMongodbDao` / `updateDbById` (see `create/index.test.ts`) |
| `service-task` | Orchestration order, error mapping, fire-and-forget | Mock `taskDomain`, `systemAgentDomain`, `aiIntegrationDomain` (see `invokeSystemAgent/index.test.ts`) |
| `ui/api-hooks` | GraphQL field mapping | Fixture `GraphQLTaskRow` |
| `apps/web` | Polling intervals, UI phases | Mock `useTaskDetail().fetch` |

### `executeTask` test cases (minimum)

1. Happy path → `complete` with message from `invoke`.
2. No `integrationCredentialId` → `fail` with `MISSING_CREDENTIAL`.
3. `resolveAndBuildClient` throws `ValidationError` → `INVALID_CREDENTIAL`.
4. `invoke` throws → `fail` with mapped code.
5. Task not `in-progress` → `fail` `INVALID_STATE`.
6. `createTask` does not await `executeTask` (mock and assert called once).

### LLM mock pattern

Do not call real providers in tests:

```typescript
mockResolveAndBuildClient.mockResolvedValue({
  modeledProviderClient: { invoke: vi.fn().mockResolvedValue({ message: 'ok', usage: {}, metadata: {} }) },
});
mockInvoke.mockResolvedValue({ message: 'Assistant output', usage: {}, metadata: { provider: 'openai' } });
```

Prefer mocking `systemAgentDomain.commands.invoke` at service layer (black-box).

### Integration tests (optional Phase 1E)

- Testcontainers Mongo + supertest `POST /tasks` with mocked domains injected via test DI **if** harness exists; otherwise manual QA checklist in PRD.

---

## Deployment Checklist

### Pre-deployment

- [ ] All package `pnpm test` green for touched packages
- [ ] `pnpm check-types` in `domains/task`, `services/task`, `apps/api`, `ui/api-hooks`, `apps/web`
- [ ] Confirm `mongodbIndexes()` deployed (optional new index)
- [ ] Staging: create task with valid credential → reaches `done`
- [ ] Staging: user without preference → `failed` + message
- [ ] Verify logs in staging for `task.status.*` events
- [ ] Product sign-off on access control (owner-only vs global read, PRD Q-1)

### Deploy order

1. `domains/task` + `services/task` (backward compatible: new fields null on old reads)
2. `apps/api`
3. `ui/api-hooks` + `apps/web` (polling harmless if API not deployed yet)

### Rollback plan

| Symptom | Action |
|---------|--------|
| High `in-progress` stuck rate | Roll back `apps/web` polling first (UX only), then service trigger (disable `void executeTask` via hotfix) |
| Bad deploy | Revert monorepo release; Mongo data safe (extra fields ignored by old code) |
| LLM cost spike | Disable fire-and-forget in `createTask` (one-line hotfix) — tasks stay `in-progress` until manual fix |

### Post-deploy monitoring

- [ ] Dashboard or log filter for `task.execute.unhandled`
- [ ] Sample `POST /tasks` p95 &lt; 500ms
- [ ] Spot-check 10 tasks: time from create to `done` &lt; 5 minutes
- [ ] Document operator query for stuck tasks

---

## Todo Plan

1. **`@vassembly/domain-task`** — Type: extend domain  
   - Changes: Model fields, create defaults, `complete`/`fail` commands, `getModelById`, DTO/mapper/GraphQL  
   - Files: `src/model/model.ts`, `dto.ts`, `toTaskResponse.ts`, `graphql.ts`, `commands/create/index.ts`, `commands/complete/`, `commands/fail/`, `queries/getModelById/`, `README.md`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer  
   - Dependencies: None  

2. **`@vassembly/service-task`** — Type: extend service  
   - Changes: `executeTask`, fire-and-forget in `createTask`, logging, error mapping  
   - Files: `package.json`, `src/handlers/executeTask/**`, `src/handlers/createTask/index.ts`, `src/handlers/index.ts`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)  
   - Dependencies: Todo 1  

3. **`apps/api`** — Type: extend app  
   - Changes: Extended `taskResponseSchema` on `POST /tasks`  
   - Files: `src/routes/tasks/create.ts`  
   - Workflow: coder → Done  
   - Dependencies: Todo 1  

4. **`@vassembly/ui-api-hooks`** — Type: extend package  
   - Changes: Types, GraphQL query, mappers  
   - Files: `src/tasks/types.ts`, `graphql/getTaskQuery.ts`, `mapTaskData.ts`  
   - Workflow: unit-test-writer → coder  
   - Dependencies: Todo 1  

5. **`apps/web`** — Type: extend app  
   - Changes: Polling, AI response/error UI, timeline  
   - Files: `app/tasks/[id]/useTaskDetailPage.ts`, `_components/TaskDetailAiResponse.tsx`, `_components/TaskDetailExecutionError.tsx`, `page.tsx`, `lib/buildSyntheticTimelineEvents.ts`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)  
   - Dependencies: Todo 4  

6. **`@vassembly/service-agent`** (optional) — Type: extend service  
   - Changes: Shared `resolveSystemCallCredentialId` helper  
   - Files: `src/handlers/shared/resolveSystemCallCredentialId.ts`, refactor `invokeSystemAgent`  
   - Workflow: coder → Done  
   - Dependencies: None (parallel with Todo 2)  

---

*End of architecture — ready for implementation todos and Phase 1 delivery.*
