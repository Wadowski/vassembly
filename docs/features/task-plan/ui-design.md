# Persisted Task Plans — UI Design Specification

**Document status:** Design handoff for engineering and QA  
**Last updated:** 2026-07-27  
**Feature slug:** `task-plan`  
**Host route:** `/tasks/[id]` (`apps/web/app/tasks/[id]/page.tsx`)  
**Related:** [PRD](./prd.md) · [Task Comment Conversation](../task-comment-conversation/ui-design.md) · [Task Detail Page](../task-detail-page/design.md) · [Specialization](../specialization/design.md) · `.cursor/rules/design.md`  
**Creative direction:** The Synthetic Luminal — tonal surfaces, no divider lines, Space Grotesk display + Inter body

---

## 1. Design Rationale

### Problem

Task execution plans today are ephemeral prose buried in agent output. Users cannot distinguish **what was planned** from **what was delivered**, and skill usage is attributed to the whole task rather than the specific comment turn that used them.

### Approach

Introduce a **distinct Plan feed item** per comment that has a persisted `taskPlanInstance`, rendered in the unified activity list alongside (not inside) the `agentResponse` card. Skill tags move to **comment scope** with a **task-level aggregation** that mirrors the existing specializations chip pattern.

**Principles**

| Principle | Application |
|-----------|-------------|
| **Separate artifacts** | Plan card ≠ agent response card; never merge or duplicate plan prose into `agentResponse` |
| **Progress-row interaction** | Plan uses inline expand/collapse like `ActivityProgressEventRow` — not the emphasized comment/response card pattern |
| **Pattern reuse** | Skill tags reuse `TaskDetailSkillsUsed` / `LinkedSpecializations` admin-link behavior; parallel groups reuse execution-progress visual language |
| **View-only** | No edit, reorder, retry, or template CRUD affordances in the UI |
| **Comment-scoped attribution** | Skills shown on the comment/plan that used them; task header shows deduplicated union |
| **Synthetic Luminal** | Tonal `surface-container` card for expanded plan body; status via semantic color on text/icons only — max one accent (primary blue) per feed region |

### Key UX decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D-UX-1 | Plan is a **new activity timeline kind** (`plan`), not a progress event | Plan exists at planning time with its own lifecycle; distinct from per-agent progress rows |
| D-UX-2 | Plan sorts by `occurredAt` with other feed items (newest first) | Consistent with [Task Comment Conversation](../task-comment-conversation/ui-design.md) §3.2 |
| D-UX-3 | Collapsed plan shows `shortName` + instance status summary + comment skill tags | Scannable audit row; skills reinforce which procedures this turn used |
| D-UX-4 | Expanded plan groups items by `order` with parallel items side-by-side on tablet+ | Mirrors orchestration semantics (§4.1 PRD) without a diagram library |
| D-UX-5 | **Remove** task-stored `skillIdsUsed` from page wiring; keep `TaskDetailSkillsUsed` fed by **computed** `task.skillIdsUsed` | Same component, new data source — matches specializations aggregation pattern |
| D-UX-6 | Per-comment skill tags on **user comment**, **plan**, and **agent response** cards | Skills attributable to the turn; agent response inherits parent comment's `skillIdsUsed` |
| D-UX-7 | Admin skill links → `/specialization/{specializationId}/skills/{skillId}` | Same route as existing `TaskDetailSkillsUsed` |
| D-UX-8 | New filter group **Plans** in activity multiselect (default: selected) | Users can hide plan rows without losing comments/responses |
| D-UX-9 | `inputDetails` / `output` JSON rendered as escaped `<pre>` blocks in expanded view only | Security (FR §7.4); avoid raw HTML; progressive disclosure |
| D-UX-10 | Null `skillId` on an item shows **"No skill"** caption — not an error | Item is valid and executable per PRD §4.4 |

---

## 2. Page Layout (top → bottom)

Updated task detail information architecture. **Bold** = changed by this feature.

