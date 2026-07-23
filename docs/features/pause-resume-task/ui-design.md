# Pause, Resume & Retry Task — UI Design Specification

**Document status:** Design handoff for engineering and QA  
**Last updated:** 2026-06-16  
**Feature slug:** `pause-resume-task`  
**Host route:** `/tasks/[id]` (`apps/web/app/tasks/[id]/page.tsx`)  
**Related:** `docs/features/pause-resume-task/prd.md` · `docs/features/task-detail-page/design.md` · `.cursor/rules/design.md`  
**Creative direction:** The Synthetic Luminal — tonal surfaces, Space Grotesk display + Inter body, restrained accent usage

---

## 1. Design Rationale

Users need lightweight control over long-running LLM tasks without leaving the Task Detail Page. Pause, resume, and retry are **header-level utility actions** — always visible in context with the status badge, never buried in the page body. The design extends the existing utility header row rather than introducing a new toolbar or modal pattern.

**Principles**

| Principle | Application |
|-----------|-------------|
| **State-driven visibility** | Only show actions valid for the current `task.status`; never render disabled hidden-state buttons |
| **Continuity with TaskList** | `paused` badge reuses the same `taskStatusDisplay` mapping as list cards |
| **Action hierarchy** | Resume is the primary positive action when paused; retry is secondary beside it; pause is a cautious secondary action when running |
| **No new packages** | `@vassembly/ui-system-design/button`, `@vassembly/ui-system-design/text`, `@vassembly/ui-system-design/icons` only |
| **Calm when idle** | Status badge update is the primary feedback; snackbars are optional per PRD §8.6 |

**Glass secondary mapping**

The `Button` component exposes `contained` \| `outlined` \| `text` variants — there is no `glass` variant. Across agent and settings pages, **secondary/glass intent is expressed as `variant="outlined"` + `color="secondary"`** (transparent fill, subtle border, hover wash). This spec uses that combination wherever "glass secondary" is specified.

---

## 2. Utility Header Row Layout

### 2.1 Wireframe (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [← Back to tasks]              [ Pause ] [ Resume ] [ Retry ]  [ Paused ● ] │
│   (text, primary)               └──── action group ────┘       status badge  │
└──────────────────────────────────────────────────────────────────────────────┘
│  H1: {task.title} or "Task details"                                          │
```

### 2.2 Component arrangement

| Zone | Position | Contents |
|------|----------|----------|
| **Left** | `justify-content: space-between` start | Existing back `Button` — unchanged (`variant="text"`, `color="primary"`, `ArrowLeftIcon`) |
| **Right cluster** | End-aligned flex row | `[headerActionButtons]` → `[TaskStatusBadge]` |

**Right cluster structure**

```html
<div class="utilityHeaderEnd">
  <div class="headerActionButtons" role="group" aria-label="Task actions">
    <!-- 0–2 Button children, conditionally rendered -->
  </div>
  <TaskStatusBadge status={task.status} />
</div>
```

- Action buttons render **immediately left of** the status badge (PRD §8.1).
- Button order within the group is always: **Pause → Resume → Retry** (left to right). Hidden buttons are not rendered — order among visible buttons is preserved.
- Maximum **2 buttons** visible at once per the visibility matrix.

### 2.3 Visibility matrix (non-negotiable)

| `task.status` | Pause | Resume | Retry | Visible count |
|---------------|-------|--------|-------|---------------|
| `created` | — | — | — | 0 |
| `in-progress` | ✓ | — | — | 1 |
| `paused` | — | ✓ | ✓ | 2 |
| `failed` | — | — | ✓ | 1 |
| `done` | — | — | — | 0 |

### 2.4 SCSS additions (`TaskDetailPage.module.scss`)

```scss
.utilityHeaderEnd {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: $spacing-3;
  margin-left: auto;
}

