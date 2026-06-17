# Architecture: Human-in-the-Loop Agent Questioning

## Overview

Agents pause mid-execution to ask the task creator one or more questions. Questions live in a **separate `TaskQuestions` entity** (own collection, own domain, 1-to-1 with Task). The **Task** model stays lean and gains only a **`waiting` status** — set when execution is blocked pending user input.

**Human-in-the-loop requires blocking.** After `ask-user` records a single question or a batch, the **calling agent invocation stops** (cooperative error, same family as pause-resume). Execution resumes only after the user has answered **all** pending questions; on resume, **every blocked invocation** receives the **full Q&A bundle**.

### Core rules (confirmed)

| Rule | Behavior |
|------|----------|
| `ask-user` | **Blocking** — records question(s), then throws `UserInputWaitingError` |
| Batch | One tool call may ask **one or many** questions before blocking |
| Multiple agents | Subagent A waiting does **not** block subagent B **execution** |
| Orchestrator fan-in | Parent **must not continue** until **every** spawned subagent has **fully completed** (suspension ≠ done) |
| Accumulation | Agent A may ask, later Agent B may ask — pending list grows |
| Answer order | User may answer pending questions in **any order** |
| Resume gate | Resume when **`pendingQuestions` is empty** |
| Resume payload | **All** answered questions in the batch are injected into **every** blocked invocation |
| Task status | `in-progress` → `waiting` when blocked; `waiting` → `in-progress` on full resume |
| Task model | **Lean** — no Q&A fields on `TaskModel` |
| Access | Only the **task creator** may submit answers |

---

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Agent (or subagent) calls ask-user with 1..N questions               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. recordQuestions (domain-task-questions)                              │
│    - Append to pendingQuestions (each tagged with invocationId)          │
│    - Register invocationId in blockedInvocations                        │
│    - If task is in-progress → transition to waiting (domain-task)       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. throw UserInputWaitingError                                          │
│    - Stops current invocation branch only                                 │
│    - use-agent: deferred promise (parent still waiting at fan-in)       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         Subagent A: waiting_for_user       Subagent B: completes
         (NOT done — parent still waiting)   (done — but fan-in open)
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Orchestrator parked at Promise.all — cannot proceed until A completes   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. UI: task.status === waiting, show pending questions (nav 1 at a time) │
│    User submits answers in any order → submitAnswer per question         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. When last pending answer submitted (pendingQuestions.length === 0)  │
│    - waiting → in-progress (domain-task)                                │
│    - Resume each blocked child invocation with full Q&A bundle          │
│    - Subagent A completes → deferred promise resolves                   │
│    - Orchestrator Promise.all settles → parent continues                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Status Transitions (`domains/task`)

```
in-progress → waiting     (first ask-user blocks; pending questions exist)
waiting     → in-progress (all pending questions answered; resume fired)
waiting     → paused      (user pause — existing pause-resume semantics)
paused      → in-progress (resume — existing; unrelated to Q&A)
```

`waiting` means: **at least one pending question** and **at least one blocked invocation** (or task-level root execution blocked).

TaskModel additions (status only — **no Q&A fields**):

```typescript
export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Paused = 'paused',
  Waiting = 'waiting',   // NEW
  Done = 'done',
  Failed = 'failed',
}
```

Use existing `conditionalStatusUpdate` for atomic transitions (same pattern as `pauseTask` / `resumeTask`).

---

## Data Model — `@vassembly/domain-task-questions`

**Collection:** `taskQuestions` (1 document per task, unique index on `taskId`)

```typescript
export type QuestionInputType = 'text' | 'select' | 'multiselect' | 'boolean';

export interface PendingQuestion {
  questionId: string;
  invocationId: string;          // which agent branch asked (see Execution Model)
  askedByAgentId: string;
  askedByAgentType: 'personal' | 'system';
  question: string;
  inputType: QuestionInputType;
  options?: string[];
  schema?: Record<string, unknown>;
  askedAt: Date;
}

export interface AnsweredQuestion extends Omit<PendingQuestion, never> {
  answer: string | string[] | boolean;
  answeredAt: Date;
}

export class TaskQuestionsModel extends Model {
  taskId: string;
  pendingQuestions: PendingQuestion[];
  answeredQuestions: AnsweredQuestion[];
  blockedInvocations: BlockedInvocation[];  // invocations waiting for user
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedInvocation {
  invocationId: string;
  agentId: string;
  agentType: 'personal' | 'system';
  blockedAt: Date;
  // Snapshot pointers for resume (progress event ids, message checkpoint, etc.)
  resumeCheckpoint?: InvocationResumeCheckpoint;
}
```