```
┌─────────────────────────────────────────────────────────────────┐
│ Utility header (back, pause/resume/retry, status badge)         │
├─────────────────────────────────────────────────────────────────┤
│ TaskQuestionForm (ONLY if pendingQuestions.length > 0)            │
├─────────────────────────────────────────────────────────────────┤
│ LinkedSpecializations (unchanged)                                 │
│ **TaskDetailSkillsUsed** ← computed task.skillIdsUsed (not stored)│
├─────────────────────────────────────────────────────────────────┤
│ Description                                                     │
├─────────────────────────────────────────────────────────────────┤
│ TaskCommentComposer                                             │
├─────────────────────────────────────────────────────────────────┤
│ TaskActivityFeed                                                  │
│   [ Activity filters — multiselect + **Plans** group ]          │
│   [ unified list — includes **Plan** rows per comment ]         │
├─────────────────────────────────────────────────────────────────┤
│ TaskExecutionStatistics                                         │
├─────────────────────────────────────────────────────────────────┤
│ TaskDetailExecutionError                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Removed / deprecated**

| Element | Action |
|---------|--------|
| `view.task.skillIdsUsed` (stored field) | Stop reading in `page.tsx`; use computed GraphQL field |
| Plan text inside `agentResponse` | Never render; backend change per PRD FR-TP-2 |
| Task-level skill tags sourced from `update_task` | Deprecate UI dependency on stored task field |

---

## 3. Activity Feed — Plan Item Type

### 3.1 Timeline integration

| Property | Value |
|----------|-------|
| **Kind** | `plan` |
| **Filter group** | `plans` |
| **Filter label** | `Plans` |
| **Presence** | One row per comment where `taskComment.taskPlanInstanceId != null` |
| **Sort key** | `occurredAt` = plan instance `createdAt` (planning time); tie-breaker: `sortKey` / `id` descending |
| **Polling** | Re-fetch timeline on existing ~3s poll while task is active; plan status/items update in place |
| **Position vs agent response** | Plan typically appears **above** agent response for the same comment (created earlier) |

**Feed ordering example** (newest at top):

```
1. Agent response      (comment C, completed)
2. Plan                (comment C, done)
3. Progress: Validator (comment C)
4. User comment        (comment C)
5. Agent response      (comment B)
6. Plan                (comment B, failed)
...
```

Question-intent comments: **no Plan row** (`taskPlanInstanceId` is null).

### 3.2 Filter bar addition

Extend `TaskActivityFilter` groups:

| Group key | Label (UI) | Includes |
|-----------|------------|----------|
| `plans` | Plans | `kind === 'plan'` |

Default: **all groups selected** (including `plans`). Empty selection still reverts to all selected per existing convention.

---

## 4. Plan Card (`ActivityPlanRow`)

### 4.1 Visual tier

Plan rows sit between **emphasized cards** (comments/responses) and **compact progress rows**:

| Aspect | Plan row | Progress row | Emphasized card |
|--------|----------|--------------|-----------------|
| Surface | `surface-container-low` when expanded | Transparent | `surface-container-high` card |
| Label | **"Plan"** overline + `shortName` | Agent name | "You" / "Agent" |
| Interaction | Expand/collapse entire card | Expand/collapse | Show more (text only) |
| Skill tags | Yes (collapsed + expanded header) | No | User comment only today → extend |

### 4.2 Collapsed state (default)

```
┌──────────────────────────────────────────────────────────────────┐
│  PLAN                                                            │  ← label-sm, primary, tracked
│  contract-risk-review · In progress — step 2 of 3        [▼]    │  ← button header
│  [contract-review] [clause-extraction]                           │  ← SkillTagList (comment skills)
└──────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| **Container** | `<li>` in activity list; `data-testid="activity-plan-{commentId}"` |
| **Header control** | Full-width `<button type="button">` with `aria-expanded={false\|true}` |
| **Overline** | `Text variant="label-sm"` → `PLAN` (`$color-primary`, uppercase, tracked) |
| **Primary line** | `shortName` (`Text variant="body2"`, `$font-weight-medium`) · status summary |
| **Status summary** | Human-readable instance status — see §4.5 |
| **Chevron** | `ChevronDownIcon` / `ChevronUpIcon`, `aria-hidden`, rotates on expand — 300ms transition |
| **Skill tags** | `CommentSkillTags` below header (§6); hidden when `skillIdsUsed` empty |
| **Chevron position** | End-aligned in header row on desktop; below tags on very narrow if wrap needed |

