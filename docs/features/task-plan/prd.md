# Product Requirements Document: Persisted Task Plans (Template + Instance)

**Document status:** Approved for design & architecture handoff
**Last updated:** 2026-07-27 (Q6, Q11, Q14 clarifications incorporated)
**Related docs:** [Task Skill Planning](../task-skill-planning/prd.md) · [Subagent Orchestration](../subagent-orchestration/architecture.md) · [Task Comment Conversation](../task-comment-conversation/prd.md) · [Pause, Resume, and Retry Task](../pause-resume-task/prd.md) · [Skill](../skill/prd.md) · [System Agent](../system-agent/prd.md) · [Async LLM Task Execution](../async-llm-task-execution/architecture.md) · [Real-Time Execution Progress](../real-time-execution-progress/prd.md)
**Feature slug:** `task-plan`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Entity Model](#3-entity-model)
4. [Execution Semantics](#4-execution-semantics)
5. [User Stories (Gherkin)](#5-user-stories-gherkin)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [API Contract Summary](#8-api-contract-summary)
9. [UI Spec](#9-ui-spec)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Out of Scope](#11-out-of-scope)
12. [Supersedes / Conflicts](#12-supersedes--conflicts)
13. [Dependencies](#13-dependencies)
14. [Acceptance Criteria (QA Checklist)](#14-acceptance-criteria-qa-checklist)
15. [Decisions](#15-decisions)
16. [Open Questions](#16-open-questions)

---

## 1. Executive Summary

### 1.1 Problem

[Task Skill Planning](../task-skill-planning/prd.md) introduced a **Task Planner** agent that composes an execution plan from skills, but that plan is **ephemeral** — it exists only as unstructured text in LLM output and progress logs, not as a persisted entity (see [Task Comment Conversation](../task-comment-conversation/prd.md) for the comment model). This creates four gaps:

- **No audit trail:** There is no durable, structured record of what was planned, which agents/skills were selected, or in what order — only a natural-language summary.
- **No replay:** A failed or retried run re-derives a plan from scratch via the LLM; it cannot resume or re-execute a previously agreed structure.
- **No real orchestration:** "Ordered/parallel execution" is only implied in prose (`formatTaskWorkerOrchestrationSection`); there is no machine-readable ordering the Task Worker can iterate over deterministically.
- **No cross-user reuse at the structural level:** Skills capture reusable *procedures*, but the *plan shape* (which agents, in what order, with what inputs/outputs) for a given goal class is not persisted or reusable independent of the specific task/comment it was created for.

### 1.2 Solution

Introduce **two new persisted domains** that separate the reusable *shape* of a plan from the *run-specific* execution of that plan:

1. **Task Plan Template** (`domains/task-plan-template`) — a generic, user-agnostic, reusable definition of a plan: an ordered/parallel list of items, each referencing a **system agent** (by MongoDB ID) and optionally a **skill**, plus generic input-slot and expected-output definitions. Created **only** by the Task Planner system agent (no admin CRUD, no end-user editor).
2. **Task Plan Instance** (`domains/task-plan-instance`) — a 1:1 binding of a template to a specific `(taskId, commentId)` execution turn, holding **resolved** input values for that run and **execution state** (per-item status) that the Task Worker mutates as it orchestrates the run.

The **Task Worker** becomes the orchestrator: it reads the persisted instance, triggers items in ascending `order`, waits for all items at a given order to complete before advancing, fails the whole plan if any parallel item fails, and lets the Validator retry by **mutating the existing instance** rather than creating a new version. Items with a `null skillId` are still executable — the worker/agent creates a skill inline during execution and backfills the item's `skillId`.

The task comment's `agentResponse` and the persisted plan are **separate artifacts that coexist**:

- **`agentResponse`** — the **post-work, user-facing result** sent to the user **after** execution completes (outcome, findings, deliverables narrative). It is **not** the plan text and does not duplicate the structured plan.
- **Plan (template + instance)** — the **authoritative machine layer** for orchestration and audit. The comment links to its instance via `taskComment.taskPlanInstanceId` (and the instance carries `commentId`). The plan is referenced from the task process list as its own entry — not embedded in `agentResponse`.

`task.skillIdsUsed` moves to **comment level**, since skills are now resolved per plan instance per comment turn, not per task.

### 1.3 Success Metrics

| Metric | Target (90 days post launch) | Measurement |
|--------|------------------------------|-------------|
| Plan persistence coverage | 100% of `task`, `scheduled_task`, `routine_task` comment turns that reach planning produce a persisted `taskPlanInstance` | Structured logs / DB count vs. comment count |
| Template reuse rate | ≥ 40% of new plans reference an existing `taskPlanTemplateId` rather than creating a new template | `taskPlanInstance.taskPlanTemplateId` novelty ratio |
| Orchestration correctness | 0 cases of an order-N item starting before all order-(N-1) items reach a terminal per-item state | Execution state audit / integration tests |
| Retry without duplication | 100% of validator-triggered retries mutate the existing `taskPlanInstance` (no duplicate instance created for the same `commentId`) | Unique `commentId` constraint enforcement + logs |
| Skill backfill correctness | 100% of items with `skillId: null` at creation have a non-null `skillId` on the instance once that item completes and a skill was created | Post-execution instance audit |
| UI visibility | Plan appears as a distinct task-process-list entry (not only inside `agentResponse`) for 100% of planned comment turns | E2E / manual QA |

### 1.4 Phasing Summary

| Phase | Deliverable |
|-------|-------------|
| **Phase 1 — Persistence** | `domains/task-plan-template`, `domains/task-plan-instance`; Task Planner persists a template + instance; `agentResponse` remains the post-work user result (separate from plan) |
| **Phase 2 — Orchestration** | Task Worker reads the instance and drives execution order-by-order (ascending order, parallel within an order, fail-fast on any parallel failure); Validator retry mutates the existing instance |
| **Phase 3 — UI & skill relocation** | Task process list plan entry; skill tags moved from task to comment level (per-comment + aggregated per-task); admin vs. regular-user skill link behavior |

Phases are documented for engineering sequencing; they are **not** a scope-reduction — all three are in scope for this PRD (see problem statement: "FULL SCOPE — persistence AND orchestration").

---

## 2. User Personas

| Persona | Description | Primary interaction |
|---------|-------------|----------------------|
| **End User** | Submits tasks/comments; expects transparent, auditable, and consistently ordered execution | Views plan as a task-process-list entry on task detail; sees skill tags (read-only) per comment and aggregated per task |
| **Platform Admin** | Reviews plans and skills for quality, debugging, and governance | Same plan/skill visibility as end user, plus skill tags are **links** to skill detail pages |
| **Task Planner (system agent)** | LLM agent that authors plans | Creates `taskPlanTemplate` + `taskPlanInstance` via internal tools; may reuse an existing template |
| **Task Worker (system agent / orchestrator)** | Reads the persisted instance and drives execution | Advances per-item execution state in ascending order; triggers validator retries by mutating the instance |
| **Validator (system agent)** | Reviews per-item or per-plan output and can request rework | Triggers a retry that mutates the existing instance state rather than creating a new plan version |
| **Worker agents referenced by plan items** | System agents (including specialization-provisioned agents) executing an individual plan item | Consume `inputDetails` resolved values for their item; produce `outputDetails`-shaped output; may create a skill inline when `skillId` is null |

---

## 3. Entity Model

Two independent domains, each following [domain package structure](../../../.cursor/rules/domain-package-structure.mdc). **No cross-domain imports** — the instance references the template and task/comment **by ID only**.

### 3.1 `domains/task-plan-template` — `TaskPlanTemplateModel`

Generic, user-agnostic, reusable. Contains **no user details and no task-specific IDs** — created by the Task Planner LLM only; **no admin/end-user CRUD**.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `shortName` | string | Short, human-scannable label for the plan shape (e.g. `"contract-risk-review"`) |
| `description` | string | 2–3 sentences; **what**, not how (mirrors skill `description` convention) |
| `inputDetails` | `Record<string, unknown>` (freeform JSON) | Generic **input slot definitions** — what inputs this plan shape needs (names, types, whether required), reusable across users/tasks |
| `outputDetails` | `Record<string, unknown>` (freeform JSON) | Expected outcome definitions, including artifact types (file, text, MCP result, action result, etc.) — describes the *shape* of success, not run-specific values |
| `items` | `TaskPlanTemplateItem[]` | Ordered list — see §3.1.1 |
| `createdAt` / `updatedAt` | Date | |
| `removedAt` | Date \| null | Soft-delete convention (no hard delete) |

#### 3.1.1 `TaskPlanTemplateItem`

| Field | Type | Notes |
|-------|------|-------|
| `agentId` | string (MongoDB ID) | References a `domains/system-agent` document. Valid targets: **system agents** and **specialization-provisioned agents** (both live in `domains/system-agent`; see [Subagent Orchestration](../subagent-orchestration/architecture.md)) |
| `skillId` | string \| null | References `domains/skill`. **Null is valid** — see §4.4 |
| `description` | string | What this item does (goal for that agent invocation) |
| `order` | number | Ascending; **items sharing the same `order` run in parallel** (see §4) |

**Validation:** `agentId` must resolve to an active, non-removed system agent at template creation time (checked via `domains/system-agent` query at the service layer — templates do not import that domain directly).

### 3.2 `domains/task-plan-instance` — `TaskPlanInstanceModel`

Independent entity; links a template to **one specific comment execution turn**. **1:1 with `commentId`.** No separate admin CRUD.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `taskPlanTemplateId` | string | FK to `task-plan-template`; immutable after creation |
| `taskId` | string | FK to task — for authorization and task-level aggregation queries |
| `commentId` | string | FK to task comment — **unique**; one plan instance per comment |
| `inputDetails` | `Record<string, unknown>` (freeform JSON) | **Resolved values** for this specific run (fills the template's `inputDetails` slots with concrete data) |
| `status` | enum: `pending` \| `in-progress` \| `done` \| `failed` | Overall instance execution state |
| `items` | `TaskPlanInstanceItem[]` | One entry per template item, same order and count as `template.items`, carrying run-specific state |
| `startedAt` / `completedAt` / `failedAt` | Date \| null | |
| `createdAt` / `updatedAt` | Date | |

#### 3.2.1 `TaskPlanInstanceItem`

| Field | Type | Notes |
|-------|------|-------|
| `templateItemIndex` | number | Index into `template.items` this run-state row corresponds to (stable identity even if `skillId` is backfilled) |
| `agentId` | string | Denormalized copy of the template item's `agentId` at instance-creation time (execution-time snapshot; template item edits, if ever allowed, do not retroactively change in-flight instances) |
| `skillId` | string \| null | Denormalized; **backfilled** from `null` → concrete ID once a skill is created inline during execution (see §4.4). Backfill writes to **both** the instance item and, per FR-TPT-6, the template item |
| `order` | number | Denormalized copy of template item order |
| `status` | enum: `pending` \| `in-progress` \| `done` \| `failed` | Per-item execution state |
| `startedAt` / `completedAt` / `failedAt` | Date \| null | |
| `output` | `Record<string, unknown>` \| null | Item-level result payload once `done` |
| `errorMessage` | string \| null | Populated when `status === 'failed'` |
| `retryCount` | number | Incremented on each validator-triggered retry that mutates this item (default `0`) |

**Why denormalize `agentId`/`skillId`/`order` onto the instance item:** the instance is the audit/replay record for *this run*; it must remain accurate even if the template is edited or a skill is later archived. This mirrors the "no cross-domain imports" domain isolation rule — the instance domain never dereferences the template at read time for execution-critical fields.

### 3.3 Task and task comment changes

| Entity | Change | Rationale |
|--------|--------|-----------|
| `domains/task` | **Remove** `skillIdsUsed: string[] \| null` from `TaskModel` | Moves to comment level (see below) |
| `domains/task-comment` | **Add** `skillIdsUsed: string[] \| null` to `TaskCommentModel` | Skills used are resolved per plan instance, which is per comment turn, not per task |
| `domains/task-comment` | **Add** `taskPlanInstanceId: string \| null` to `TaskCommentModel` | Links a comment turn to its plan instance for detail-page and skills-aggregation queries; `null` when the comment's execution did not go through planning (e.g. `question` intent) |

Task-level aggregated skill display (§9.3) is computed by the service layer by joining across all comments for a task — **not** by re-introducing a task-level stored field.

#### 3.3.1 `agentResponse` vs. plan (clarified)

| Artifact | When written | Purpose | Linked how |
|----------|--------------|---------|------------|
| `taskPlanTemplate` + `taskPlanInstance` | At planning time (before/during execution) | Machine-readable orchestration, audit, replay | `taskComment.taskPlanInstanceId` → instance; instance → template |
| `taskComment.agentResponse` | **After** work completes | User-facing outcome narrative (not the plan) | Same comment row; independent field |

The structured plan is **not** a replacement for `agentResponse`. Users see both: a **Plan** entry in the task process list (from the instance) and an **agent response** feed item with the final result.

#### 3.3.2 Template vs. instance `inputDetails` (confirmed)

| Entity | `inputDetails` holds |
|--------|----------------------|
| **Template** | Generic **input slot definitions** — what inputs the plan shape requires (reusable, user-agnostic) |
| **Instance** | **Resolved values** for this specific run — concrete data filling those slots |

Both are freeform JSON; the template defines the shape, the instance holds run-specific values.

### 3.4 Relationship diagram

```
Task ──1:N── TaskComment ──1:1── TaskPlanInstance ──N:1── TaskPlanTemplate
                                        │
                                        └── items[] (denormalized agentId/skillId/order + run state)

TaskPlanTemplate.items[].agentId  ──────► SystemAgent (by MongoDB ID)
TaskPlanTemplate.items[].skillId  ──────► Skill (nullable)
```

---

## 4. Execution Semantics

### 4.1 Ordering

- Items are grouped by `order` ascending.
- All items sharing the same `order` value are triggered **in parallel** (`use_agent` fan-out, e.g. `Promise.all`).
- The Task Worker does **not** advance to the next `order` group until **every** item in the current group reaches a terminal per-item state (`done` or `failed`).

### 4.2 Failure propagation

- If **any** item within a parallel `order` group ends `failed`, the **whole plan instance** transitions to `failed` — remaining un-started items are left `pending` (not force-failed, so a retry can see which items never ran) and no subsequent `order` group is started.
- Instance-level `status: failed` sets `failedAt` and propagates an `errorMessage` (derived from the first failed item's `errorMessage` if multiple, deterministically the lowest `templateItemIndex`).

### 4.3 Validator retry semantics

- When a Validator determines rework is needed, the retry **mutates the existing `taskPlanInstance`** — no new instance or template version is created for that comment turn.
- Retry resets the targeted item(s) `status` to `pending`, increments `retryCount`, clears `errorMessage`/`completedAt`/`failedAt` on those items, and the instance `status` returns to `in-progress`.
- Retry does **not** re-run items that already completed successfully in an earlier attempt unless the Validator explicitly targets them (mirrors [Pause, Resume, and Retry Task](../pause-resume-task/prd.md) checkpoint philosophy applied at the item level instead of the task level).
- There is no cap on retry rounds enforced by this PRD's domain layer; the Validator's own retry-loop bound is governed by [Subagent Orchestration](../subagent-orchestration/architecture.md) (mandatory validator + bounded retry loop).

### 4.4 Null `skillId` — inline skill creation

- A template/instance item with `skillId: null` is **fully executable** — it is not a placeholder.
- The worker agent assigned via `agentId` executes the item's `description` directly. If, during execution, it determines a reusable procedure should be persisted, it creates a skill via the existing `create_skill` internal tool (from [Task Skill Planning](../task-skill-planning/prd.md)).
- On successful skill creation, the item is **backfilled**: `instance.items[i].skillId` is set to the new skill ID, **and** `template.items[i].skillId` is updated on the parent template so future reuses of that template resolve the same skill.
- Backfill is a targeted single-field update (not a template rewrite) to preserve template identity/audit trail for its other fields.

### 4.5 Agent references

- `agentId` on a plan item is a **MongoDB ID** referencing `domains/system-agent`.
- Valid targets: **system agents** (seeded utility/global agents) and **specialization-provisioned agents** (researcher/worker/validator agents created via `createSpecialization`) — both are documents in `domains/system-agent`, so a single ID type and lookup path covers both per the approved model.
- Personal (user-owned, non-system) agents are **not** valid plan-item targets in this PRD (consistent with Task Skill Planning's system-agent-only scope).

---

## 5. User Stories (Gherkin)

IDs: `TPT-N` (Task Plan Template), `TPI-N` (Task Plan Instance), `EXE-N` (execution orchestration), `UI-N` (UI/skills display), `INT-N` (integration with existing planning/comment flows).

### Task Plan Template stories

**TPT-1 — Task Planner persists a reusable template**

```gherkin
As the platform
I want the Task Planner to persist the plan shape it composes as a reusable template
So that equivalent future goals can reuse the same plan structure

Scenario: Task Planner creates a new template
  Given Task Planner has composed a plan for goal "Review NDA for risky clauses"
  And no existing template matches this goal shape
  When Task Planner persists the plan
  Then a taskPlanTemplate is created with shortName, description, inputDetails, outputDetails, and items[]
  And each item has an agentId, an optional skillId, a description, and an order
  And the template contains no userId, taskId, or commentId
```

**TPT-2 — Template reuse across users**

```gherkin
As the platform
I want an existing template to be reused for an equivalent goal from a different user
So that plan structure is consistent and audit-comparable across users

Scenario: Second user's task reuses an existing template
  Given user A's task previously produced taskPlanTemplate "contract-risk-review"
  And user B submits a task with an equivalent goal
  When Task Planner selects a template for user B's task
  Then Task Planner reuses taskPlanTemplateId "contract-risk-review" for a new taskPlanInstance
  And no new taskPlanTemplate document is created
```

**TPT-3 — Template items reference valid agents**

```gherkin
As the platform
I want every plan item to reference a valid system agent by MongoDB ID
So that execution can always resolve who runs each step

Scenario: Item agentId resolves to a system agent
  Given Task Planner composes an item for specialization "legal" worker
  When the item is persisted on the template
  Then item.agentId is the MongoDB ID of an active system agent document
  And that agent is either a global system agent or a specialization-provisioned agent

Scenario: Invalid agentId is rejected
  Given Task Planner attempts to persist an item with an agentId that does not resolve to an active system agent
  When create_task_plan_template is called
  Then the command fails validation
  And no template is persisted
```

**TPT-4 — No admin or end-user CRUD**

```gherkin
As the platform
I want task plan templates to be created only by the Task Planner
So that the template catalog stays consistent with actual planning output

Scenario: No manual template creation surface
  Given I am an admin viewing the platform
  Then there is no "Create task plan template" UI action
  And there is no public REST/GraphQL mutation to create a template outside the Task Planner's internal tool
```

### Task Plan Instance stories

**TPI-1 — One instance per comment**

```gherkin
As the platform
I want each task comment's execution turn to have at most one plan instance
So that plan state maps unambiguously to a conversation turn

Scenario: Instance created for a planned comment turn
  Given a task comment triggers execution that goes through Task Planner
  When planning completes
  Then a taskPlanInstance is created referencing that taskId and commentId
  And commentId is unique across all taskPlanInstance documents

Scenario: Second instance for the same comment is rejected
  Given a taskPlanInstance already exists for commentId "c1"
  When a second create_task_plan_instance is attempted for commentId "c1"
  Then the command fails with a uniqueness violation
```

**TPI-2 — Resolved inputs distinct from template input slots**

```gherkin
As the platform
I want the instance to hold resolved input values separate from the template's generic input slots
So that the same template can be reused with different concrete inputs per run

Scenario: Instance inputDetails fills template slots
  Given taskPlanTemplate "contract-risk-review" defines an input slot "documentReference"
  And the current task comment's goal specifies a contract file "nda-acme.pdf"
  When the taskPlanInstance is created
  Then instance.inputDetails contains a resolved value for "documentReference" of "nda-acme.pdf"
  And the template's inputDetails is unchanged
```

**TPI-3 — Instance item state mirrors template items**

```gherkin
As the platform
I want each instance to have one item-state row per template item
So that execution progress can be tracked per step

Scenario: Instance items created from template items
  Given the referenced template has 3 items with orders [1, 1, 2]
  When the taskPlanInstance is created
  Then instance.items has 3 entries with matching templateItemIndex, agentId, skillId, and order
  And each item's status is "pending"
```

### Execution orchestration stories

**EXE-1 — Ascending order, parallel within an order**

```gherkin
As the platform
I want plan items to execute in ascending order with same-order items in parallel
So that dependent steps never run before their prerequisites

Scenario: Two items at order 1 run in parallel, then order 2 starts
  Given a plan instance has items A (order 1), B (order 1), C (order 2)
  When the Task Worker begins orchestration
  Then A and B are triggered concurrently
  And C is not triggered until both A and B reach a terminal status
  And once A and B are both "done", C is triggered
```

**EXE-2 — Parallel failure fails the whole plan**

```gherkin
As the platform
I want one failing item in a parallel group to fail the entire plan
So that downstream steps never run against an incomplete prerequisite set

Scenario: One of two parallel items fails
  Given items A (order 1) and B (order 1) are triggered in parallel
  And item C (order 2) has not yet started
  When item A completes "done" and item B completes "failed"
  Then the plan instance status becomes "failed"
  And item C is never triggered and remains "pending"
  And the task comment's execution turn reflects the failure
```

**EXE-3 — Validator retry mutates the existing instance**

```gherkin
As the platform
I want a validator-triggered retry to update the existing plan instance in place
So that plan history is not fragmented across multiple versions per comment

Scenario: Validator requests rework of one failed item
  Given a plan instance has item B in status "failed"
  When the Validator requests a retry of item B
  Then item B's status resets to "pending" and its retryCount increments by 1
  And the taskPlanInstance.id is unchanged
  And no new taskPlanInstance or taskPlanTemplate is created
  And the instance status returns to "in-progress"
```

**EXE-4 — Null skillId executes and backfills**

```gherkin
As the platform
I want an item with no skillId to still execute and to persist a skill if one is created
So that first-of-kind steps become reusable without blocking execution

Scenario: Item with null skillId executes inline
  Given a plan item has skillId null and description "Summarize uploaded PDF"
  When the Task Worker triggers that item
  Then the assigned agent executes the item description directly
  And if the agent creates a skill via create_skill during execution
  Then the instance item's skillId is set to the new skill ID
  And the parent template's corresponding item skillId is also backfilled to the new skill ID

Scenario: Item with null skillId executes without creating a skill
  Given a plan item has skillId null
  When the assigned agent completes the item without calling create_skill
  Then the item's status is "done"
  And skillId remains null on both the instance item and the template item
```

**EXE-5 — Plan-level status reflects item completion**

```gherkin
As the platform
I want the plan instance's overall status to reflect its items' progress
So that the Task Worker and UI can show a single execution state

Scenario: All items complete successfully
  Given all items in a plan instance reach status "done"
  Then the plan instance status becomes "done"
  And completedAt is set

Scenario: Plan instance status while mid-execution
  Given some items are "done" and the current order group is "in-progress"
  Then the plan instance status is "in-progress"
```

### UI / skills relocation stories

**UI-1 — Plan appears as its own task process list entry**

```gherkin
As an end user
I want to see the execution plan as its own entry in the task process list
So that I can distinguish structured plan data from the agent's narrative summary

Scenario: Plan entry visible on task detail
  Given a task comment has an associated taskPlanInstance
  When I view the task detail page's task process list
  Then a distinct "Plan" entry appears, separate from the agentResponse feed item
  And expanding it shows the ordered/parallel items with their per-item status
```

**UI-2 — Skill tags per comment**

```gherkin
As an end user
I want to see which skills were used for a specific comment's execution
So that I understand what procedures produced that response

Scenario: Skill tags shown at comment level
  Given a task comment's plan instance used skills "contract-review" and "clause-extraction"
  When I view that comment in the activity feed
  Then skill tags "contract-review" and "clause-extraction" are shown on that comment
```

**UI-3 — Aggregated skills per task**

```gherkin
As an end user
I want to see all skills used across the whole task's conversation
So that I get a task-level summary similar to the specializations pattern

Scenario: Aggregated skill tags on task detail
  Given a task has 3 comments using skills ["a"], ["a", "b"], ["c"] respectively
  When I view the task detail page's aggregated skills section
  Then the deduplicated set ["a", "b", "c"] is displayed
  And the display pattern matches the existing specializations aggregation pattern
```

**UI-4 — Regular users see tags only; admins see links**

```gherkin
As a regular end user
I want skill tags without navigation
So that I am not exposed to internal skill management pages

Scenario: Regular user sees non-interactive tags
  Given I am authenticated as a non-admin user
  When I view skill tags on a comment or the aggregated task view
  Then the tags render as plain, non-clickable labels

Scenario: Admin sees clickable skill links
  Given I am authenticated as an admin
  When I view skill tags on a comment or the aggregated task view
  Then each tag is a link to that skill's detail page
```

**UI-5 — agentResponse and plan are separate, coexisting artifacts**

```gherkin
As an end user
I want the agent's final result and the execution plan to be separate in the UI
So that I see what was planned versus what was delivered as the outcome

Scenario: agentResponse is post-work result, plan is a linked entry
  Given a comment's execution produced a plan instance and later completed with an agentResponse
  When I view the activity feed
  Then the plan entry renders as a separate task-process-list item linked via taskPlanInstanceId
  And the agentResponse renders as the existing markdown feed item with the post-work user-facing result
  And the agentResponse does not contain the structured plan text
  And neither artifact replaces the other
```

### Integration stories

**INT-1 — Task Planner writes template + instance instead of ephemeral text only**

```gherkin
As the platform
I want Task Planner's persistence to include the structured template and instance
So that the plan becomes machine-consumable, not just narrative

Scenario: Planning produces persisted structures
  Given Task Planner completes planning for a comment turn
  When it finalizes the plan
  Then a taskPlanTemplate (new or reused) exists
  And a taskPlanInstance exists linking that template to the current taskId and commentId
  And taskComment.taskPlanInstanceId is set to that instance
  And the comment's agentResponse is populated only after work completes with the user-facing outcome (not the plan text)
```

**INT-2 — skillIdsUsed relocation**

```gherkin
As the platform
I want skillIdsUsed to live on the comment, not the task
So that skill usage is attributable to the specific execution turn that used it

Scenario: skillIdsUsed set on the comment
  Given a comment's plan instance used skills ["contract-review"]
  When execution completes
  Then taskComment.skillIdsUsed is ["contract-review"]
  And task.skillIdsUsed no longer exists as a field
```

**INT-3 — Question intent bypasses plan persistence**

```gherkin
As the platform
I want question-intent comment turns to skip plan persistence entirely
So that informational answers are not misrepresented as executable plans

Scenario: Question intent has no plan instance
  Given a comment's execution has intent category "question"
  When execution completes
  Then no taskPlanTemplate or taskPlanInstance is created for that comment
  And taskComment.taskPlanInstanceId remains null
```

---

## 6. Functional Requirements

### 6.1 `domains/task-plan-template`

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-TPT-1 | New domain `task-plan-template` following standard domain package structure (model, commands, queries, clients). | Package scaffolded via `create-domain` skill; passes lint/build. |
| FR-TPT-2 | `create` command persists `shortName`, `description`, `inputDetails`, `outputDetails`, `items[]`. Callable only from the Task Planner's internal tool layer (`services/agent`), not exposed as a public admin/user command. | No REST/GraphQL route mounts this command directly for end users or admins. |
| FR-TPT-3 | Each `items[]` entry validated: `agentId` required and must resolve to an active, non-removed `domains/system-agent` document (checked at the service layer, not via domain cross-import); `skillId` optional/nullable, when present must resolve to an active skill; `description` required non-empty; `order` required non-negative integer. | Zod validation schema at command boundary; invalid `agentId`/`skillId` rejected before persistence. |
| FR-TPT-4 | `description` length bounded (recommend ≤ 500 chars, "2–3 sentences, what not how") consistent with skill `description` convention. | Validation error on overflow. |
| FR-TPT-5 | `inputDetails` / `outputDetails` stored as freeform JSON with a maximum serialized size guard (recommend ≤ 32 KB) to prevent unbounded documents. | Oversized payload rejected at command boundary. |
| FR-TPT-6 | Add a targeted `backfillItemSkillId` command: updates a single item's `skillId` by `templateItemIndex` without touching other fields. | Used exclusively by the inline-skill-creation backfill path (§4.4); does not require re-submitting the full template. |
| FR-TPT-7 | Standard `getModelById` (internal) and `getById` (public, mapped) queries; a `findEquivalent` query used by Task Planner to detect reusable templates (see Open Questions OQ-1 for matching strategy). | Queries follow domain query conventions; `findEquivalent` documented as best-effort, not exact-match guaranteed. |
| FR-TPT-8 | Soft-delete only (`removeSoft`); no hard delete exposed. | Matches skill/removeSoft pattern. |

### 6.2 `domains/task-plan-instance`

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-TPI-1 | New domain `task-plan-instance` following standard domain package structure. | Package scaffolded; passes lint/build. |
| FR-TPI-2 | `create` command persists `taskPlanTemplateId`, `taskId`, `commentId`, `inputDetails` (resolved), and denormalized `items[]` derived 1:1 from the referenced template's items (each seeded with `status: pending`). | Unique index on `commentId`; duplicate create for the same `commentId` fails. |
| FR-TPI-3 | `updateItemStatus` command: transitions a single item's `status`/`startedAt`/`completedAt`/`failedAt`/`output`/`errorMessage` by `templateItemIndex`; recomputes and persists the instance-level `status` per §4.5 (EXE-5 rules). | Called by the Task Worker orchestration loop per item transition. |
| FR-TPI-4 | `retryItem` command: resets a targeted item to `pending`, increments `retryCount`, clears terminal fields, and sets instance `status` back to `in-progress`. Does not create a new instance document. | Same `id` before/after; `retryCount` increments verified. |
| FR-TPI-5 | `backfillItemSkillId` command: mirrors FR-TPT-6 but on the instance item; called together with the template backfill in the same execution step. | Both instance and template item reflect the new `skillId` after inline skill creation. |
| FR-TPI-6 | Standard `getModelById` (internal) and `getById` (public, mapped) queries; add `getByCommentId` (1:1 lookup) and `getByTaskId` (list, for task-level aggregation e.g. skills rollup). | Queries follow domain query conventions. |
| FR-TPI-7 | Instance-level `status` computed as: `pending` if no items started; `in-progress` if any item is `in-progress` or some but not all are terminal; `done` if all items `done`; `failed` if any item `failed` and no further items are started. | Deterministic status derivation covered by unit tests. |

### 6.3 Task Worker orchestration

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-EXE-1 | Task Worker, after Task Planner produces a template + instance, orchestrates execution by grouping `items` by `order` ascending. | Verified via integration test with a 3-item, 2-order-group plan. |
| FR-EXE-2 | Within an `order` group, all items are triggered concurrently (`Promise.all` over `use_agent` calls). | No sequential await between same-order items. |
| FR-EXE-3 | The next `order` group is not started until **all** items in the current group reach a terminal per-item status (`done` or `failed`). | Enforced via awaited `Promise.all` before advancing loop index. |
| FR-EXE-4 | If any item in a group ends `failed`, the instance transitions to `failed` and no further `order` groups are started. | Remaining `pending` items are left untouched (not force-failed). |
| FR-EXE-5 | For each item, the Task Worker resolves the assigned agent by `agentId`, invokes it via existing `use_agent` internal tool with the item's `description` + relevant slice of `instance.inputDetails`, and records the result via `updateItemStatus`. | Reuses existing `use_agent` / `runAgentInvokeWithTools` — no new invocation primitive. |
| FR-EXE-6 | When an item's `skillId` is `null`, the Task Worker still triggers the item; if the invoked agent calls `create_skill` during that invocation, the Task Worker (or the tool handler) calls `backfillItemSkillId` on both instance and template. | Covered by EXE-4 Gherkin scenarios. |
| FR-EXE-7 | Validator retry path calls `retryItem` on the instance rather than triggering Task Planner to create a new template/instance. | No new `taskPlanInstance` row created for a retry within the same comment turn. |
| FR-EXE-8 | Orchestration failures surface a user-readable `errorMessage` on the task comment's execution turn (existing `complete`/`fail` path), referencing which plan item failed. | Error message includes item description or index for debuggability. |

### 6.4 Task Planner behavior changes

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-TP-1 | After composing a plan (per existing Task Skill Planning flow), Task Planner calls a new internal tool (e.g. `persist_task_plan`) that: (a) attempts to find an equivalent existing template, (b) creates a new template if none found, (c) creates the instance for the current `taskId`/`commentId`. | New internal tool documented in `services/agent/src/internalTools/`. |
| FR-TP-2 | Task Planner persists template + instance at planning time. `agentResponse` is **not** populated with plan text — it receives the **post-work user-facing result** only after execution completes (supersedes Task Comment Conversation AC-9 plan-in-agentResponse). | No plan prose in `agentResponse`; plan visible via `taskPlanInstanceId` linkage and Plan UI entry. |
| FR-TP-3 | Task Planner maps each planned step to a `TaskPlanTemplateItem` (`agentId`, `skillId` or `null`, `description`, `order`), preserving the existing ordered/parallel semantics already implied by Task Skill Planning + Subagent Orchestration's subtask-list output. | 1:1 mapping from narrative plan steps to persisted items verified in integration tests. |
| FR-TP-4 | `question` intent comment turns do **not** invoke `persist_task_plan` — no template/instance created (unchanged from Task Skill Planning's question exclusion). | `taskComment.taskPlanInstanceId` remains `null` for question turns. |

### 6.5 Task and task-comment model changes

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-TM-1 | Remove `skillIdsUsed` from `TaskModel`, DTO, GraphQL type, and `update_task` command input. | Field absent from task model/schema/GraphQL after change. |
| FR-TM-2 | Add `skillIdsUsed: string[] \| null` to `TaskCommentModel`, DTO, GraphQL type, and the comment `complete`/`setAgentResponse` write path. | Field persisted per comment; nullable; defaults to `null`. |
| FR-TM-3 | Add `taskPlanInstanceId: string \| null` to `TaskCommentModel`, DTO, GraphQL type. | Set when a plan instance is created for that comment; `null` otherwise. |
| FR-TM-4 | GraphQL: expose `taskComment.plan { instance { status items { ... } } template { shortName description items { ... } } }` (nested read) for task detail consumers. | Query returns full plan detail for a given comment without a second round-trip. |
| FR-TM-5 | GraphQL: expose task-level aggregated `skillIdsUsed` as a **computed** field (union of all comments' `skillIdsUsed` for that task), not a stored task field. | Resolver aggregates across comments at read time; not persisted redundantly. |

### 6.6 UI

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-UI-1 | Task detail's task process list renders a distinct **Plan** entry per comment turn that has a `taskPlanInstanceId`, separate from the `agentResponse` feed item. | Matches UI-1 Gherkin; no plan content duplicated inside the agentResponse card. |
| FR-UI-2 | Plan entry, when expanded, shows ordered/parallel groups and each item's `description`, assigned agent (name), skill (name, if any), and per-item `status`. | Visual grouping reflects `order` — same-order items shown together. |
| FR-UI-3 | Skill tags render at the **comment** level (per that comment's `skillIdsUsed`) inside the activity feed item for that comment. | Matches UI-2 Gherkin. |
| FR-UI-4 | Skill tags render **aggregated** at the **task** level in a dedicated section, following the existing specializations aggregation display pattern. | Matches UI-3 Gherkin; visually consistent with specialization tags component. |
| FR-UI-5 | Regular (non-admin) users see skill tags as plain, non-interactive labels. | Matches UI-4 Gherkin (regular user scenario). |
| FR-UI-6 | Admin users see skill tags as links navigating to the skill detail page. | Matches UI-4 Gherkin (admin scenario). |
| FR-UI-7 | No new admin/user CRUD surface for task plan templates or instances. | No "create/edit template" screens ship. |

### 6.7 Observability

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-OB-1 | Log events: `taskPlan.template.created`, `taskPlan.template.reused`, `taskPlan.instance.created`, `taskPlan.instance.itemStarted`, `taskPlan.instance.itemCompleted`, `taskPlan.instance.itemFailed`, `taskPlan.instance.itemRetried`, `taskPlan.instance.skillBackfilled`, `taskPlan.instance.completed`, `taskPlan.instance.failed`. | Structured logs include `taskId`, `commentId`, `taskPlanTemplateId`, `taskPlanInstanceId`, `templateItemIndex` where applicable. |
| FR-OB-2 | Progress timeline (existing `domain-task-progress`, comment-scoped per Task Comment Conversation) records plan-level start/complete/fail events so they render in the existing activity feed alongside plan-item detail. | No new progress domain; reuses comment-scoped progress events. |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Area | Target |
|------|--------|
| `persist_task_plan` tool call (template lookup/create + instance create) | p95 < 2 s |
| Per-item orchestration overhead (status read/write, excluding the agent invocation itself) | p95 < 300 ms per `updateItemStatus` call |
| Task detail plan query (`taskComment.plan`) | p95 < 500 ms |
| Task-level aggregated skills query | p95 < 800 ms for tasks with ≤ 50 comments |

### 7.2 Reliability & degradation

- If `persist_task_plan` fails (e.g. invalid `agentId`), the comment turn fails with a clear `errorMessage` — Task Planner must not silently fall back to an unpersisted, ephemeral plan.
- Orchestration failure mid-plan (§4.2) must leave the instance and its items in a well-defined, inspectable state (no partial writes that leave `status` inconsistent with `items[]`).
- A crash/restart mid-orchestration (before Phase-2/worker-process execution is addressed architecturally) leaves the instance in its last-persisted per-item state; resumability across process restarts follows the same in-process execution model as [Pause, Resume, and Retry Task](../pause-resume-task/prd.md) — out of scope to redesign here.

### 7.3 Consistency & idempotency

- Uniqueness constraint on `taskPlanInstance.commentId` prevents duplicate plans for the same comment turn even under retried tool calls.
- `retryItem` and `backfillItemSkillId` are idempotent when called twice with the same target state (no double-increment of `retryCount` beyond the intended single retry request; no error if `skillId` backfill is called again with the same value).
- Denormalized `agentId`/`skillId`/`order` on instance items are **frozen at instance-creation time** except for the explicit `skillId` backfill path — no other field silently drifts from the template after creation.

### 7.4 Security

- `agentId` and `skillId` references are validated against active, non-removed documents at write time to prevent dangling/attacker-supplied references.
- `inputDetails`/`outputDetails` freeform JSON is size-capped (FR-TPT-5) and must not be rendered as raw HTML on the UI (render as structured data / escaped text).
- Task Plan Template/Instance creation tools are system-agent-only — not reachable via any public REST/GraphQL mutation (mirrors Task Skill Planning's system-only agent boundary).

### 7.5 Accessibility

- Plan entry in the task process list follows existing list/expand accessibility patterns (keyboard-operable expand/collapse, consistent with the comment-conversation activity feed's inline-expand progress rows).
- Skill tag links (admin) are standard anchor elements with descriptive `aria-label` (e.g. "View skill: contract-review").

### 7.6 Platform

- Two new domain packages: `domains/task-plan-template`, `domains/task-plan-instance` (scaffolded via the `create-domain` skill).
- No changes to `domains/skill` or `domains/system-agent` schemas — both are referenced by ID only.
- GraphQL resolvers added for reads; REST/internal-tool paths added for writes, per [API Calling Conventions](../../../.cursor/rules/api-calling-conventions.mdc).

---

## 8. API Contract Summary

Per [API Calling Conventions](../../../.cursor/rules/api-calling-conventions.mdc): **GraphQL for reads, REST for commands.** Template/instance **writes** in this feature are performed by the Task Planner / Task Worker via internal tools and **service-layer handlers**, not by public REST endpoints callable by end users — there is intentionally **no public "create template" or "create instance" REST route**. The REST surface below exists only where a human-triggered state change is legitimate (validator-triggered retry surfaced through existing task/comment orchestration, not a new public endpoint).

### 8.1 GraphQL (reads)

```graphql
type TaskPlanTemplateItem {
  agentId: ID!
  agentName: String!
  skillId: ID
  skillName: String
  description: String!
  order: Int!
}

type TaskPlanTemplate {
  id: ID!
  shortName: String!
  description: String!
  inputDetails: JSON!
  outputDetails: JSON!
  items: [TaskPlanTemplateItem!]!
}

type TaskPlanInstanceItem {
  templateItemIndex: Int!
  agentId: ID!
  agentName: String!
  skillId: ID
  skillName: String
  order: Int!
  status: TaskPlanItemStatus!
  startedAt: DateTime
  completedAt: DateTime
  failedAt: DateTime
  errorMessage: String
  retryCount: Int!
}

type TaskPlanInstance {
  id: ID!
  taskPlanTemplateId: ID!
  status: TaskPlanInstanceStatus!
  inputDetails: JSON!
  items: [TaskPlanInstanceItem!]!
  startedAt: DateTime
  completedAt: DateTime
  failedAt: DateTime
}

extend type TaskComment {
  skillIdsUsed: [ID!]
  taskPlanInstanceId: ID
  plan: TaskCommentPlan
}

type TaskCommentPlan {
  template: TaskPlanTemplate!
  instance: TaskPlanInstance!
}

extend type Task {
  skillIdsUsed: [ID!]  # computed: union across all comments, not stored on task
}
```

**Removed:** `Task.skillIdsUsed` as a **stored** field (replaced by the computed resolver above); `taskPlanTemplateId`/`taskPlanInstanceId` are not exposed on `Task` directly — always accessed via the owning `TaskComment`.

### 8.2 REST / internal commands (writes)

| Caller | Mechanism | Purpose |
|--------|-----------|---------|
| Task Planner (system agent, via internal tool) | Internal tool `persist_task_plan` → service handler → `domains/task-plan-template.create` (or reuse) + `domains/task-plan-instance.create` | Persist plan shape + run binding |
| Task Worker (system agent, via internal tool / service orchestration loop) | Service-layer call → `domains/task-plan-instance.updateItemStatus` | Record per-item execution progress |
| Validator (system agent, via internal tool) | Service-layer call → `domains/task-plan-instance.retryItem` | Trigger in-place retry of a failed item |
| Task Worker / assigned agent (on inline skill creation) | Service-layer call → `domains/task-plan-template.backfillItemSkillId` + `domains/task-plan-instance.backfillItemSkillId` | Backfill `skillId` after inline `create_skill` |

There is **no** `POST /task-plan-templates` or `POST /task-plan-instances` REST route for direct human/API-client use — all writes flow through the existing task/comment execution pipeline (`executeTask`) and system-agent internal tools, consistent with "no separate UI/CRUD" and "no separate admin CRUD" requirements.

### 8.3 Authorization

- Reads (`taskComment.plan`, aggregated `task.skillIdsUsed`) are scoped to the task owner, same authorization boundary as existing task/comment queries.
- Admin-only behavior is limited to the **UI presentation** of skill tags as links (FR-UI-6) — the underlying plan/skill read authorization is unchanged (owner-scoped for task data; skill detail page authorization is admin-only per existing skill domain rules).

---

## 9. UI Spec

### 9.1 Placement

Task detail page, within the existing activity feed / task process list (per [Task Comment Conversation](../task-comment-conversation/prd.md) §7):

1. Description (existing).
2. Activity feed — **add** a new item type: **Plan** (rendered once per comment that has a `taskPlanInstanceId`), positioned in feed order at the comment's `occurredAt` alongside its `userComment`/`agentResponse`/progress items, but as a **visually distinct card**, not merged into the `agentResponse` markdown card.
3. **Aggregated skills** section — new, following the existing specializations aggregation display pattern; placed near where specialization tags are shown today (e.g. below description or within task metadata).
4. Execution statistics (existing, unchanged placement).
5. Comment composer (existing, unchanged).

### 9.2 Plan entry (per comment)

- Collapsed state: shows the template `shortName`, instance `status` (e.g. "In progress — step 2 of 3"), and skill tags used by this comment.
- Expanded state: shows items grouped visually by `order` (e.g. "Step 1" containing 2 parallel items side-by-side, "Step 2" below), each with agent name, skill name/tag (if any), description, and per-item status icon.
- Failed items show `errorMessage` inline; retried items show `retryCount` (e.g. "Retried once").

### 9.3 Skill tags

| Level | Behavior |
|-------|----------|
| Per comment | Tags reflect `taskComment.skillIdsUsed`; rendered inside that comment's feed card |
| Aggregated per task | Deduplicated union of all comments' `skillIdsUsed` for the task, rendered in a dedicated component mirroring the existing specializations aggregation pattern |
| Regular user | Non-interactive label (both levels) |
| Admin | Anchor link to skill detail page (both levels) |

### 9.4 Interaction

- Plan entry expand/collapse follows the same inline-expand (no modal) convention established in [Task Comment Conversation](../task-comment-conversation/prd.md) for progress rows.
- No editing affordance anywhere in the plan UI (view-only, per out-of-scope).

### 9.5 `agentResponse` vs. Plan entry (distinct roles)

| Feed item | Content | Timing | Source |
|-----------|---------|--------|--------|
| **Plan** | Structured execution plan: shortName, items by order, per-item status, skill tags | Created at planning; status updates during execution | `taskPlanInstance` via `taskComment.taskPlanInstanceId` |
| **Agent response** | Post-work user-facing outcome (findings, deliverables, narrative result) | Written when execution completes | `taskComment.agentResponse` |

These are **never merged** into one card. The Plan entry may appear **before** the agent response (plan exists at planning time; response follows completion). The agent response must **not** duplicate or substitute for plan content.

---

## 10. Edge Cases & Error Handling

| Case | Expected behavior |
|------|--------------------|
| Task Planner cannot find or create a valid template (e.g. no resolvable `agentId` for a required step) | Comment execution fails with a clear `errorMessage`; no partial template/instance persisted |
| Comment execution retried at the **task/comment** level (per Pause/Resume/Retry) after a plan instance already exists for that `commentId` | Retry at the comment level does not create a second `taskPlanInstance` for the same `commentId`; existing instance is reset/reused (exact reset strategy is an architecture decision — see OQ-3) |
| All items in a plan have the same `order` (fully parallel plan) | Single group executes concurrently; instance completes when all finish; a single failure still fails the whole instance |
| Plan has only one item | Behaves as a single-order, single-item group; no parallelism edge cases |
| Item's assigned agent is later soft-removed after the instance was created | Instance execution is unaffected (agent was already resolved and denormalized at instance-creation time); a **new** instance/template referencing that agent could not be created going forward |
| Two different comments concurrently attempt to create instances for template lookup with a race on "equivalent template" detection | Both may create separate templates in the rare race case (best-effort matching, not exact); acceptable per FR-TPT-7 — no distributed lock required for v1 |
| Skill created inline for an item, but the same template item is later executed again (template reused by a different task) with a *different* agent choosing not to reuse the skill | Backfilled `skillId` from the first run is treated as the template's now-standard choice; the second run's instance denormalizes that already-backfilled `skillId` at instance-creation time — the second run's agent still executes with `skillId` populated, consistent with normal skill-resolution flow |
| `outputDetails`/`inputDetails` freeform JSON exceeds size cap | Command validation rejects the write; comment execution fails with a size-limit error |
| Validator requests retry on an item that is still `pending` (never started) | `retryItem` is a no-op state-wise (already `pending`) but still increments `retryCount` for audit purposes (see OQ-4) |
| Question-intent comment turn | No template/instance created; `taskPlanInstanceId` stays `null`; no Plan entry rendered in the feed |
| Admin views a comment whose plan instance references a skill that has since been soft-removed | Skill tag still renders (historical record); admin link routes to the skill detail page, which shows removed/archived state per existing skill domain behavior |

---

## 11. Out of Scope

| Item | Notes |
|------|-------|
| End-user plan editor | View-only UI; no create/edit/reorder affordance for templates or instances |
| Template library marketplace UI | No browsing/searching/publishing UI for templates as a standalone catalog in this PRD |
| Historical migration of `agentResponse`/`llmResponse` into plans | No backfill — only new comment turns going forward get persisted plans (mirrors Task Comment Conversation's no-migration decision for `llmResponse`) |
| Manual CRUD for templates/instances | No admin or end-user create/update/delete surface; Task Planner/Task Worker are the only writers |
| Cross-process / worker-based execution of plan orchestration | Orchestration runs in the existing in-process `executeTask` model (per Async LLM Task Execution); moving to an out-of-process worker for plan orchestration is a future phase |
| Template versioning | No version history on templates; template edits (via backfill only) mutate in place |
| Distributed locking for template-reuse race conditions | Best-effort equivalent-template matching; duplicate templates in rare races are acceptable |
| Plan step timeouts / SLA enforcement | Not specified in this PRD; relies on existing agent invocation timeout behavior, if any |
| Notifications specific to plan step failures (beyond existing task/comment failure surfacing) | Uses existing error/failure UI; no new notification channel |
| Changing skill domain schema (`domains/skill`) | Skills are referenced by ID only; no new fields added to skill model |

---

## 12. Supersedes / Conflicts

| Prior decision | Status | Resolution in this PRD |
|-----------------|--------|--------------------------|
| [Task Skill Planning](../task-skill-planning/prd.md) §1.4 Phase 3 — "Plan persistence (optional future) — out of scope for Phase 1" | **Superseded** | Plan persistence is now **in scope** via `task-plan-template` + `task-plan-instance`. Phase 1/2 of Task Skill Planning (agents, skill-based planning logic) are unchanged and remain the source of *what* gets planned; this PRD adds *where it is stored and how it is executed*. |
| [Task Skill Planning](../task-skill-planning/prd.md) FR-TP-8 — "Plan is returned in task `llmResponse` — not persisted as a separate entity in Phase 1" | **Superseded** | Plan is now persisted as a template + instance pair. Plan content lives in the structured entities and Plan UI entry — not in `agentResponse`. |
| [Task Skill Planning](../task-skill-planning/prd.md) FR-TM-1 — `skillIdsUsed` on the **task** model | **Superseded** | `skillIdsUsed` moves to `taskComment` (FR-TM-1/FR-TM-2 in this PRD). Task-level view is a computed aggregation, not a stored field. |
| [Subagent Orchestration](../subagent-orchestration/architecture.md) — "No new internal tools / Zod schemas / DB fields... entire orchestration protocol... carried as natural-language `agentPrompt` strings" | **Superseded for plan structure** | This PRD introduces persisted DB fields and structured orchestration state (per-item status, order, retryCount) specifically for the plan/instance layer. Subagent Orchestration's other conclusions (subagent output policy section, mandatory validator, `use_agent`/`list_agents` reuse) remain valid and are **reused**, not replaced — only its "no DB fields" premise is narrowed to exclude plan persistence. |
| [Task Comment Conversation](../task-comment-conversation/prd.md) AC-9 / §3.4 — "Skill planning output: plan text in `agentResponse`" | **Superseded** | `agentResponse` is the **post-work user-facing result**, not plan text. The structured plan is linked via `taskPlanInstanceId` and shown as a separate Plan entry in the task process list. |

---

## 13. Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|---------------------|
| `domains/task-comment` (create, setAgentResponse, setSpecializationIds commands) | Exists | Cannot attach `skillIdsUsed`/`taskPlanInstanceId` to a comment |
| `domains/task` (`skillIdsUsed` field, to be removed) | Exists | Removal requires coordinated migration of readers/writers |
| `domains/skill` (`create`, `getById`, `getActiveRuleById`) | Exists | Cannot validate/resolve `skillId` references or support inline skill creation backfill |
| `domains/system-agent` (`getActiveById`, specialization-provisioned agents) | Exists | Cannot validate `agentId` references on plan items |
| Task Skill Planning's Task Planner / Skill Planner / script creators | Exists (Task Skill Planning PRD, shipped) | No source of plan content to persist |
| Subagent Orchestration's mandatory validator + retry loop, subtask-list output convention | Exists (approved architecture) | No consistent step/subtask shape to map into template items; no validator retry trigger point |
| `create-domain` skill (scaffolding) | Available (`.cursor/skills/create-domain/SKILL.md`) | Manual package setup required |
| `add-domain-command-query` skill | Available | Manual command/query wiring required |
| Task Comment Conversation's comment-scoped progress + activity feed (`domain-task-progress`, `TaskActivityFeed`) | Shipped (core stack); UI polish/E2E in progress per that PRD's status | Plan entry needs the activity feed's item-type extension point; if unavailable, Plan UI has no host surface |
| `use_agent` / `runAgentInvokeWithTools` / `list_agents` internal tools | Exists | No mechanism to invoke plan-item agents or discover agents for validation |
| `apps/api` GraphQL/REST layering conventions | Exists | New reads/writes would not have a consistent transport pattern to follow |

---

## 14. Acceptance Criteria (QA Checklist)

### Domain layer

- [ ] `domains/task-plan-template` scaffolded with model, commands (`create`, `backfillItemSkillId`, `removeSoft`), queries (`getModelById`, `getById`, `findEquivalent`)
- [ ] `domains/task-plan-instance` scaffolded with model, commands (`create`, `updateItemStatus`, `retryItem`, `backfillItemSkillId`), queries (`getModelById`, `getById`, `getByCommentId`, `getByTaskId`)
- [ ] Unique index enforced on `taskPlanInstance.commentId`
- [ ] `agentId` and `skillId` validated against active documents at write time (FR-TPT-3)
- [ ] `task.skillIdsUsed` removed from model/DTO/GraphQL/`update_task` (FR-TM-1)
- [ ] `taskComment.skillIdsUsed` and `taskComment.taskPlanInstanceId` added (FR-TM-2, FR-TM-3)

### Task Planner integration

- [ ] Task Planner persists template + instance after planning (INT-1)
- [ ] `agentResponse` contains post-work result only — no plan text (FR-TP-2)
- [ ] Question-intent turns produce no template/instance (INT-3)
- [ ] Template reuse works for an equivalent goal from a different user (TPT-2)

### Orchestration

- [ ] Same-order items execute in parallel; next order waits for full completion of prior order (EXE-1)
- [ ] One failed item in a parallel group fails the whole plan; untouched items remain `pending` (EXE-2)
- [ ] Validator retry mutates the existing instance; no duplicate instance/template created (EXE-3)
- [ ] Null-`skillId` item executes and, when a skill is created inline, backfills both instance and template (EXE-4)
- [ ] Instance-level `status` derivation matches FR-TPI-7 rules under unit test (EXE-5)

### UI

- [ ] Plan renders as a distinct task-process-list entry, separate from `agentResponse` (UI-1)
- [ ] Skill tags shown per comment (UI-2) and aggregated per task (UI-3)
- [ ] Regular users see non-interactive tags; admins see clickable links to skill detail (UI-4)
- [ ] No admin/end-user CRUD screens ship for templates or instances (FR-UI-7)

### Regression

- [ ] Existing Task Skill Planning agent behavior (skill selection, clarification rounds, Skill Planner delegation) unaffected
- [ ] Task Comment Conversation activity feed, filters, and progress rows unaffected by the new Plan item type
- [ ] Pause/Resume/Retry at the task/comment level continues to function; interaction with in-place instance retry documented and tested (see OQ-3)
- [ ] Existing skill admin UI and skill detail pages unaffected

### E2E (recommended)

- [ ] Gherkin scenarios TPT-1 through TPT-4, TPI-1 through TPI-3, EXE-1 through EXE-5, UI-1 through UI-5, INT-1 through INT-3 covered in `apps/web/e2e/features/task-plan/` or service integration tests where UI is unchanged

---

## 15. Decisions

| # | Question | Decision |
|---|----------|----------|
| D-1 | Number of new entities | **Two** — `taskPlanTemplate` (generic, reusable) and `taskPlanInstance` (run-specific, 1:1 with `commentId`) |
| D-2 | Who creates templates/instances | **Task Planner (LLM) only** — no admin or end-user CRUD surface |
| D-3 | Agent reference type on plan items | **MongoDB ID**, resolving to `domains/system-agent` (covers both global system agents and specialization-provisioned agents) |
| D-4 | `skillId` nullability | **Nullable** — null means the step is executable inline; the assigned agent may create a skill during execution, backfilled onto both instance and template |
| D-5 | Retry strategy | **Mutate existing instance** — no new version/instance per retry |
| D-6 | Execution ordering | **Ascending `order`; same-order items run in parallel; next order waits for full completion of the previous order** |
| D-7 | Failure propagation | **Any parallel-group item failure fails the whole plan instance** |
| D-8 | `skillIdsUsed` location | **Moves to comment level** (`taskComment.skillIdsUsed`); task-level view is a computed aggregation, not a stored field |
| D-9 | agentResponse vs. plan | **Separate, coexist** — `agentResponse` is the **post-work user-facing result** (written after execution completes); plan is linked via `taskComment.taskPlanInstanceId` and shown as its own Plan entry. Structured plan is authoritative for orchestration; `agentResponse` is not plan text and does not replace the plan |
| D-14 | Null `skillId` execution (Q6) | **Option A confirmed** — item is executable; assigned agent creates skill inline during execution; instance and template items backfilled with `skillId` when skill is created |
| D-15 | Template vs. instance `inputDetails` (Q11) | **Confirmed** — template `inputDetails` = generic input slot definitions (reusable); instance `inputDetails` = resolved values for the specific run. Both freeform JSON |
| D-10 | UI surface for the plan | **New task-process-list entry**, separate from the `agentResponse` feed card |
| D-11 | Skill tag interactivity | **Regular users: tags only. Admins: tags as links to skill detail** |
| D-12 | Historical data migration | **None** — no backfill of past `agentResponse`/`llmResponse` into plan entities |
| D-13 | Relationship to Subagent Orchestration's "no DB fields" conclusion | **Narrowed/superseded for plan structure only** — that PRD's other conclusions (subagent output policy, mandatory validator, tool reuse) remain valid |

---

## 16. Open Questions

### 16.1 Resolved (product owner, 2026-07-27)

| # | Topic | Decision |
|---|---|---|
| **Q6** | Null `skillId` on plan items | **Option A** — executable; worker creates skill inline; plan item backfilled when skill is created (see D-4, D-14, §4.4) |
| **Q11** | Template vs. instance `inputDetails` | **Confirmed** — template holds generic slot definitions; instance holds resolved run values (see D-15, §3.3.2) |
| **Q14** | `agentResponse` vs. plan | **Separate artifacts** — `agentResponse` = post-work user result; plan linked via `taskPlanInstanceId`; not replacements (see D-9, §3.3.1, §9.5) |

### 16.2 Deferred to Architect

The following remain **open for architecture** before implementation begins:

| # | Question | Context |
|---|----------|---------|
| **OQ-1** | Equivalent-template matching strategy | `findEquivalent` (FR-TPT-7) needs a concrete algorithm — exact `shortName` match, embedding/semantic similarity, or normalized-description matching (similar to Task Skill Planning's OQ-5 goal normalization). Affects template reuse rate (§1.3 metric). |
| **OQ-2** | Instance-item execution invocation contract | Exact shape of the `use_agent` payload passed to an item's assigned agent (how much of `instance.inputDetails` is scoped per item vs. passed wholesale) — architectural detail of FR-EXE-5. |
| **OQ-3** | Interaction between task/comment-level retry (Pause/Resume/Retry PRD) and instance-level retry (this PRD) | If a whole comment turn is retried per Pause-Resume-Retry semantics, does the existing `taskPlanInstance` reset entirely (all items back to `pending`) or is a *new* instance created for a *new* `commentId` (since Pause/Resume/Retry operates on the task, and a new comment/turn may or may not be created)? Needs explicit reconciliation with Task Comment Conversation's "new comment → new progress document" rule. |
| **OQ-4** | Retry semantics for `pending` (never-started) items | Should `retryItem` on a `pending` item be a true no-op (no `retryCount` increment) or always increment for audit purposes? PRD currently assumes "always increment" (see Edge Cases) but this should be confirmed. |
| **OQ-5** | Concurrency/locking on `updateItemStatus` | If two same-order items complete near-simultaneously, is there a risk of a race in recomputing instance-level `status` (FR-TPI-7)? Needs an architectural decision (optimistic locking, single-writer orchestration loop, or DB-level atomic update). |
| **OQ-6** | `inputDetails`/`outputDetails` schema strictness | Should there be a lightweight shared JSON-schema convention across template/instance (e.g. `{ slots: [{ name, type, required }] }`) or remain fully freeform as stated in the approved model? Affects UI rendering quality (§9.2) and validation depth. |
| **OQ-7** | Task-level aggregated `skillIdsUsed` performance at scale | For tasks with very long comment threads, is a live cross-comment aggregation query (FR-TM-5) sufficient, or does it need caching/denormalization? Affects §7.1 performance target for large threads. |
| **OQ-8** | Backfill visibility to already-created instances of the same template | When a template item's `skillId` is backfilled (§4.4), should already-`done` instances created **before** the backfill be retroactively updated, or only the instance that triggered the backfill? PRD currently assumes **only the triggering instance is directly mutated**; other instances keep their own denormalized snapshot — confirm this is the intended audit behavior. |

---

*End of PRD — approved 2026-07-27; architecture review in progress.*
