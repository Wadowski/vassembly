# Product Requirements Document: LLM-Generated Task Title

**Document status:** Draft  
**Last updated:** 2026-06-16  
**Feature slug:** `task-title-generator`  
**Related docs:** [Task List Homepage](../task-list-homepage/prd.md) · [Task Detail Page](../task-detail-page/prd.md) · [Async LLM Task Execution](../async-llm-task-execution/prd.md) · [System Agents](../system-agent/prd.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Story & Acceptance Criteria](#2-user-story--acceptance-criteria)
3. [Scope](#3-scope)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Model](#6-data-model)
7. [System Agent Specification](#7-system-agent-specification)
8. [API Contract](#8-api-contract)
9. [UI Specification](#9-ui-specification)
10. [Edge Cases](#10-edge-cases)
11. [Out of Scope (v1)](#11-out-of-scope-v1)
12. [Gherkin Acceptance Scenarios](#12-gherkin-acceptance-scenarios)
13. [Dependencies](#13-dependencies)
14. [Success Metrics](#14-success-metrics)

---

## 1. Overview

### 1.1 Feature Summary

After a user creates a task, the platform **asynchronously** invokes a dedicated system agent — **"Task title generator"** — to produce a short, human-readable title (up to 8 words) from the task description. The generated text is persisted to the existing `title` field on the task entity. The title appears in the **task list** (as a line above the description) and on the **task detail page** (as the page H1), once the user reloads or navigates.

Title generation is **fire-and-forget**: it does not block `POST /tasks`, does not run inside the main `executeTask` chain, and **fails silently** from the user's perspective if anything goes wrong.

### 1.2 Problem Statement

| Problem | Impact |
|---------|--------|
| Task list rows show only raw descriptions | Users with multiple tasks cannot quickly scan or distinguish work |
| Task detail page header is always generic **"Task details"** | No at-a-glance identity when bookmarking, switching tabs, or returning to a task |
| `title` field exists in model and UI but is always `null` | Built infrastructure is unused; search already accepts `title` but never matches |

### 1.3 Solution

| Aspect | Behavior |
|--------|----------|
| **Trigger** | Immediately after successful task creation in `createTask` handler |
| **Execution** | Separate second `void generateTaskTitle({...}).catch(log)` call — parallel to, not nested in, `executeTask` |
| **Agent** | New seeded system agent: **"Task title generator"** |
| **Credential** | User's `userSystemAgentPreferences.integrationCredentialId` (same as all system-agent LLM calls) |
| **Persistence** | Internal domain command `updateTitle` writes to existing `TaskModel.title` |
| **Failure** | Log internally; no user error, no effect on task creation or main execution |
| **UI** | No loading/pending state; omit title until populated; visible after next reload or navigation |

### 1.4 Goals

| Goal | Description |
|------|-------------|
| **Scannable task list** | Short generated title above description when available |
| **Meaningful detail header** | Generated title replaces generic "Task details" H1 when populated |
| **Zero create-path impact** | `POST /tasks` latency unchanged; title not awaited in response |
| **Governed agent catalog** | Title generation uses the same system-agent + user-credential model as task execution |
| **Graceful degradation** | Silent failure preserves existing UX (description-only list, generic detail header) |

### 1.5 Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| User-visible errors for title failure | Title is additive; failure must not affect core task flows |
| Loading or pending title state | Avoids complexity; title appears when ready on next fetch |
| Real-time/polling title updates | Out of scope for v1; reload/navigation is sufficient |
| User edit or regenerate | Deferred to future release |
| Backfill existing tasks | Only new tasks created after release |

---

## 2. User Story & Acceptance Criteria

### 2.1 User Story

> As a User, I want my tasks to have a short, descriptive title generated automatically from my description, so that I can scan my task list and recognize tasks on the detail page without reading the full description.

### 2.2 Acceptance Criteria

| # | Criterion |
|---|-----------|
| **AC-1** | When a task is created via `POST /tasks`, the HTTP 201 response includes `title: null` (or omits populated title). |
| **AC-2** | A background title-generation LLM call starts after create without blocking the response. |
| **AC-3** | Title generation uses the **"Task title generator"** system agent and the user's preferred system-call credential. |
| **AC-4** | On success, `title` is persisted as a short phrase (≤ 8 words, no trailing punctuation). |
| **AC-5** | On any failure (missing credential, LLM error, timeout, invalid output), title remains `null` and no user-facing error is shown. |
| **AC-6** | Task list shows the title as a distinct line above the description when `title` is non-null and non-empty; omits the line when null/empty. |
| **AC-7** | Task detail page H1 shows `task.title` when non-null/non-empty; falls back to **"Task details"** when null/empty. |
| **AC-8** | Browser document title (`<title>`) uses generated title when available (existing `buildDocumentTitle` behavior). |
| **AC-9** | Task list search matches generated `title` (existing search-on-`title` behavior). |
| **AC-10** | Main task execution (`executeTask`) proceeds independently; title generation failure does not change task status. |
| **AC-11** | No new public REST or GraphQL endpoints; title is read via existing task queries. |

### 2.3 Confirmed Product Decisions (Non-Negotiable)

| Decision | Choice |
|----------|--------|
| Async pattern | Fire-and-forget, same as `void executeTask({...}).catch(log)` — **separate** second call |
| Credential source | `userSystemAgentPreferences.integrationCredentialId` only |
| Failure UX | **Silent** — internal logging only |
| Pending UX | **None** — hide title until populated |
| Refresh model | No polling; title visible after next list/detail fetch (reload, navigation, refetch-on-create for list) |
| Title format | Short phrase, max **8 words**, **no trailing punctuation** |
| Data model | Reuse existing `title` field — no new fields |
| Public API | No new endpoints; internal `updateTitle` domain command only |

---

## 3. Scope

### 3.1 In-Scope

| Area | Deliverable |
|------|-------------|
| **System agent seed** | Add **"Task title generator"** to `domains/system-agent/seed/systemAgents.json` |
| **Constants** | Add `TaskTitleGenerator = 'Task title generator'` to `SYSTEM_AGENT_NAME` enum |
| **Domain command** | `updateTitle` — persist generated title on task entity |
| **Service handler** | `generateTaskTitle` — resolve agent, credential, invoke LLM, validate output, call `updateTitle` |
| **Create hook** | `createTask` handler triggers `void generateTaskTitle({...}).catch(log)` after create |
| **Task list UI** | No code changes required if `title` populates — existing conditional render |
| **Task detail UI** | No code changes required — existing H1 fallback in `TaskDetailHeader` |
| **GraphQL / REST reads** | Existing `task.title` field exposure (already nullable) |
| **Logging** | Structured logs for title generation start, success, and failure (internal only) |
| **Tests** | Unit tests for handler, command, output validation; UI tests already cover title display |

### 3.2 Out-of-Scope (v1)

| Item | Notes |
|------|-------|
| Polling or WebSocket for title arrival | User sees title on next reload/navigation |
| Loading/skeleton/pending title state | Title line/header omitted until populated |
| User-facing error when generation fails | Silent failure only |
| User edit of generated title | Future feature |
| Regenerate title action | Future feature |
| Backfill titles for existing tasks | New tasks only |
| New public REST/GraphQL mutation for title | Internal command only |
| Separate AI Summary section on detail page | Title is the page H1 only (no duplicate section) |
| Title generation for scheduled/routine task types (if distinct create paths exist later) | v1: standard `POST /tasks` create path only |

---

## 4. Functional Requirements

### 4.1 Title Generation Flow (Backend)

```
POST /tasks
    │
    ├─► create task (sync) ──► 201 response { title: null, ... }
    │
    ├─► void executeTask({ taskId, userId })     ← existing main execution chain
    │
    └─► void generateTaskTitle({ taskId, userId })  ← NEW separate fire-and-forget
            │
            ├─► load task description
            ├─► resolve "Task title generator" system agent (getActiveByName)
            ├─► resolve userSystemAgentPreferences.integrationCredentialId
            ├─► invoke LLM (same integration as system agents)
            ├─► validate output (≤ 8 words, strip trailing punctuation)
            └─► taskDomain.commands.updateTitle({ taskId, title })
                    │
                    on failure anywhere ──► log + return (no throw to caller)
```

#### FR-B1 — Trigger timing

- Title generation MUST start only after the task document is successfully created and persisted.
- Title generation MUST NOT be awaited before returning the `POST /tasks` response.
- Title generation MUST NOT be invoked from within `executeTask` or any agent tool loop.

#### FR-B2 — Input to LLM

- The user message passed to the agent is the task's `description` as stored at create time.
- If `description` is empty or whitespace-only after trim, skip LLM call and leave `title` null (log skip reason).

#### FR-B3 — Agent resolution

- Resolve system agent by exact name: **"Task title generator"** (`SYSTEM_AGENT_NAME.TaskTitleGenerator`).
- If agent is missing or inactive, fail silently (log `title.generate.agent_not_found`).

#### FR-B4 — Credential resolution

- Load `userSystemAgentPreferences` for `userId`.
- Use `integrationCredentialId` when present.
- If missing, fail silently (log `title.generate.missing_credential`) — **do not** fail the task or show Settings messaging.

#### FR-B5 — LLM invocation

- Use the same LangChain / system-agent invoke path as other system agents (`@vassembly/client-langchain` via domain/service patterns).
- No tools assigned to this agent; single-turn text response expected.

#### FR-B6 — Output validation and normalization

| Rule | Action |
|------|--------|
| Empty or whitespace-only response | Do not persist; log `title.generate.empty_output` |
| More than 8 words | Truncate to first 8 words OR reject and leave null — **product choice: reject invalid output and leave null** (prefer quality over truncated garbage) |
| Trailing punctuation (`.`, `,`, `;`, `:`, `!`, `?`) | Strip from end before persist |
| Leading/trailing whitespace | Trim |
| Newlines or multiple sentences | Take first line only; trim |
| Word count ≤ 8 after normalization | Persist via `updateTitle` |

#### FR-B7 — Persistence

- Call `taskDomain.commands.updateTitle({ taskId, title })`.
- Update MUST NOT change `status`, `llmResponse`, or any execution-related fields.
- Update MAY set `updatedAt` per standard domain update behavior.

#### FR-B8 — Failure handling

- Any error in the generation path MUST be caught in the fire-and-forget wrapper.
- MUST NOT propagate to `createTask` caller.
- MUST NOT change task status.
- MUST emit structured internal log with `taskId`, `userId`, and error reason.

#### FR-B9 — Concurrency with main execution

- Title generation and `executeTask` MAY run concurrently.
- Title generation MUST NOT acquire execution registry locks used by pause/resume.
- Race: if task is deleted before title persists (future delete feature), update fails silently.

### 4.2 Title Display (Frontend)

#### FR-F1 — Task list (`TaskListItem`)

| State | Behavior |
|-------|----------|
| `title` null, undefined, or empty string | Do not render title line (existing behavior) |
| `title` non-empty after trim | Render as `body2` line above description (`data-testid="task-ai-summary"`) |
| Immediately after create | List refetch shows `title: null` until background generation completes |
| After reload/navigation | If generation succeeded, title line appears |

#### FR-F2 — Task detail page (`TaskDetailHeader`)

| State | H1 (`data-testid="task-detail-title"`) | Document `<title>` |
|-------|----------------------------------------|-------------------|
| `title` null/empty | **"Task details"** | `TASK_DETAILS_PAGE_TITLE` constant |
| `title` populated | `task.title` (trimmed) | `{truncatedTitle} · Tasks` per `buildDocumentTitle` |

#### FR-F3 — No pending state

- Do NOT show "Generating title…", skeleton for title, or spinner in list or detail header.
- Do NOT add polling solely for title arrival on list or detail (detail may continue existing status polling for execution — title updates when that poll/refetch happens).

#### FR-F4 — Search

- Existing case-insensitive search on `description` OR `title` continues unchanged.
- When title populates, task becomes searchable by title substring on next fetch.

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target |
|-------------|--------|
| `POST /tasks` p95 latency | No measurable regression vs. baseline (title generation not on critical path) |
| Title generation p95 end-to-end | ≤ 30 seconds from create to `title` persisted |
| Title generation success rate | ≥ 95% under normal provider availability |

### 5.2 Reliability

| Requirement | Behavior |
|-------------|----------|
| Silent failure | 100% of generation errors absorbed; zero user-facing snackbars/toasts for title |
| Idempotent skip | Re-invocation on same task with existing non-null title: **do not overwrite** in v1 (skip if `title` already set) |
| Create path isolation | 100% of title failures leave task creation and `executeTask` unaffected |

### 5.3 Observability

| Event | Log level | Fields |
|-------|-----------|--------|
| `title.generate.started` | info | `taskId`, `userId` |
| `title.generate.completed` | info | `taskId`, `userId`, `title`, `durationMs` |
| `title.generate.failed` | warn/error | `taskId`, `userId`, `reason`, `durationMs` |
| `title.generate.skipped` | info | `taskId`, `userId`, `reason` (empty description, already has title, etc.) |

### 5.4 Accessibility

- When title is absent, H1 remains **"Task details"** — satisfies page purpose identification.
- When title is present, H1 is the generated phrase — screen readers announce the specific task identity.
- No aria-live region for title arrival in v1 (no dynamic injection without user navigation).

### 5.5 Security & Access Control

- Title generation runs in service layer with `userId` from create context.
- `updateTitle` MUST only update tasks owned by that user (enforce via domain command same as other task commands).
- Generated title MUST NOT be exposed cross-user via GraphQL (existing owner-scoped reads).

### 5.6 Cost

- One additional LLM call per task create (short prompt, short expected output).
- Accept marginal per-task cost; no user-facing quota UI in v1.

---

## 6. Data Model

### 6.1 Existing Fields (No Schema Change)

| Entity | Field | Type | Current | After Feature |
|--------|-------|------|---------|---------------|
| `TaskModel` | `title` | `string \| null` | Always `null` | Populated asynchronously when generation succeeds |
| `TaskResponse` / GraphQL `Task` | `title` | `string \| null` | Always `null` | Reflects persisted value |
| MongoDB `tasks` collection | `title` | optional string | Absent or null | Set by `updateTitle` command |

### 6.2 New Domain Command

| Command | Input | Output | Notes |
|---------|-------|--------|-------|
| `updateTitle` | `{ taskId: string, title: string }` | Updated `TaskModel` | Internal; not exposed as public REST route |

**Validation schema (command boundary):**

- `title`: non-empty string after trim
- `title`: max length 120 characters (storage guard; prompt enforces ≤ 8 words)
- `taskId`: valid existing task id

### 6.3 Create Response Shape (Unchanged)

`POST /tasks` continues to return `TaskResponse` immediately. `title` is `null` in the create response even if generation completes within milliseconds.

---

## 7. System Agent Specification

### 7.1 Catalog Entry

| Field | Value |
|-------|-------|
| **name** | `Task title generator` |
| **description** | Generates a short scannable title from a task description. Used automatically after task creation. |
| **category** | `utility` |
| **assignedToolIds** | `[]` (no tools) |
| **enum key** | `SYSTEM_AGENT_NAME.TaskTitleGenerator = 'Task title generator'` |

### 7.2 Rule / Prompt (Seed File)

Follows style of existing seed agents in `domains/system-agent/seed/systemAgents.json`:

```json
{
  "name": "Task title generator",
  "description": "Generates a short scannable title from a task description. Used automatically after task creation.",
  "rule": "You generate a short title for a task based on the user's task description.\n\nOutput rules:\n1. Respond with ONLY the title text. No quotes, labels, or explanation.\n2. Maximum 8 words.\n3. Use a concise noun phrase or short action phrase (e.g. \"Quarterly sales report review\").\n4. Do not end with punctuation.\n5. Capture the core intent of the description; ignore filler words.\n6. If the description is too vague to title meaningfully, output a best-effort short label from the key nouns or verbs present.\n\nDo not produce plans, steps, or answers — title only.",
  "category": "utility",
  "assignedToolIds": []
}
```

### 7.3 Invocation Parameters

| Parameter | Value |
|-----------|-------|
| Agent | Resolved by name `"Task title generator"` |
| User message | Task `description` (raw text) |
| Credential | `userSystemAgentPreferences.integrationCredentialId` |
| Tools | None |
| Expected response | Single line, ≤ 8 words |

### 7.4 Admin Visibility

- Agent appears in system agent catalog (read-only for end users).
- Admins may edit rule via existing system agent admin flows (out of scope for this PRD's implementation steps but supported by platform).

---

## 8. API Contract

### 8.1 Public API — No Changes

| Endpoint / Query | Change |
|------------------|--------|
| `POST /tasks` | Unchanged contract; `title` remains `null` in immediate response |
| GraphQL `task(id)` | Unchanged; returns `title` when populated |
| GraphQL `userTasks` / list query | Unchanged; returns `title` per item |
| No new REST routes | — |
| No new GraphQL mutations | — |

### 8.2 Internal Service Handler

| Handler | Location (expected) | Trigger |
|---------|---------------------|---------|
| `generateTaskTitle` | `services/task/src/handlers/generateTaskTitle/` | `createTask` fire-and-forget |

**Input:**

| Field | Type | Required |
|-------|------|----------|
| `taskId` | `string` | yes |
| `userId` | `string` | yes |

**Output:** `void` (errors logged, not thrown to `createTask`)

### 8.3 Internal Domain Command

| Command | Package | Called by |
|---------|---------|-----------|
| `updateTitle` | `@vassembly/domain-task` | `generateTaskTitle` handler |

---

## 9. UI Specification

### 9.1 Task List Row

```
┌─────────────────────────────────────────────┐
│  [title line — body2, only if title set]    │  ← NEW content when populated
│  Description text (clamped)                   │
│  [Status badge]                               │
└─────────────────────────────────────────────┘
```

| Element | Source | Styling |
|---------|--------|---------|
| Title line | `task.title` | Existing `itemStyles.summary`, `data-testid="task-ai-summary"` |
| Description | `task.description` | Unchanged |
| Status | `task.status` | Unchanged |

**Post-create behavior:** User submits task → list refetches → new row shows description only (no title line) → user reloads later → title line may appear.

### 9.2 Task Detail Page Header

```
[← Back to tasks]

[H1: task.title  OR  "Task details"]

[Status badge]  [Pause / Resume / Retry — per other PRDs]
```

| Element | When `title` null | When `title` set |
|---------|-------------------|------------------|
| H1 | "Task details" | Trimmed `task.title` |
| Browser tab title | "Task details" (or app default) | `{title} · Tasks` (truncated at max length) |

No separate "Summary" or "AI Summary" section is added or modified for this feature.

### 9.3 UI States Checklist

| State | List title line | Detail H1 |
|-------|-----------------|-----------|
| Loading (skeleton) | Not shown (no title-specific skeleton) | Generic skeleton or "Task details" per existing page load |
| Ready, `title: null` | Hidden | "Task details" |
| Ready, `title: "Invoice Q3 review"` | Visible above description | "Invoice Q3 review" |
| Generation failed | Hidden | "Task details" |
| User navigates away and back after generation | Visible if fetch returns title | Shows title |

---

## 10. Edge Cases

| # | Condition | Expected Behavior |
|---|-----------|-------------------|
| **E-1** | Empty or whitespace-only description | Skip LLM; `title` stays null; log `title.generate.skipped` |
| **E-2** | Very short description (e.g. "Hi") | Still invoke LLM; accept best-effort short title if valid |
| **E-3** | Missing AI credential | Skip persist; silent; main `executeTask` may still fail with credential error independently |
| **E-4** | LLM timeout or provider error | `title` stays null; log failure; task execution unaffected |
| **E-5** | LLM returns > 8 words | Reject output; `title` stays null; log `title.generate.invalid_output` |
| **E-6** | LLM returns title with trailing period | Strip punctuation; persist if ≤ 8 words |
| **E-7** | LLM returns quoted title (`"Foo bar"`) | Strip surrounding quotes if present; then validate |
| **E-8** | Task already has non-null `title` | Skip generation (idempotent); do not overwrite |
| **E-9** | User creates task and immediately opens detail | H1 shows "Task details" until refetch returns populated title (may occur on existing execution poll) |
| **E-10** | User searches list before title generated | Task findable by description only; after title set, also findable by title on next fetch |
| **E-11** | Concurrent `executeTask` fails task | Title may still populate independently if generation succeeds |
| **E-12** | System agent seed not deployed | Silent failure; log agent not found |
| **E-13** | Non-English description | LLM should still produce a title in the description's language (best effort; no locale enforcement in v1) |

---

## 11. Out of Scope (v1)

Explicit deferrals (also listed in §3.2):

1. **Polling** for title on task list
2. **Loading/pending** UI for title
3. **User edit** of title
4. **Regenerate** title action
5. **Backfill** existing tasks
6. **Public API** to set or trigger title
7. **User notification** when title is ready
8. **Title versioning** or audit trail
9. **A/B prompt testing** UI
10. **Rate limiting** specific to title generation (inherits platform limits only)

---

## 12. Gherkin Acceptance Scenarios

### 12.1 Backend — Title Generation

```gherkin
Feature: Async task title generation

Scenario: Title generation starts after task create without blocking response
  Given I am authenticated
  And I have a configured "preferred for system calls" AI credential
  When I POST /tasks with description "Prepare the quarterly sales report for the board meeting"
  Then I receive HTTP 201 within the existing API latency budget
  And the response body includes title null
  And the response body includes status "in-progress"
  And a background title generation job is started for the new task id
  And the POST response is sent before title generation completes

Scenario: Successful title generation persists to task entity
  Given I am authenticated with a valid AI credential
  And a task exists with description "Prepare the quarterly sales report for the board meeting"
  And the task title is null
  When the title generation handler completes successfully
  Then the task title is persisted as a non-empty string
  And the title contains at most 8 words
  And the title does not end with punctuation
  And the task status is unchanged from before title generation

Scenario: Title generation uses Task title generator system agent
  Given the "Task title generator" system agent is seeded and active
  When title generation runs for a task
  Then the LLM is invoked with the Task title generator agent rule
  And the user message is the task description
  And no agent tools are invoked

Scenario: Title generation uses user system agent preference credential
  Given my userSystemAgentPreferences.integrationCredentialId is "cred-123"
  When title generation runs for my task
  Then the LLM client is created with credential "cred-123"

Scenario: Missing credential fails silently
  Given I have no userSystemAgentPreferences.integrationCredentialId
  When I POST /tasks with a valid description
  Then I receive HTTP 201
  And the task title remains null
  And no user-facing error is shown for title generation
  And an internal log records title generation skipped or failed

Scenario: LLM failure fails silently
  Given the LLM provider returns an error for title generation
  When title generation runs for a task
  Then the task title remains null
  And the task creation and executeTask flow are unaffected
  And no user-facing error is shown
  And an internal log records the failure

Scenario: Empty description skips title generation
  Given a task exists with description ""
  When title generation is triggered
  Then no LLM call is made
  And the task title remains null

Scenario: Invalid LLM output over 8 words is rejected
  Given the LLM returns "This is a very long title that exceeds the maximum word limit"
  When title generation validates the output
  Then the title is not persisted
  And the task title remains null

Scenario: Title generation does not overwrite existing title
  Given a task exists with title "Existing title"
  When title generation is triggered for that task
  Then the title is not updated
  And the title remains "Existing title"
```

### 12.2 Frontend — Task List Display

```gherkin
Feature: Task list title display

Scenario: Title line hidden when title is null
  Given I am authenticated on the homepage
  And a task exists with title null and description "Draft email to client"
  When the task list loads
  Then I see the description "Draft email to client"
  And I do not see a title line above the description

Scenario: Title line shown when title is populated
  Given I am authenticated on the homepage
  And a task exists with title "Client email draft" and description "Draft email to client about the proposal"
  When the task list loads
  Then I see "Client email draft" above the description
  And the title has data-testid "task-ai-summary"

Scenario: New task appears without title until reload
  Given I am authenticated on the homepage
  When I create a task with description "Schedule dentist appointment next Tuesday"
  Then the new task appears in the list without a title line
  When title generation completes in the background
  And I reload the homepage
  Then the task may show a generated title line above the description

Scenario: Search matches generated title
  Given a task exists with title "Dentist appointment" and description "Schedule dentist appointment next Tuesday"
  When I search the task list for "dentist"
  Then the task appears in the filtered results
```

### 12.3 Frontend — Task Detail Display

```gherkin
Feature: Task detail title display

Scenario: Detail header shows generic title when title is null
  Given I am authenticated as the task owner
  And a task exists with title null
  When I open the task detail page at "/tasks/{taskId}"
  Then the page heading shows "Task details"
  And the element with data-testid "task-detail-title" contains "Task details"

Scenario: Detail header shows generated title when populated
  Given I am authenticated as the task owner
  And a task exists with title "Board sales report"
  When I open the task detail page at "/tasks/{taskId}"
  Then the page heading shows "Board sales report"
  And the element with data-testid "task-detail-title" does not contain "Task details"

Scenario: Browser document title uses generated title
  Given I am authenticated as the task owner
  And a task exists with title "Board sales report"
  When I open the task detail page
  Then the browser document title contains "Board sales report"

Scenario: No loading state for pending title
  Given I just created a task and navigated to its detail page
  And title generation has not completed
  When the detail page renders
  Then I do not see "Generating title" or a title skeleton
  And the page heading shows "Task details"
```

### 12.4 Edge Cases & Error Handling

```gherkin
Scenario: Title generation failure does not block task execution
  Given I am authenticated with a valid AI credential
  When I create a task
  And title generation fails
  And executeTask succeeds
  Then the task status becomes "done"
  And the task title remains null
  And the task llmResponse is populated

Scenario: Task execution failure does not block title generation
  Given I am authenticated with a valid AI credential
  When I create a task
  And executeTask fails
  And title generation succeeds
  Then the task status is "failed"
  And the task title is populated

Scenario: Very short description still attempts generation
  Given a task exists with description "Fix bug"
  When title generation runs
  Then an LLM call is attempted
  And if the output is valid it is persisted

Scenario: Trailing punctuation is stripped before persist
  Given the LLM returns "Quarterly sales report."
  When title generation normalizes the output
  Then the persisted title is "Quarterly sales report"
```

---

## 13. Dependencies

### 13.1 Required Existing Features

| Dependency | Relationship |
|------------|--------------|
| **Task domain** | `TaskModel.title`, `toTaskResponse`, `listUserTasks` search on title |
| **Async LLM Task Execution** | `createTask` fire-and-forget pattern; separate `generateTaskTitle` call modeled after `executeTask` |
| **System Agents** | Seed catalog, `getActiveByName`, invoke via LangChain |
| **User system agent preferences** | `integrationCredentialId` for credential resolution |
| **AI Integrations** | Connected credential required for LLM call |
| **Task List Homepage** | Title line UI and search already implemented |
| **Task Detail Page** | H1 and document title already support `task.title` |

### 13.2 Unaffected Features

| Feature | Must Remain Unchanged |
|---------|----------------------|
| `POST /tasks` response shape and latency | No await on title generation |
| `executeTask` lifecycle | Independent of title generation |
| Pause / Resume / Retry | No interaction with title generation |
| GraphQL task queries | Field already exposed; no schema change |
| Task list create refetch | Continues to refetch page 0; may return null title |

### 13.3 Suggested Phased Delivery

| Phase | Scope |
|-------|-------|
| **PR 1** | Seed agent + enum; domain `updateTitle` command + tests |
| **PR 2** | Service `generateTaskTitle` handler + output validation + logging |
| **PR 3** | Wire `createTask` fire-and-forget; integration tests |
| **PR 4** | E2E: create task → verify title after reload (optional; UI already supports display) |

---

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Title generation success rate | ≥ 95% | `title.generate.completed` / (`completed` + `failed`) |
| Title generation p95 latency | ≤ 30s from create | `durationMs` on completed logs |
| Create path regression | `POST /tasks` p95 unchanged | API timing comparison pre/post deploy |
| UI population rate | ≥ 90% of new tasks show title within 60s on reload (staging) | Sample task records + QA spot check |
| Silent failure compliance | 0 user-facing errors attributed to title generation | QA + support tickets |
| Search usability | Tasks with titles discoverable by title substring | QA search scenarios |
| Word limit compliance | ≥ 99% of persisted titles ≤ 8 words | DB audit sample |

---

## Appendix A: QA Functional Checklist

| # | Check | Pass Condition |
|---|-------|----------------|
| 1 | Create returns immediately | 201 with `title: null` |
| 2 | Title appears after reload | List/detail show title when generation succeeded |
| 3 | List hides null title | No extra line above description |
| 4 | Detail fallback H1 | "Task details" when `title` null |
| 5 | Detail populated H1 | Generated title when set |
| 6 | Document title | Browser tab reflects title when set |
| 7 | Search by title | Filter returns task matching title |
| 8 | Missing credential | No user error; title null |
| 9 | LLM failure | No user error; task execution independent |
| 10 | Empty description | No title; no crash |
| 11 | No pending UI | No loading copy for title |
| 12 | executeTask unaffected | Status transitions normal when title fails |
| 13 | Owner-only reads | Other user's task title not visible |

## Appendix B: Regression Check

| Area | Must Remain Unchanged |
|------|----------------------|
| Task create | `POST /tasks` still triggers `executeTask` fire-and-forget |
| Task status lifecycle | Title generation does not set or change status |
| Task detail execution UI | Polling, pause/resume/retry unchanged |
| GraphQL schema | No breaking changes to `Task` type |
| System agent invoke (manual) | User-initiated invoke flows unchanged |

## Appendix C: Content & Messaging

No new user-facing copy is required for v1. Existing strings:

| Location | String | When |
|----------|--------|------|
| Task detail H1 fallback | `Task details` | `title` null/empty |
| Task list empty description | `No description` | Unchanged; separate from title |

No snackbars, toasts, or error messages for title generation failure.