**Lifecycle:** TaskQuestions document is created on first `ask-user`, deleted when Task is deleted (same lifecycle as task).

---

## Execution Model — Per-Invocation Blocking

### Invocation identity

Extend `InternalToolContext` (`services/agent/src/helpers/internalTools/types.ts`):

```typescript
export interface InternalToolContext {
  // ...existing fields...
  taskId: string;              // NEW — required for ask-user
  invocationId: string;        // NEW — unique per agent invoke boundary
  rootInvokeId: string;        // existing — correlates whole task run
}
```

- **Root agent** (`executeTask`): new `invocationId` at start.
- **Each `use-agent` child**: new `invocationId` for the nested invoke.
- Questions are tagged with `invocationId` so we know who asked, but **resume delivers all answers to all blocked invocations**.

### Blocking semantics

| Caller | On `UserInputWaitingError` |
|--------|---------------------------|
| Root `executeTask` (root called `ask-user`) | Catch silently; task stays `waiting`; root parked until resume |
| `use-agent` (child called `ask-user`) | **Deferred promise** — parent `use-agent` call stays pending until child resumes and **fully completes** |
| Parallel siblings in same tool turn | Each `use-agent` has its own promise; `Promise.all` waits for **all** (including deferred children) |

### Subagent independence (Agent 1 waits, Agent 2 proceeds)

**Requirement:** While subagent 1 is waiting for answers, subagent 2 must be able to continue and optionally ask its own questions.

**Important:** Subagent 2 finishing does **not** unblock the orchestrator. A suspension is **not** a successful completion.

### Orchestrator fan-in (multi-subagent coordination)

**Scenario (must work):**

1. Orchestrator spawns subagent A and subagent B (same tool-call turn, parallel `use-agent`).
2. Subagent A calls `ask-user` → blocks, task → `waiting`.
3. Subagent B continues and **completes successfully**.
4. Orchestrator **stays parked** — it must not take its next LLM turn yet.
5. User answers all pending questions.
6. Subagent A **resumes**, runs to completion, returns its final result.
7. **Only now** does the orchestrator receive **both** tool results and may proceed.

```
Orchestrator                    Subagent A              Subagent B
     │                               │                       │
     ├── use_agent(A) ──────────────►│                       │
     ├── use_agent(B) ───────────────────────────────────────►│
     │                               │                       │
     │                          ask-user (blocks)             │
     │                               │                       ├── ... completes
     │                               X                       │
     │                     (waiting — NOT done)              │
     │                                                       │
     │◄── Promise.all still pending ─────────────────────────┤
     │    (orchestrator blocked at fan-in)                   │
     │                                                       │
     │         User answers all questions                    │
     │                               │                       │
     │                          resume + complete            │
     │◄── A result ──────────────────┤                       │
     │◄── B result (already done) ─────────────────────────────┤
     │                                                       │
     └── orchestrator continues (next LLM turn)              │
```

#### Subagent lifecycle (orchestrator view)

| State | Counts toward fan-in? | Orchestrator can proceed? |
|-------|----------------------|---------------------------|
| `running` | No — still in flight | No |
| `waiting_for_user` | No — **not terminal** | No |
| `completed` | Yes | Only when **all** siblings `completed` |
| `failed` | Yes (terminal) | Policy: fail parent or return error to LLM |

**Rule:** `waiting_for_user` is **not** `completed`. Returning a suspension string to the parent prematurely would violate fan-in.

#### Implementation — deferred `use-agent` promise

When a child hits `UserInputWaitingError`, `use-agent` **must not** return immediately to the parent. Instead:

1. Child invocation is registered in `blockedInvocations` (via `ask-user`).
2. `use-agent` returns a **deferred promise** tied to that `invocationId`.
3. The promise **stays pending** until:
   - user answers all pending questions,
   - child invocation is resumed from `resumeCheckpoint`,
   - child runs to normal completion (or fails).
4. Then the promise resolves with the child's **final message** (same as a successful `use-agent` today).

Parallel tool execution (`runToolCallLoop`):

```typescript
// Sibling use-agent calls in one LLM turn
const toolResults = await Promise.all(
  toolCalls.map((toolCall) => executeToolCall(toolCall)),
);
// Orchestrator's next LLM turn runs ONLY after every promise settles.
// Subagent A's promise remains pending while waiting_for_user.
```

#### Spawn batch tracking

Tag parallel siblings so fan-in is explicit:

```typescript
export interface InternalToolContext {
  // ...existing...
  spawnBatchId?: string;   // same UUID for all use-agent calls from one parent tool-call turn
  parentInvocationId: string;
}
```

Optional `InvocationTracker` (in-memory, keyed by `parentInvocationId` + `spawnBatchId`):

```typescript
interface SpawnBatchState {
  parentInvocationId: string;
  spawnBatchId: string;
  children: Array<{
    invocationId: string;
    status: 'running' | 'waiting_for_user' | 'completed' | 'failed';
  }>;
}

// Parent proceeds only when children.every(c => c.status === 'completed' | 'failed')
```

The **primary** gate is still `Promise.all` on deferred `use-agent` promises; the tracker supports observability, progress UI, and debugging.

#### Resume after user answers (fan-in path)

When `pendingQuestions.length === 0`:

1. For each `blockedInvocations` entry, **resume that invocation** from `resumeCheckpoint` (not only root `executeTask`).
2. Subagent A's deferred `use-agent` promise runs to completion → resolves with final output.
3. Parent's `Promise.all` (already waiting) now settles.
4. Parent tool loop delivers **all** tool messages to the LLM.
5. If `blockedInvocations` is empty and root was also blocked, fall back to `executeTask({ mode: Resume })`.

**Do not** call `executeTask(Resume)` for the whole task when the root orchestrator is still alive and parked at `Promise.all` — only resume the **specific blocked child invocations**.

#### Root orchestrator vs nested orchestrator

| Blocked entity | What is parked | Resume mechanism |
|----------------|----------------|------------------|
| Subagent A (child) | Parent's `use-agent` deferred promise | Resume invocation A from checkpoint |
| Root orchestrator (called `ask-user` itself) | `executeTask` / root tool loop | `executeTask({ mode: Resume })` after all pending answered |
| Nested orchestrator (spawned children, none blocked itself) | `Promise.all` on child `use-agent` calls | Resume blocked **children** only; parent wakes when promises settle |

**Implementation:**

1. **`use-agent` holds a deferred promise on `UserInputWaitingError`** — parent does not see a tool result until the child truly completes after resume.
2. **Parallel sibling subagents** — `runToolCallLoop` runs independent tool calls with `Promise.all`. Subagent B completes while A's promise stays pending.
3. **Sequential subagent calls** — natural ordering; fan-in is per `await useAgent(...)` call (each call still deferred if child suspends).

### Resume gate — all questions answered

`submitAnswer` (domain + service):

1. Move one question `pendingQuestions` → `answeredQuestions`.
2. If `pendingQuestions.length > 0` → stay `waiting`; no resume.
3. If `pendingQuestions.length === 0`:
   - `waiting` → `in-progress` (`domain-task`)
   - Load **all** `answeredQuestions` from the current waiting cycle
   - **Resume each blocked child invocation** from `resumeCheckpoint` with the **full Q&A bundle**
   - Each resumed child runs to completion → its deferred `use-agent` promise resolves
   - Parent orchestrator's `Promise.all` settles → parent may continue
   - Clear `blockedInvocations` only after children have been handed off to resume workers
   - Fire `executeTask({ mode: Resume })` **only** when the **root** invocation is in `blockedInvocations` (root called `ask-user` directly). Do **not** restart the whole task when only nested subagents were blocked and the root is parked at fan-in.

---

## Agent Tool: `ask-user` (BLOCKING)

### Registry