**Collapsed header copy template**

```
{template.shortName} · {statusSummary}
```

### 4.3 Expanded state

```
┌──────────────────────────────────────────────────────────────────┐
│  PLAN                                                            │
│  contract-risk-review · Failed at step 1                  [▲]    │
│  [contract-review] [clause-extraction]                           │
├──────────────────────────────────────────────────────────────────┤
│  contract-risk-review                                            │  ← template shortName (body1 medium)
│  Review uploaded contracts for risky clauses and summarize…      │  ← template.description (body2)
│                                                                  │
│  ── Step 1 (parallel) ─────────────────────────────────────────  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ ✓ Legal researcher      │  │ ✗ Legal worker          │       │
│  │ Skill: contract-review  │  │ Skill: No skill         │       │
│  │ Extract key clauses…    │  │ Draft risk summary…     │       │
│  │                         │  │ ⚠ Connection timeout…   │       │
│  │                         │  │ Retried once            │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                  │
│  ── Step 2 ────────────────────────────────────────────────────  │
│  ┌─────────────────────────┐                                     │
│  │ ○ Legal validator       │  ← pending (never started)          │
│  │ Skill: clause-extraction│                                     │
│  │ Validate findings…      │                                     │
│  └─────────────────────────┘                                     │
│                                                                  │
│  ▸ Resolved inputs (optional)                                    │  ← <details> JSON block
│  ▸ Expected outputs (optional)                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Order groups (`ActivityPlanOrderGroup`)

Items with the same `order` value render in one group.

| Element | Spec |
|---------|------|
| **Group label** | `Text variant="label"` → `Step {order}` + `(parallel)` suffix when group has >1 item |
| **Layout — tablet+** | CSS grid: `repeat(auto-fit, minmax(14rem, 1fr))`, `gap: $spacing-3` |
| **Layout — mobile** | Single column stack |
| **Group spacing** | `$spacing-4` between order groups; no divider lines — use label + gap only |
| **Connector (optional)** | 2px left ghost border on group (`outline-variant` 15% opacity) — matches progress detail panel |

### 4.5 Plan instance status summary (collapsed header)

| Instance `status` | Summary string | Notes |
|-------------------|----------------|-------|
| `pending` | `Pending` | No items started |
| `in-progress` | `In progress — step {current} of {total}` | `current` = highest `order` with any non-pending item; `total` = distinct order count |
| `done` | `Completed` | Optional: append relative `completedAt` in caption on expanded header only |
| `failed` | `Failed at step {n}` | `n` = lowest `order` containing a `failed` item |

### 4.6 Plan item row (`ActivityPlanItemRow`)

One row per `TaskPlanInstanceItem`.

| Field | Display | Notes |
|-------|---------|-------|
| **Status icon** | See §4.7 | Leading; `aria-hidden` with text status adjacent |
| **Agent** | `agentName` | `Text variant="body2"`, `$font-weight-medium` |
| **Skill** | `Skill: {skillName}` or `Skill: No skill` | `caption` secondary; if `skillId` backfilled during run, show resolved name |
| **Description** | Template/item `description` | `body2`, full text, `white-space: pre-wrap` |
| **Item status** | Text label beside icon | `Pending` / `In progress` / `Done` / `Failed` |
| **Error** | `errorMessage` when `status === 'failed'` | `caption`, `$color-error`, below description |
| **Retry** | `Retried once` / `Retried {n} times` | Only when `retryCount > 0`; `caption`, `$color-text-secondary` |
| **Timestamps** | `startedAt` / `completedAt` | Optional `caption` in expanded row only — relative time |

**Item card surface:** `background: $color-surface-container-low`, `padding: $spacing-3`, `border-radius: $border-radius-md`. No 1px border (tonal only).

### 4.7 Per-item status visuals

| Item `status` | Icon | Color token | Label |
|---------------|------|-------------|-------|
| `pending` | `TimeClockCircleIcon` | `$color-text-secondary` | Pending |
| `in-progress` | `SingleNeutralCircleIcon` | `$color-primary` | In progress |
| `done` | `CheckCircleIcon` | `$color-success` | Done |
| `failed` | `AlertCircleIcon` | `$color-error` | Failed |

Icons 16×16, decorative (`aria-hidden="true"`). Visible text label always present.

### 4.8 Optional detail sections (expanded plan footer)

Collapsible `<details>` blocks — collapsed by default.

| Section | Source | Rendering |
|---------|--------|-----------|
| **Resolved inputs** | `instance.inputDetails` | `JSON.stringify` → `<pre class="code">`, escaped, monospace |
| **Expected outputs** | `template.outputDetails` | Same as above |
| **Plan description** | `template.description` | Always visible above steps (not in `<details>`) |

Max height on `<pre>`: `20rem` with `overflow: auto`. Do not render values as HTML.

### 4.9 Live update behavior

| Event | UI behavior |
|-------|-------------|
| Item → `in-progress` | Status icon + summary line update without collapsing |
| Item → `failed` | Error message appears inline; instance summary → "Failed at step N" |
| Item retry | `retryCount` label updates; error clears when item returns to `pending` |
| Instance → `done` | Summary → "Completed"; all item icons green |
| Poll merge | Preserve local `isExpanded` state per `commentId` |

---

## 5. Agent Response Card — Skill Tags Addition

Extend `ActivityAgentResponse` to show `CommentSkillTags` for the parent comment's `skillIdsUsed` (same row as plan). Placement: below stats line, above markdown body.

**Rationale:** User sees which skills contributed to the delivered outcome, not only the plan structure.

`ActivityUserComment` receives the same `CommentSkillTags` treatment (replaces any future per-task skill display on comments).

---

## 6. Skill Tags (`CommentSkillTags` / task aggregation)

### 6.1 Shared component

Extract from `TaskDetailSkillsUsed` into a reusable app component:

```
apps/web/app/_components/CommentSkillTags/
  CommentSkillTags.tsx
  CommentSkillTags.module.scss
  types.ts
  index.ts
