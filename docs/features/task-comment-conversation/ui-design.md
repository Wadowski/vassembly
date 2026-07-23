# Task Comment Conversation — UI Design Specification

**Document status:** Design handoff for engineering and QA (revised)  
**Last updated:** 2026-07-23  
**Feature slug:** `task-comment-conversation`  
**Host route:** `/tasks/[id]` (`apps/web/app/tasks/[id]/page.tsx`)  
**Related:** [PRD](./prd.md) · [Architecture](./architecture.md) · [Task Detail Page](../task-detail-page/prd.md) · [Pause, Resume & Retry UI](../pause-resume-task/ui-design.md)

---

## 1. Design Rationale

Task detail uses **one unified activity list** (evolved from today’s execution progress tracker): **comments**, **agent responses**, **HITL Q&A**, and **agent progress events** in a **single feed**. **Newest items appear at the top.** Progress-style rows **expand/collapse inline** on click (no modal). Comments and responses are **visually emphasized** with line clamp + **Show more**. **Multiselect filters** at the top control which event groups are visible (default: all). **Execution statistics** (today’s `ProgressHeader` metrics) move to a **separate block below the list**. There is **no** standalone AI response component (`TaskDetailAiResponse`).

**Principles**

| Principle | Application |
|-----------|-------------|
| **One list** | Single feed for all activity types; remove `TaskDetailAiResponse`, `TaskQuestionsHistory`, standalone `ExecutionProgressTracker` section |
| **Recent first** | Sort all items by `occurredAt` **descending** (newest at top) |
| **Two interaction models** | Progress-like rows: toggle expand/collapse; comment/response: always visible summary + optional Show more for long text |
| **Filters** | Multiselect at top of list; default all groups selected |
| **Stats at bottom** | Token/duration/attempt metadata not above the list |
| **Composer below feed** | Multiline comment input under list + statistics |

---

## 2. Page Layout (top → bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ Utility header (back, pause/resume/retry, status badge)         │
├─────────────────────────────────────────────────────────────────┤
│ TaskQuestionForm (ONLY if pendingQuestions.length > 0)          │
├─────────────────────────────────────────────────────────────────┤
│ LinkedSpecializations · TaskDetailSkillsUsed                    │
├─────────────────────────────────────────────────────────────────┤
│ Description                                                     │
├─────────────────────────────────────────────────────────────────┤
│ TaskActivityFeed (NEW)                                          │
│   [ Activity filters — multiselect ]                            │
│   [ unified list — newest first ]                               │
├─────────────────────────────────────────────────────────────────┤
│ TaskExecutionStatistics (NEW — was ProgressHeader at top)       │
├─────────────────────────────────────────────────────────────────┤
│ TaskCommentComposer                                             │
├─────────────────────────────────────────────────────────────────┤
│ TaskDetailExecutionError                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Removed:** `TaskDetailAiResponse`, `TaskQuestionsHistory`, `ExecutionProgressTracker` as a page section, `ProgressDetailModal` usage on task detail.

---

## 3. Activity feed (`TaskActivityFeed`)

### 3.1 Section chrome

| Property | Value |
|----------|-------|
| **Heading** | `"Activity"` |
| **data-testid** | `task-activity-feed` |

### 3.2 Sort order

| Rule | Detail |
|------|--------|
| **Order** | `occurredAt` **descending** (most recent at top) |
| **Tie-breaker** | Stable `id` / `sortKey` descending |
| **Live updates** | New progress events insert at top of list while polling |

Server `activityTimeline` SHOULD return pre-sorted descending; client re-sorts after merge if needed.

### 3.3 Filter bar (multiselect)

Placed **directly under** the Activity heading, **above** the list.

| Property | Value |
|----------|-------|
| **Control** | Multiselect (`MultiSelect` or design-system equivalent) |
| **Label** | `"Show"` or `"Filter activity"` |
| **Default** | **All groups selected** (no filtering) |
| **Behavior** | Hide list items whose **filter group** is not in the current selection |
| **Empty selection** | Disallowed — if user clears all, revert to all selected OR show helper “Select at least one type” (prefer revert) |
| **data-testid** | `task-activity-filter` |

**Filter groups** (map 1:1 to timeline item kinds):

| Group key | Label (UI) | Includes |
|-----------|------------|----------|
| `comments` | Comments | User comment items (`userComment`) |
| `responses` | Agent responses | Agent markdown replies (`agentResponse`) |
| `questions` | Questions & answers | HITL answered items (`hitlAnswered`; includes Q + A in one row) |
| `agentStarted` | Agent started | Progress events with state `STARTED` / `started` |
| `agentFinished` | Agent finished | Progress events with state `COMPLETED` / `completed` |
| `agentFailed` | Agent failed | Progress events with state `FAILED` / `failed` |
| `agentWaiting` | Agent waiting | Progress events with state `WAITING` / `waiting` |

