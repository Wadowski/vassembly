# Product Requirements Document: Pause, Resume, and Retry Task

**Document status:** Draft  
**Last updated:** 2026-06-16  
**Feature slug:** `pause-resume-task`  
**Related docs:** [Async LLM Task Execution](../async-llm-task-execution/architecture.md) · [Real-Time Execution Progress](../real-time-execution-progress/prd.md) · [Task Detail Page](../task-detail-page/prd.md) · [Progress Event AI Integration](../progress-event-ai-integration/architecture.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Story & Acceptance Criteria](#2-user-story--acceptance-criteria)
3. [State Machine](#3-state-machine)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Edge Cases](#6-edge-cases)
7. [API Contract](#7-api-contract)
8. [UI Spec](#8-ui-spec)
9. [Out of Scope (v1)](#9-out-of-scope-v1)
10. [Gherkin Acceptance Scenarios](#10-gherkin-acceptance-scenarios)
11. [Dependencies](#11-dependencies)
12. [Open Questions](#12-open-questions)


---

## 1. Overview

### 1.1 Feature Summary

Users can **pause** an in-progress task to stop ongoing LLM execution and **resume** it later, continuing from the last completed progress step. Users can also **retry** a failed or paused task, restarting execution from the beginning.

Pause persists the task status in MongoDB; resume re-invokes task execution without re-running steps that already completed; retry discards any prior checkpoint and re-runs the full task.

This feature adds a new non-terminal task status (`paused`), REST pause/resume/retry commands, in-process LLM cancellation, checkpoint-based resume via existing `task-progress` events, and Task Detail Page controls (pause, resume, and retry buttons in the header).

### 1.2 Goals

| Goal | Description |
|------|-------------|
| **User control** | Allow users to stop long-running LLM work without losing completed progress, and restart when needed |
| **Durability** | Persist `paused` status on the task entity; use existing progress events as the checkpoint |
| **Resume fidelity** | Resume from the step *after* the last `completed` progress event — no duplicate completed steps |
| **Retry from failure or pause** | Allow users to restart a `failed` or `paused` task from scratch |
| **Convention compliance** | REST for pause/resume/retry commands; GraphQL for task reads |

### 1.3 Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| Cancel/abort task | Explicitly out of scope for v1 |
| Additional checkpoint storage | Last completed progress event in DB is sufficient (Option C) |
| Auto-expiry of paused tasks | Tasks may remain paused indefinitely |
| Multi-tab real-time sync | Polling interval is sufficient |
| WebSocket push for pause state | Not required for v1 |
| Pause history / audit log | Not required for v1 |

---

## 2. User Story & Acceptance Criteria

### 2.1 User Story

> As a User, I want to pause, resume, and retry a task, so I can stop ongoing LLM execution and continue it later from where it left off, or restart it from scratch when needed.

### 2.2 Acceptance Criteria

| # | Criterion |
|---|-----------|
| **AC-1** | When a Task is in **in-progress** state, the user sees a **pause button** next to the status badge in the task detail header. |
| **AC-2** | After clicking pause: (a) Task transitions to **paused** state; (b) A **resume button** and a **retry button** are shown instead of pause; (c) All LLM calls for that task are stopped. |
| **AC-3** | After clicking resume: (a) Task transitions back to **in-progress** state; (b) Task LLM execution is triggered from where it stopped (resume from the last completed progress step). |
| **AC-4** | When a Task is in **failed** state, the user sees a **retry button** next to the status badge in the task detail header. |
| **AC-5** | When a Task is in **paused** state, the user sees both a **resume button** and a **retry button** next to the status badge. |
| **AC-6** | After clicking retry (from either `failed` or `paused` state): (a) Task transitions to **in-progress** state; (b) Task LLM execution restarts from the beginning, ignoring any prior progress events. |

### 2.3 Confirmed Product Decisions (Non-Negotiable)

| Decision | Choice |
|----------|--------|
| Checkpoint semantics | **Option C** — resume from last completed progress step. Read last `completed` event from `domains/task-progress` → re-invoke `executeTask` starting after that step. No additional checkpoint storage. |
| Retry semantics | Restart from scratch — ignores all prior progress events and runs `executeTask` from the beginning. |
| Cancel in scope | **Pause-only for v1.** No cancel/abort feature. |
| Retry in scope | **Yes** — available from `failed` and `paused` states. |
| Durability | Save `paused` status on task DB entity. Progress events are the checkpoint. |
| Paused indefinitely | No auto-expiry or auto-fail. |
| Multi-tab reflection | No real-time sync; polling is sufficient. |
| Parallel work | `progress-event-ai-integration` proceeds independently; shared execution path only. |
| Delivery | Phased PRs following project conventions. |

---

## 3. State Machine

### 3.1 Task Status Enum (Extended)

Add `paused` to `TaskStatus` in `domains/task`:

| Status | Terminal? | Description |
|--------|-----------|-------------|
| `created` | No | Legacy only; new tasks skip to `in-progress` |
| `in-progress` | No | Task is executing or awaiting execution |
| **`paused`** | **No** | Execution stopped by user; may resume or remain paused indefinitely |
| `done` | Yes | Task completed successfully |
| `failed` | Yes | Task failed during execution |

### 3.2 Valid Transitions

```mermaid
stateDiagram-v2
    [*] --> in-progress : createTask / executeTask start
    in-progress --> paused : PATCH /tasks/:id/pause
    paused --> in-progress : PATCH /tasks/:id/resume (from checkpoint)
    paused --> in-progress : PATCH /tasks/:id/retry (from scratch)
    failed --> in-progress : PATCH /tasks/:id/retry (from scratch)
    in-progress --> done : executeTask complete
    in-progress --> failed : executeTask fail
    paused --> paused : idempotent pause (no-op)
    done --> [*]
    failed --> [*]

    note right of paused
        Non-terminal.
        No auto-expiry.
        User may resume (checkpoint)
        or retry (from scratch)
        at any time.
    end note
```

### 3.3 ASCII Reference

```
                    ┌──────────────┐
                    │  in-progress │◄─────────────────────────────┐
                    └──────┬───────┘                              │
                           │                        resume/retry  │
              pause        │                                      │
                           ▼                                      │
                    ┌──────────────┐  resume (checkpoint) ────────┤
                    │    paused    │                              │
                    └──────────────┘  retry (from scratch) ──────┤
                                                                  │
    in-progress ──complete──► done (terminal)                     │
    in-progress ──fail──────► failed ─── retry (from scratch) ───┘

    Invalid: done/created → paused
    Invalid: paused → done/failed (must resume/retry to in-progress first)
```

### 3.4 Transition Guards

| Transition | Precondition | Postcondition |
|------------|--------------|---------------|
| `in-progress → paused` | Task owned by authenticated user; status is `in-progress` | Status `paused`; active execution cancelled |
| `paused → in-progress` (resume) | Task owned by authenticated user; status is `paused` | Status `in-progress`; `executeTask` re-invoked from last completed step |
| `paused → in-progress` (retry) | Task owned by authenticated user; status is `paused` | Status `in-progress`; `executeTask` invoked from the beginning |
| `failed → in-progress` (retry) | Task owned by authenticated user; status is `failed` | Status `in-progress`; `executeTask` invoked from the beginning |
| `in-progress → done/failed` | Normal execution lifecycle | Terminal; pause/resume/retry buttons updated accordingly |

---

## 4. Functional Requirements

### 4.1 Domain Layer (`domains/task`)

| ID | Requirement |
|----|-------------|
| **FR-D1** | Add `TaskStatus.Paused = 'paused'` to the task model enum. |
| **FR-D2** | Add `pause` command: set task `status` to `paused`. Optionally persist `pausedAt` timestamp (see Open Questions). |
| **FR-D3** | Add `resume` command: set task `status` to `in-progress` (does not itself invoke LLM — service layer triggers execution). |
| **FR-D4** | Add `retry` command: set task `status` to `in-progress` and clear `errorMessage`, `errorCode`, `failedAt` (does not itself invoke LLM — service layer triggers execution from scratch). |
| **FR-D5** | Extend task DTO, GraphQL schema, and mappers to expose `paused` status (and `pausedAt` if added). |
| **FR-D6** | Pause/resume/retry commands validate task exists and belongs to the requesting user (via service layer ownership check). |

### 4.2 Service Layer (`services/task`)

| ID | Requirement |
|----|-------------|
| **FR-S1** | Add `pauseTask` handler: verify ownership → verify status is `in-progress` → signal in-process execution to stop → persist `paused`. |
| **FR-S2** | Add `resumeTask` handler: verify ownership → verify status is `paused` → persist `in-progress` → fire-and-forget `executeTask` with resume semantics. |
| **FR-S3** | Add `retryTask` handler: verify ownership → verify status is `paused` or `failed` → persist `in-progress` (clearing error fields) → fire-and-forget `executeTask` from the beginning (no checkpoint). |
| **FR-S4** | **Execution registry:** Maintain an in-process registry mapping `taskId` → active execution context (e.g., `AbortController`) so `pauseTask` can cancel the running LLM loop. |
| **FR-S5** | **Resume checkpoint logic:** On resume, `executeTask` reads `task-progress` events, finds the last event with `state: completed`, and continues execution from the *next* step. If no completed events exist, execution starts from the beginning. |
| **FR-S6** | **Retry logic:** On retry, `executeTask` runs the full task from the beginning regardless of any prior progress events. Prior progress events remain in DB (immutable) for historical reference. |
| **FR-S7** | **Pause during execution:** When pause is processed, the active `runAgentInvokeWithTools` invocation for that task must be cancelled. In-flight tool calls and nested agent invocations (`useAgent` internal tool) initiated by that task's execution must also stop. |
| **FR-S8** | **Idempotency:** `pauseTask` on an already-`paused` task returns success with current task state (no error). `resumeTask` on an already-`in-progress` task returns success (no duplicate execution trigger). `retryTask` on an already-`in-progress` task returns 409. |
| **FR-S9** | **Race with terminal states:** If `pauseTask` is called when task is already `done` or `failed`, return a conflict error (409) without modifying the task. |
| **FR-S10** | **Race with completion:** If execution completes or fails concurrently with pause, terminal state wins; pause request returns 409. |

### 4.3 API Gateway (`apps/api`)

| ID | Requirement |
|----|-------------|
| **FR-A1** | `PATCH /tasks/:id/pause` — authenticated, owner-only, calls `pauseTask`. |
| **FR-A2** | `PATCH /tasks/:id/resume` — authenticated, owner-only, calls `resumeTask`. |
| **FR-A3** | `PATCH /tasks/:id/retry` — authenticated, owner-only, calls `retryTask`. |
| **FR-A4** | All three endpoints return the updated task DTO (same shape as create response). |
| **FR-A5** | GraphQL task query continues to serve reads; no GraphQL mutations for pause/resume/retry. |

### 4.4 Frontend (`apps/web`, `ui/api-hooks`)

| ID | Requirement |
|----|-------------|
| **FR-U1** | Add REST client hooks: `pauseTask`, `resumeTask`, `retryTask` in `ui/api-hooks` (http layer). |
| **FR-U2** | Extend `TaskStatus` enum and `taskStatusDisplay` mappings for `paused` (label, icon, color). |
| **FR-U3** | **Pause button visibility:** Shown in `TaskDetailHeader` utility row, immediately adjacent to `TaskStatusBadge`, only when `task.status === in-progress`. |
| **FR-U4** | **Resume button visibility:** Shown only when `task.status === paused`. |
| **FR-U5** | **Retry button visibility:** Shown when `task.status === paused` or `task.status === failed`. When paused, both resume and retry buttons are shown simultaneously. |
| **FR-U6** | **Loading/disabled states:** While any action request (pause/resume/retry) is in flight, the clicked button shows loading state and all action buttons are disabled to prevent double-submit. |
| **FR-U7** | **Optimistic or refresh-on-success:** On successful pause/resume/retry response, update local task state from response body. On error, show snackbar and revert to last known state. |
| **FR-U8** | **Polling behavior:** `useTaskDetailPage` polls every 3s only while `status === in-progress`. Polling stops when `paused`, `done`, or `failed`. Resumes polling when status returns to `in-progress` after resume or retry. |
| **FR-U9** | **AI Response section:** When `paused`, show a paused-state message (not "Processing..."). When `in-progress`, keep existing "Processing..." label. |
| **FR-U10** | **Execution Progress panel:** Remains visible when paused or failed; shows events recorded up to pause/failure point. No new events while paused. On retry, new events append; prior events remain visible. |

### 4.5 Button Visibility Matrix

| Task Status | Pause Button | Resume Button | Retry Button | Polling |
|-------------|--------------|---------------|--------------|---------|
| `created` | Hidden | Hidden | Hidden | Off |
| `in-progress` | **Visible** | Hidden | Hidden | **On (3s)** |
| `paused` | Hidden | **Visible** | **Visible** | Off |
| `done` | Hidden | Hidden | Hidden | Off |
| `failed` | Hidden | Hidden | **Visible** | Off |

---

## 5. Non-Functional Requirements

### 5.1 Consistency

| ID | Requirement |
|----|-------------|
| **NFR-C1** | After successful pause API response, task status in DB is `paused` and no further progress events are written for that execution until resume. |
| **NFR-C2** | After successful resume API response, task status in DB is `in-progress` and a new execution cycle begins within the same API process (Option A fire-and-forget). |
| **NFR-C3** | Progress events from the pre-pause execution remain immutable and visible; resume appends new events without modifying prior ones. |

### 5.2 Error Handling

| Scenario | HTTP Status | User-Facing Behavior |
|----------|-------------|----------------------|
| Unauthenticated | 401 | Redirect to login (existing pattern) |
| Task not found or not owned | 404 | Snackbar: task unavailable |
| Pause when not `in-progress` (done/failed/created) | 409 | Snackbar: "This task can no longer be paused." |
| Resume when not `paused` | 409 | Snackbar: "This task is not paused." |
| Retry when not `paused` or `failed` | 409 | Snackbar: "This task cannot be retried." |
| Resume when credential missing/expired | 200 → task becomes `failed` | Task detail shows failure state with credential error message |
| Retry when credential missing/expired | 200 → task becomes `failed` | Same as resume credential failure |
| Server error | 500 | Snackbar: generic error message |

### 5.3 Idempotency

| Operation | Repeat Request Behavior |
|-----------|---------------------------|
| Pause on `paused` task | 200, return current task (no-op) |
| Pause on `in-progress` with no active execution | 200, set `paused` (handles stuck/orphaned in-progress) |
| Resume on `paused` task | 200, trigger execution once from checkpoint |
| Resume on `in-progress` task | 200, no duplicate execution (idempotent) |
| Retry on `failed` or `paused` task | 200, trigger execution from scratch |
| Retry on `in-progress` task | 409, no duplicate execution |

### 5.4 Authorization

| ID | Requirement |
|----|-------------|
| **NFR-A1** | Only the task owner (`task.userId === authenticated userId`) may pause or resume. |
| **NFR-A2** | Cross-user pause/resume attempts return 404 (no data leak). |

### 5.5 Performance

| ID | Requirement |
|----|-------------|
| **NFR-P1** | Pause API response ≤ 2s (p95), including cancellation signal propagation. |
| **NFR-P2** | Resume API response ≤ 500ms (p95) — execution is fire-and-forget; HTTP returns after status persist. |

### 5.6 Accessibility

| ID | Requirement |
|----|-------------|
| **NFR-X1** | Pause and resume buttons are keyboard-focusable with visible focus ring. |
| **NFR-X2** | Buttons have `aria-label`: "Pause task" / "Resume task". |
| **NFR-X3** | Loading state announced via `aria-busy` on the action button. |

---

## 6. Edge Cases

### 6.1 Pause While Nested Agent Call Is Running

**Context:** `executeTask` invokes the root agent via `runAgentInvokeWithTools`. Nested agents may run via the `useAgent` internal tool, creating a call stack of LLM invocations tied to one task execution.

**Expected behavior:**

| Aspect | Requirement |
|--------|-------------|
| What gets cancelled | The **entire task execution context** — the root invocation and any nested agent invocations currently in-flight for that `taskId`. |
| Progress events | Any `started` event without a matching `completed`/`failed` at pause time may remain as `started` (orphaned). Resume continues from the last `completed` event, not from the orphaned `started` step. |
| Which invocation | The **currently active** invocation in the task's execution stack (deepest in-flight nested call if nested; otherwise root). Cancellation propagates up via the shared abort signal for the task. |

*Exact cancellation propagation is deferred to the Architect (see §12).*

### 6.2 Task Completes or Fails Between UI Click and Server Processing

**Scenario:** User clicks Pause; before the server processes the request, `executeTask` completes and sets status to `done`.

**Expected behavior:**

- `pauseTask` detects terminal status → returns **409 Conflict** with error code `TASK_NOT_PAUSABLE`.
- UI shows snackbar; refreshes task from server; pause button disappears (status is `done`).
- No partial state: task remains `done` with full `llmResponse`.

### 6.3 User Resumes After Long Pause (Credential Change or Expiry)

**Scenario:** Task paused for days. User's preferred AI credential was removed or expired.

**Expected behavior:**

- `resumeTask` succeeds (status → `in-progress`, execution triggered).
- `executeTask` resolves credential at resume time (same as initial execution).
- If credential missing: task transitions to `failed` with `errorCode: MISSING_CREDENTIAL` and user-facing message from existing execution path.
- UI reflects `failed` state; resume button hidden; user directed to Settings (existing pattern).

### 6.4 Task Stuck in `in-progress` After API Restart

**Scenario:** API process restarts while a task was genuinely `in-progress` (execution lost) vs. user had paused (status persisted as `paused` in DB).

**Expected behavior:**

| DB Status | Behavior |
|-----------|----------|
| `paused` | Survives restart. User sees resume button. No execution until resume. |
| `in-progress` (orphaned) | No in-process execution registry entry. User may click Pause → succeeds (sets `paused`, no-op cancel). Or user waits — task stays `in-progress` with no progress until manual pause/resume or operational intervention. |

*Operational remediation for orphaned `in-progress` tasks is out of v1 scope; pause provides a user-facing recovery path.*

### 6.5 Double-Click or Duplicate Pause/Resume Requests

**Scenario:** User double-clicks Pause or sends duplicate API calls.

**Expected behavior:**

- UI disables button on first click (FR-U5).
- Second in-flight request: first completes → second is idempotent (pause on `paused` → 200 no-op).
- No duplicate execution on duplicate resume when already `in-progress`.

### 6.6 Pause With Zero Progress Events

**Scenario:** User pauses immediately after task creation, before any progress event is recorded.

**Expected behavior:**

- Task status → `paused`; execution cancelled.
- Resume: no completed events → `executeTask` runs from the beginning (full agent invoke with original task description).

### 6.7 Multi-Tab Usage

**Scenario:** User pauses in Tab A; Tab B still shows in-progress until next manual navigation or refresh.

**Expected behavior:**

- Tab B does not receive real-time updates (confirmed decision).
- Tab B stops polling if it was polling (only polls while locally known status is `in-progress`).
- On page reload or re-fetch, Tab B reflects `paused` from GraphQL.

---

## 7. API Contract

### 7.1 Conventions

- **Commands:** REST `PATCH` (state change)
- **Reads:** GraphQL `task(id: ID!)` (unchanged)
- **Auth:** Session/cookie auth via `authorizeRequest` (same as `POST /tasks`)
- **Response shape:** Same as existing task response DTO

### 7.2 `PATCH /tasks/:id/pause`

**Request:**

```
PATCH /tasks/:id/pause
Authorization: (session cookie)
Content-Type: application/json

(no body)
```

**Success Response (200):**

```typescript
interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: string;
  status: 'paused';  // after successful pause
  agentAssignedId: string | null;
  title: string | null;
  llmResponse: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;      // ISO 8601
  completedAt: string | null;
  failedAt: string | null;
  pausedAt: string | null;       // ISO 8601 — if field added
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**

| Status | `type` / condition | `message` (example) | `errorCode` (in body if applicable) |
|--------|-------------------|---------------------|-------------------------------------|
| 401 | Unauthorized | Unauthorized | — |
| 404 | Task not found or not owned | Task not found | — |
| 409 | Status not `in-progress` | This task can no longer be paused. | `TASK_NOT_PAUSABLE` |
| 500 | Internal error | An unexpected error occurred. | — |

**Idempotent success:** Pause on already-`paused` task → **200** with current task.

### 7.3 `PATCH /tasks/:id/resume`

**Request:**

```
PATCH /tasks/:id/resume
Authorization: (session cookie)
Content-Type: application/json

(no body)
```

**Success Response (200):**

```typescript
interface TaskResponse {
  // same shape as pause response
  status: 'in-progress';  // after successful resume
  // ...
}
```

**Error Responses:**

| Status | `type` / condition | `message` (example) | `errorCode` |
|--------|-------------------|---------------------|-------------|
| 401 | Unauthorized | Unauthorized | — |
| 404 | Task not found or not owned | Task not found | — |
| 409 | Status not `paused` | This task is not paused. | `TASK_NOT_RESUMABLE` |
| 500 | Internal error | An unexpected error occurred. | — |

**Idempotent success:** Resume on already-`in-progress` task → **200** with current task (no second execution).

### 7.4 `PATCH /tasks/:id/retry`

**Request:**

```
PATCH /tasks/:id/retry
Authorization: (session cookie)
Content-Type: application/json

(no body)
```

**Success Response (200):**

```typescript
interface TaskResponse {
  // same shape as pause/resume response
  status: 'in-progress';  // after successful retry
  errorMessage: null;     // cleared on retry
  errorCode: null;        // cleared on retry
  failedAt: null;         // cleared on retry
  // ...
}
```

**Error Responses:**

| Status | `type` / condition | `message` (example) | `errorCode` |
|--------|-------------------|---------------------|-------------|
| 401 | Unauthorized | Unauthorized | — |
| 404 | Task not found or not owned | Task not found | — |
| 409 | Status not `paused` or `failed` | This task cannot be retried. | `TASK_NOT_RETRYABLE` |
| 500 | Internal error | An unexpected error occurred. | — |

### 7.5 GraphQL (Read — Unchanged Pattern)

Task query continues to return status including new `paused` value. Clients add `paused` to `TaskStatus` enum and selection sets. No new GraphQL mutations.

---

## 8. UI Spec

### 8.1 Placement

**Location:** Task Detail Page header — `TaskDetailHeader` utility row (`utilityHeader`).

**Layout (left → right):**

```
[ ← Back to tasks ]          [ Pause ] [ Resume ] [ Retry ] [ Status Badge ]
```

- Action buttons sit **immediately to the left** of `TaskStatusBadge`.
- At most two action buttons are visible at any time (pause only when in-progress; resume + retry when paused; retry only when failed).
- Use existing `Button` component with icon variant.
- **Pause icon:** `ButtonPauseIcon` from `@vassembly/ui-icons` (already exists, unused for tasks).
- **Resume icon:** Use design-system play/resume icon consistent with existing icon set (Architect/design to confirm exact icon export).
- **Retry icon:** Use design-system refresh/retry icon consistent with existing icon set (Architect/design to confirm exact icon export).

### 8.2 Button States

| State | Pause Button | Resume Button | Retry Button |
|-------|--------------|---------------|--------------|
| Default (in-progress) | Enabled, icon + optional "Pause" text | Hidden | Hidden |
| Default (paused) | Hidden | Enabled, icon + "Resume" text | Enabled, icon + "Retry" text |
| Default (failed) | Hidden | Hidden | Enabled, icon + "Retry" text |
| Loading (request in flight) | `aria-busy`, disabled, loading spinner | Same | Same |
| Hidden (done/created) | Not rendered | Not rendered | Not rendered |

### 8.3 Status Badge — `paused`

Extend `taskStatusDisplay.ts` following existing pattern:

| Property | Proposed Value | Notes |
|----------|----------------|-------|
| Label | `Paused` | Title case, consistent with "In progress" |
| Color | `warning` | Distinguishes from active (`info`) and terminal states |
| Icon | `ButtonPauseIcon` or dedicated pause status icon | Match design system; reuse pause metaphor |

### 8.4 Polling Rules

| Local Task Status | Poll Task GraphQL? | Interval |
|-------------------|-------------------|----------|
| `in-progress` | Yes | 3000ms |
| `paused` | No | — |
| `done` | No | — |
| `failed` | No | — |
| `created` | No | — |

After resume click succeeds and status becomes `in-progress`, polling resumes automatically.

### 8.5 AI Response Section (`TaskDetailAiResponse`)

| Status | Display |
|--------|---------|
| `in-progress` | "Processing..." (existing) |
| `paused` | "Task paused — click Resume to continue, or Retry to restart from scratch." |
| `done` | AI Response markdown (existing) |
| `failed` | Existing error display (existing); retry button visible in header |

### 8.6 Snackbar Messages

| Action | Success | Error |
|--------|---------|-------|
| Pause | Optional: "Task paused" (or silent — status badge update is sufficient) | "Unable to pause task. {reason}" |
| Resume | Optional: "Task resumed" | "Unable to resume task. {reason}" |
| Retry | Optional: "Task restarted" | "Unable to retry task. {reason}" |

### 8.7 Task List (Homepage)

- Task list cards show `Paused` badge using same `taskStatusDisplay` mappings.
- No pause/resume actions on list view in v1 (detail page only).

---

## 9. Out of Scope (v1)

| Item | Notes |
|------|-------|
| Cancel / abort task | User decision: pause-only |
| Auto-expiry of paused tasks | Tasks may remain paused forever |
| Multi-tab real-time sync | Polling on single tab is sufficient |
| WebSocket / SSE for pause state | Not required |
| Pause history / audit log | Not required |
| Pause/resume from Task List | Detail page only |
| Admin override (pause another user's task) | Owner-only |
| Partial checkpoint beyond progress events | Option C only — no extra storage |
| Cross-process execution (Phase 2 worker) | Future; see Async LLM Task Execution architecture |

---

## 10. Gherkin Acceptance Scenarios

### 10.1 Primary Use Cases

```gherkin
Scenario: Pause an in-progress task
  Given I am authenticated as the task owner
  And a task exists with status "in-progress"
  And the task detail page is open at "/tasks/{taskId}"
  When I click the pause button in the task detail header
  Then the pause API request PATCH "/tasks/{taskId}/pause" is sent
  And the task status becomes "paused"
  And the pause button is hidden
  And the resume button is visible next to the status badge
  And the status badge displays "Paused"
  And LLM execution for that task stops
  And no new progress events are recorded until resume
  And task detail polling stops

Scenario: Resume a paused task and task completes
  Given I am authenticated as the task owner
  And a task exists with status "paused"
  And the task has at least one progress event with state "completed"
  And the task detail page is open at "/tasks/{taskId}"
  When I click the resume button in the task detail header
  Then the resume API request PATCH "/tasks/{taskId}/resume" is sent
  And the task status becomes "in-progress"
  And the resume button is hidden
  And the pause button is visible
  And task detail polling resumes every 3 seconds
  And executeTask continues from the step after the last completed progress event
  And when execution finishes the task status becomes "done"
  And the AI Response section displays the LLM output
```

### 10.2 Secondary Use Cases

```gherkin
Scenario: Pause button not shown for done task
  Given I am authenticated as the task owner
  And a task exists with status "done"
  And the task detail page is open at "/tasks/{taskId}"
  Then the pause button is not visible
  And the resume button is not visible
  And the retry button is not visible
  And the status badge displays "Done"

Scenario: Retry button shown for failed task
  Given I am authenticated as the task owner
  And a task exists with status "failed"
  And the task detail page is open at "/tasks/{taskId}"
  Then the pause button is not visible
  And the resume button is not visible
  And the retry button is visible next to the status badge
  And the status badge displays "Failed"

Scenario: Resume and retry buttons both shown for paused task
  Given I am authenticated as the task owner
  And a task exists with status "paused"
  And the task detail page is open at "/tasks/{taskId}"
  Then the pause button is not visible
  And the resume button is visible next to the status badge
  And the retry button is visible next to the status badge
  And the status badge displays "Paused"

Scenario: Retry a failed task restarts from scratch
  Given I am authenticated as the task owner
  And a task exists with status "failed"
  And the task detail page is open at "/tasks/{taskId}"
  When I click the retry button in the task detail header
  Then the retry API request PATCH "/tasks/{taskId}/retry" is sent
  And the task status becomes "in-progress"
  And the retry button is hidden
  And the pause button is visible
  And task detail polling resumes every 3 seconds
  And executeTask starts from the beginning ignoring any prior progress events
  And when execution finishes the task status becomes "done"

Scenario: Retry a paused task restarts from scratch
  Given I am authenticated as the task owner
  And a task exists with status "paused"
  And the task has progress events with state "completed"
  And the task detail page is open at "/tasks/{taskId}"
  When I click the retry button in the task detail header
  Then the retry API request PATCH "/tasks/{taskId}/retry" is sent
  And the task status becomes "in-progress"
  And executeTask starts from the beginning ignoring prior completed progress events
  And new progress events are appended alongside the prior ones

Scenario: Idempotent pause on already paused task
  Given I am authenticated as the task owner
  And a task exists with status "paused"
  When PATCH "/tasks/{taskId}/pause" is called
  Then the response status is 200
  And the task status remains "paused"
  And no additional execution cancellation occurs

Scenario: Retry on in-progress task returns 409
  Given I am authenticated as the task owner
  And a task exists with status "in-progress"
  When PATCH "/tasks/{taskId}/retry" is called
  Then the response status is 409
  And the task status remains "in-progress"
  And no duplicate execution is triggered
```

### 10.3 Edge Cases & Error Handling

```gherkin
Scenario: Task completes before pause is processed (race)
  Given I am authenticated as the task owner
  And a task exists with status "in-progress"
  And the task detail page shows the pause button
  When the task execution completes and status becomes "done"
  And I click the pause button
  Then PATCH "/tasks/{taskId}/pause" returns 409
  And the UI shows an error snackbar indicating the task can no longer be paused
  And the task status remains "done"
  And the pause button is not visible after refresh

Scenario: Resume after credential change (should fail gracefully)
  Given I am authenticated as the task owner
  And a task exists with status "paused"
  And my preferred AI credential has been removed from Settings
  When I click the resume button
  Then the task status briefly becomes "in-progress"
  And executeTask attempts to resolve the credential
  And the task status becomes "failed"
  And the error message indicates a missing credential
  And the resume button is not visible
  And the user can navigate to Settings to configure a credential

Scenario: Pause while nested agent call is running
  Given I am authenticated as the task owner
  And a task is "in-progress" with a nested agent invocation in flight via useAgent
  When I click the pause button
  Then the active nested LLM call is cancelled
  And the root task execution stops
  And the task status becomes "paused"
  And progress events show completed steps up to the last finished step

Scenario: Double-click pause prevents duplicate requests
  Given I am authenticated as the task owner
  And a task exists with status "in-progress"
  When I double-click the pause button rapidly
  Then only one pause API request is processed meaningfully
  And the button is disabled after the first click
  And the task ends in status "paused"

Scenario: Multi-tab does not sync pause in real time
  Given I have the same task detail page open in two browser tabs
  And the task is "in-progress" in both tabs
  When I pause the task in Tab A
  Then Tab A shows status "paused" and the resume button
  And Tab B continues to show "in-progress" until page reload or manual refresh
  And Tab B does not poll while it locally believes status is not "in-progress" after user navigates away and back
```

---

## 11. Dependencies

### 11.1 Existing Features (Required)

| Dependency | Relationship |
|------------|--------------|
| **Async LLM Task Execution** | Provides `executeTask`, fire-and-forget pattern, task status lifecycle. See [architecture](../async-llm-task-execution/architecture.md). |
| **Real-Time Execution Progress** | Provides `task-progress` events used as resume checkpoint. See [PRD](../real-time-execution-progress/prd.md). |
| **Task Detail Page** | Host UI for pause/resume controls. See [PRD](../task-detail-page/prd.md). |
| **`domains/task-progress`** | Source of truth for last completed step (`events[]` with `state: completed`). |

### 11.2 Parallel Work (Non-Blocking)

| Dependency | Relationship |
|------------|--------------|
| **progress-event-ai-integration** | In-flight in parallel. Shares `executeTask` → `runAgentInvokeWithTools` → progress callback path. Pause/resume PRD proceeds independently; coordinate on execution registry and abort signal injection during implementation. See [architecture](../progress-event-ai-integration/architecture.md). |

### 11.3 Future Work

| Dependency | Relationship |
|------------|--------------|
| **Async LLM Task Execution — Phase 2 worker** | Out-of-process execution via SQS/worker changes execution registry and cancellation semantics. Pause/resume v1 targets in-process (Option A) only. |

### 11.4 Suggested Phased Delivery

| Phase | Scope |
|-------|-------|
| **PR 1** | Domain: `paused` status, `pause`/`resume`/`retry` commands, DTO/GraphQL |
| **PR 2** | Service: execution registry, abort signal, `pauseTask`/`resumeTask`/`retryTask`, checkpoint logic in `executeTask` |
| **PR 3** | API: REST routes + tests |
| **PR 4** | UI: hooks, header buttons (pause/resume/retry), status display, polling, AI response paused state |
| **PR 5** | E2E: Gherkin scenarios for pause/resume/retry flows |

---

## 12. Open Questions

The following decisions are **deferred to the Architect** for the architecture document:

| # | Question | Context |
|---|----------|---------|
| **OQ-1** | Exact in-process cancellation mechanism | No `AbortController` exists today. Options: propagate `AbortSignal` through `executeTask` → `runAgentInvokeWithTools` → LangChain tool loop and nested `useAgent` calls. |
| **OQ-2** | Execution registry design | In-memory `Map<taskId, AbortController>` vs. richer execution handle. Must support nested invocations and clean up on complete/fail/pause. |
| **OQ-3** | Orphaned `started` progress events on pause | Leave as-is vs. write `failed` with reason `paused` for the in-flight step. PRD allows orphaned `started`; architect may prefer explicit failure event. |
| **OQ-4** | Resume implementation detail | How `executeTask` skips completed steps — re-enter agent graph at checkpoint vs. re-invoke root agent with accumulated context. Checkpoint is last `completed` event; execution strategy is architectural. |
| **OQ-5** | `pausedAt` timestamp field | Useful for display and debugging. Not required for checkpoint logic. Confirm add to `TaskModel` or derive from `updatedAt`. |
| **OQ-6** | Resume and retry icon components | Confirm which `@vassembly/ui-icons` exports to use for the resume and retry buttons. |
| **OQ-7** | Concurrent resume + pause ordering | If user clicks resume then pause quickly, define lock/serialization on taskId in service layer. |

---

## Appendix A: QA Functional Checklist

| # | Check | Pass Condition |
|---|-------|----------------|
| 1 | Pause visible on in-progress | Button appears next to badge |
| 2 | Pause transitions status | Badge shows Paused; API returns `paused` |
| 3 | LLM stops on pause | No new progress events; no token usage after pause |
| 4 | Resume + retry visible on paused | Both buttons shown next to status badge |
| 5 | Resume transitions status | Badge shows In progress; polling resumes |
| 6 | Resume continues from checkpoint | No duplicate completed progress steps |
| 7 | Retry visible on failed | Retry button shown next to status badge |
| 8 | Retry from failed starts from scratch | All progress steps re-run; prior events remain in DB |
| 9 | Retry from paused starts from scratch | Prior completed steps ignored; new events appended |
| 10 | Done task — no actions | Pause/resume/retry hidden |
| 11 | 409 on pause of done/failed task | Snackbar shown; status unchanged |
| 12 | 409 on retry of in-progress task | No duplicate execution |
| 13 | Credential missing on retry | Task fails gracefully with clear message |
| 14 | Double-click guarded | All action buttons disabled during request |
| 15 | Owner-only | Other user's task → 404 on pause/resume/retry |
| 16 | Task list badge | Paused tasks show Paused badge on homepage |

## Appendix B: Regression Check

| Area | Must Remain Unchanged |
|------|----------------------|
| Task creation flow | `POST /tasks` still fire-and-forgets `executeTask` |
| GraphQL task query | Still owner-scoped read |
| Progress panel | Still displays historical events when paused |
| Terminal states | `done` behavior unchanged; `failed` now has retry button |
| Auth / login redirect | Unauthenticated detail access unchanged |