```

| Prop | Type | Notes |
|------|------|-------|
| `skillIds` | `string[]` | From `taskComment.skillIdsUsed` |
| `isAdmin` | `boolean` | Controls link vs static tag |
| `size` | `'small'` | Default; matches existing `Tag size="small"` |
| `className` | `string?` | Optional layout hook |

**Behavior** (unchanged from current `TaskDetailSkillsUsed`):

| Role | Rendering |
|------|-----------|
| **Regular user** | `Tag` in `<span>` — non-interactive |
| **Admin** | `Tag` wrapped in `Link` → `/specialization/{specializationId}/skills/{skillId}` |
| **Admin `aria-label`** | `View skill: {skillName}` |
| **Empty** | Render nothing (no section) |
| **Loading** | Render nothing until skills resolve (avoid flicker) |

### 6.2 Task-level aggregation (`TaskDetailSkillsUsed`)

| Property | Value |
|----------|-------|
| **Data** | GraphQL computed `task.skillIdsUsed` (union of all comments, deduplicated) |
| **Placement** | Unchanged — below `LinkedSpecializations`, above Description |
| **Heading** | `Skills used` (`h2`, secondary) — unchanged |
| **Visual** | Identical chip row to specializations area |
| **Implementation** | Refactor view to use `CommentSkillTags` internally |

### 6.3 Per-comment placement

| Surface | `skillIds` source |
|---------|-------------------|
| `ActivityUserComment` | `taskComment.skillIdsUsed` |
| `ActivityPlanRow` | Same comment's `skillIdsUsed` |
| `ActivityAgentResponse` | Same comment's `skillIdsUsed` |

---

## 7. Admin vs Regular User Variants

| Surface | Regular user | Admin |
|---------|--------------|-------|
| Plan card | Full read-only expand/collapse | Same |
| Skill tags (all levels) | Static `Tag` chips | `Tag` as link to skill detail |
| Template/instance IDs | Not shown | Not shown in v1 (no debug mode) |
| Agent names on plan items | Visible | Visible |
| `inputDetails` JSON | Visible when expanded | Same |

No additional admin-only plan management UI (FR-UI-7).

---

## 8. Component Inventory

### 8.1 New components (apps/web)

| Component | Responsibility |
|-----------|----------------|
| `CommentSkillTags` | Shared skill chip row with admin link variant |
| `ActivityPlanRow` | Plan feed item: header, expand/collapse, orchestrates groups |
| `ActivityPlanOrderGroup` | Single `order` group with parallel grid |
| `ActivityPlanItemRow` | Single plan item: status, agent, skill, description, error, retry |
| `useActivityPlanRow` | Derive status summary, group items by order, expand state |
| `getPlanStatusSummary` | Pure helper for collapsed header copy |
| `getPlanItemStatusDisplay` | Icon + label + color for item status |

### 8.2 Modified components

| Component | Change |
|-----------|--------|
| `TaskActivityFeedItem` | Route `kind === 'plan'` → `ActivityPlanRow` |
| `TaskActivityFilter` | Add `plans` filter option |
| `useTaskActivityFeed` | Include `plans` in `ALL_FILTER_GROUPS` |
| `ActivityAgentResponse` | Add `skillIds` prop + `CommentSkillTags` |
| `ActivityUserComment` | Swap inline skills to `CommentSkillTags` with `skillIdsUsed` |
| `TaskDetailSkillsUsed` | Use computed `task.skillIdsUsed`; delegate tags to `CommentSkillTags` |
| `page.tsx` | Remove stored `skillIdsUsed` assumption; pass computed field |

### 8.3 API / hooks (ui-api-hooks)

| Change | Detail |
|--------|--------|
| `TaskActivityItemDto` | Add `kind: 'plan'`, plan payload fields, `filterGroup: 'plans'` |
| `TaskActivityFilterGroup` | Add `'plans'` |
| Timeline mapper | Emit plan items from `taskComment.plan` + `taskPlanInstanceId` |
| Task detail query | `skillIdsUsed` on comment; computed on task; nested `plan { template, instance }` |

### 8.4 Suggested file structure

```
apps/web/app/
  _components/
    CommentSkillTags/
      CommentSkillTags.tsx
      CommentSkillTags.module.scss
      types.ts
      index.ts
  tasks/[id]/_components/
    TaskActivityFeed/
      activityPlanRow/
        ActivityPlanRow.tsx
        ActivityPlanRow.module.scss
        useActivityPlanRow.ts
        types.ts
        index.ts
        ActivityPlanOrderGroup/
          ActivityPlanOrderGroup.tsx
          ActivityPlanOrderGroup.module.scss
          index.ts
        ActivityPlanItemRow/
          ActivityPlanItemRow.tsx
          ActivityPlanItemRow.module.scss
          index.ts
        getPlanStatusSummary.ts
        getPlanItemStatusDisplay.ts
    TaskDetailSkillsUsed/
      TaskDetailSkillsUsed.tsx          # thin wrapper → CommentSkillTags