Architect may collapse `agentStarted` / `agentFinished` / etc. in API as `progressEvent.filterGroup`; UI labels stay as above.

Filtering is **client-side** on the loaded timeline (v1).

### 3.4 List item behaviors

#### A. Progress-style rows (`progressEvent`, legacy question-asked/answer if split)

| Interaction | Behavior |
|-------------|----------|
| **Click row** | Toggle **inline expand** to show detail (tokens, input/output snippets, error details — content currently in `ProgressDetailModal`) |
| **Click again** | **Collapse** |
| **No modal** | Remove `ProgressDetailModal` from task detail flow |
| **Selected state** | `aria-expanded={true|false}` on row button/header |
| **Visual** | Compact row when collapsed; chevron or caret indicates expand state |

Reuse/refactor `ProgressItem` from `@vassembly/ui-execution-progress-tracker`; replace modal wiring with local expanded state per `eventId`.

#### B. User comment (`userComment`)

| Property | Value |
|----------|-------|
| **Emphasis** | Stronger surface (card/border), label **"You"** |
| **Collapse** | **No** accordion collapse |
| **Long text** | CSS line-clamp **`ACTIVITY_TEXT_CLAMP_LINES` = 4** (constant); overflow ellipsis |
| **Show more** | `Button` `variant="text"` **"Show more"** expands to full text; toggles to **"Show less"** |
| **data-testid** | `activity-user-comment-{commentId}` |

#### C. Agent response (`agentResponse`)

| Property | Value |
|----------|-------|
| **Emphasis** | Same tier as user comment; label **"Agent"** |
| **Markdown** | `MarkdownContent` (inline in feed — **not** `TaskDetailAiResponse` component) |
| **Long text** | Same line-clamp + Show more as comments (clamp applies to plain preview or block container height — engineer: clamp rendered markdown block) |
| **data-testid** | `activity-agent-response-{commentId}` |

#### D. HITL answered (`hitlAnswered`)

| Property | Value |
|----------|-------|
| **Presentation** | Question + answer in one emphasized card (not split into separate asked/answered rows unless already in API as one item) |
| **Long text** | Line-clamp + Show more on answer (and question if needed) |
| **Filter group** | `questions` |
| **data-testid** | `activity-hitl-{questionId}` |

### 3.5 Unified content rule

The feed MUST include **all** of:

- User comments (`userText`)
- Agent responses (`agentResponse`)
- Answered HITL (per PRD `commentId` scope)
- All progress events for each comment turn

No separate history or AI response sections.

---

## 4. Execution statistics (`TaskExecutionStatistics`)

Extract from current `ProgressHeader` (`ui/execution-progress-tracker`).

| Property | Value |
|----------|-------|
| **Placement** | **Below** the activity list, **above** comment composer |
| **Content** | Execution attempt, started at, duration, total tokens, status label (same fields as today’s header) |
| **Scope** | v1: statistics for **active comment turn** while in progress; when idle, show aggregate for **latest comment** or last completed run (architect: prefer per-active-`commentId` progress doc) |
| **data-testid** | `task-execution-statistics` |

Do **not** render statistics above the list.

---

## 5. Comment composer (`TaskCommentComposer`)

Unchanged from prior spec: multiline + Submit below statistics block.

| `task.status` | Composer |
|---------------|----------|
| `in-progress` | Disabled + helper text |
| `paused` | Disabled |
| `done` / `failed` | Enabled |

---

## 6. Data & polling

| Concern | Behavior |
|---------|----------|
| **Timeline load** | GraphQL `activityTimeline` + pending questions |
| **Poll** | ~1s on active `commentId` progress; merge new events at **top** |
| **Filters** | Persist in component state only (no URL query v1) |
| **Expand state** | Per-item local state; collapsed on first paint |

---

## 7. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| List | `ul` / `li` or `role="list"` |
| Expandable progress rows | `button` with `aria-expanded` |
| Show more | `aria-expanded` on comment/response blocks |
| Filters | Multiselect with accessible name; announce count of visible items optionally |

---

## 8. Engineering checklist

- [ ] `TaskActivityFeed` + `TaskActivityFilter` + `TaskExecutionStatistics` under `apps/web/.../_components/`
- [ ] Refactor `ui-execution-progress-tracker`: inline expand, remove modal from task detail; export row + statistics panel
- [ ] Delete usage of `TaskDetailAiResponse` (do not repurpose as section)
- [ ] Sort descending in `mergeTimelineItems` / activity mapper
- [ ] E2E: filters, expand/collapse, show more, stats below list

---

## 9. Out of scope (UI)

- Server-side filter query params
- Edit/delete comments
- List/home thread preview