```typescript
{
  id: 'ask-user',
  displayName: 'Ask user',
  description:
    'Ask the task creator one or more questions. Execution pauses until all pending questions are answered.',
  accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
  llmToolName: 'ask_user',
}
```

Configurable per agent via `assignedToolIds` (tool assignment), same as other internal tools.

### Args — single or batch

```typescript
export interface AskUserQuestionInput {
  question: string;
  input_type?: QuestionInputType;
  options?: string[];
  schema?: Record<string, unknown>;
}

export interface AskUserArgs {
  // Single question (shorthand)
  question?: string;
  input_type?: QuestionInputType;
  options?: string[];
  schema?: Record<string, unknown>;
  // Batch
  questions?: AskUserQuestionInput[];
}
```

Validation: exactly one of `question` or non-empty `questions` array.

### Handler (always throws after record)

```typescript
export const askUser = async ({ args, context }: AskUserParams): Promise<never> => {
  const { taskId, invocationId, callerAgentId, callerAgentType, abortSignal, shouldAbort } =
    context;

  if (abortSignal?.aborted || (await shouldAbort?.())) {
    throw new ExecutionPausedError();
  }

  const normalized = normalizeAskUserArgs(args); // single → [one item]

  try {
    await taskQuestionsDomain.commands.recordQuestions({
      taskId,
      invocationId,
      askedByAgentId: callerAgentId,
      askedByAgentType: callerAgentType,
      questions: normalized,
      resumeCheckpoint: captureResumeCheckpoint(context),
    });

    await taskDomain.commands.markWaiting({ taskId }); // in-progress → waiting (idempotent if already waiting)
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ExecutionPausedError(); // concurrent pause race
    }
    throw error;
  }

  throw new UserInputWaitingError(
    `Waiting for user answers to ${normalized.length} question(s)`,
  );
};
```

**`recordQuestions` command** (atomic):

- Upsert `taskQuestions` doc
- `$push` all new pending questions
- `$addToSet` / upsert `blockedInvocations` for this `invocationId`
- Does **not** transition task status (service/tool calls `markWaiting` separately, or combined in one service orchestration step)

---

## Error Types

### `UserInputWaitingError` (`packages/errors`)

Same cooperative pattern as `ExecutionPausedError` (HTTP 499). Thrown by `ask-user` after persisting questions.

`executeTask` catch block:

```typescript
if (error instanceof ExecutionPausedError || error instanceof UserInputWaitingError) {
  logTaskTransition({
    event: error instanceof UserInputWaitingError ? 'task.execution.waiting' : 'task.execution.paused',
    taskId,
    userId,
    durationMs: Date.now() - startedAt,
  });
  return;
}
```

---

## Service Layer

### `services/task` — `executeTask` extensions

1. Pass `taskId` + `invocationId` on `toolContext`.
2. Catch `UserInputWaitingError` at root (do not fail task).
3. `shouldAbort` also true when `status === Paused` (existing) — **not** when `waiting` (waiting is expected).
4. **Resume mode:** after all answers, `buildResumeMessage` includes **all Q&A** from the waiting cycle:

```typescript
export const buildResumeMessage = ({
  description,
  events,
  answeredQuestions, // ALL answers from waiting cycle
}: BuildResumeMessageParams): string => {
  const parts = [description];

  if (events.length > 0) {
    parts.push('', '--- Previously completed execution steps ---', formatEvents(events), '');
  }

  if (answeredQuestions.length > 0) {
    parts.push('--- User responses received ---');
    for (const qa of answeredQuestions) {
      parts.push(`Question: "${qa.question}"`, `Answer: ${formatAnswer(qa.answer)}`, '');
    }
  }

  parts.push('Continue from where execution left off. Do not repeat completed steps above.');
  return parts.join('\n');
};
```

5. Fire-and-forget resume: `submitAnswer` resumes **blocked invocations** (see Orchestrator fan-in). Call `executeTask({ mode: Resume })` only when the **root** invocation was blocked — not when the root is merely waiting on deferred child promises at fan-in.

### `services/task-questions` — `submitAnswer` handler