```

### 8.5 Design system components reused

| Package | Components |
|---------|------------|
| `@vassembly/ui-system-design/text` | `Text` variants `label-sm`, `label`, `body2`, `caption` |
| `@vassembly/ui-system-design/tag` | Skill chips |
| `@vassembly/ui-system-design/icons` | Status icons, chevrons |
| `@vassembly/ui-api-hooks` | `useLinkedSkills`, timeline + task queries |

---

## 9. States & Edge Cases

| State | UI |
|-------|-----|
| **Loading timeline** | No plan-specific skeleton; whole feed uses existing load behavior |
| **Plan pending, no items started** | Summary: "Pending"; all items show Pending icon |
| **Parallel group partial failure** | Failed item shows error; sibling done items show success; later steps stay Pending |
| **Plan failed, items never started** | Pending items remain hollow clock — not marked failed |
| **retryCount > 0** | "Retried once" / "Retried N times" on that item only |
| **skillId null** | "Skill: No skill" — not a warning |
| **Archived skill (admin link)** | Tag still renders; skill detail page shows archived state |
| **Missing plan on comment** | No row — do not placeholder |
| **Question intent** | No plan row |
| **Long errorMessage** | Wrap in item card; no truncation |
| **Empty skillIdsUsed** | Omit tag row entirely |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Mobile** (`< 768px`) | Plan item groups stack single column; header text wraps; tags wrap below title |
| **Tablet+** (`≥ 768px`) | Parallel items in grid `minmax(14rem, 1fr)`; chevron stays end-aligned |
| **Touch** | Header button min-height 44px via padding |
| **Content column** | Inherits `max-width: 42rem` from task detail |

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Plan row expand | `<button aria-expanded>` on header; visible focus ring |
| Heading | Overline "PLAN" + `shortName` in button `aria-label`: `Plan: {shortName}, {statusSummary}` |
| Status | Icon + text label — not color alone |
| Skill admin links | `aria-label="View skill: {name}"` |
| Live updates | Parent list `aria-live="polite"` (existing feed) |
| JSON blocks | `<pre>` in `<details>` with `<summary>` "Resolved inputs" |
| List semantics | Plan row is `<li>` inside feed `<ul role="list">` |
| Reduced motion | Chevron rotation instant when `prefers-reduced-motion` |

---

## 12. Copy & Strings

| Key | String |
|-----|--------|
| `plan.overline` | `PLAN` |
| `plan.filterLabel` | `Plans` |
| `plan.status.pending` | `Pending` |
| `plan.status.inProgress` | `In progress — step {current} of {total}` |
| `plan.status.done` | `Completed` |
| `plan.status.failed` | `Failed at step {order}` |
| `plan.step.label` | `Step {order}` |
| `plan.step.parallel` | `(parallel)` |
| `plan.item.skill` | `Skill: {name}` |
| `plan.item.noSkill` | `Skill: No skill` |
| `plan.item.retriedOnce` | `Retried once` |
| `plan.item.retriedCount` | `Retried {count} times` |
| `plan.item.status.pending` | `Pending` |
| `plan.item.status.inProgress` | `In progress` |
| `plan.item.status.done` | `Done` |
| `plan.item.status.failed` | `Failed` |
| `plan.details.inputs` | `Resolved inputs` |
| `plan.details.outputs` | `Expected outputs` |
| `task.skills.title` | `Skills used` |
| `skill.linkAriaLabel` | `View skill: {name}` |

---

## 13. Wireframes

### 13.1 Task header — aggregated skills (desktop)

```
  SPECIALIZATIONS          (existing — LinkedSpecializations, no heading)
  [Legal] [Finance]

  Skills used
  [contract-review] [clause-extraction] [nda-summary]
       ↑ regular user: plain tags
       ↑ admin: each tag links to skill detail