.headerActionButtons {
  display: inline-flex;
  align-items: center;
  gap: $spacing-2;
}
```

The existing `.utilityHeader` already uses `display: flex`, `justify-content: space-between`, `align-items: center`, `flex-wrap: wrap`, `gap: $spacing-2`. The new `.utilityHeaderEnd` wrapper groups actions + badge so they stay together when the row wraps.

---

## 3. Button Specifications

All action buttons use `size="small"` to keep the utility row compact relative to the H1 below. All include **visible text labels** (not icon-only). Icon position: `left` (default).

**Global loading rule (PRD FR-U6):** When any pause/resume/retry request is in flight, the clicked button shows `isLoading={true}` and **all visible action buttons** receive `isDisabled={true}`.

### 3.1 Pause

| Property | Value |
|----------|-------|
| **Shown when** | `task.status === 'in-progress'` |
| **Hidden when** | All other statuses |
| **Icon** | `ButtonPauseIcon` |
| **Icon rationale** | PRD-mandated; paired media-control metaphor with play/resume; two vertical bars in circle reads unambiguously as "pause execution" |
| **Label** | `"Pause"` |
| **Variant** | `outlined` |
| **Color** | `secondary` |
| **Visual intent** | Glass secondary — low-emphasis control; pausing is reversible but should not compete with primary CTAs |
| **aria-label** | `"Pause task"` |
| **Loading** | `isLoading` + `isDisabled`; `aria-busy="true"` |
| **data-testid** | `task-pause-button` |

```tsx
<Button
  variant="outlined"
  color="secondary"
  size="small"
  icon={ButtonPauseIcon}
  text="Pause"
  aria-label="Pause task"
  aria-busy={isPausing}
  data-testid="task-pause-button"
  isLoading={isPausing}
  isDisabled={isAnyActionLoading}
  onClick={onPause}
/>
```

### 3.2 Resume

| Property | Value |
|----------|-------|
| **Shown when** | `task.status === 'paused'` |
| **Hidden when** | All other statuses |
| **Icon** | `ButtonPlayIcon` |
| **Icon rationale** | Part of the same media-control icon family as `ButtonPauseIcon` and `ButtonStopIcon`; triangle-in-circle is the universal "continue/play" affordance; preferred over `ButtonFastForwardIcon` (implies skip) and `ArrowRightIcon` (implies navigation) |
| **Label** | `"Resume"` |
| **Variant** | `contained` |
| **Color** | `primary` |
| **Visual intent** | Primary positive action — resuming is the expected path when paused |
| **aria-label** | `"Resume task"` |
| **Loading** | `isLoading` + `isDisabled`; `aria-busy="true"` |
| **data-testid** | `task-resume-button` |

```tsx
<Button
  variant="contained"
  color="primary"
  size="small"
  icon={ButtonPlayIcon}
  text="Resume"
  aria-label="Resume task"
  aria-busy={isResuming}
  data-testid="task-resume-button"
  isLoading={isResuming}
  isDisabled={isAnyActionLoading}
  onClick={onResume}
/>
```

### 3.3 Retry

| Property | Value |
|----------|-------|
| **Shown when** | `task.status === 'paused'` **or** `task.status === 'failed'` |
| **Hidden when** | `created`, `in-progress`, `done` |
| **Icon** | `ButtonLoopArrowIcon` |
| **Icon rationale** | Circular arrow loop is the standard "restart/retry" metaphor; preferred over `SynchronizeArrowsIcon` (reads as sync/refresh between sources) and `RedoIcon` (reads as undo-stack redo) |
| **Label** | `"Retry"` |
| **Variant / color** | **Context-dependent** (see below) |
| **aria-label** | `"Retry task"` |
| **Loading** | `isLoading` + `isDisabled`; `aria-busy="true"` |
| **data-testid** | `task-retry-button` |

**Variant by context**

| Context | Variant | Color | Rationale |
|---------|---------|-------|-----------|
| Paused (alongside Resume) | `outlined` | `secondary` | Secondary to Resume; restart-from-scratch is destructive relative to checkpoint resume |
| Failed (sole action) | `contained` | `primary` | Only header action available; elevated to primary so the recovery path is obvious |

```tsx
const isFailedOnly = task.status === 'failed';

<Button
  variant={isFailedOnly ? 'contained' : 'outlined'}
  color={isFailedOnly ? 'primary' : 'secondary'}
  size="small"
  icon={ButtonLoopArrowIcon}
  text="Retry"
  aria-label="Retry task"
  aria-busy={isRetrying}
  data-testid="task-retry-button"
  isLoading={isRetrying}
  isDisabled={isAnyActionLoading}
  onClick={onRetry}
