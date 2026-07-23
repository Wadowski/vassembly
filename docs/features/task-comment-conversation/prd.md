# Product Requirements Document: Task Comment Conversation

**Document status:** Approved (stakeholder gate)  
**Last updated:** 2026-07-23 (activity feed UX revision)  
**Implementation:** **On hold** until stakeholder approves proceeding past design/docs.
**Feature slug:** `task-comment-conversation`  
**Related docs:** [Async LLM Task Execution](../async-llm-task-execution/architecture.md) · [Task Detail Page](../task-detail-page/prd.md) · [Pause, Resume, and Retry](../pause-resume-task/prd.md) · [Real-Time Execution Progress](../real-time-execution-progress/prd.md) · [Task Skill Planning](../task-skill-planning/prd.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Story & Acceptance Criteria](#2-user-story--acceptance-criteria)
3. [Data Model](#3-data-model)
4. [Execution & Context](#4-execution--context)
5. [Functional Requirements](#5-functional-requirements)
6. [API Contract](#6-api-contract)
7. [UI Spec](#7-ui-spec)
8. [Edge Cases](#8-edge-cases)
9. [Out of Scope](#9-out-of-scope)
10. [Gherkin Acceptance Scenarios](#10-gherkin-acceptance-scenarios)
11. [Dependencies & Doc Updates](#11-dependencies--doc-updates)

---

## 1. Overview

### 1.1 Feature Summary

Replace the single task field `llmResponse` with a **task comment** thread. Each comment is one document with **user-authored text** and an optional **agent response** filled when that execution turn completes.

Users can continue the conversation on the task detail page after a task reaches `done` by submitting new comments. Each submission starts a new execution turn (`in-progress`), runs the assigned agent with **prior conversation + the new comment** as context, and updates the new comment row with the agent output on success.

On task detail, **one activity feed** lists **all** comments, agent responses, answered HITL, and progress events together, **newest first**. **Task progress is scoped to `commentId`**, not to the task alone.

Task **`description`** remains on the task entity for search and list display (unchanged semantics for create input). The first comment is created at task creation with the same text as the initial user input.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| **Conversation** | Support multiple user ↔ agent turns on one task |
| **Clear ownership** | User text and agent reply live on one `taskComment` row per turn |
| **Search unchanged** | Keep `task.description` for list/search/title flows |
| **Convention compliance** | GraphQL for reads; REST for submit/create commands |
| **Unified feed** | One list for comments, responses, HITL answers, and progress; newest on top; filters + inline expand |
| **Operational parity** | Progress polling during execution unchanged; events render inside the feed, not a separate block |

### 1.3 Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| Data migration | Stakeholder: no backfill of existing `llmResponse` |
| Comment thread on home/list | Detail page only |
| Merging `task-questions` into comment storage | Questions remain in `domain-task-questions`; timeline API aggregates reads |
| Replacing progress events | Resume still uses latest progress checkpoint on the **active comment’s** progress document |

### 1.4 Confirmed Product Decisions

| Decision | Choice |
|----------|--------|
| Comment shape | Single row: `userText` + `agentResponse` (nullable until run completes) |
| `description` | Retained on task for search; first comment mirrors create input |
| Follow-up submit | Task → `in-progress`; same orchestration pattern as create |
| Resume | From **latest progress state** on the **active `commentId`**; not “replay entire comment thread” as checkpoint |
| HITL | **Answered** in activity feed; **pending** in form above feed |
| Task progress scope | **One progress document per `commentId`** (not one per task); retain `taskId` for auth and indexes |
| Agent output limit | Same as today: **5000** characters max on agent response |
| Migration | **None** — drop `llmResponse` without backfill |
| UI surface | Conversation list **only on task detail** |
| Skill planning output | **9a** — plan text in `agentResponse` on the comment for that run (replaces `llmResponse` in docs) |
| Real-time | **As today** — poll progress during execution; new events append in the feed |
| Authorship | Comments are user-initiated; agent text only as `agentResponse` on that row |
| Detail layout | **Single activity feed** — all comments, responses, answered HITL, and progress events; **newest first** |
| Progress row UX | Click toggles **inline expand/collapse** for details; **no modal** |
| Comment/response UX | **Emphasized** cards; line clamp + **Show more** (not accordion collapse) |
| Activity filters | **Multiselect** at top of feed (comments, responses, questions, agent started/finished/failed/waiting); **default all selected** |
| Statistics | Execution stats (tokens, duration, attempt) in **separate component below** the feed (not above) |
| No AI response section | **`TaskDetailAiResponse` removed** — agent markdown only as feed items |

---

## 2. User Story & Acceptance Criteria

### 2.1 User Story

> As a user, I want to see the full conversation with the agent on a task and send follow-up messages, so I can refine or extend work after the first run completes.

### 2.2 Acceptance Criteria

| # | Criterion |
|---|-----------|
| **AC-1** | Creating a task persists `description` and creates **comment #1** with `userText` equal to that input; `agentResponse` is empty until execution completes. |
| **AC-2** | When execution completes successfully, **`agentResponse`** on the active comment is set; task status is `done`; `llmResponse` is **not** used. |
| **AC-3** | Task detail shows one **activity feed** with **all** user comments, agent responses, answered HITL, and progress events; sort **newest first** (global `occurredAt` desc). List/home do **not** load the feed. |
| **AC-3a** | Progress rows use today’s list visual language; **click** expands details **inline**; second click **collapses**; **no modal**. |
| **AC-3b** | **Answered** HITL in the feed; **pending** questions only in the form above the feed. |
| **AC-3c** | **Task progress** stored **per `commentId`**; historical events remain after later turns. |
| **AC-3d** | Comments and agent responses are **emphasized**; long text uses line clamp + **Show more** / Show less. |
| **AC-3e** | **Multiselect filters** at top of feed; default all groups selected; hiding a group removes matching items from the list. |
| **AC-3f** | Execution **statistics** (attempt, duration, tokens, etc.) render **below** the feed in a dedicated component, not above. |
| **AC-3g** | No standalone **`TaskDetailAiResponse`** (or equivalent) section on the page. |
| **AC-4** | Below description, user sees a **multiline** input and **Submit** to add a follow-up when allowed by status rules. |
| **AC-5** | On follow-up submit: new comment row created, task → `in-progress`, agent invoked with **full prior conversation + new `userText`**. |
| **AC-6** | While `in-progress`, user cannot submit another comment (disabled UI + server rejection). |
| **AC-7** | Resume uses existing pause/resume semantics (progress checkpoint); agent message construction for resume is unchanged except where architect replaces description-only context with conversation rules for **new** runs only. |
| **AC-8** | Failed runs: comment row keeps `userText`; `agentResponse` remains null; task `failed` with existing error fields. |
| **AC-9** | Task skill planning: final plan text appears in **`agentResponse`** of the comment for that execution turn. |

---

## 3. Data Model

### 3.1 New entity: `taskComment`

Recommended package: `@vassembly/domain-task-comment` (or equivalent per architect).

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `taskId` | string | FK to task |
| `userId` | string | Author (task owner) |
| `userText` | string | Required; user-authored |
| `agentResponse` | string \| null | Set on successful `complete` for that turn; max **5000** |
| `createdAt` | Date | |
| `updatedAt` | Date | |

**Ordering:** `createdAt` ascending (tie-breaker `id`).

**Indexes:** `{ taskId: 1, createdAt: 1 }`.

Each comment row is the **execution turn** identifier for progress and (when applicable) HITL during that run.

### 3.2 Task progress (`domain-task-progress`) — comment scope

**Breaking change:** Progress is keyed by **`commentId`**, not only `taskId`.

| Field / behavior | Change |
|------------------|--------|
| Primary scope | `commentId` (required, unique per progress document) |
| `taskId` | Retained for authorization and `{ taskId, commentId }` queries |
| Lifecycle | `initializeTaskProgress` runs when a comment turn starts execution; one document per comment |
| Events | `events[]` belong only to that comment’s run |
| Retry | `resetTaskProgress` resets the **active comment’s** document (same `commentId`), per pause-resume retry semantics |
| Resume | Checkpoint reads progress for the **active `commentId`** |
| Follow-up | New comment → new progress document; prior comment documents are immutable history |

**Indexes:** unique `{ commentId: 1 }`; secondary `{ taskId: 1, createdAt: 1 }` if listing all progress for a task is needed.

**API:** Replace task-only progress fetch with **comment-scoped** read (e.g. `GET /tasks/:taskId/comments/:commentId/progress` or GraphQL `comment { progress { events } }`). Polling during `in-progress` targets the **active comment’s** progress.

### 3.3 Task entity changes

| Change | Action |
|--------|--------|
| `llmResponse` | **Remove** from model, DTO, GraphQL, REST schemas, `complete` command input |
| `description` | **Keep** — set at create; not updated by follow-up comments |
| `complete` command | Accept `agentResponse` (or update comment via dedicated command — architect chooses orchestration) |

### 3.4 Task questions (`domain-task-questions`) — timeline + comment link

Storage remains in `domain-task-questions` (not embedded in `taskComment`).

| Change | Detail |
|--------|--------|
| `commentId` | Add to **pending** and **answered** question records — the comment turn during which the agent asked |
| Timeline | **Answered** questions are feed items at `answeredAt` (global desc sort with other items) |
| Pending UI | `TaskQuestionForm` above the feed when pending questions exist |
| History UI | **Remove** `TaskQuestionsHistory`; answered content only in feed |

---

## 4. Execution & Context

### 4.1 Initial create flow

1. `createTask`: persist task (`description`, `in-progress`, …).
2. Create **first** `taskComment` with `userText` = create input.
3. `initializeTaskProgress({ taskId, commentId })` for that comment.
4. Fire-and-forget `executeTask` with **active `commentId`** (as today, plus comment binding).

### 4.2 Agent input message (new runs — create and follow-up)

Build context from **all comments** for `taskId`, in order, e.g.:

- For each comment: user message = `userText`; if `agentResponse` present, assistant message = `agentResponse`.
- Append or emphasize the **latest** `userText` as the new user turn (architect to align with existing `invoke` message shape).

**Not** description-only after this feature ships for new/follow-up invocations (description may still be used for classification/title side paths).

### 4.3 Complete flow

On success: update **the comment associated with this execution turn** with `agentResponse`; `task.complete` without `llmResponse`.

`executeTask` receives **active `commentId`** at start (create, follow-up submit, resume, retry). Progress recording and finalize always use that `commentId`.

### 4.4 Resume / retry / pause

| Operation | Comment thread | Execution context |
|-----------|----------------|-------------------|
| **Resume** | Unchanged | `buildResumeMessage` + progress events on **active `commentId`** |
| **Retry** | Unchanged (historical comments remain) | `resetTaskProgress` for **active `commentId`**; restart from scratch per pause-resume PRD |
| **Pause** | Unchanged | Existing cancellation |

### 4.5 Follow-up when `done` or `failed`

- Allowed from **`done`** and **`failed`** (user may retry conversation after failure with a new comment).
- **Not** allowed from `in-progress` or `paused` (paused: use resume/retry controls first).

---

## 5. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-CC-1 | Introduce `taskComment` persistence with create + update (`agentResponse`) commands. |
| FR-CC-2 | Remove `llmResponse` from all layers. |
| FR-CC-3 | `createTask` creates first comment. |
| FR-CC-4 | REST endpoint to **submit follow-up comment** (create comment + enqueue execution). |
| FR-CC-5 | GraphQL: load comments for task detail (nested on `Task` or dedicated query). |
| FR-CC-6 | `executeTask` writes `agentResponse` to active comment on complete. |
| FR-CC-7 | Validate `userText` and `agentResponse` lengths at domain boundaries. |
| FR-CC-8 | List `userTasks` query **must not** require comment payload (performance). |
| FR-CC-9 | Update [task-skill-planning](../task-skill-planning/prd.md) references: plan → `agentResponse` on comment. |
| FR-CC-10 | Refactor `domain-task-progress` to **one document per `commentId`**; update all record/query/reset/finalize paths. |
| FR-CC-11 | Single **activity feed** with all item types; server `activityTimeline` sorted **desc**; client filters by `filterGroup`. |
| FR-CC-12 | Remove `TaskDetailAiResponse`, standalone progress tracker, `TaskQuestionsHistory`, and progress **modal** on detail. |
| FR-CC-13 | Add `commentId` to task-questions pending/answered records; set when agent asks during a run. |
| FR-CC-14 | Answered HITL entries render in the feed with question text + answer. |
| FR-CC-15 | Activity feed sort: **`occurredAt` descending** (newest on top). |
| FR-CC-16 | Each timeline item exposes **`filterGroup`** for client multiselect (see UI design). |
| FR-CC-17 | Progress event payload supports **inline expand** (no modal). |
| FR-CC-18 | **`TaskExecutionStatistics`** below feed; migrate fields from current `ProgressHeader`. |
| FR-CC-19 | Do not ship **`TaskDetailAiResponse`** on task detail. |

---

## 6. API Contract

### 6.1 GraphQL (reads)

- Extend task detail with `comments { id userText agentResponse createdAt updatedAt progress { events … } }` ordered ascending.
- Expose **`taskActivityTimeline(taskId)`** (or nested `task { activityTimeline }`) returning a discriminated union, pre-sorted **`occurredAt` DESC**:
  - `userComment` — `commentId`, `userText`, `occurredAt`, `filterGroup: comments`
  - `progressEvent` — `commentId`, full event + expand details, `occurredAt`, `filterGroup` by state
  - `hitlAnswered` — `commentId`, question, answer, `occurredAt`, `filterGroup: questions`
  - `agentResponse` — `commentId`, markdown body, `occurredAt`, `filterGroup: responses`
- **Pending** questions: separate field (existing shape) for the form only.

**Remove:** `llmResponse` from `Task` type.

**Deprecate:** task-level-only progress query used by current detail page (replace with comment-scoped or timeline aggregate).

### 6.2 REST (commands)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/tasks/:taskId/comments` | Create follow-up comment; transition task to `in-progress`; trigger `executeTask` |

Request body (illustrative):

```json
{ "userText": "Please shorten the summary to 3 bullets." }
```

Response: `201` with created comment DTO ( `agentResponse: null` ).

**Existing:** `POST /tasks` unchanged from client perspective except response no longer includes `llmResponse`.

**Internal:** `complete` handler updates comment + task status (no public `llmResponse`).

### 6.3 Authorization

- Only task owner may read comments and submit comments (same as task detail today).

---

## 7. UI Spec

Authoritative detail: [ui-design.md](./ui-design.md).

### 7.1 Placement

Task detail page only:

1. Description (existing).
2. **Activity feed** — multiselect filters + unified list (**newest first**): comments, responses, answered HITL, all progress events.
3. **Execution statistics** — separate block **below** the feed (tokens, duration, attempt, status).
4. **Comment composer** — multiline textarea + Submit below statistics.

**Removed:** `TaskDetailAiResponse`, `TaskQuestionsHistory`, standalone `ExecutionProgressTracker`, progress detail **modal**.

### 7.2 Feed ordering and interactions

- **Sort:** global `occurredAt` **descending** (recent at top).
- **Progress rows:** click to expand/collapse details inline; no modal.
- **Comments & agent responses:** emphasized; **line clamp** (default **4 lines**) + **Show more** / Show less — not collapsed behind accordion.
- **Filters:** multiselect at top; groups include comments, responses, questions, agent started/finished/failed/waiting; **all selected by default**.

### 7.3 Composer behavior

| Task status | Composer |
|-------------|----------|
| `in-progress` | Hidden or disabled with explanation (“Agent is working…”) |
| `paused` | Disabled; direct user to Resume/Retry |
| `done` | Enabled |
| `failed` | Enabled (new turn) |

### 7.4 List / home

No change: no comment preview on task cards.

### 7.5 Progress polling

Keep existing progress **polling** (~1s) during `in-progress` for **active `commentId`**; new events appear at **top** of feed.

---

## 8. Edge Cases

| Case | Expected behavior |
|------|-------------------|
| Double submit | Idempotency or reject second request while `in-progress` |
| Complete with empty agent message | Treat as validation error or fail task (align with current empty `llmResponse` rules) |
| Agent response > 5000 chars | Validation error on complete |
| Task deleted | Comments removed or orphaned per architect (prefer cascade delete) |
| Concurrent tabs | Second submit while in-progress rejected |
| First comment before agent finishes | Timeline shows `userText`, then streaming progress events; agent block appears on complete |
| Multi-turn history | Older turns keep comment + events + response visible above newer turns |
| Retry on same comment turn | `resetTaskProgress` clears that `commentId`’s events; timeline shows only the retried run’s events for that comment |
| HITL during run | New pending question tagged with `commentId`; on answer, timeline item appears at `answeredAt` |
| Follow-up comment | New `commentId` → new progress doc; prior comment’s events and HITL answers remain in timeline |

---

## 9. Out of Scope

- Editing or deleting past comments
- @mentions, attachments, rich text
- Migrating legacy `llmResponse` data
- Agent-only comments without user `userText`
- WebSocket push for new comments (polling task/comments on detail is sufficient for v1)

---

## 10. Gherkin Acceptance Scenarios

```gherkin
Feature: Task comment conversation

  Scenario: CC-1 First comment created with task
    Given I create a task with description "Draft Q3 report"
    When the task is persisted
    Then the task description is "Draft Q3 report"
    And a task comment exists with userText "Draft Q3 report" and no agent response

  Scenario: CC-2 Agent response on first turn
    Given a task with one comment in progress
    When execution completes with message "Here is the report"
    Then the task status is done
    And that comment's agentResponse is "Here is the report"
    And the task has no llmResponse field

  Scenario: CC-3 Follow-up after done
    Given a done task with one completed comment
    When I submit a follow-up comment "Make it shorter"
    Then a second comment exists with userText "Make it shorter"
    And the task status is in-progress
    When execution completes with "Short version..."
    Then the second comment's agentResponse is "Short version..."
    And the task status is done

  Scenario: CC-4 Conversation context
    Given a done task with two comments each having user and agent text
    When I submit "Add a conclusion"
    Then the agent invocation includes prior user and agent messages from the thread

  Scenario: CC-5 Block submit while in progress
    Given a task in in-progress status
    When I attempt to submit a comment via API
    Then the request is rejected

  Scenario: CC-6 List view without comments
    When I load the user task list
    Then task items do not include comment threads

  Scenario: CC-7 Resume unchanged
    Given a paused task with progress events on the active commentId
    When I resume the task
    Then execution continues from the latest progress checkpoint on that comment
    And existing comments are not deleted

  Scenario: CC-8 Skill planning output on comment
    Given a task executed under task skill planning
    When planning completes
    Then the plan text is stored in agentResponse on the comment for that run

  Scenario: CC-9 Activity feed order and placement
    Given a task with multiple activity items
    When I view the task detail activity feed
    Then the newest items appear at the top
    And progress is not in a separate section below the description
    And execution statistics appear below the feed

  Scenario: CC-9a Progress row expand
    Given a progress event in the feed
    When I click the row
    Then details expand inline
    When I click the row again
    Then details collapse
    And no modal is shown

  Scenario: CC-9b Activity filters
    Given the activity filter multiselect with all groups selected
    When I deselect "Agent started"
    Then started progress events are hidden
    And other selected groups remain visible

  Scenario: CC-9c Comment show more
    Given a user comment longer than the line clamp
    When the feed renders
    Then truncated text shows an ellipsis
    When I click "Show more"
    Then the full comment text is visible

  Scenario: CC-10 Comment-scoped progress
    Given a task with two completed comment turns
    When I load progress for each comment
    Then each comment has its own progress document and events
    And events from turn one are not stored on turn two's commentId

  Scenario: CC-11 Answered HITL in feed
    Given a task turn where the agent asked a question and the user answered
    When I view the activity feed
    Then the answered question and answer appear in the list
    And there is no separate answered-questions history section below the description
```

---

## 11. Dependencies & Doc Updates

| Area | Action |
|------|--------|
| `domains/task` | Remove `llmResponse`; adjust `complete` |
| New `domain-task-comment` | CRUD + list by taskId |
| `services/task` | `createTask`, `executeTask`, new submit-comment handler |
| `apps/api` | GraphQL + REST |
| `ui/api-hooks` | Detail query; submit hook |
| `apps/web` | `TaskActivityFeed`, filters, `TaskExecutionStatistics` below feed, composer; no `TaskDetailAiResponse` |
| `domains/task-progress` | **Required:** one document per `commentId`; migrate APIs and service handlers |
| `domains/task-questions` | Add `commentId`; wire on ask/answer |
| `ui-execution-progress-tracker` | Inline expand (no modal); statistics export; descending sort; poll by `commentId` |
| Docs | `real-time-execution-progress`, pause-resume, task-questions consumers |
| E2E | Replace `llmResponse` seeds with comments |
| Docs | `task-skill-planning`, `async-llm-task-execution`, `task-detail-page` |

**Workflow:** PRD ✓ · UI design ✓ · Architecture ✓ · **Implementation in progress** (core stack landed; UI polish + E2E remain)
