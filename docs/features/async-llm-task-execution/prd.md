# Product Requirements Document: Async LLM Task Execution

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-06-04  
**Feature slug:** `async-llm-task-execution`  
**Related docs:** [Task Detail Page](./task-detail-page/prd.md) · [Task Agent Assignment](./task-agent-assignment/architecture.md) · [System Agents](../system-agent/prd.md) · [AI Integrations](../ai-integrations/prd.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Overview & User Journey](#2-feature-overview--user-journey)
3. [User Stories with Acceptance Criteria](#3-user-stories-with-acceptance-criteria)
4. [Scope Definition](#4-scope-definition)
5. [Technical Requirements](#5-technical-requirements)
6. [Data Model](#6-data-model)
7. [API Specification](#7-api-specification)
8. [Background Processing Strategy](#8-background-processing-strategy)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Notification & Update Strategy](#10-notification--update-strategy)
11. [Monitoring & Logging Requirements](#11-monitoring--logging-requirements)
12. [Implementation Phases & Sequencing](#12-implementation-phases--sequencing)
13. [Architectural Decisions & Rationale](#13-architectural-decisions--rationale)
14. [Open Questions & Assumptions](#14-open-questions--assumptions)

---

## 1. Executive Summary

### 1.1 Problem

Tasks in Vassembly are persisted and assigned to the Assistant system agent, but **no LLM work runs after creation**. The `TaskStatus` enum includes `in-progress`, `done`, and `failed`, yet create always sets `created` and nothing transitions status or stores model output. Users cannot see AI-generated results on the task detail page.

### 1.2 Solution

When a user creates a task via `POST /tasks`, the API **returns immediately** with a task record while a **background LLM invocation** runs asynchronously. The system composes the prompt from the assigned system agent’s **rule** plus the user’s **task description**, calls the model using the user’s **“preferred for system calls”** credential (`userSystemAgentPreferences.integrationCredentialId`), persists the **full response** or **error**, and updates status to `done` or `failed`. The task detail page displays the response when available.

### 1.3 Success Metrics

| Metric | Target (MVP) | Measurement |
|--------|--------------|-------------|
| Create latency | `POST /tasks` p95 &lt; 500ms (excluding LLM) | API timing |
| End-to-end completion | ≥ 95% of tasks reach `done` or `failed` within 5 minutes under normal provider latency | Status field + timestamps |
| Response visibility | 100% of `done` tasks show persisted response on detail page | QA + GraphQL field presence |
| Failure clarity | 100% of `failed` tasks expose user-readable `errorMessage` | QA |
| Status logging | 100% of transitions emit structured log events | Log inspection |

### 1.4 Phasing Summary

| Phase | Deliverable |
|-------|-------------|
| **Phase 1 (MVP)** | Async execution, status transitions, DB persistence, GraphQL exposure, detail page polling + response/error UI, basic transition logging |
| **Phase 2 (Future)** | Durable job queue (SQS) + worker app, optional retries, real event-history model, WebSocket/SSE, metrics export |

---

## 2. Feature Overview & User Journey

### 2.1 High-Level Summary

Authenticated users submit a task description from the homepage composer. The backend creates a MongoDB document, kicks off non-blocking LLM processing, and responds with HTTP 201. While processing, status is `in-progress`. On success, the full model text is stored and status becomes `done`. On failure, status becomes `failed` with a stored error message. Users open `/tasks/[id]` to read description, status, and—when complete—the LLM response (or failure details).

### 2.2 User Journey (Sequence)

```
┌─────────┐     POST /tasks      ┌──────────┐     create + enqueue/trigger   ┌─────────────┐
│  User   │ ──────────────────► │ apps/api │ ───────────────────────────────► │ service-task│
│ (web)   │ ◄── 201 + task      │          │                                  │ + domains   │
└─────────┘     (in-progress)   └──────────┘                                  └──────┬──────┘
       │                                                                              │
       │ navigate /tasks/[id]                                                         │ async
       ▼                                                                              ▼
┌─────────┐     GraphQL task(id)   ┌──────────┐                              ┌──────────────┐
│ Detail  │ ◄────────────────────── │ apps/api │ ◄── poll while in-progress │ LLM provider │
│  page   │     (polling MVP)       │ GraphQL  │                              │ (LangChain)  │
└─────────┘                          └──────────┘                              └──────────────┘
```

**Step-by-step**

1. User enters description on homepage (`apps/web/app/_components/TaskInputComposer/` → `useCreateTask` → `POST /tasks`).
2. API authenticates, rate-limits, calls `taskService.createTask` (`services/task/src/handlers/createTask/index.ts`).
3. Handler resolves Assistant system agent (`SYSTEM_AGENT_NAME.Assistant`), creates task, triggers async `executeTask` (new), returns mapped `TaskResponse` without awaiting LLM.
4. User lands on task list or detail; detail page polls GraphQL while `status === 'in-progress'`.
5. Background worker path loads preference → credential → invokes same pattern as `invokeSystemAgent` (`services/agent/src/handlers/invokeSystemAgent/index.ts` + `domains/system-agent/src/commands/invoke/index.ts`).
6. On success: persist `llmResponse`, set `done`, set `completedAt`. On failure: persist `errorMessage` + optional `errorCode`, set `failed`.
7. Next poll (or manual retry) shows response or error on detail page.

### 2.3 Success Criteria

- [ ] Task creation returns in &lt; 1s without blocking on LLM.
- [ ] New tasks appear with `in-progress` status immediately after create (see [§6.3 Status lifecycle](#63-status-lifecycle)).
- [ ] Successful runs persist **full** LLM text and set `done`.
- [ ] Failed runs set `failed` with stored error; **no automatic retries** in MVP.
- [ ] Task detail GraphQL query returns `llmResponse` / `errorMessage` when populated.
- [ ] Credential resolution uses `userSystemAgentPreferences` (same as system-agent invoke).
- [ ] Structured logs emitted for `created`, `in-progress`, `done`, `failed` transitions.

---

## 3. User Stories with Acceptance Criteria

Personas: **Task Creator**, **Task Viewer** (same authenticated user in MVP; see [§14](#14-open-questions--assumptions) for access-control note).

### AT-1 — Create task and return immediately

```gherkin
As a task creator
I want to submit a task description and receive an immediate confirmation
So that I am not blocked while the AI processes my request

Scenario: Successful create returns before LLM completes
  Given I am authenticated
  When I POST /tasks with a valid description (1–5000 chars)
  Then I receive HTTP 201 within the API timeout budget
  And the response body includes task id, status "in-progress", and my description
  And the LLM invocation continues after the response is sent

Scenario: Invalid description rejected synchronously
  Given I am authenticated
  When I POST /tasks with an empty or over-length description
  Then I receive 400 Validation Error
  And no task document is created
  And no background LLM job is started
```

### AT-2 — Background LLM uses agent rule + description

```gherkin
As the platform
I want the LLM prompt to combine the assigned system agent rule and the user description
So that task execution matches governed Assistant behavior

Scenario: Prompt composition matches system-agent invoke
  Given a task was created with agentAssignedId pointing to the active Assistant system agent
  When background execution runs
  Then the prompt sent to the provider equals "{agent.rule}\n\n{task.description}"
  And the pattern matches domains/system-agent/src/commands/invoke/index.ts
```

### AT-3 — Credential resolution from user preference

```gherkin
As a task creator
I want my "preferred for system calls" AI credential used for task LLM calls
So that usage bills against my chosen integration

Scenario: Preference present
  Given my userSystemAgentPreferences document has integrationCredentialId "cred-1"
  When my task executes in the background
  Then resolveAndBuildClient uses integrationCredentialId "cred-1"
  And the invoke uses my userId for credential scoping

Scenario: Preference missing
  Given I have no preference row or integrationCredentialId is null
  When my task executes
  Then the task transitions to failed
  And errorMessage explains that a system-call credential must be configured
  And no unscoped provider call is attempted
```

### AT-4 — Status transitions (success)

```gherkin
As a task creator
I want the task status to reflect processing progress
So that I know when the AI work finished

Scenario: Happy path
  Given a task was created and background execution started
  When the LLM returns successfully
  Then status becomes "done"
  And llmResponse contains the full provider message text
  And completedAt is set
  And updatedAt reflects the terminal update
```

### AT-5 — Status transitions (failure, no retry)

```gherkin
As a task creator
I want failed AI runs surfaced clearly without silent retries
So that I can fix credentials or try again manually

Scenario: Provider error
  Given background execution is running
  When the LLM provider returns an error or times out
  Then status becomes "failed"
  And errorMessage stores a user-safe summary
  And failedAt is set
  And the system does not automatically re-invoke the LLM

Scenario: Missing system agent
  Given agentAssignedId is invalid or agent is archived
  When execution runs
  Then status becomes "failed"
  And errorMessage indicates the assigned agent is unavailable
```

### AT-6 — View task detail with response

```gherkin
As a task viewer
I want to open the task detail page and see the AI response when ready
So that I can read the full output in context

Scenario: Completed task
  Given a task with status "done" and populated llmResponse
  When I open /tasks/{id} while authenticated
  Then I see the description, status badge "Done", and a dedicated "AI Response" section with full text
  And whitespace in the response is preserved

Scenario: In progress
  Given a task with status "in-progress"
  When I view the detail page
  Then I see status "In progress" and a loading indicator for the response section
  And the page polls until status is terminal or I navigate away
```

### AT-7 — View failure on task detail

```gherkin
As a task viewer
I want to see why a task failed
So that I can adjust integrations or create a new task

Scenario: Failed task
  Given a task with status "failed" and errorMessage populated
  When I open the task detail page
  Then I see status "Failed" and the error message in an error-styled block
  And llmResponse is empty or hidden
```

### AT-8 — Monitoring visibility (operator)

```gherkin
As an operator
I want status transition events in application logs
So that I can debug stuck or failing tasks without DB access

Scenario: Transition logging
  Given a task moves through the lifecycle
  When each status is persisted
  Then a structured log line is written with taskId, userId, previousStatus, newStatus, and timestamp
```

---

## 4. Scope Definition

### In Scope (MVP — Phase 1)

| Area | Items |
|------|--------|
| **Backend** | Extend `@vassembly/domain-task` model/commands; `executeTask` in `@vassembly/service-task`; trigger after create in `apps/api` |
| **LLM** | Reuse `domain-system-agent` `commands.invoke` + `domain-ai-integration` `resolveAndBuildClient`; same prompt/credential pattern as `invokeSystemAgent` |
| **API** | Extend `POST /tasks` response fields; extend GraphQL `Task` type and `task(id)` resolver |
| **Frontend** | Task detail polling, response/error sections; optional list badge refresh on navigation |
| **Logging** | Status transition events via `@vassembly/logger` |
| **Access** | Per product clarification: authenticated create/view without additional owner checks (see assumptions) |

### Out of Scope (MVP)

| Item | Notes |
|------|--------|
| Automatic retries | Documented as Phase 2+ |
| SQS / dedicated worker app | Phase 2 |
| Separate `task_events` collection | Phase 2; MVP uses synthetic timeline + new timestamps |
| WebSocket / SSE | Phase 2 evaluation |
| Task edit/delete/re-run | Future |
| Cross-feature dependencies | Explicitly deferred to later phase per stakeholder |
| Populating `title` from LLM summary | Optional future; MVP uses `llmResponse` for full text |
| Datadog/Sentry wiring | Future observability |

---

## 5. Technical Requirements

### 5.1 Domain Layer (`@vassembly/domain-task`)

| ID | Requirement |
|----|-------------|
| D-1 | Add fields to `TaskModel` (`domains/task/src/model/model.ts`): `llmResponse`, `errorMessage`, `errorCode`, `startedAt`, `completedAt`, `failedAt` (see [§6](#6-data-model)). |
| D-2 | Add `commands.updateExecution` (or `complete` + `fail` + `markInProgress`) — internal writes only; Zod-validated payloads. |
| D-3 | Extend `toTaskResponse` / `TaskResponse` DTO (`domains/task/src/model/dto.ts`) with new fields. |
| D-4 | Extend GraphQL schema (`domains/task/src/model/graphql.ts`) to expose new fields on `Task`. |
| D-5 | On create: set initial status to `in-progress` and `startedAt` when async execution is the product contract **OR** keep `created` for &lt;1s then transition in same request before 201 — **recommended:** persist `in-progress` before returning 201 (see §6.3). |
| D-6 | Domain must **not** import LangChain or `@vassembly/client-*`; LLM stays in `domain-system-agent` / `domain-ai-integration`. |

### 5.2 Service Layer (`@vassembly/service-task`)

| ID | Requirement |
|----|-------------|
| S-1 | New handler `executeTask({ taskId, userId })` orchestrates: load task model → resolve agent → preference → `resolveAndBuildClient` → `systemAgentDomain.commands.invoke` → `taskDomain.commands.updateExecution`. |
| S-2 | `createTask` (`services/task/src/handlers/createTask/index.ts`) after successful create: trigger `executeTask` without awaiting (MVP Option A). |
| S-3 | Service may depend on `@vassembly/domain-system-agent`, `@vassembly/domain-ai-integration`, `@vassembly/domain-user` (admin override not used for tasks). |
| S-4 | Map domain errors to persisted `errorMessage`; never swallow errors. |
| S-5 | Optional: extract shared `resolveSystemCallConnection({ userId })` used by `service-agent` and `service-task` to avoid duplicating preference logic from `invokeSystemAgent`. |

### 5.3 API Gateway (`apps/api`)

| ID | Requirement |
|----|-------------|
| A-1 | `POST /tasks` (`apps/api/src/routes/tasks/create.ts`): extend `taskResponseSchema` with new fields; fire-and-forget `executeTask` after `createTask`. |
| A-2 | **No** public REST endpoint for status updates — transitions are internal only. |
| A-3 | GraphQL `task` / `userTasks` resolvers (`apps/api/src/graphql/resolvers/task.ts`) return extended DTO via existing service handlers. |
| A-4 | Preserve conventions: REST = commands, GraphQL = queries. |

### 5.4 Frontend (`apps/web`, `@vassembly/ui-api-hooks`)

| ID | Requirement |
|----|-------------|
| F-1 | Extend `TaskDto` / GraphQL queries (`ui/api-hooks/src/tasks/graphql/getTaskQuery.ts`, `types.ts`). |
| F-2 | `useTaskDetailPage` (`apps/web/app/tasks/[id]/useTaskDetailPage.ts`): poll every **3s** while `status === 'in-progress'`, stop on terminal status or unmount. |
| F-3 | New UI section **AI Response** (distinct from legacy `title` / “Summary” section). |
| F-4 | Failed state: show `errorMessage` with link copy to Settings → AI integrations (if credential-related). |
| F-5 | Extend `buildSyntheticTimelineEvents` (`apps/web/app/tasks/[id]/lib/buildSyntheticTimelineEvents.ts`) to include “Processing started”, “Completed”, “Failed” using new timestamps when present. |

### 5.5 Constraints & Assumptions

- **Volume:** Low; no batching, concurrency limits beyond existing `assertUserRateLimit` on create (5/min).
- **Idempotency:** MVP does not guard against double-execution if create handler triggers twice; acceptable at low volume; queue phase adds deduplication.
- **Serverless:** If API runs on ephemeral workers, in-process async may be killed on scale-down — document risk; Phase 2 queue mitigates.
- **Personal agents:** Tasks use **system agent** (`agentAssignedId`) only; personal agents are out of scope.

### 5.6 Dependencies on Existing Systems

| System | Path / package | Role |
|--------|----------------|------|
| Task domain | `domains/task/` | Persistence, status, DTOs |
| System agent | `domains/system-agent/` | `rule`, `commands.invoke`, preferences |
| AI integration | `domains/ai-integration/` | `resolveAndBuildClient` |
| Constants | `packages/constants` | `SYSTEM_AGENT_NAME.Assistant` |
| LangChain client | `packages/client-langchain/` | Used only inside ai-integration domain |
| Logger | `packages/logger/` | Transition logging |
| Errors | `packages/errors/` | Typed failures |

---

## 6. Data Model

### 6.1 TaskModel Extensions

**File:** `domains/task/src/model/model.ts`  
**Collection:** `tasks` (unchanged, `domains/task/src/clients/mongodb.ts`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `llmResponse` | `string \| null` | no | Full LLM message text on success; null until done |
| `errorMessage` | `string \| null` | no | User-safe error summary on failure |
| `errorCode` | `string \| null` | no | Machine-oriented code (e.g. `MISSING_CREDENTIAL`, `PROVIDER_ERROR`) for UI branching |
| `startedAt` | `Date \| null` | no | When background execution began (set with `in-progress`) |
| `completedAt` | `Date \| null` | no | When status became `done` |
| `failedAt` | `Date \| null` | no | When status became `failed` |

**Existing fields (unchanged semantics)**

| Field | Notes |
|-------|-------|
| `description` | User input; LLM message body in invoke |
| `agentAssignedId` | Assistant system agent id at create |
| `title` | Reserved; **not** used for full LLM response in MVP (avoid 16MB-adjacent conflation with summary UX) |
| `status` | `TaskStatus` enum |

### 6.2 MongoDB Implications

- No new collections for MVP.
- Optional index: `{ status: 1, updatedAt: -1 }` for operator queries — **not required** at low volume.
- Document size: full LLM responses stored as string; enforce max length at persist time (recommend **same 5000 char cap as description** or provider max — **open question** §14).
- Sensitive data: do not store raw API keys; errors must not leak key material.

### 6.3 Status Lifecycle

```
                    ┌──────────────────────────────────────┐
                    │  create (POST /tasks)                 │
                    │  status: in-progress                  │
                    │  startedAt: now                       │
                    └─────────────────┬────────────────────┘
                                      │
                          async executeTask
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
            ┌───────────────┐                   ┌───────────────┐
            │     done      │                   │    failed     │
            │ llmResponse   │                   │ errorMessage  │
            │ completedAt   │                   │ failedAt      │
            └───────────────┘                   └───────────────┘
```

**Note on `created` status:** Enum value remains for backward compatibility and list filters, but **new tasks skip persistent `created`** and enter `in-progress` immediately per product requirements. Existing rows with `created` may be migrated or left as-is (engineering discretion).

### 6.4 New Entities

| Entity | MVP | Rationale |
|--------|-----|-----------|
| `task_events` / audit collection | No | Synthetic timeline + timestamps suffice |
| Job queue messages | No (Phase 2) | In-process trigger for MVP |

### 6.5 DTO & GraphQL Updates

**`TaskResponse`** (`domains/task/src/model/dto.ts`):

```typescript
export interface TaskResponse {
  // ...existing fields
  llmResponse: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;   // ISO 8601 via mapper
  completedAt: string | null;
  failedAt: string | null;
}
```

Mirror in `ui/api-hooks/src/tasks/types.ts` (`TaskDto`, `GraphQLTaskRow`).

---

## 7. API Specification

### 7.1 REST — Create Task (extended)

**Endpoint:** `POST /tasks`  
**Route:** `apps/api/src/routes/tasks/create.ts`  
**Auth:** Required (`authorizeRequest`)  
**Rate limit:** 5 requests / 60s / user (existing)

**Request body** (unchanged):

```json
{
  "description": "Summarize the Q2 board deck and list action items."
}
```

**Response `201`** (extended):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "user-auth-id",
  "description": "Summarize the Q2 board deck and list action items.",
  "type": "user",
  "status": "in-progress",
  "agentAssignedId": "system-agent-assistant-id",
  "title": null,
  "llmResponse": null,
  "errorMessage": null,
  "errorCode": null,
  "startedAt": "2026-06-04T14:00:00.000Z",
  "completedAt": null,
  "failedAt": null,
  "createdAt": "2026-06-04T14:00:00.000Z",
  "updatedAt": "2026-06-04T14:00:00.000Z"
}
```

**Behavior change:** Handler schedules `executeTask` after mapping response; does not await LLM.

**Error responses** (unchanged patterns): `401 Unauthorized`, `400` validation, `429` rate limit, `5xx` only for synchronous failures (DB, agent lookup).

### 7.2 REST — Task Status Update

**Not exposed.** Status changes occur only via `service-task.executeTask` → domain commands. Rationale:

- Avoids client tampering with execution state.
- Aligns with “commands are REST” rule for **user-initiated** mutations only; internal lifecycle is service-driven.

### 7.3 GraphQL — Task Detail & List

**Queries:** `task(id: ID!)`, `userTasks(...)`  
**Resolver:** `apps/api/src/graphql/resolvers/task.ts`  
**Schema:** `domains/task/src/model/graphql.ts`

**`getTaskQuery` extension** (`ui/api-hooks/src/tasks/graphql/getTaskQuery.ts`):

```graphql
query GetTask($id: ID!) {
  task(id: $id) {
    id
    userId
    description
    type
    status
    agentAssignedId
    title
    llmResponse
    errorMessage
    errorCode
    startedAt
    completedAt
    failedAt
    createdAt
    updatedAt
  }
}
```

**Access:** Return task when found; apply product access rule from §14 (MVP: authenticated user can read any task id if product confirms global visibility).

**Errors:** `null` task + GraphQL errors for not found; client maps to 404 UX (`useTaskDetailPage`).

### 7.4 Reference — Synchronous Invoke (not used for tasks)

For comparison only — tasks must **not** block on this endpoint:

`POST /system-agents/:id/invoke` → `services/agent/src/handlers/invokeSystemAgent/index.ts`

---

## 8. Background Processing Strategy

### 8.1 Options Matrix

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — In-process fire-and-forget** | After `createTask`, `void executeTask(...).catch(log)` in API or service | Minimal infra; fastest to ship; reuses existing `apps/api` deploy | Lost work on process crash/restart; no retry; harder horizontal scaling |
| **B — Lightweight queue (Bull/Redis)** | New Redis + Bull consumer | Retries, visibility timeout | New infrastructure not in monorepo today |
| **C — AWS SQS** | `@vassembly/client-aws-sqs` enqueue on create; new worker consumer | Durable, fits AWS deploy | Requires worker app, IAM, polling Lambda/ECS; package currently **unused** |

### 8.2 Recommendation

**MVP: Option A** with explicit operational caveats documented for stakeholders.

**Phase 2: Option C** (preferred over B for alignment with existing `packages/client-aws-sqs`) plus `apps/worker` (or similar) consuming messages and calling `executeTask`.

### 8.3 MVP Trigger Pattern (Pseudocode)

```typescript
// apps/api/src/routes/tasks/create.ts (after createTask)
const { task } = await taskService.createTask({ userId, body });

void taskService.executeTask({ taskId: task.id, userId }).catch((error) => {
  logger.error({ event: 'task.execute.unhandled', taskId: task.id, userId, error });
});

return task;
```

```typescript
// services/task/src/handlers/executeTask/index.ts (orchestration sketch)
export const executeTask = async ({ taskId, userId }: ExecuteTaskParams): Promise<void> => {
  const task = await taskDomain.queries.getModelById({ id: taskId });
  // assert task.agentAssignedId, task.status === in-progress
  try {
    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    if (!preference.data?.integrationCredentialId) {
      await taskDomain.commands.fail({ taskId, errorMessage: '...', errorCode: 'MISSING_CREDENTIAL' });
      return;
    }
    const client = await aiIntegrationDomain.commands.resolveAndBuildClient({
      userId,
      connectionOverride: { integrationCredentialId: preference.data.integrationCredentialId },
    });
    const result = await systemAgentDomain.commands.invoke({
      modeledProviderClient: client,
      systemAgentId: task.data.agentAssignedId!,
      message: task.data.description!,
    });
    await taskDomain.commands.complete({ taskId, llmResponse: result.message });
  } catch (error) {
    await taskDomain.commands.fail({ taskId, errorMessage: mapError(error), errorCode: mapCode(error) });
  }
};
```

### 8.4 Phase 2 SQS Flow (ASCII)

```
POST /tasks → createTask → SQS push { taskId, userId }
                              ↓
                    apps/worker → executeTask
```

---

## 9. Error Handling Strategy

### 9.1 Error Categories

| Category | Example | `errorCode` (suggested) | User `errorMessage` |
|----------|---------|-------------------------|---------------------|
| Configuration | No `userSystemAgentPreferences` / missing credential | `MISSING_CREDENTIAL` | Configure “preferred for system calls” in settings |
| Configuration | Credential disconnected / invalid | `INVALID_CREDENTIAL` | Reconnect AI integration |
| Agent | Assigned system agent not found/inactive | `AGENT_UNAVAILABLE` | Task could not run; contact support |
| Provider | 4xx/5xx from LangChain provider | `PROVIDER_ERROR` | Provider message (sanitized) |
| Provider | Timeout | `PROVIDER_TIMEOUT` | Request timed out; try again later |
| Internal | Unexpected exception | `INTERNAL_ERROR` | Something went wrong; try creating a new task |

### 9.2 Persistence Rules

- Always set `status: failed` and `failedAt` when execution cannot complete successfully.
- Store **user-safe** text in `errorMessage`; log full stack/cause via logger (no API keys).
- Do **not** partially write `llmResponse` on failure.
- Unhandled promise rejections in fire-and-forget must still attempt `fail` command in `catch`.

### 9.3 Retry Strategy

| MVP | Future |
|-----|--------|
| No automatic retries | Optional manual “Retry” button (new REST command) or queue-based retry with max attempts |

### 9.4 Error Visibility

- Task detail: error section with `errorMessage` and status badge `Failed`.
- List page: failed status visible via existing `taskStatusDisplay`.
- Logs: `task.execution.failed` with `taskId`, `userId`, `errorCode`.

---

## 10. Notification & Update Strategy

### 10.1 Assessment

| Approach | Fit for Vassembly today |
|----------|-------------------------|
| **Polling** | No WebSocket/SSE in `apps/web`; detail page already one-shot fetch + manual `loadVersion` retry |
| **WebSocket / SSE** | Would require new API gateway plumbing and connection management |
| **Push notifications** | Out of scope |

### 10.2 Recommendation (MVP)

**GraphQL polling on task detail only** while `status === 'in-progress'`.

| Parameter | Value |
|-----------|-------|
| Interval | 3 seconds |
| Stop condition | `done`, `failed`, or component unmount |
| Scope | `/tasks/[id]` only (not homepage list) |
| Cache | `fetchPolicy: 'no-cache'` (existing) |

**Homepage list:** No background polling in MVP; user sees updated status on navigation or refresh.

### 10.3 Pros / Cons (This Context)

| | Polling | WebSocket / SSE |
|---|---------|-----------------|
| **Pros** | Matches current hooks; trivial to implement; no new infra; sufficient for low volume | Instant updates; lower redundant traffic at scale |
| **Cons** | Latency up to poll interval; extra GraphQL load | New subsystem; auth on connections; ops complexity |

**Phase 2:** Re-evaluate SSE if volume grows or list page needs live updates.

---

## 11. Monitoring & Logging Requirements

### 11.1 Status Transition Events

Emit structured logs via `@vassembly/logger` from `service-task` (not domain):

| Event name | When | Required fields |
|------------|------|-----------------|
| `task.status.created` | Document inserted | `taskId`, `userId`, `status`, `agentAssignedId` |
| `task.status.in_progress` | Execution starts (if distinct from create) | `taskId`, `userId`, `previousStatus`, `newStatus` |
| `task.status.done` | Success persist | `taskId`, `userId`, `durationMs`, `provider`, `model` (from metadata if present) |
| `task.status.failed` | Failure persist | `taskId`, `userId`, `errorCode`, `durationMs` |

### 11.2 Storage / Display

| Sink | MVP |
|------|-----|
| Application logs | Yes |
| DB event table | No |
| User-facing timeline | Extend synthetic timeline (`buildSyntheticTimelineEvents.ts`) |

### 11.3 Optional Metrics (Phase 2)

- Counter: `tasks_created_total`, `tasks_completed_total`, `tasks_failed_total`
- Histogram: `task_execution_duration_seconds`

---

## 12. Implementation Phases & Sequencing

### Phase 1 — MVP (Core Async Processing)

| Step | Package | Deliverable |
|------|---------|-------------|
| 1 | `domains/task` | Model fields, `updateExecution` commands, DTO/GraphQL/mapper |
| 2 | `services/task` | `executeTask`, wire `createTask` trigger, logging |
| 3 | `services/agent` (optional) | Shared preference resolution helper |
| 4 | `apps/api` | Extended schemas, fire-and-forget trigger |
| 5 | `ui/api-hooks` | Types + GraphQL fields |
| 6 | `apps/web` | Polling, response/error UI, timeline |

**Exit criteria:** End-to-end manual test: create task → see in-progress → see done with response on detail page.

### Phase 2 — Durability & Observability (Future)

- SQS enqueue + `apps/worker`
- Idempotency key on messages
- Optional manual retry REST command
- Real `task_events` collection
- SSE or WebSocket for detail page
- Metrics export

### Dependency Graph (Phase 1)

```
domains/task (model + commands)
        ↓
services/task (executeTask + createTask)
        ↓
apps/api (POST /tasks trigger)
        ↓
ui/api-hooks → apps/web
```

---

## 13. Architectural Decisions & Rationale

### 13.1 Layering

| Concern | Owner |
|---------|--------|
| Task persistence & status | `domain-task` |
| LLM invoke & prompt | `domain-system-agent` |
| Credential client | `domain-ai-integration` |
| Orchestration | `service-task` |
| HTTP/GraphQL | `apps/api` |

Domains do not import each other; `service-task` composes domains (same as `service-agent` for invoke).

### 13.2 Code Organization (New / Modified Files)

| Path | Action |
|------|--------|
| `domains/task/src/model/model.ts` | Add fields |
| `domains/task/src/commands/updateExecution/` | New command(s) |
| `domains/task/src/model/toTaskResponse.ts` | Map new fields |
| `domains/task/src/model/graphql.ts` | Expose fields |
| `services/task/src/handlers/executeTask/` | New handler |
| `services/task/src/handlers/createTask/index.ts` | Trigger execute |
| `apps/api/src/routes/tasks/create.ts` | Schema + void trigger |
| `ui/api-hooks/src/tasks/graphql/getTaskQuery.ts` | Query fields |
| `apps/web/app/tasks/[id]/` | Polling + response UI |

### 13.3 Why Not GraphQL Mutation for Create?

Existing `POST /tasks` follows workspace **REST for commands** rule; extend in place.

### 13.4 Why Reuse `invoke` Command?

`domains/system-agent/src/commands/invoke/index.ts` already implements `{rule}\n\n{message}` and returns `{ message, usage, metadata }` — identical product requirement; avoids duplicate LangChain wiring.

### 13.5 `title` vs `llmResponse`

Task detail PRD Phase 1 used `title` as “AI Summary.” MVP introduces **`llmResponse`** for full text to avoid overloading summary semantics and to keep list search behavior stable. Future job may copy excerpt into `title` for list previews.

### 13.6 Architecture Diagram (Packages)

```
┌─────────────┐     REST      ┌─────────────┐    handlers    ┌──────────────┐
│  apps/web   │ ────────────► │  apps/api   │ ─────────────► │ service-task │
└─────────────┘               └─────────────┘                └──────┬───────┘
       │ GraphQL                     │                              │
       └─────────────────────────────┘                              │
                    │                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                    ▼                         ▼                         ▼
            ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
            │ domain-task  │    │ domain-system-  │    │ domain-ai-       │    │ packages/client-   │
            │ (tasks coll) │    │ agent (invoke)  │    │ integration      │    │ langchain (via dom)│
            └──────────────┘    └─────────────────┘    └──────────────────┘    └────────────────────┘
```

---

## 14. Open Questions & Assumptions

### Assumptions (documented)

| ID | Assumption |
|----|------------|
| A-1 | **Access control:** Product states “no restrictions”; MVP implements **authenticated-only** create/read. Confirm whether **owner-only** (`userId` match) from [task-detail-page PRD](./task-detail-page/prd.md) is superseded. |
| A-2 | **Initial status:** New tasks are returned as `in-progress`, not `created`. |
| A-3 | **No preference fallback:** Unlike admin override on invoke, tasks **fail** if user has no system-call credential. |
| A-4 | **Full response storage:** Entire provider message stored in `llmResponse` without summarization. |
| A-5 | **Max response size:** Apply 5000-character cap unless product specifies otherwise (provider may return more). |
| A-6 | **Dependencies:** External feature dependencies deferred to later phase — not enumerated in this PRD. |
| A-7 | **Assistant agent:** All tasks use `SYSTEM_AGENT_NAME.Assistant` assigned at create (current `createTask` behavior). |

### Open Questions for Product / Business

| ID | Question |
|----|----------|
| Q-1 | Should access remain **owner-only** despite “no restrictions” note? |
| Q-2 | Maximum `llmResponse` length to persist? Truncate or reject? |
| Q-3 | Should homepage list poll in-progress tasks, or only detail page? |
| Q-4 | On missing credential, should we still create the task (failed immediately) or reject create synchronously? **Recommendation:** create + fail async to keep UX consistent. |
| Q-5 | Expose `usage` / `metadata` (tokens, model) on GraphQL for power users? |
| Q-6 | Is `created` status needed on any UI, or deprecate for new tasks? |

---

## Appendix A — Key File Reference

| Concern | Path |
|---------|------|
| Task model | `domains/task/src/model/model.ts` |
| Task create command | `domains/task/src/commands/create/index.ts` |
| Create handler | `services/task/src/handlers/createTask/index.ts` |
| Invoke reference | `services/agent/src/handlers/invokeSystemAgent/index.ts` |
| LLM command | `domains/system-agent/src/commands/invoke/index.ts` |
| Preferences model | `domains/system-agent/src/model/preferenceModel.ts` |
| REST create | `apps/api/src/routes/tasks/create.ts` |
| GraphQL resolvers | `apps/api/src/graphql/resolvers/task.ts` |
| Task detail page | `apps/web/app/tasks/[id]/page.tsx` |
| Detail data hook | `apps/web/app/tasks/[id]/useTaskDetailPage.ts` |
| SQS client (future) | `packages/client-aws-sqs/src/index.ts` |

---

## Appendix B — Decision Record Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Async mechanism (MVP) | In-process fire-and-forget | No worker/queue today; low volume |
| Status updates API | Internal only | Prevent client tampering |
| LLM stack | Reuse system-agent invoke + ai-integration | Proven path, minimal new logic |
| User updates (MVP) | Polling on detail page | Matches existing web patterns |
| Response field | `llmResponse` | Full text; don’t overload `title` |
| Retries | None | Per product clarification |

---

*End of PRD — ready for architecture.md and implementation todos.*