/>
```

### 3.4 Button state summary

| State | Pause | Resume | Retry |
|-------|-------|--------|-------|
| Default (visible) | Enabled | Enabled | Enabled |
| Loading (own request) | `isLoading`, disabled, `aria-busy` | Same | Same |
| Loading (sibling request) | Disabled (no spinner) | Disabled | Disabled |
| Hidden | Not in DOM | Not in DOM | Not in DOM |

---

## 4. Status Badge — `paused` Extension

Extend the shared `taskStatusDisplay.ts` mapping. Both `TaskStatusBadge` (detail header) and `TaskListItem` (homepage cards) consume these helpers — **one change updates both surfaces**.

### 4.1 `paused` entry

| Property | Value | Notes |
|----------|-------|-------|
| **Label** | `"Paused"` | Title case; consistent with `"In progress"` |
| **Color** | `warning` | New semantic color slot; distinguishes from active (`info`), success (`done`), and terminal error (`failed`) |
| **Icon** | `ButtonStopIcon` | Square-in-circle "stop" metaphor signals halted execution; **distinct from** `ButtonPauseIcon` used on the Pause action button (two bars, no circle) |

**Icon rationale:** Using `ButtonPauseIcon` on both the action button and the badge creates visual redundancy and confuses "click to pause" with "currently paused." `ButtonStopIcon` shares the media-control family but reads as state ("stopped") rather than action. `TimeClockCircleIcon` is reserved for `created`; `FlagWarningIcon` implies alert, not user-initiated pause.

### 4.2 Style token additions

**`taskStatusStyles.module.scss`** — add:

```scss
.statusWarning {
  color: $color-warning;
}
```

**`taskStatusStyles.ts`** — extend map:

```ts
warning: styles.statusWarning ?? '',
```

**`types.ts` (`ColorValue`)** — extend union:

```ts
export type ColorValue = 'secondary' | 'info' | 'success' | 'error' | 'warning';
```

**`taskStatusDisplay.ts`** — add entries:

```ts
[TaskStatus.Paused]: ButtonStopIcon,   // icon map
[TaskStatus.Paused]: 'warning',         // color map
[TaskStatus.Paused]: 'Paused',          // label map
```

### 4.3 Badge accessibility enhancement

Update `TaskStatusBadge` span:

```tsx
<span
  role="status"
  aria-live="polite"
  className={...}
  data-testid="task-detail-status"
>
```

- `role="status"` ensures screen readers announce badge text changes after pause/resume/retry.
- Icon remains `aria-hidden`; label text provides the accessible name.
- Task list cards should add the same `role="status"` on the badge span for consistency (non-interactive, informational).

---

## 5. Paused AI Response Copy

### 5.1 Behavior

| `task.status` | `TaskDetailAiResponse` output |
|---------------|-------------------------------|
| `in-progress` | Existing: `"Processing..."` in `sectionCard` |
| **`paused`** | **New:** Paused guidance copy (replaces processing state — does not supplement it) |
| `done` | Existing: AI Response markdown block |
| `failed` | `null` (error handled by `TaskDetailExecutionError`) |
| `created` | `null` |

When the user pauses, the section **transitions from** `"Processing..."` **to** the paused message in place — same `sectionCard` container, same vertical position in the content column.

### 5.2 Copy (exact)

> Task paused — click Resume to continue, or Retry to restart from scratch.

Use an em dash (`—`) as in the PRD, not a hyphen.

### 5.3 Styling

| Property | Token / value |
|----------|---------------|
| Container | Existing `pageStyles.sectionCard` (same as in-progress processing block) |
| Text component | `Text variant="body2"` |
| Color | `$color-text-secondary` via `className={styles.pausedMessage}` or `pageStyles.descriptionEmpty` pattern |
| Weight | Regular (400) — helper/informational, not a heading |
| `id` | `task-detail-ai-response-heading` (preserve `aria-labelledby` on section) |
| `data-testid` | `task-detail-ai-paused` |

```tsx
<section aria-labelledby="task-detail-ai-response-heading" className={pageStyles.sectionCard}>
  <Text
    variant="body2"
    id="task-detail-ai-response-heading"
    className={styles.pausedMessage}
    data-testid="task-detail-ai-paused"
  >
    Task paused — click Resume to continue, or Retry to restart from scratch.
  </Text>