```typescript
export const submitAnswer = async ({ userId, taskId, questionId, answer }) => {
  // 1. Verify task ownership
  // 2. domain-task-questions.commands.submitAnswer
  // 3. If pendingQuestions.length === 0:
  //    - domain-task.commands.markInProgressFromWaiting (waiting → in-progress)
  //    - resumeBlockedInvocations({ taskId, answeredQuestions })
  //      → each child runs to completion; deferred use-agent promises resolve
  //      → parent orchestrator Promise.all settles; parent continues
  //    - if root invocation was blocked: void executeTask({ taskId, userId, mode: Resume })
  return { taskQuestions: toTaskQuestionsResponse(result.data) };
};
```

### `services/agent` — `use-agent` extension (deferred fan-in)

```typescript
// use-agent must NOT return a suspension string immediately.
// It must keep the parent waiting until the child fully completes after resume.

export const useAgent = async ({ args, context }: UseAgentParams): Promise<string> => {
  const childInvocationId = randomUUID();

  const completeChild = async (): Promise<string> => {
    const nestedResult = await runAgentInvokeWithTools({
      // ...
      toolContext: {
        ...context,
        invocationId: childInvocationId,
        parentInvocationId: context.invocationId,
        spawnBatchId: context.spawnBatchId,
        recursionDepth: context.recursionDepth + 1,
        // ...
      },
    });
    return nestedResult.message;
  };

  try {
    return await completeChild();
  } catch (error) {
    if (error instanceof UserInputWaitingError) {
      // Child already registered in blockedInvocations via ask-user.
      // Park parent: resolve only after user answers and child finishes.
      return await invocationResumeRegistry.waitForCompletion({
        taskId: context.taskId,
        invocationId: childInvocationId,
      });
    }
    throw error;
  }
};
```

`invocationResumeRegistry` (in-memory, `services/agent` or `services/task`):

- `waitForCompletion({ taskId, invocationId })` → `Promise<string>` pending until resume worker finishes child
- `resumeInvocation({ taskId, invocationId, answeredQuestions })` → re-run child from checkpoint; resolve/reject waiting promise
- Cleared on task completion / deregister

Parent orchestrator does **not** advance until every deferred child promise resolves (successful fan-in).

---

## Domain Commands Summary

### `domain-task`

| Command | Purpose |
|---------|---------|
| `markWaiting` | `in-progress` → `waiting` (guard: only from in-progress) |
| `markInProgressFromWaiting` | `waiting` → `in-progress` (guard: only from waiting) |

### `domain-task-questions`

| Command | Purpose |
|---------|---------|
| `recordQuestions` | Append pending + register blocked invocation |
| `submitAnswer` | Move one pending → answered; return updated model |
| `clearBlockedInvocations` | After successful resume orchestration |
| `deleteByTaskId` | Cascade on task delete |

| Query | Purpose |
|-------|---------|
| `getTaskQuestions` | By `taskId` |

---

## API Layer

### REST (commands only — questions are created by agent tool, not REST)

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/tasks/:id/questions/:questionId/answer` | Submit answer (task creator only) |
| `GET` | `/tasks/:id/questions` | Read pending + answered |

No `POST /tasks/:id/questions` — recording is **agent-only** via `ask-user`.

### GraphQL

```graphql
query GetTaskQuestions($taskId: String!) {
  taskQuestions(taskId: $taskId) {
    taskId
    pendingQuestions { questionId question inputType options askedAt invocationId }
    answeredQuestions { questionId question answer askedAt answeredAt }
  }
}