```

### 13.2 Activity feed — collapsed plan + agent response (same comment)

```
  ACTIVITY                                    [Filter ▼]

  ┌─ Agent ─────────────────────────────────────────────┐
  │ 12.4s · 8,240 tokens                              │
  │ [contract-review] [clause-extraction]             │
  │ The NDA contains three high-risk clauses…           │
  │ (markdown body)                         [Show more]│
  └───────────────────────────────────────────────────┘

  ┌─ PLAN ────────────────────────────────────────────┐
  │ contract-risk-review · Completed            [▼]   │
  │ [contract-review] [clause-extraction]             │
  └───────────────────────────────────────────────────┘

  ○ Validator · Completed · 2m ago
  ○ Task worker · Completed · 5m ago

  ┌─ You ─────────────────────────────────────────────┐
  │ [Legal]                                           │
  │ Review this NDA for risky clauses                 │
  └───────────────────────────────────────────────────┘
```

### 13.3 Expanded plan — parallel failure (tablet)

```
  ┌─ PLAN ────────────────────────────────────────────┐
  │ contract-risk-review · Failed at step 1     [▲] │
  │ [contract-review]                                 │
  ├───────────────────────────────────────────────────┤
  │ contract-risk-review                              │
  │ Review uploaded contracts for risky clauses.      │
  │                                                   │
  │ Step 1 (parallel)                                 │
  │ ┌──────────────────┐  ┌──────────────────┐       │
  │ │ ✓ Legal researcher│  │ ✗ Legal worker   │       │
  │ │ Skill: contract-… │  │ Skill: No skill  │       │
  │ │ Extract clauses…  │  │ Summarize risks… │       │
  │ │ Done              │  │ Connection timed │       │
  │ │                   │  │ out after 30s    │       │
  │ │                   │  │ Retried once     │       │
  │ └──────────────────┘  └──────────────────┘       │
  │                                                   │
  │ Step 2                                            │
  │ ┌──────────────────┐                               │
  │ │ ○ Legal validator│                               │
  │ │ Skill: clause-… │                               │
  │ │ Validate…       │                               │
  │ │ Pending         │                               │
  │ └──────────────────┘                               │
  └───────────────────────────────────────────────────┘