</section>
```

**Rationale:** Secondary text color signals informational/helper tone without using `warning` (reserved for the status badge). No `sectionLabel` heading — the header badge already communicates state; duplicating a "Paused" heading would be redundant.

---

## 6. Task List Card Badge

**No new list components required.**

`TaskListItem` already renders:

```tsx
getStatusIcon(task.status) + getStatusLabel(task.status) + STATUS_COLOR_CLASS_MAP[getStatusColor(task.status)]
```

Once `taskStatusDisplay.ts` includes `paused` and `statusWarning` exists, paused tasks on the homepage automatically show:

```
[ ■ Paused ]   ← ButtonStopIcon + warning color + "Paused" label
```

- **No card-level action buttons** in v1 (PRD §8.7).
- Users tap the card to navigate to the detail page for pause/resume/retry controls.

---

## 7. Polling Behavior (Hook — No Visual Change)

Document for engineering; no UI delta.

| Local `task.status` | Poll GraphQL? | Interval |
|---------------------|---------------|----------|
| `in-progress` | Yes | 3000ms |
| `paused` | **No** | — |
| `done` | No | — |
| `failed` | No | — |
| `created` | No | — |

**Current implementation** (`useTaskDetailPage.ts`):

```ts
usePolling(
  { enabled: task?.status === TaskStatus.InProgress && taskIdParam !== '', intervalMs: 3000 },
  pollCallback,
);
```

`paused` is already excluded because it is not `InProgress`. **No hook change required** unless `TaskStatus.Paused` enum value is added — verify the enum comparison still works after the domain extension.

After successful resume or retry, status returns to `in-progress` → polling resumes automatically on the next render.

---

## 8. Accessibility Annotations

| Requirement | Implementation |
|-------------|----------------|
| Visible labels | All buttons: icon + text (`"Pause"`, `"Resume"`, `"Retry"`) |
| `aria-label` | `"Pause task"`, `"Resume task"`, `"Retry task"` on respective buttons |
| Loading | `isLoading` on active button; `aria-busy="true"` on that button; `disabled` on all action buttons |
| Status badge | `role="status"`, `aria-live="polite"`; icon `aria-hidden` |
| Color independence | Badge always shows icon + text label; buttons always show icon + text |
| Focus management | After pause/resume/retry response, **focus remains on the triggering button** (or moves to the button that replaces it in the same `headerActionButtons` group). Do not move focus to the page body or AI response section. |
| Focus visibility | `Button` `:focus-visible` outline (`2px solid $color-primary-500`, `outline-offset: 2px`) — no override |
| Keyboard | Buttons are native `<button>` elements — Tab to focus, Enter/Space to activate |
| Action group | `role="group"` + `aria-label="Task actions"` on `.headerActionButtons` |
| Touch targets | `size="small"` buttons inherit Button min sizing; verify ≥44px touch target on mobile (may need `className` padding override if audit fails) |

---

## 9. Responsive Behavior

### 9.1 Desktop (≥ `$media-tablet` / 768px)

Single utility row: back link left, action buttons + badge right-aligned inline.

```
[ ← Back to tasks ]                    [ Resume ] [ Retry ] [ Paused ● ]
```

### 9.2 Mobile (`$media-mobile-only` / < 768px)

`.utilityHeader` `flex-wrap: wrap` handles narrow viewports:

1. **Preferred wrap:** Back link occupies full width on first line (or left half); `.utilityHeaderEnd` wraps to the right or second line, end-aligned.
2. **Action buttons:** Stay **inline** within `.headerActionButtons` — do not stack vertically. At most 2 small buttons fit comfortably beside the badge on 375px widths.
3. **Overflow fallback:** If `[Resume] [Retry] [Badge]` exceeds available width, the entire `.utilityHeaderEnd` block wraps to a new line below the back link, `justify-content: flex-end`, preserving internal horizontal order.
4. **No icon-only collapse:** Labels remain visible at all breakpoints (only 1–2 buttons shown).

### 9.3 H1 interaction

No change. Page title remains below the utility row with `margin-top: $spacing-2`.

---

## 10. Design Tokens Used

| Token | Usage |
|-------|-------|
| `$spacing-2` | Gap between action buttons; utility header base gap |
| `$spacing-3` | Gap between action group and status badge |
| `$spacing-4` / `$spacing-6` | Page padding (unchanged) |
| `$color-primary` / `$color-primary-600` | Resume button (contained); badge `info` state (unchanged) |
| `$color-secondary-600` | Pause / Retry outlined button border and text |
| `$color-warning` | Paused badge text/icon color |
| `$color-text-secondary` | Paused AI response message |
| `$color-text-primary` | Button contained text |
| `$color-error` | Failed badge (unchanged) |
| `$color-success` | Done badge (unchanged) |
| `$border-radius-md` | Status badge (unchanged) |
| `$font-size-body-md` | Badge label (unchanged) |
| `$shadow-sm` / `$shadow-md` | Button contained hover (from Button component) |
| `$media-tablet` / `$media-mobile-only` | Responsive breakpoints |

### New tokens

| Token | Status |
|-------|--------|
| `$color-warning` | **Existing** in `ui/system-design/theme/src/tokens/colors.scss` — first use in task status badge styling |
| `.statusWarning` class | **New SCSS class** mapping to existing `$color-warning` — not a new color token |

No new design-system color tokens required.

---

## 11. Component Change Summary

| File | Change type | Description |
|------|-------------|-------------|
| `apps/web/app/tasks/[id]/_components/TaskDetailHeader.tsx` | **Modify** | Add `.utilityHeaderEnd` wrapper; render action button group left of badge; wire callbacks/loading from new hook |
| `apps/web/app/tasks/[id]/_components/TaskDetailHeaderActions/` (new folder) | **Add** | `TaskDetailHeaderActions.tsx` — visibility matrix, button rendering, loading state; `types.ts`; optional `TaskDetailHeaderActions.module.scss` if needed |
| `apps/web/app/tasks/[id]/hooks/useTaskDetailActions/` (new folder) | **Add** | REST commands (`PATCH /tasks/:id/pause\|resume\|retry`), loading flags, optimistic `setTask` on success, snackbar on error |
| `apps/web/app/tasks/[id]/_components/TaskDetailAiResponse/TaskDetailAiResponse.tsx` | **Modify** | Add `paused` branch with guidance copy |
| `apps/web/app/tasks/[id]/_components/TaskDetailAiResponse/TaskDetailAiResponse.module.scss` | **Modify** | Add `.pausedMessage { color: $color-text-secondary; }` |
| `apps/web/app/_components/TaskList/taskStatusDisplay.ts` | **Modify** | Add `paused` icon, color, label entries |
| `apps/web/app/_components/TaskList/taskStatusStyles.module.scss` | **Modify** | Add `.statusWarning` |
| `apps/web/app/_components/TaskList/taskStatusStyles.ts` | **Modify** | Add `warning` key to `STATUS_COLOR_CLASS_MAP` |
| `apps/web/app/_components/TaskList/types.ts` | **Modify** | Extend `ColorValue` with `'warning'` |
| `apps/web/app/tasks/[id]/_components/TaskStatusBadge.tsx` | **Modify** | Add `role="status"`, `aria-live="polite"` |
| `apps/web/app/_components/TaskList/TaskListItem.tsx` | **Modify** | Add `role="status"` on list card badge span |
| `apps/web/app/tasks/[id]/TaskDetailPage.module.scss` | **Modify** | Add `.utilityHeaderEnd`, `.headerActionButtons` |
| `apps/web/app/tasks/[id]/useTaskDetailPage.ts` | **Verify** | Polling already excludes non-`in-progress`; pass `setTask` to action hook or lift state |
| `ui/api-hooks` (TaskStatus enum) | **Modify** | Add `Paused = 'paused'` (domain dependency) |
| `ui/execution-progress-tracker/.../ProgressHeader.tsx` | **Optional follow-up** | Add `paused` → `"Paused"` in `getStatusLabel` for progress panel consistency (PRD FR-U10); no visual redesign |

### Suggested component tree after implementation

```
TaskDetailHeader
├── Button (back)
└── utilityHeaderEnd
    ├── TaskDetailHeaderActions
    │   ├── Button (pause)   — conditional
    │   ├── Button (resume)  — conditional
    │   └── Button (retry)   — conditional
    └── TaskStatusBadge