query GetTask($id: String!) {
  task(id: $id) {
    id
    status   # includes waiting
    # ...existing fields — no Q&A on Task
  }
}
```

---

## Frontend

### UI surfaces (unchanged from prior UX spec)

1. **Below title** — `TaskQuestionForm`: one pending question at a time, prev/next nav, any-order answers.
2. **Below description** — `TaskQuestionsHistory`: read-only answered list.
3. **Progress timeline** — Q&A entries merged chronologically (required).
4. **Notification** — toast when `status` becomes `waiting`.
5. **Polling** — while `in-progress` **or** `waiting`.

### Hooks

- `useTaskQuestions(taskId)` — polls pending/answered.
- `useSubmitAnswer()` — `PATCH .../answer`.
- `useTaskDetail` — reads `status === waiting` for banner/actions.

---

## Infrastructure Dependencies

| Area | Change | Why |
|------|--------|-----|
| `InternalToolContext` | `taskId`, `invocationId`, `spawnBatchId`, `parentInvocationId` | Tag questions, fan-in batches, parent/child tree |
| `use-agent` | Deferred promise on `UserInputWaitingError` | Orchestrator fan-in: suspension ≠ done |
| `invocationResumeRegistry` | New in-memory registry | Park/resume child invocations; resolve deferred promises |
| `runToolCallLoop` | `Promise.all` for independent tool calls | Parallel subagents; parent waits for all promises |
| `executeTask` | Catch `UserInputWaitingError` only at **root**; Resume mode Q&A | Root blocking + resume when root called `ask-user` |
| `executionRegistry` | Per-task abort (existing) | Unchanged; separate from invocation resume registry |
| `domain-task` | `Waiting` status + commands | UI + orchestration |
| `domain-task-questions` | New package | Lean task, 1-to-1 Q&A store |

---

## Todo Plan (revised)

### Phase 1 — Foundation
1. `packages/errors` — `UserInputWaitingError`
2. `packages/constants` — `ask-user` registry entry
3. `domain-task` — `Waiting` status, `markWaiting`, `markInProgressFromWaiting`
4. `domain-task-questions` — model, DAO, `recordQuestions`, `submitAnswer`, queries

### Phase 2 — Execution wiring
5. `InternalToolContext` — `taskId`, `invocationId`, `spawnBatchId`, `parentInvocationId`
6. `invocationResumeRegistry` — deferred promise park/resume for blocked child invocations
7. `services/agent` — blocking `ask-user`, deferred `use-agent` fan-in
8. `packages/client-langchain` — `Promise.all` parallel tool execution where safe
9. `services/task` — root-only `UserInputWaitingError` catch + `executeTask` Resume when root blocked
10. `services/task-questions` — `submitAnswer` orchestration (resume gate + resume children)

### Phase 3 — API + hooks
11. REST `PATCH` answer + `GET` questions; GraphQL `taskQuestions`
12. `ui/api-hooks` — types, queries, `useTaskQuestions`, `useSubmitAnswer`, poll on `waiting`

### Phase 4 — UI
13. `TaskQuestionForm`, `TaskQuestionsHistory`, task detail integration, notifications
14. Progress timeline Q&A merge (required)

---

## Key Design Principles (final)

1. **Lean TaskModel** — status only; Q&A in `domain-task-questions`.
2. **Blocking `ask-user`** — human-in-the-loop requires pausing the invocation branch.
3. **Batch support** — one tool call, many questions, one blocking point.
4. **Per-invocation wait** — subagent A blocked ≠ subagent B blocked (B may finish).
5. **Orchestrator fan-in** — parent waits for **all** subagents to **fully complete**; `waiting_for_user` is not done.
6. **Deferred `use-agent` promise** — parent stays parked until suspended child resumes and finishes.
7. **Resume when all answered** — single gate on `pendingQuestions.length === 0`.
8. **Full Q&A broadcast** — every resumed invocation gets all answers.
9. **Any-order UX** — user navigates and answers pending questions freely.
10. **`waiting` task status** — visible, pollable, notifies user.

---

## Open Implementation Notes

1. **Resume checkpoint** — store enough in `BlockedInvocation.resumeCheckpoint` to continue nested agents without replaying completed tool steps (align with pause-resume `buildResumeMessage` + progress events).
2. **Answer scope on resume** — prefer "all answers since task entered waiting" vs "entire history"; default to **current waiting cycle** to avoid duplicating old Q&A on every resume.
3. **Parallel tool loop** — only parallelize tools that do not share mutable invocation state; `ask-user` and `use-agent` are independent across different `invocationId`s.
4. **Fan-in regression test** — orchestrator spawns A + B in parallel; A asks user; B completes; assert parent LLM does **not** receive the next turn until A completes after answers; assert B's result is already available when parent continues.
5. **Root vs nested resume** — never call `executeTask(Resume)` when root is alive and parked on `Promise.all`; only resume specific `blockedInvocations`.
