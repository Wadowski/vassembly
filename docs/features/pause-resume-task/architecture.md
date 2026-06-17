# Pause, Resume & Retry Task — Architecture

**Document status:** Engineering handoff  
**Last updated:** 2026-06-16  
**Feature slug:** pause-resume-task  
**Related docs:** [PRD](./prd.md) · [UI design](./ui-design.md) · [Async LLM Task Execution](../async-llm-task-execution/architecture.md) · [Real-Time Execution Progress](../real-time-execution-progress/prd.md) · [Progress Event AI Integration](../progress-event-ai-integration/architecture.md)

---

## Table of Contents

1. [Analysis](#1-analysis)
2. [Architecture Overview Diagram](#2-architecture-overview-diagram)
3. [Package Touch Map](#3-package-touch-map)
4. [Domain Layer (`domains/task`)](#4-domain-layer-domainstask)
5. [Execution Registry (`services/task`)](#5-execution-registry-servicestask)
6. [Service Handlers (`services/task`)](#6-service-handlers-servicestask)
7. [`runAgentInvokeWithTools` (`services/agent`)](#7-runagentinvokewithtools-servicesagent)
8. [LangChain Tool Loop (`packages/client-langchain`)](#8-langchain-tool-loop-packagesclient-langchain)
9. [API Layer (`apps/api`)](#9-api-layer-appsapi)
10. [Frontend (`ui/api-hooks` + `apps/web`)](#10-frontend-uiapi-hooks--appsweb)
11. [Test Strategy](#11-test-strategy)
12. [Phased PR Breakdown](#12-phased-pr-breakdown)
13. [Todo Plan](#13-todo-plan)

---

## 1. Analysis

### 1.1 Librarian findings (incorporated)

| Finding | Implication |
|---------|-------------|
| `@vassembly/domain-task`, `@vassembly/service-task`, task API, and web task UI **already exist** | Extend in place; **no new packages** |
| `TaskStatus` has 4 values; **no `paused`** | Add enum value + commands + DTO/GraphQL |
| `executeTask` → `runAgentInvokeWithTools` → domain invoke → `client-langchain` is proven | Extend with abort signal + resume mode |
| **No** `AbortController` anywhere in execution path | Net-new cooperative cancellation |
| `task-progress` events are immutable checkpoint source | Resume reads `getModelByTaskId`; no new checkpoint storage |
| `createTask` fire-and-forget pattern is the template for resume/retry triggers | Same `void executeTask(...).catch(logger)` |
| `complete` / `fail` / `markInProgress` commands use `updateDbById` + Zod | Mirror for `pauseTask` / `resumeTask` / `retryTask` with status guards |
| `ui-design.md` resolves icon choices (OQ-6 in PRD) | `ButtonPlayIcon`, `ButtonLoopArrowIcon`, `ButtonStopIcon` for badge |
| `domain-ai-integration` wraps `client-langchain` | Signal must thread through `ModeledProviderInvokeParams` → `AiProviderInvokeParams` |

### 1.2 Codebase audit — what exists vs missing

| Layer | Exists | Missing |
|-------|--------|---------|
| `domains/task` | `TaskStatus`, `TaskModel`, `create`/`complete`/`fail`/`markInProgress`, DTO, GraphQL, `toTaskResponse` | `Paused` status, `pausedAt`, `pauseTask`/`resumeTask`/`retryTask` commands |
| `domains/task-progress` | `ProgressEventModel`, `recordProgressEvent`, `getModelByTaskId`, `finalizeTaskProgress` | Optional read helper for last completed event (service-layer util is sufficient) |
| `domains/ai-integration` | `ModeledProviderClient.invoke`, `resolveAndBuildClient` | Optional `signal` on invoke params |
| `services/task` | `createTask`, `executeTask`, `getTask`, progress recording | Registry, `pauseTask`/`resumeTask`/`retryTask`, resume message builder, abort error handling |
| `services/agent` | `runAgentInvokeWithTools`, `useAgent` recursion via `toolContext` spread | `AbortSignal` on `InternalToolContext` + invoke chain |
| `packages/client-langchain` | `runToolCallLoop`, `invokeWithChatModel` | Abort checks between iterations |
| `packages/errors` | `ConflictError` (409) | `ExecutionPausedError` (or domain-specific abort error) |
| `apps/api` | `POST /tasks`, GraphQL task resolvers | `PATCH /tasks/:id/pause\|resume\|retry` |
| `ui/api-hooks` | `useCreateTask`, `useTaskDetail`, `TaskStatus` enum | Pause/resume/retry hooks, `Paused` enum, GraphQL field |
| `apps/web` | Task detail page, polling (in-progress only), status display | Header action buttons, paused AI copy, badge styling |

### 1.3 Reuse vs new (by layer)

| Layer | Reuse | New |
|-------|-------|-----|
| `domains/task` | `updateDbById` pattern from `complete`/`fail`; `toTaskResponse`; GraphQL registration | `pauseTask`, `resumeTask`, `retryTask` with atomic status guards |
| `domains/task-progress` | `getModelByTaskId` for checkpoint reads | Nothing required (orphaned events left as-is) |
| `domains/ai-integration` | `getModeledProviderClient` wrapper | Pass-through `signal` on invoke params |
| `services/task` | `createTask` fire-and-forget; `getTask` ownership; `mapExecutionError`; progress callback factory | Registry, three handlers, `buildResumeMessage`, execution mode on `executeTask` |
| `services/agent` | `InternalToolContext` spread in `useAgent` | `abortSignal` field + pre-invoke checks |
| `packages/client-langchain` | Existing loop structure | `signal` + optional `shouldAbort` callback |
| `apps/api` | `create.ts` auth/rate-limit pattern; `system-agents/update.ts` PATCH pattern | Three route files + shared schema extension |
| `ui/api-hooks` | `useCreateTask` REST hook shape | Three PATCH hooks |
| `apps/web` | `TaskDetailHeader`, `taskStatusDisplay`, polling hook | `TaskDetailHeaderActions`, paused UI branches |

### 1.4 Resolved open questions

#### OQ-1: Cancellation mechanism → **Option C (Hybrid)**

| Mechanism | Role |
|-----------|------|
| **Primary:** in-memory `AbortSignal` from execution registry | Fast cooperative cancel between tool-loop iterations and before nested `useAgent` calls |
| **Fallback:** DB status poll via `shouldAbort()` callback | Catches edge cases where signal propagation is delayed; supports pause-after-restart when execution is already gone but user clicks pause on orphaned `in-progress` |

**Rationale:** Pure DB polling alone is too slow for p95 ≤ 2s pause latency (NFR-P1). Pure in-memory signal alone fails silently after process restart (PRD §6.4). Hybrid gives fast cancel in the common case and durable semantics when the registry is empty.

#### OQ-2: Execution registry → **In-memory `Map<taskId, ExecutionHandle>`**

```typescript
interface ExecutionHandle {
  abortController: AbortController;
  registeredAt: Date;
}

interface ExecutionRegistry {
  register: (params: { taskId: string }) => AbortSignal;
  abort: (params: { taskId: string }) => boolean;
  deregister: (params: { taskId: string }) => void;
  getSignal: (params: { taskId: string }) => AbortSignal | undefined;
}
```

**Rationale:** Minimal surface area. One `AbortController` per task covers root + all nested `useAgent` invocations when the same signal is placed on `toolContext`. Richer handles (execution generation counters, promise tracking) are unnecessary for v1 in-process execution.

#### OQ-3: Orphaned `started` progress events → **Option A (Leave as-is)**

**Rationale:** PRD §6.1 explicitly allows orphaned `started` events. Resume checkpoint uses the **last `completed` event**, not the orphaned `started` step. Writing synthetic `failed` or new `paused` event types adds write-path complexity and a new enum value in `task-progress` with no read-side benefit for v1.

#### OQ-4: Resume implementation → **Option A (Context injection via progress events)**

Re-invoke the **root assigned agent** with an augmented message built from:

1. Original task `description`
2. Ordered summary of all `completed` progress events (input + generated response per agent invocation)
3. Explicit instruction: *continue from where you left off; do not repeat completed steps*

**Not** option B (skip N steps in agent graph) — there is no fixed step graph; execution is a dynamic LangChain tool loop. **Not** option C — rejected by product.

Checkpoint query: scan `taskProgress.events` for the last event where `state === 'completed'`. If none exist, resume behaves like fresh execution (original description only). Prior events remain immutable; new events append on resume.

#### OQ-5: `pausedAt` timestamp → **Add explicit field**

Add `pausedAt?: Date | null` to `TaskModel`, mirroring `startedAt` / `completedAt` / `failedAt`.

**Rationale:** Consistent timestamp convention; API contract (PRD §7.2) already documents `pausedAt`; avoids overloading `updatedAt` (which changes on any entity touch). **Not cleared** on resume — preserves last-pause time for debugging and future UI. Cleared only implicitly irrelevant once task reaches terminal state.

#### OQ-6: Concurrent pause/resume race → **Per-taskId async mutex + atomic status-guard updates + 409**

| Rule | Behavior |
|------|----------|
| **Serialization** | `services/task` maintains `Map<taskId, Promise<void>>` mutex (or async-mutex utility) wrapping `pauseTask` / `resumeTask` / `retryTask` handler bodies |
| **Atomic writes** | Domain commands use MongoDB `findOneAndUpdate` with `{ status: expectedStatus }` filter; return null → handler throws `ConflictError` |
| **Pause vs complete race** | Whichever atomic update succeeds first wins; loser gets 409 (`TASK_NOT_PAUSABLE`) or no-op exit in `executeTask` |
| **Idempotent pause** | If status already `paused` → 200, no abort signal |
| **Idempotent resume** | If status already `in-progress` → 200, **do not** re-fire `executeTask` |
| **Retry on in-progress** | 409 `TASK_NOT_RETRYABLE` |

**Rationale:** Mutex prevents duplicate execution triggers from concurrent resume clicks. Atomic DB guards ensure terminal states win over in-flight pause without distributed locks.

---

## 2. Architecture Overview Diagram

### 2.1 End-to-end flows

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              PAUSE FLOW                                           │
└──────────────────────────────────────────────────────────────────────────────────┘

 apps/web                apps/api                 service-task              executeTask (async)
    │                        │                         │                          │
    │ PATCH /tasks/:id/pause │                         │                          │
    ├───────────────────────►│ pauseTask handler       │                          │
    │                        ├────────────────────────►│ acquire mutex            │
    │                        │                         │ verify owner + status    │
    │                        │                         │ registry.abort(taskId)───┼──► signal.abort()
    │                        │                         │ domain.pauseTask (DB)    │     loop exits
    │                        │                         │ registry.deregister        │
    │                        │◄────────────────────────┤ return TaskResponse      │ catch ExecutionPausedError
    │◄───────────────────────┤ 200 status: paused      │ release mutex            │ → return (no fail/complete)
    │ update local task      │                         │                          │

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              RESUME FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────────┘

 apps/web                apps/api                 service-task              executeTask (async)
    │                        │                         │                          │
    │ PATCH /tasks/:id/resume│                         │                          │
    ├───────────────────────►│ resumeTask handler      │                          │
    │                        ├────────────────────────►│ acquire mutex            │
    │                        │                         │ verify paused            │
    │                        │                         │ domain.resumeTask (DB)   │
    │                        │                         │ void executeTask({       │
    │                        │                         │   mode: 'resume'         │
    │                        │                         │ })                       │
    │                        │◄────────────────────────┤ 200 status: in-progress  │
    │◄───────────────────────┤                         │ release mutex            │
    │ polling resumes (3s)   │                         │                          ├──► getModelByTaskId (progress)
    │                        │                         │                          ├──► buildResumeMessage()
    │                        │                         │                          ├──► registry.register
    │                        │                         │                          └──► runAgentInvokeWithTools
    │                        │                         │                               → complete / fail

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              RETRY FLOW                                           │
└──────────────────────────────────────────────────────────────────────────────────┘

 Same as RESUME except:
   - Precondition: status is `paused` OR `failed`
   - domain.retryTask clears errorMessage, errorCode, failedAt
   - executeTask mode: 'retry' → original description (no checkpoint context)
   - Prior progress events remain in DB; new events append
```

### 2.2 Status lifecycle (extended)

```mermaid
stateDiagram-v2
    [*] --> in-progress : createTask / resume / retry
    in-progress --> paused : PATCH pause (+ abort signal)
    paused --> in-progress : PATCH resume (checkpoint)
    paused --> in-progress : PATCH retry (from scratch)
    failed --> in-progress : PATCH retry (from scratch)
    in-progress --> done : executeTask complete
    in-progress --> failed : executeTask fail
    paused --> paused : idempotent pause
    done --> [*]
    failed --> [*]
```

### 2.3 Execution registry lifecycle

```
                    ┌─────────────────────────────────────────┐
                    │         executeTask starts               │
                    │  registry.register(taskId)               │
                    │  → new AbortController                   │
                    │  → signal on toolContext                 │
                    └──────────────────┬──────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │ Normal complete │       │  pauseTask      │       │  executeTask    │
  │ or fail         │       │  registry.abort │       │  catch (abort)  │
  └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
           │                         │                           │
           └─────────────────────────┼───────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │  finally: registry.deregister(taskId)    │
                    │  Map entry removed                       │
                    └─────────────────────────────────────────┘

  Nested useAgent: toolContext.abortSignal is spread unchanged → same controller
```

### 2.4 Abort signal propagation chain

```
executeTask
  └─ toolContext.abortSignal + shouldAbort
       └─ runAgentInvokeWithTools
            └─ domain-agent.invoke / domain-system-agent.invoke
                 └─ modeledProviderClient.invoke({ signal })
                      └─ client-langchain.invokeWithChatModel
                           └─ runToolCallLoop  ← check signal / shouldAbort each iteration
                                └─ internal tool handler (useAgent)
                                     └─ runAgentInvokeWithTools (same signal via spread)
```

---

## 3. Package Touch Map

| Package / path | Files changed | Role | New / Modified |
|----------------|---------------|------|----------------|
| `domains/task` | `src/model/model.ts`, `dto.ts`, `graphql.ts`, `toTaskResponse.ts`, `commands/pauseTask/`, `commands/resumeTask/`, `commands/retryTask/`, `commands/index.ts`, `README.md` | `Paused` status, `pausedAt`, three commands, DTO/GraphQL | Modified + New commands |
| `domains/task-progress` | — (read-only via existing queries) | Checkpoint source | — |
| `domains/ai-integration` | `src/clients/langchain.ts` | Pass `signal` through modeled client | Modified |
| `domains/agent` | `src/commands/invoke/types.ts` (optional) | Forward `signal` to client | Modified |
| `domains/system-agent` | `src/commands/invoke/types.ts` (optional) | Forward `signal` to client | Modified |
| `packages/errors` | `src/ExecutionPausedError.ts`, `src/index.ts` | Distinguish pause abort from provider failure | New |
| `packages/client-langchain` | `src/types.ts`, `src/operations/runToolCallLoop.ts`, `src/operations/invokeWithChatModel.ts` | Abort checks in tool loop | Modified |
| `services/task` | `src/executionRegistry/`, `src/handlers/pauseTask/`, `resumeTask/`, `retryTask/`, `executeTask/` (index, types, buildResumeMessage, mapExecutionError), `src/handlers/index.ts`, `README.md` | Registry, handlers, resume logic | Modified + New |
| `services/agent` | `src/helpers/internalTools/types.ts`, `runAgentInvokeWithTools.ts`, `useAgent/index.ts` | Signal on context + propagation | Modified |
| `apps/api` | `src/routes/tasks/pause.ts`, `resume.ts`, `retry.ts`, `index.ts`, `create.ts` (shared schema) | REST PATCH routes | New + Modified |
| `ui/api-hooks` | `src/tasks/types.ts`, `http/usePauseTask.ts`, `useResumeTask.ts`, `useRetryTask.ts`, `graphql/getTaskQuery.ts`, `mapTaskData.ts`, `index.ts` | Client hooks + types | New + Modified |
| `apps/web` | `app/tasks/[id]/_components/TaskDetailHeader.tsx`, `TaskDetailHeaderActions/`, `hooks/useTaskDetailActions/`, `TaskDetailAiResponse/`, `TaskStatusBadge.tsx`, `useTaskDetailPage.ts`, `TaskDetailPage.module.scss`, `app/_components/TaskList/taskStatusDisplay.ts`, `taskStatusStyles.*`, `types.ts`, `TaskListItem.tsx` | UI controls + paused state | Modified + New |
| `apps/web/e2e` | `e2e/features/tasks/pause-resume-retry.feature` | Gherkin acceptance | New |

---

## 4. Domain Layer (`domains/task`)

### 4.1 Updated `TaskStatus` enum

```typescript
export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Paused = 'paused',       // NEW
  Done = 'done',
  Failed = 'failed',
}
```

### 4.2 Updated `TaskModel`

```typescript
export class TaskModel extends Model {
  // …existing fields…
  pausedAt?: Date | null;  // NEW — set on pause, not cleared on resume
}
```

### 4.3 Command: `pauseTask`

**Path:** `domains/task/src/commands/pauseTask/`

```typescript
export interface PauseTaskCommandInput {
  taskId: string;
}

// Atomic update: { id: taskId, status: 'in-progress' } → { status: 'paused', pausedAt: now }
// Returns updated model or throws NotFoundError / ConflictError
```

| Field updated | Value |
|---------------|-------|
| `status` | `TaskStatus.Paused` |
| `pausedAt` | `new Date()` |

**Zod DB schema:** `{ status: literal('paused'), pausedAt: date }`

**Note:** Idempotent pause (already paused) is handled at **service layer** — domain command only matches `in-progress → paused`.

### 4.4 Command: `resumeTask`

**Path:** `domains/task/src/commands/resumeTask/`

```typescript
export interface ResumeTaskCommandInput {
  taskId: string;
}

// Atomic update: { id: taskId, status: 'paused' } → { status: 'in-progress' }
// Does NOT invoke LLM — service layer triggers executeTask
```

| Field updated | Value |
|---------------|-------|
| `status` | `TaskStatus.InProgress` |

Does **not** modify `pausedAt`, `startedAt`, or progress data.

### 4.5 Command: `retryTask`

**Path:** `domains/task/src/commands/retryTask/`

```typescript
export interface RetryTaskCommandInput {
  taskId: string;
}

// Atomic update: { id: taskId, status: 'paused' | 'failed' } → in-progress + clear errors
```

| Field updated | Value |
|---------------|-------|
| `status` | `TaskStatus.InProgress` |
| `errorMessage` | `null` |
| `errorCode` | `null` |
| `failedAt` | `null` |

### 4.6 GraphQL schema

Add to `gqlTaskSchema` in `domains/task/src/model/graphql.ts`:

```typescript
pausedAt: t.exposeString('pausedAt', { nullable: true }),
```

`status` field already exposes string — clients accept `'paused'` without schema enum change.

### 4.7 DTO / mapper

Extend `TaskResponse` in `dto.ts`:

```typescript
pausedAt: string | null;
```

Update `toTaskResponse`:

```typescript
pausedAt: toNullableIsoString(task.pausedAt),
```

### 4.8 Implementation pattern

Use MongoDB conditional `findOneAndUpdate` (via DAO or thin wrapper in each command) rather than blind `updateDbById`, so status guards are atomic:

```typescript
// Pseudocode — pauseTask
const result = await taskMongodbDao.findOneAndUpdate(
  { id: taskId, status: TaskStatus.InProgress },
  { $set: { status: TaskStatus.Paused, pausedAt: new Date() } },
);
if (!result) throw new ConflictError('Task is not in-progress');
```

Follow existing subfolder layout: `index.ts`, `types.ts`, `index.test.ts` per command.

---

## 5. Execution Registry (`services/task`)

### 5.1 Location

`services/task/src/executionRegistry/index.ts` — module-scoped singleton (in-process only; Phase 2 worker will replace).

### 5.2 Interface

```typescript
export interface ExecutionRegistry {
  register: (params: { taskId: string }) => AbortSignal;
  abort: (params: { taskId: string }) => boolean;
  deregister: (params: { taskId: string }) => void;
  getSignal: (params: { taskId: string }) => AbortSignal | undefined;
}

export const executionRegistry: ExecutionRegistry = createExecutionRegistry();
```

### 5.3 Lifecycle rules

| Event | Action |
|-------|--------|
| `executeTask` enters try block (after preflight validation) | `register(taskId)` — if entry exists, abort previous controller first (safety) |
| `executeTask` finally block | `deregister(taskId)` |
| `pauseTask` handler (in-progress task) | `abort(taskId)` before or after DB pause (order: abort first for faster cancel) |
| `pauseTask` on already-paused | No abort (idempotent) |
| Process crash / restart | Map empty; DB `paused` status durable |

### 5.4 Nested `useAgent` propagation

Add to `InternalToolContext`:

```typescript
abortSignal?: AbortSignal;
shouldAbort?: () => Promise<boolean>;
```

`executeTask` sets both on root `toolContext`. `useAgent` spreads `...context` — nested invocations inherit the same signal automatically.

---

## 6. Service Handlers (`services/task`)

### 6.1 Extended `ExecuteTaskParams`

```typescript
export enum TaskExecutionMode {
  Fresh = 'fresh',
  Resume = 'resume',
  Retry = 'retry',
}

export interface ExecuteTaskParams {
  taskId: string;
  userId: string;
  mode?: TaskExecutionMode; // default: Fresh
}
```

### 6.2 Updated `executeTask`

| Step | Fresh (create) | Resume | Retry |
|------|----------------|--------|-------|
| Load task | ✓ | ✓ | ✓ |
| Validate agent assigned | ✓ | ✓ | ✓ |
| `markInProgress` | ✓ | Skip (already in-progress) | Skip |
| Resolve credential | ✓ | ✓ | ✓ |
| Build message | `task.description` | `buildResumeMessage({ description, events })` | `task.description` |
| Register + invoke | ✓ | ✓ | ✓ |
| On success | `complete` | `complete` | `complete` |
| On `ExecutionPausedError` | — | Return silently | — |
| On other error | `fail` | `fail` | `fail` |
| `finalizeTaskProgress` | On complete/fail only | On complete/fail only | On complete/fail only |

**Abort error handling** — extend `mapExecutionError` or add guard in catch:

```typescript
if (error instanceof ExecutionPausedError) {
  logTaskTransition({ event: 'task.execution.paused', taskId, userId });
  return; // status already paused; skip fail + skip finalize
}
```

**Registry wrapper:**

```typescript
const abortSignal = executionRegistry.register({ taskId });
try {
  await runAgentInvokeWithTools({
    // …
    toolContext: {
      abortSignal,
      shouldAbort: async () => {
        const { data } = await taskDomain.queries.getModelById({ id: taskId });
        return data?.status === TaskStatus.Paused;
      },
      // …existing fields…
    },
  });
} finally {
  executionRegistry.deregister({ taskId });
}
```

### 6.3 `buildResumeMessage`

**Path:** `services/task/src/handlers/executeTask/buildResumeMessage.ts`

```typescript
export interface BuildResumeMessageParams {
  description: string;
  events: ProgressEventModel[];
}

export const buildResumeMessage = ({
  description,
  events,
}: BuildResumeMessageParams): string => {
  const completedEvents = events.filter((e) => e.state === ProgressEventState.Completed);
  if (completedEvents.length === 0) {
    return description;
  }

  const stepsSummary = completedEvents
    .map((event, index) => {
      const input = event.inputMessages ?? '';
      const output = event.generatedResponse ?? '';
      return `Step ${index + 1} (agent ${event.agentId}):\nInput: ${input}\nOutput: ${output}`;
    })
    .join('\n\n');

  return [
    description,
    '',
    '--- Previously completed execution steps ---',
    stepsSummary,
    '',
    'Continue from where execution left off. Do not repeat the completed steps above.',
  ].join('\n');
};
```

Load events via `taskProgressDomain.queries.getModelByTaskId({ taskId })`.

### 6.4 `pauseTask` handler

**Path:** `services/task/src/handlers/pauseTask/`

```
1. acquireTaskMutex(taskId)
2. getModelById + verify task.userId === userId (else NotFoundError)
3. if status === paused → return toTaskResponse (idempotent)
4. if status !== in-progress → throw ConflictError('TASK_NOT_PAUSABLE')
5. executionRegistry.abort({ taskId })
6. taskDomain.commands.pauseTask({ taskId })
7. releaseTaskMutex(taskId)
8. return toTaskResponse
```

### 6.5 `resumeTask` handler

```
1. acquireTaskMutex(taskId)
2. ownership check
3. if status === in-progress → return toTaskResponse (idempotent, NO executeTask)
4. if status !== paused → throw ConflictError('TASK_NOT_RESUMABLE')
5. taskDomain.commands.resumeTask({ taskId })
6. void executeTask({ taskId, userId, mode: Resume }).catch(logger)
7. release mutex
8. return toTaskResponse
```

### 6.6 `retryTask` handler

```
1. acquireTaskMutex(taskId)
2. ownership check
3. if status === in-progress → throw ConflictError('TASK_NOT_RETRYABLE')
4. if status not in (paused, failed) → throw ConflictError('TASK_NOT_RETRYABLE')
5. taskDomain.commands.retryTask({ taskId })
6. void executeTask({ taskId, userId, mode: Retry }).catch(logger)
7. release mutex
8. return toTaskResponse
```

### 6.7 Task action mutex

**Path:** `services/task/src/handlers/shared/acquireTaskMutex.ts`

Simple per-taskId promise chain — no new package:

```typescript
const locks = new Map<string, Promise<void>>();

export const withTaskMutex = async <T>(
  params: { taskId: string; fn: () => Promise<T> },
): Promise<T> => { /* queue on taskId */ };
```

---

## 7. `runAgentInvokeWithTools` (`services/agent`)

### 7.1 Type changes

Extend `InternalToolContext` and `RunAgentInvokeWithToolsParams` (via toolContext):

```typescript
abortSignal?: AbortSignal;
shouldAbort?: () => Promise<boolean>;
```

### 7.2 Pre-invoke abort check

At top of `runAgentInvokeWithTools`, before credential resolve:

```typescript
if (toolContext.abortSignal?.aborted) {
  throw new ExecutionPausedError();
}
if (toolContext.shouldAbort && (await toolContext.shouldAbort())) {
  throw new ExecutionPausedError();
}
```

Repeat check before recording `started` progress and before calling domain invoke.

### 7.3 Domain invoke — thread signal

Pass `signal: toolContext.abortSignal` into `agentDomain.commands.invoke` / `systemAgentDomain.commands.invoke` params (extend invoke command types to accept optional `signal`).

### 7.4 `useAgent` nested propagation

`useAgent` already spreads `toolContext`:

```typescript
toolContext: {
  ...context,
  recursionDepth: context.recursionDepth + 1,
  parentAgentId: context.callerAgentId,
  // abortSignal + shouldAbort inherited via spread
},
```

Add abort check at start of `useAgent` before `runAgentInvokeWithTools`.

### 7.5 Orphaned events (OQ-3)

When pause aborts mid-invocation, the `started` progress event already written will **not** receive a matching `completed`/`failed`. **Do not** write a synthetic failure in the catch block for `ExecutionPausedError` — leave orphaned. The progress panel shows it as an in-flight step; resume continues from last `completed`.

---

## 8. LangChain Tool Loop (`packages/client-langchain`)

### 8.1 Type extensions

```typescript
// packages/client-langchain/src/types.ts
export interface AiProviderInvokeParams {
  // …existing…
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
}

// packages/client-langchain/src/operations/runToolCallLoop.ts
export interface RunToolCallLoopParams {
  // …existing…
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
}
```

### 8.2 Abort check placement

At the **start of each iteration** in `runToolCallLoop`:

```typescript
const assertNotAborted = async (): Promise<void> => {
  if (signal?.aborted) {
    throw new ExecutionPausedError();
  }
  if (shouldAbort && (await shouldAbort())) {
    throw new ExecutionPausedError();
  }
};

for (let iteration = 0; iteration < maxIterations; iteration += 1) {
  await assertNotAborted();
  const response = await modelWithTools.invoke(currentMessages);
  // …
  for (const toolCall of toolCalls) {
    await assertNotAborted();
    const toolContent = await tool.invoke(toolCall.args);
    // …
  }
}
```

Also check before single-shot `chatModel.invoke` path in `invokeWithChatModel` (no-tools branch).

### 8.3 Error type

Add `ExecutionPausedError` to `@vassembly/errors` — extends `CommonError` with a distinct `code: 'EXECUTION_PAUSED'`. **Not** a 409/500 at the HTTP layer — caught inside `executeTask` before reaching API.

### 8.4 LangChain native abort

`{ signal }` is passed to every LangChain `model.invoke(messages, { signal })` call in `invokeWithChatModel` (no-tools path) and `runToolCallLoop` (tool-loop path). When `executionRegistry.abort()` fires, the in-flight HTTP request is cancelled by the provider client; LangChain/provider errors named `AbortError` are mapped to `ExecutionPausedError` in `mapInvokeAbortError`.

Cooperative checks (`assertNotAborted` with `signal` + `shouldAbort`) still run at loop iteration boundaries and **before each tool invocation**, so pause blocks new tool steps even when no LLM call is active.

**MCP tool limitation:** abort checks run before `tool.invoke()`. An MCP tool already executing its own HTTP/SDK call is not cancelled mid-flight — pause takes effect before the next LLM iteration or tool step. Nested `useAgent` calls share the same `AbortSignal`, so their LLM requests are cancelled mid-request.

**Partial output on abort:** LangChain may expose partial model output on abort in newer versions (`ModelAbortError.partialOutput`). Not consumed in v1 — orphaned `started` progress events remain as documented in §7.4.

---

## 9. API Layer (`apps/api`)

### 9.1 New routes

| Route | File | Service handler |
|-------|------|-----------------|
| `PATCH /tasks/:id/pause` | `apps/api/src/routes/tasks/pause.ts` | `taskService.pauseTask` |
| `PATCH /tasks/:id/resume` | `apps/api/src/routes/tasks/resume.ts` | `taskService.resumeTask` |
| `PATCH /tasks/:id/retry` | `apps/api/src/routes/tasks/retry.ts` | `taskService.retryTask` |

Mount under tasks router prefix (same as create). Register in `apps/api/src/routes/tasks/index.ts`.

### 9.2 Route pattern

Follow `system-agents/update.ts`:

```typescript
export const taskPauseRoute = defineRoute({
  method: 'PATCH',
  url: '/:id/pause',
  schema: {
    response: withErrorResponses(taskResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const taskId = params?.id;
    if (!taskId) throw new WrongParamError('Missing task id');
    return taskService.pauseTask({ userId, taskId });
  },
});
```

### 9.3 Shared response schema

Extend `taskResponseSchema` in `create.ts` (or extract to `schemas.ts`):

```typescript
pausedAt: z.string().datetime().nullable(),
```

### 9.4 Error mapping

| Condition | HTTP | errorCode |
|-----------|------|-----------|
| Not authenticated | 401 | — |
| Not found / not owned | 404 | — |
| `ConflictError` pause | 409 | `TASK_NOT_PAUSABLE` |
| `ConflictError` resume | 409 | `TASK_NOT_RESUMABLE` |
| `ConflictError` retry | 409 | `TASK_NOT_RETRYABLE` |

Attach `errorCode` in error body per existing `withErrorResponses` pattern.

---

## 10. Frontend (`ui/api-hooks` + `apps/web`)

### 10.1 `ui/api-hooks` — REST hooks

**Path:** `ui/api-hooks/src/tasks/http/`

| Hook | Method | Path |
|------|--------|------|
| `usePauseTask` | PATCH | `/tasks/${id}/pause` |
| `useResumeTask` | PATCH | `/tasks/${id}/resume` |
| `useRetryTask` | PATCH | `/tasks/${id}/retry` |

Mirror `useCreateTask` outcome shape: `{ ok: true, task } | { ok: false, error }`.

### 10.2 Types

Add to `ui/api-hooks/src/tasks/types.ts`:

```typescript
export enum TaskStatus {
  // …
  Paused = 'paused',
}

// TaskResponse / TaskDto / GraphQLTaskRow:
pausedAt: string | null;
```

Update `getTaskQuery.ts` selection set and `mapTaskData.ts` validation.

### 10.3 `apps/web` — component changes

| File | Change |
|------|--------|
| `TaskDetailHeader.tsx` | Wrap badge in `.utilityHeaderEnd`; render `TaskDetailHeaderActions` |
| `TaskDetailHeaderActions/` (new) | Visibility matrix, button specs per ui-design.md |
| `hooks/useTaskDetailActions/` (new) | Compose hooks, loading flags, `setTask` on success, snackbar on error |
| `useTaskDetailPage.ts` | Pass `setTask` to action hook; polling already excludes non-`InProgress` |
| `TaskDetailAiResponse.tsx` | Paused copy branch |
| `taskStatusDisplay.ts` | `Paused` → `ButtonStopIcon`, `'warning'`, `'Paused'` |
| `taskStatusStyles.module.scss` | `.statusWarning { color: $color-warning; }` |
| `taskStatusStyles.ts` | Add `warning` key |
| `types.ts` | `ColorValue` includes `'warning'` |
| `TaskStatusBadge.tsx` | `role="status"`, `aria-live="polite"` |
| `TaskListItem.tsx` | Same badge accessibility |
| `TaskDetailPage.module.scss` | `.utilityHeaderEnd`, `.headerActionButtons` |

### 10.4 Icons (PRD OQ-6 / UI design §12)

| Element | Icon |
|---------|------|
| Pause button | `ButtonPauseIcon` |
| Resume button | `ButtonPlayIcon` |
| Retry button | `ButtonLoopArrowIcon` |
| Paused badge | `ButtonStopIcon` |

### 10.5 Polling

No hook change required — `usePolling` enabled only when `task?.status === TaskStatus.InProgress`. Adding `Paused` enum value does not affect the guard.

---

## 11. Test Strategy

### 11.1 Unit tests

| File | What to test |
|------|--------------|
| `domains/task/src/commands/pauseTask/index.test.ts` | in-progress → paused + pausedAt; conflict when not in-progress |
| `domains/task/src/commands/resumeTask/index.test.ts` | paused → in-progress; conflict when not paused |
| `domains/task/src/commands/retryTask/index.test.ts` | paused/failed → in-progress + error fields cleared; conflict otherwise |
| `services/task/src/executionRegistry/index.test.ts` | register/abort/deregister; re-register aborts previous |
| `services/task/src/handlers/executeTask/buildResumeMessage.test.ts` | No completed events → original description; with events → augmented message |
| `services/task/src/handlers/executeTask/index.test.ts` | Fresh/resume/retry modes; ExecutionPausedError → no fail; registry cleanup in finally |
| `services/task/src/handlers/pauseTask/index.test.ts` | Idempotent pause; 409 when done; abort called |
| `services/task/src/handlers/resumeTask/index.test.ts` | Idempotent in-progress; fires executeTask once |
| `services/task/src/handlers/retryTask/index.test.ts` | 409 when in-progress; fires executeTask with retry mode |
| `services/agent/.../runAgentInvokeWithTools.test.ts` | Signal aborted before invoke → ExecutionPausedError |
| `services/agent/.../useAgent/index.test.ts` | Nested call receives parent abortSignal |
| `packages/client-langchain/src/operations/runToolCallLoop.test.ts` | Abort between iterations stops loop |
| `apps/api/src/routes/tasks/pause.test.ts` | Auth, 404, 409, 200 response shape |
| `apps/api/src/routes/tasks/resume.test.ts` | Same |
| `apps/api/src/routes/tasks/retry.test.ts` | Same |

### 11.2 E2E tests (PRD §10)

**File:** `apps/web/e2e/features/tasks/pause-resume-retry.feature`

Scenarios from PRD:

- Pause an in-progress task
- Resume a paused task and task completes
- Pause button not shown for done task
- Retry button shown for failed task
- Resume and retry buttons both shown for paused task
- Retry a failed task restarts from scratch
- Retry a paused task restarts from scratch
- Idempotent pause on already paused task
- Retry on in-progress task returns 409
- Task completes before pause is processed (race)
- Resume after credential change (should fail gracefully)
- Double-click pause prevents duplicate requests

Reuse steps from `apps/web/e2e/features/tasks/task-detail.feature` and `packages/e2e/src/steps/` where possible. New step definitions only for pause/resume/retry button clicks and API assertions.

---

## 12. Phased PR Breakdown

### PR 1 — Domain (`domains/task`)

| Item | Detail |
|------|--------|
| **Packages** | `domains/task` |
| **Files** | `model/model.ts`, `model/dto.ts`, `model/graphql.ts`, `model/toTaskResponse.ts`, `commands/pauseTask/`, `commands/resumeTask/`, `commands/retryTask/`, `commands/index.ts`, `README.md` |
| **Dependencies** | None |
| **Tests** | Unit tests for three commands |

### PR 2 — Execution (`services/task`, `services/agent`, `domains/ai-integration`, `packages/client-langchain`, `packages/errors`)

| Item | Detail |
|------|--------|
| **Packages** | `services/task`, `services/agent`, `domains/ai-integration`, `domains/agent`, `domains/system-agent`, `packages/client-langchain`, `packages/errors` |
| **Files** | Execution registry, updated `executeTask`, `buildResumeMessage`, `pauseTask`/`resumeTask`/`retryTask` handlers, signal threading through agent + langchain |
| **Dependencies** | PR 1 |
| **Tests** | Registry, executeTask modes, abort propagation, buildResumeMessage |

### PR 3 — API (`apps/api`)

| Item | Detail |
|------|--------|
| **Packages** | `apps/api` |
| **Files** | `routes/tasks/pause.ts`, `resume.ts`, `retry.ts`, `index.ts`, extended `taskResponseSchema` |
| **Dependencies** | PR 2 |
| **Tests** | Route unit tests |

### PR 4 — Frontend (`ui/api-hooks`, `apps/web`)

| Item | Detail |
|------|--------|
| **Packages** | `ui/api-hooks`, `apps/web` |
| **Files** | Three hooks, types, GraphQL query, header actions, status display, AI response paused copy |
| **Dependencies** | PR 3 (API must exist; can stub against PR 3 branch) |
| **Tests** | `taskStatusDisplay.test.ts` update; component tests optional |

### PR 5 — E2E (`apps/web/e2e`)

| Item | Detail |
|------|--------|
| **Packages** | `apps/web/e2e` |
| **Files** | `features/tasks/pause-resume-retry.feature`, new steps if needed |
| **Dependencies** | PR 1–4 merged |
| **Tests** | Playwright BDD — Gherkin from PRD §10 |

---

## 13. Todo Plan

1. **`@vassembly/domain-task`** — [Type: domain extension]
   - Changes: `Paused` status, `pausedAt`, `pauseTask`/`resumeTask`/`retryTask` commands, DTO/GraphQL/mapper
   - Files: `domains/task/src/model/*`, `domains/task/src/commands/pauseTask/`, `resumeTask/`, `retryTask/`, `commands/index.ts`, `README.md`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer`
   - Dependencies: None

2. **`@vassembly/errors` + `@vassembly/client-langchain` + `@vassembly/domain-ai-integration`** — [Type: utility/domain extension]
   - Changes: `ExecutionPausedError`; `signal`/`shouldAbort` on invoke params and tool loop
   - Files: `packages/errors/src/ExecutionPausedError.ts`, `packages/client-langchain/src/types.ts`, `operations/runToolCallLoop.ts`, `operations/invokeWithChatModel.ts`, `domains/ai-integration/src/clients/langchain.ts`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2)`
   - Dependencies: Todo 1 (for `TaskStatus.Paused` in shouldAbort, can parallel if typed as string)

3. **`@vassembly/service-agent`** — [Type: service extension]
   - Changes: `abortSignal`/`shouldAbort` on `InternalToolContext`; checks in `runAgentInvokeWithTools` and `useAgent`; forward signal to domain invoke
   - Files: `services/agent/src/helpers/internalTools/types.ts`, `runAgentInvokeWithTools.ts`, `useAgent/index.ts`; domain invoke types if needed
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2)`
   - Dependencies: Todo 2

4. **`@vassembly/service-task`** — [Type: service extension]
   - Changes: Execution registry, `pauseTask`/`resumeTask`/`retryTask` handlers, `buildResumeMessage`, updated `executeTask`, task mutex
   - Files: `services/task/src/executionRegistry/`, `handlers/pauseTask/`, `resumeTask/`, `retryTask/`, `handlers/executeTask/*`, `handlers/shared/acquireTaskMutex.ts`, `handlers/index.ts`, `README.md`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer`
   - Dependencies: Todos 1, 2, 3

5. **`apps/api`** — [Type: API gateway]
   - Changes: Three PATCH routes, extended response schema
   - Files: `apps/api/src/routes/tasks/pause.ts`, `resume.ts`, `retry.ts`, `index.ts`, `create.ts` or `schemas.ts`
   - Workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2)`
   - Dependencies: Todo 4

6. **`@vassembly/ui-api-hooks`** — [Type: UI client]
   - Changes: `usePauseTask`, `useResumeTask`, `useRetryTask`, `TaskStatus.Paused`, `pausedAt` in types/query/mapper
   - Files: `ui/api-hooks/src/tasks/http/*`, `types.ts`, `graphql/getTaskQuery.ts`, `mapTaskData.ts`, `index.ts`
   - Workflow: `coder → code-reviewer`
   - Dependencies: Todo 5

7. **`apps/web`** — [Type: app UI]
   - Changes: Header actions, paused badge/copy, accessibility
   - Files: per §10.3
   - Workflow: `coder ↔ code-reviewer (max 2)`
   - Dependencies: Todo 6

8. **`apps/web` E2E** — [Type: app / E2E tests]
   - Changes: Playwright BDD feature file for pause/resume/retry
   - Files: `apps/web/e2e/features/tasks/pause-resume-retry.feature`, steps as needed
   - Workflow: `tdd-e2e-test-writer → coder ↔ code-reviewer (max 2)`
   - Dependencies: PRD exists; Todos 1–7 for green runs

---

## Appendix: Coordination with parallel work

**progress-event-ai-integration** shares the `executeTask` → `runAgentInvokeWithTools` → progress callback path. When implementing abort signal injection, coordinate so both features use the same `InternalToolContext` extension (`abortSignal`, `shouldAbort`) without merge conflicts. No functional dependency — either PR can land first if context fields are additive.