```

---

## 12. Icon Recommendations (Quick Reference)

| UI element | Icon | Package export |
|------------|------|----------------|
| Pause button | `ButtonPauseIcon` | `@vassembly/ui-system-design/icons` |
| Resume button | `ButtonPlayIcon` | `@vassembly/ui-system-design/icons` |
| Retry button | `ButtonLoopArrowIcon` | `@vassembly/ui-system-design/icons` |
| Paused status badge | `ButtonStopIcon` | `@vassembly/ui-system-design/icons` |

**Rejected alternatives**

| Icon | Reason |
|------|--------|
| `ButtonPauseIcon` (badge) | Duplicates action button; conflates action vs state |
| `SynchronizeArrowsIcon` (retry) | Reads as sync, not restart |
| `ArrowRightIcon` (resume) | Reads as navigation |
| `ButtonFastForwardIcon` (resume) | Implies skip ahead, not resume |
| `TimeClockCircleIcon` (paused badge) | Already used for `created` |

---

## 13. Key Layout Decisions

1. **Actions sit inside a right-aligned cluster** with the status badge — not between back link and badge across the full row width.
2. **Glass secondary = `outlined` + `secondary`** — the closest existing Button pattern to the design system's glassmorphic secondary spec.
3. **Retry promotes to primary** when it is the sole action on `failed` tasks.
4. **Paused AI copy replaces** `"Processing..."` in the same card — no additional section or heading.
5. **Badge and list card share one mapping** — single source of truth in `taskStatusDisplay.ts`.
