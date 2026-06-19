# Task Title Generator — Architecture

**Document status:** Engineering handoff  
**Last updated:** 2026-06-16  
**Feature slug:** task-title-generator  
**Related docs:** [PRD](./prd.md) · [UI design](./ui-design.md) · [Async LLM Task Execution](../async-llm-task-execution/architecture.md) · [System Agents](../system-agent/prd.md) · [Task List Homepage](../task-list-homepage/prd.md) · [Task Detail Page](../task-detail-page/prd.md)

---

## Table of Contents

1. [Analysis](#1-analysis)
2. [Architecture Overview Diagram](#2-architecture-overview-diagram)
3. [Package Touch Map](#3-package-touch-map)
4. [Constants & System Agent Seed](#4-constants--system-agent-seed)
5. [Domain Layer (`domains/task`)](#5-domain-layer-domainstask)
6. [Service Handlers (`services/task`)](#6-service-handlers-servicestask)
7. [Logging Specification](#7-logging-specification)
8. [Unchanged Layers](#8-unchanged-layers)
9. [Test Strategy](#9-test-strategy)
10. [Phased PR Breakdown](#10-phased-pr-breakdown)
11. [Todo Plan](#11-todo-plan)

---

## 1. Analysis

### 1.1 Librarian findings (incorporated)

| Finding | Implication |
|---------|-------------|
| `TaskModel.title` already exists (`string \| null`) | **No schema migration**; populate existing field |
| `toTaskResponse`, GraphQL `Task.title`, list search on `title` already implemented | **No API or read-path changes** |
| `apps/web` task list (`data-testid="task-ai-summary"`) and detail header (`task-detail-title`) already conditionally render `title` | **No frontend code changes** for v1 display |
| `ui/api-hooks` GraphQL queries already request `title` | **No client hook changes** |
| `createTask` already fires `void executeTask(...).catch(log)` | Add **parallel** second fire-and-forget — same pattern, separate handler |
| `executeTask` → `runAgentInvokeWithTools` is the proven LLM invoke path | Reuse for title generation; **no tools**, **no execution registry**, **no progress recording** |
| `userSystemAgentPreferences.integrationCredentialId` is the credential source for all system-agent calls | Same resolution as `executeTask`; missing credential → **skip silently** (do not `fail` task) |
| `markInProgress` / `complete` use `updateDbById` + Zod | Mirror for `updateTitle` — title-only partial update |
| `SYSTEM_AGENT_NAME` enum + `systemAgents.json` seed is how catalog agents are registered | Add `TaskTitleGenerator` entry only |
| Pause/resume execution registry is unrelated | Title generation **must not** register with or acquire execution registry locks |

### 1.2 Codebase audit — what exists vs missing

| Layer | Exists | Missing |
|-------|--------|---------|
| `packages/constants` | `SYSTEM_AGENT_NAME` enum with 6 agents | `TaskTitleGenerator = 'Task title generator'` |
| `domains/system-agent` | Seed file, `getActiveByName`, `getPreferenceByUserId` | Seed entry for title generator agent |
| `domains/task` | `title` on model/DTO/GraphQL; `create`/`complete`/`fail`/status commands | `updateTitle` command |
| `services/task` | `createTask`, `executeTask`, fire-and-forget pattern | `generateTaskTitle` handler; `createTask` wiring |
| `services/agent` | `runAgentInvokeWithTools` | No changes |
| `apps/api` | `POST /tasks`, GraphQL task resolvers | No changes |
| `ui/api-hooks` | Task queries include `title` | No changes |
| `apps/web` | Conditional title display | No changes; optional E2E for async population |

### 1.3 Reuse vs new (by layer)

| Layer | Reuse | New |
|-------|-------|-----|
| `packages/constants` | Enum pattern | One new enum member |
| `domains/system-agent` | Seed JSON structure | One new seed object |
| `domains/task` | `updateDbById`, `taskMongodbDao`, `taskFactory`, `title` field | `updateTitle` command + tests |
| `services/task` | `createTask` fire-and-forget; `executeTask` invoke pattern; domain imports | `generateTaskTitle` handler, normalization util, logging helper, `createTask` second void call |
| `services/agent` | `runAgentInvokeWithTools` | Nothing |
| `apps/api` | Existing task endpoints | Nothing |
| `ui/api-hooks` | Existing queries | Nothing |
| `apps/web` | Existing UI conditionals | Optional E2E feature file |

### 1.4 Design decisions (from PRD — non-negotiable)

| Decision | Choice |
|----------|--------|
| Async pattern | **Separate** `void generateTaskTitle(...).catch(log)` parallel to `void executeTask(...)` |
| Blocking | Never awaited on `POST /tasks` critical path |
| Failure UX | **Silent** — log internally; never `fail` task or surface user error |
| Missing credential | Skip + log `task.title.skipped` (`missing_credential`); do **not** call `taskDomain.commands.fail` |
| Invalid LLM output (> 8 words) | **Reject** and leave `title` null (quality over truncation) |
| Idempotency | Skip if `task.title` already non-null (`already_set`) |
| Concurrency | Title generation and `executeTask` run in parallel; no shared locks |
| Public API | No new REST or GraphQL endpoints; `updateTitle` is internal domain command only |
| UI pending state | None — title appears on next fetch/reload/navigation |

### 1.5 New packages

**None.** All work extends existing packages.

---

## 2. Architecture Overview Diagram

### 2.1 Create path — two parallel fire-and-forget flows

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         POST /tasks → createTask handler                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

 apps/web          apps/api              service-task                    background (parallel)
    │                  │                      │                                  │
    │ POST /tasks      │                      │                                  │
    │─────────────────►│ createTask           │                                  │
    │                  │─────────────────────►│                                  │
    │                  │                      │ taskDomain.commands.create       │
    │                  │                      │ (title: null)                    │
    │                  │                      │                                  │
    │                  │◄─────────────────────│ 201 { task, title: null }        │
    │◄─────────────────│                      │                                  │
    │                  │                      │                                  │
    │                  │                      ├── void executeTask({ taskId, userId })
    │                  │                      │       .catch(log)  ───────────────┼──► MAIN EXECUTION
    │                  │                      │                                  │    (Assistant agent,
    │                  │                      │                                  │     progress events,
    │                  │                      │                                  │     status lifecycle)
    │                  │                      │                                  │
    │                  │                      └── void generateTaskTitle({ taskId, userId })
    │                  │                              .catch(log)  ───────────┼──► TITLE GENERATION
    │                  │                                                         │    (Task title generator,
    │                  │                                                         │     title-only persist)
    │                  │                                                         │
    │  (user continues; no await)                                                 │
    │                                                                             ▼
    │                                                                    ┌─────────────────┐
    │                                                                    │ generateTaskTitle│
    │                                                                    └────────┬────────┘
    │                                                                             │
    │                              ┌──────────────────────────────────────────────┘
    │                              │
    │                              ▼
    │                    taskDomain.queries.getModelById
    │                              │
    │                    skip if title set / empty description / no credential
    │                              │
    │                              ▼
    │                    systemAgentDomain.getActiveByName(TaskTitleGenerator)
    │                              │
    │                              ▼
    │                    runAgentInvokeWithTools (no tools, no abortSignal)
    │                              │
    │                              ▼
    │                    normalizeGeneratedTitle(response.message)
    │                              │
    │                    skip if empty / > 8 words
    │                              │
    │                              ▼
    │                    taskDomain.commands.updateTitle({ id, title })
    │                              │
    │                              ▼
    │                    log task.title.completed
    │
    │  (later: reload / list refetch / detail poll)
    ▼
 GraphQL task query returns populated title
```

### 2.2 Mermaid — sequence diagram

```mermaid
sequenceDiagram
  participant Client
  participant API as apps/api
  participant Create as createTask
  participant Domain as domain-task
  participant Exec as executeTask
  participant Title as generateTaskTitle
  participant Agent as runAgentInvokeWithTools

  Client->>API: POST /tasks
  API->>Create: createTask({ userId, body })
  Create->>Domain: commands.create(...)
  Domain-->>Create: TaskModel (title: null)
  Create-->>API: 201 TaskResponse
  API-->>Client: 201 (title: null)

  par Main execution
    Create--)Exec: void executeTask({ taskId, userId })
    Exec->>Domain: markInProgress / complete / fail
  and Title generation
    Create--)Title: void generateTaskTitle({ taskId, userId })
    Title->>Domain: queries.getModelById
    Title->>Agent: runAgentInvokeWithTools (Task title generator)
    Agent-->>Title: { message }
    Title->>Domain: commands.updateTitle({ id, title })
  end
```

### 2.3 Independence guarantees

| Concern | Title generation | Main execution |
|---------|------------------|----------------|
| Task status | **Never modified** | `in-progress` → `done` / `failed` / `paused` |
| `llmResponse` | **Never modified** | Set on `complete` |
| Execution registry | **Not used** | Register/abort/deregister |
| Progress events | **Not recorded** | `recordAgentInvokeProgress` |
| User-visible errors | **Never** | May set `errorMessage` on fail |
| Assigned agent | Task title generator (by name) | Assistant (on `agentAssignedId`) |

---

## 3. Package Touch Map

### 3.1 Full file tree

```
packages/constants/
└── src/
    └── SystemAgentName.ts                          # MODIFY — add TaskTitleGenerator

domains/system-agent/
└── seed/
    └── systemAgents.json                           # MODIFY — add seed entry

domains/task/
└── src/
    └── commands/
        ├── index.ts                                # MODIFY — export updateTitle
        └── updateTitle/                            # CREATE
            ├── index.ts
            ├── types.ts
            └── index.test.ts

services/task/
└── src/
    └── handlers/
        ├── index.ts                                # MODIFY — export generateTaskTitle
        ├── createTask/
        │   ├── index.ts                            # MODIFY — fire generateTaskTitle
        │   └── index.test.ts                       # MODIFY — assert generateTaskTitle called
        └── generateTaskTitle/                      # CREATE
            ├── index.ts
            ├── types.ts
            ├── normalizeGeneratedTitle.ts          # CREATE — pure normalization (keeps handler ≤100 lines)
            ├── logTaskTitleEvent.ts                # CREATE — structured logging helper
            ├── normalizeGeneratedTitle.test.ts     # CREATE — unit tests for normalization
            └── index.test.ts

apps/web/e2e/features/tasks/
└── task-title-generation.feature                   # CREATE (PR 4, optional) — Gherkin from PRD §12
```

### 3.2 Explicitly unchanged

| Path | Reason |
|------|--------|
| `domains/task/src/model/model.ts` | `title?: string \| null` already defined |
| `domains/task/src/model/toTaskResponse.ts` | Already maps `title` |
| `domains/task/src/model/graphql.ts` | Already exposes `title` |
| `domains/task/src/queries/*` | Search on `title` already implemented |
| `apps/api/**` | No new routes or resolvers |
| `apps/web/app/**` (task UI) | Conditional render already in place |
| `ui/api-hooks/**` | GraphQL already fetches `title` |
| `services/agent/**` | Reuse `runAgentInvokeWithTools` as-is |

---

## 4. Constants & System Agent Seed

### 4.1 `packages/constants/src/SystemAgentName.ts`

**Change:** Add enum member after existing entries (alphabetically or at end — match file convention):

```typescript
TaskTitleGenerator = 'Task title generator',
```

**Consumers:** `services/task/src/handlers/generateTaskTitle/index.ts` — `getActiveByName({ name: SYSTEM_AGENT_NAME.TaskTitleGenerator })`.

### 4.2 `domains/system-agent/seed/systemAgents.json`

**Change:** Append new object (exact text from PRD §7.2):

```json
{
  "name": "Task title generator",
  "description": "Generates a short scannable title from a task description. Used automatically after task creation.",
  "rule": "You generate a short title for a task based on the user's task description.\n\nOutput rules:\n1. Respond with ONLY the title text. No quotes, labels, or explanation.\n2. Maximum 8 words.\n3. Use a concise noun phrase or short action phrase (e.g. \"Quarterly sales report review\").\n4. Do not end with punctuation.\n5. Capture the core intent of the description; ignore filler words.\n6. If the description is too vague to title meaningfully, output a best-effort short label from the key nouns or verbs present.\n\nDo not produce plans, steps, or answers — title only.",
  "category": "utility",
  "assignedToolIds": []
}
```

**Deployment note:** Existing environments need seed re-run or manual insert so `getActiveByName` resolves the agent. Document in PR 1 description.

---

## 5. Domain Layer (`domains/task`)

### 5.1 `commands/updateTitle/types.ts`

```typescript
import type { TaskModel } from '../../model';

export interface UpdateTitleCommandInput {
  id: string;
  title: string;
}

export interface UpdateTitleCommandResult {
  data: TaskModel | undefined;
}
```

### 5.2 `commands/updateTitle/index.ts`

Follow `domains/task/src/commands/markInProgress/index.ts` and `complete/index.ts`:

| Aspect | Value |
|--------|-------|
| Helper | `updateDbById<TaskModel>` from `@vassembly/commands` |
| DAO | `taskMongodbDao` |
| Factory | `taskFactory` (not translation factory — matches `markInProgress`) |
| Input schema | `z.object({ id: z.string().min(1), title: z.string().min(1).max(120) })` |
| DB schema | `z.object({ title: z.string().min(1).max(120) })` |
| Updates only | `{ title }` — **must not** touch `status`, `llmResponse`, timestamps beyond `updatedAt` from DAO |

```typescript
export const updateTitle = async ({
  id,
  title,
}: UpdateTitleCommandInput): Promise<UpdateTitleCommandResult> => {
  const parsed = UPDATE_TITLE_INPUT_SCHEMA.safeParse({ id, title });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  return persistUpdateTitle({
    id: parsed.data.id,
    data: { title: parsed.data.title },
  });
};
```

**Ownership:** v1 follows `executeTask` pattern — service passes `taskId` from authenticated create context; domain command does not re-check `userId`. Cross-user writes are prevented because only the create handler invokes `generateTaskTitle` with the creating user's context.

### 5.3 `commands/index.ts`

Add exports:

```typescript
export { updateTitle } from './updateTitle';
export type { UpdateTitleCommandInput, UpdateTitleCommandResult } from './updateTitle/types';
```

### 5.4 `domains/task/README.md`

Add `updateTitle` to commands section (documentation-writer in PR 2).

---

## 6. Service Handlers (`services/task`)

### 6.1 `handlers/generateTaskTitle/types.ts`

```typescript
export interface GenerateTaskTitleHandlerInput {
  taskId: string;
  userId: string;
}
```

Handler return type: `Promise<void>` — never throws to caller.

### 6.2 `handlers/generateTaskTitle/normalizeGeneratedTitle.ts`

Pure function — no side effects. Export result type for tests:

```typescript
export type NormalizeGeneratedTitleResult =
  | { isValid: true; title: string }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedTitleParams {
  rawOutput: string;
}

export const normalizeGeneratedTitle = ({
  rawOutput,
}: NormalizeGeneratedTitleParams): NormalizeGeneratedTitleResult => { ... };
```

**Algorithm (PRD §4.1 FR-B6):**

1. Trim whitespace on full `rawOutput`
2. Split on `\n`, take index `0`, trim
3. If wrapped in matching `"..."` or `'...'`, strip outer quotes
4. Strip trailing characters from set `. , ; : ! ?` repeatedly from end
5. Trim again
6. If empty → `{ isValid: false, reason: 'empty_output' }`
7. Split on whitespace (`/\s+/`), filter empty → word count
8. If word count > 8 → `{ isValid: false, reason: 'invalid_output' }`
9. Return `{ isValid: true, title: normalized }`

**Do not** truncate to 8 words — reject invalid output per product decision.

### 6.3 `handlers/generateTaskTitle/logTaskTitleEvent.ts`

Mirror `executeTask/logTaskTransition.ts` with `sessionId: 'TASK_TITLE_GENERATION'`:

```typescript
export type TaskTitleLogEvent =
  | 'task.title.started'
  | 'task.title.completed'
  | 'task.title.failed'
  | 'task.title.skipped';

export interface LogTaskTitleEventParams {
  event: TaskTitleLogEvent;
  taskId: string;
  userId: string;
  durationMs?: number;
  reason?: string;
}

export const logTaskTitleEvent = ({ event, taskId, userId, durationMs, reason }: LogTaskTitleEventParams): void => {
  logger(event, {
    meta: { sessionId: 'TASK_TITLE_GENERATION', taskId, userId },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
    },
  });
};
```

Use `warn` level for `task.title.failed` — pass via logger API if supported, or document that `task.title.failed` is logged at warn severity in handler call site per PRD §5.3.

### 6.4 `handlers/generateTaskTitle/index.ts`

**Imports:**

- `SYSTEM_AGENT_NAME` from `@vassembly/constants`
- `taskDomain` from `@vassembly/domain-task`
- `systemAgentDomain` from `@vassembly/domain-system-agent`
- `runAgentInvokeWithTools` from `@vassembly/service-agent`
- `./normalizeGeneratedTitle`
- `./logTaskTitleEvent`
- `./types`

**Implementation flow:**

```typescript
export const generateTaskTitle = async ({
  taskId,
  userId,
}: GenerateTaskTitleHandlerInput): Promise<void> => {
  const startedAt = Date.now();

  try {
    logTaskTitleEvent({ event: 'task.title.started', taskId, userId });

    const taskResult = await taskDomain.queries.getModelById({ id: taskId });
    const task = taskResult.data;

    if (task?.title != null && task.title.trim() !== '') {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'already_set' });
      return;
    }

    if (!task?.description?.trim()) {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'empty_description' });
      return;
    }

    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const integrationCredentialId = preference.data?.integrationCredentialId;

    if (!integrationCredentialId) {
      logTaskTitleEvent({ event: 'task.title.skipped', taskId, userId, reason: 'missing_credential' });
      return;
    }

    const agentResult = await systemAgentDomain.queries.getActiveByName({
      name: SYSTEM_AGENT_NAME.TaskTitleGenerator,
    });

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: agentResult.data.id!,
      message: task.description,
      connectionOverride: { integrationCredentialId },
      toolContext: {},
    });

    const normalized = normalizeGeneratedTitle({ rawOutput: invokeResult.message });

    if (!normalized.isValid) {
      logTaskTitleEvent({
        event: 'task.title.skipped',
        taskId,
        userId,
        reason: normalized.reason,
      });
      return;
    }

    await taskDomain.commands.updateTitle({ id: taskId, title: normalized.title });

    logTaskTitleEvent({
      event: 'task.title.completed',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logTaskTitleEvent({
      event: 'task.title.failed',
      taskId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
};
```

**Key differences from `executeTask`:**

| `executeTask` | `generateTaskTitle` |
|---------------|---------------------|
| Missing credential → `fail` task | Missing credential → skip log, return |
| Uses `executionRegistry` + `abortSignal` | No registry; empty `toolContext: {}` |
| Records progress events | No progress |
| Updates status / `llmResponse` | Updates `title` only via `updateTitle` |
| Re-throws mapped errors to `fail` | Outer catch absorbs all errors |

### 6.5 `handlers/createTask/index.ts`

**Change:** Import `generateTaskTitle` from `../generateTaskTitle`. After existing `void executeTask(...).catch(...)`, add:

```typescript
void generateTaskTitle({
  taskId: result.data.id!,
  userId,
}).catch((error: unknown) => {
  logger('task.title.unhandled', {
    meta: { sessionId: 'TASK_TITLE_GENERATION', taskId: result.data.id, userId },
    data: { error: error instanceof Error ? error.message : String(error) },
  });
});
```

The `.catch` on `void` is defensive — `generateTaskTitle` should never reject, but matches `createTask` safety for `executeTask`.

### 6.6 `handlers/index.ts`

Add:

```typescript
export { generateTaskTitle } from './generateTaskTitle';
export type { GenerateTaskTitleHandlerInput } from './generateTaskTitle/types';
```

### 6.7 `services/task/README.md`

Document `generateTaskTitle` handler and create-path trigger (documentation-writer in PR 3).

---

## 7. Logging Specification

All events use `meta.sessionId: 'TASK_TITLE_GENERATION'`.

| Event | Level | When | Key fields |
|-------|-------|------|------------|
| `task.title.started` | info | Before LLM call (after early skip checks pass through to invoke path, or at handler entry per spec — **log at handler entry** before `getModelById`) | `taskId`, `userId` |
| `task.title.completed` | info | After successful `updateTitle` | `taskId`, `userId`, `durationMs` |
| `task.title.failed` | warn | Any thrown error in try block | `taskId`, `userId`, `reason`, `durationMs` |
| `task.title.skipped` | info | Early exit (see reasons below) | `taskId`, `userId`, `reason` |

**Skip reasons:**

| `reason` | Condition |
|----------|-----------|
| `already_set` | `task.title` non-null and non-empty after trim |
| `empty_description` | `description` missing or whitespace-only |
| `missing_credential` | No `integrationCredentialId` on user preference |
| `empty_output` | Normalization yields empty string |
| `invalid_output` | Normalized title > 8 words |

**Defensive wrapper log (createTask only):**

| Event | When |
|-------|------|
| `task.title.unhandled` | `generateTaskTitle` promise rejects (should not happen) |

**Note:** PRD §5.3 uses `title.generate.*` event names in one table; implementation standardizes on `task.title.*` for consistency with `task.status.*` / `task.execute.*` naming in `createTask` and `executeTask`.

---

## 8. Unchanged Layers

### 8.1 API (`apps/api`)

- `POST /tasks` response shape unchanged; `title: null` in immediate 201
- GraphQL `task` / list queries unchanged
- No new mutations or PATCH routes for title

### 8.2 Frontend (`apps/web`, `ui/api-hooks`)

| Surface | Behavior (already implemented) |
|---------|-------------------------------|
| Task list row | `task-ai-summary` line when `title` set |
| Task detail H1 | `task-detail-title` — fallback "Task details" |
| Document title | `buildDocumentTitle` uses title when present |
| Search | Case-insensitive match on `description` OR `title` |
| Post-create | List refetch may show null title until background job completes |

No polling added for title-only updates in v1.

---

## 9. Test Strategy

### 9.1 `domains/task/src/commands/updateTitle/index.test.ts`

| Test case | Assertion |
|-----------|-----------|
| Persists title to existing task | `updateTitle` returns model with `title` set |
| Fails on empty title | `ValidationError` from Zod `min(1)` |
| Fails on missing id | `ValidationError` |

**Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer (max 2)`

Mock `taskMongodbDao` / use domain test patterns from `markInProgress/index.test.ts` if present.

### 9.2 `services/task/src/handlers/generateTaskTitle/normalizeGeneratedTitle.test.ts`

| Test case | Input → Output |
|-----------|----------------|
| Strips trailing punctuation | `"Quarterly sales report."` → valid, `"Quarterly sales report"` |
| Takes first line only | `"Line one\nLine two"` → valid, `"Line one"` |
| Strips surrounding quotes | `'"Board report"'` → valid, `"Board report"` |
| Rejects > 8 words | Long string → `invalid_output` |
| Empty after normalization | `"   "` or `"..."` → `empty_output` |

### 9.3 `services/task/src/handlers/generateTaskTitle/index.test.ts`

Mock: `taskDomain`, `systemAgentDomain`, `runAgentInvokeWithTools`, `logTaskTitleEvent` or `logger`.

| Test case | Assertion |
|-----------|-----------|
| Successful path | Invokes LLM, normalizes, calls `updateTitle`, logs `task.title.completed` |
| Skips empty description | No LLM call; `task.title.skipped` / `empty_description` |
| Skips missing credential | No LLM call; `missing_credential` |
| Skips already has title | No LLM call; `already_set` |
| Fails silently when LLM throws | No rethrow; `task.title.failed` |
| Rejects title > 8 words | No `updateTitle`; `invalid_output` |
| Strips trailing punctuation | Persists normalized title |
| First line of multi-line | Persists first line only |
| Strips surrounding quotes | Persists unquoted title |

**Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer (max 2)`

### 9.4 `services/task/src/handlers/createTask/index.test.ts` (modify)

Add `vi.mock('../generateTaskTitle')` alongside existing `executeTask` mock.

| Test case | Assertion |
|-----------|-----------|
| `generateTaskTitle` called after create | `toHaveBeenCalledWith({ taskId, userId })` |
| `generateTaskTitle` failure does not affect result | Mock reject; `createTask` still returns 201-shaped response |

### 9.5 E2E — `apps/web/e2e/features/tasks/task-title-generation.feature`

**PR 4 (optional).** Translate PRD §12 Gherkin:

**Backend-focused (may use API steps + DB/wait helpers):**

- Title generation starts after create without blocking response (§12.1)
- Successful title persists (§12.1) — wait/retry for async population
- Missing credential fails silently (§12.1)
- Title generation failure does not block execution (§12.4)
- Execution failure does not block title (§12.4)

**UI-focused (reuse existing steps):**

- Title line hidden/shown on list (§12.2) — mostly covered by existing tests; E2E for **async** case: create → reload → title may appear
- Detail header / document title (§12.3) — reuse `tasksDetail.steps.ts` (`task-detail-title`)
- No loading state for pending title (§12.3)

**Workflow:** `tdd-e2e-test-writer → coder ↔ code-reviewer (max 2)`

**Dependencies:** PR 1–3 merged; valid AI credential in E2E environment for green async scenarios.

---

## 10. Phased PR Breakdown

### PR 1 — Catalog (`packages/constants`, `domains/system-agent`)

| Item | Detail |
|------|--------|
| **Packages** | `@vassembly/constants`, `@vassembly/domain-system-agent` |
| **Files** | `SystemAgentName.ts`, `seed/systemAgents.json` |
| **Dependencies** | None |
| **Tests** | None required (enum + seed data) |
| **Deploy** | Re-seed system agents in target environments |

### PR 2 — Domain command (`domains/task`)

| Item | Detail |
|------|--------|
| **Packages** | `@vassembly/domain-task` |
| **Files** | `commands/updateTitle/*`, `commands/index.ts`, `README.md` |
| **Dependencies** | None (can parallel with PR 1) |
| **Tests** | `updateTitle/index.test.ts` |

### PR 3 — Service handler + wiring (`services/task`)

| Item | Detail |
|------|--------|
| **Packages** | `@vassembly/service-task` |
| **Files** | `handlers/generateTaskTitle/*`, `handlers/createTask/index.ts`, `handlers/index.ts`, `createTask/index.test.ts`, `README.md` |
| **Dependencies** | PR 1 (enum + seeded agent for integration), PR 2 (`updateTitle` command) |
| **Tests** | Handler tests, normalization tests, createTask wiring tests |

### PR 4 — E2E (optional, `apps/web`)

| Item | Detail |
|------|--------|
| **Packages** | `apps/web` |
| **Files** | `e2e/features/tasks/task-title-generation.feature`, new steps only if needed |
| **Dependencies** | PR 1–3 |
| **Tests** | Playwright BDD — PRD §12 |

---

## 11. Todo Plan

1. **`@vassembly/constants`** — [Type: utility extension]
   - Changes: Add `TaskTitleGenerator` to `SYSTEM_AGENT_NAME`
   - Files: `packages/constants/src/SystemAgentName.ts`
   - Workflow: `coder → Done`
   - Dependencies: None

2. **`@vassembly/domain-system-agent`** — [Type: domain extension]
   - Changes: Add Task title generator seed entry
   - Files: `domains/system-agent/seed/systemAgents.json`
   - Workflow: `coder → Done`
   - Dependencies: None (pair with Todo 1 in PR 1)

3. **`@vassembly/domain-task`** — [Type: domain extension]
   - Changes: `updateTitle` command using `updateDbById`
   - Files: `domains/task/src/commands/updateTitle/index.ts`, `types.ts`, `index.test.ts`, `commands/index.ts`, `README.md`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer`
   - Dependencies: None

4. **`@vassembly/service-task`** — [Type: service extension]
   - Changes: `generateTaskTitle` handler, `normalizeGeneratedTitle`, `logTaskTitleEvent`, wire `createTask`, export handler
   - Files: `services/task/src/handlers/generateTaskTitle/**`, `handlers/createTask/index.ts`, `handlers/createTask/index.test.ts`, `handlers/index.ts`, `README.md`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer`
   - Dependencies: Todos 1, 2, 3

5. **`apps/web` E2E** — [Type: app / E2E tests]
   - Changes: Playwright BDD for async title generation (PRD §12)
   - Files: `apps/web/e2e/features/tasks/task-title-generation.feature`, steps as needed
   - Workflow: `tdd-e2e-test-writer → coder ↔ code-reviewer (max 2)`
   - Dependencies: PRD exists; Todo 4 for green runs in CI with live LLM/credential

---

## Appendix: Coordination with parallel work

**Pause / Resume / Retry** (`pause-resume-task`) adds execution registry and `abortSignal` to `executeTask`. Title generation intentionally **does not** use the registry — no merge conflict expected beyond shared `createTask` file (add second void call next to existing `executeTask` call).

**Real-time execution progress** and **progress-event-ai-integration** are unrelated to title generation — no shared write paths.