```

### 13.4 Mobile — parallel items stacked

```
  PLAN
  contract-risk-review · In progress — step 1 of 2 [▼]
  [contract-review]

  (expanded)
  Step 1 (parallel)
  ┌─────────────────────┐
  │ ◷ Legal researcher  │
  │ Skill: contract-…   │
  │ Extract clauses…    │
  │ In progress         │
  └─────────────────────┘
  ┌─────────────────────┐
  │ ◷ Legal worker      │
  │ …                   │
  └─────────────────────┘
```

---

## 14. Developer Handoff

### 14.1 Implementation order

1. GraphQL: `taskComment.plan`, `skillIdsUsed`, computed `task.skillIdsUsed`; timeline `plan` items
2. `CommentSkillTags` extract + refactor `TaskDetailSkillsUsed`
3. `ActivityPlanRow` + subcomponents (static fixture first)
4. Wire `TaskActivityFeedItem` + filter group `plans`
5. Add `CommentSkillTags` to user comment + agent response cards
6. Remove stored `task.skillIdsUsed` from page/hooks
7. E2E: UI-1 through UI-5 Gherkin scenarios

### 14.2 Do / Don't

| Do | Don't |
|----|-------|
| Keep plan and agent response as separate `<li>` items | Embed plan markdown in `ActivityAgentResponse` |
| Group items by `order` with parallel grid | Render flat numbered list ignoring parallelism |
| Use computed task skills for header aggregation | Read/write stored `task.skillIdsUsed` |
| Escape JSON in `<pre>` | `dangerouslySetInnerHTML` on plan fields |
| Reuse progress-row expand pattern | Modal or emphasized card for full plan |
| Show retry count on items | Expose validator retry action in UI |

### 14.3 `data-testid` suggestions

| Element | id |
|---------|-----|
| Plan row | `activity-plan-{commentId}` |
| Plan header button | `activity-plan-toggle-{commentId}` |
| Plan expanded body | `activity-plan-details-{commentId}` |
| Order group | `activity-plan-step-{commentId}-{order}` |
| Plan item | `activity-plan-item-{commentId}-{templateItemIndex}` |
| Item error | `activity-plan-item-error-{commentId}-{templateItemIndex}` |
| Comment skill tags | `activity-comment-skills-{commentId}` |
| Task aggregated skills | `task-detail-skills-used` |

### 14.4 QA checklist

- [ ] Plan row appears for comments with `taskPlanInstanceId`; absent for question intent
- [ ] Plan and agent response are separate cards for the same comment
- [ ] `agentResponse` contains no plan structure text
- [ ] Collapsed plan shows shortName, status summary, skill tags
- [ ] Expanded plan groups parallel items; failed item shows error + retry count
- [ ] Pending items after failure stay Pending (not Failed)
- [ ] Task-level skills = deduplicated union across comments
- [ ] Per-comment skill tags on user comment, plan, and agent response
- [ ] Regular user: non-clickable skill tags
- [ ] Admin: skill tags link to skill detail
- [ ] Plans filter toggles plan rows only
- [ ] Keyboard: expand/collapse plan via header button
- [ ] Mobile: parallel items stack; touch targets ≥ 44px

---

## 15. Out of Scope (UI)

| Item | Notes |
|------|-------|
| Template library / browse UI | No catalog screen |
| Plan edit, reorder, manual retry | View-only |
| Template/instance admin CRUD | System agents only |
| Historical migration UI | Forward-only comments |
| Plan step progress bar / Gantt | Order groups sufficient for v1 |
| Real-time WebSocket | Polling via existing feed refresh |

---

*End of design specification — ready for architecture alignment and implementation.*
