# Task Title Generator — UI Design Specification

**Document status:** Design handoff for engineering and QA  
**Last updated:** 2026-06-16  
**Feature slug:** `task-title-generator`  
**Host routes:** `/` (TaskList) · `/tasks/[id]` (Task Detail Page)  
**Related:** `docs/features/task-title-generator/prd.md` · `docs/features/task-detail-page/design.md` · `docs/features/pause-resume-task/ui-design.md` · `.cursor/rules/design.md`  
**Creative direction:** The Synthetic Luminal — tonal surfaces, Space Grotesk display + Inter body, restrained accent usage

---

## 1. Design Rationale

After task creation, an LLM asynchronously writes a short title (≤ 8 words) to the existing nullable `title` field. The UI surfaces that value in two places already wired for conditional rendering: a **title line above the description** in each TaskList card, and the **page H1** on the Task Detail Page.

**Principles**

| Principle | Application |
|-----------|-------------|
| **Absent until ready** | No loading skeleton, spinner, or “generating…” copy for the title. If `title` is null/empty, the title line is omitted and the H1 falls back to “Task details”. |
| **Scannable list hierarchy** | When present, the title is the **primary scan line**; the description becomes supporting context below it. |
| **Continuity across surfaces** | The same `task.title` string appears in the list card and as the detail H1 — no separate “Summary” section on the detail page. |
| **Silent failure** | Failed generation looks identical to “not yet generated” — no error styling, no retry affordance in v1. |
| **No new packages** | `@vassembly/ui-text` only; reuse existing SCSS module patterns. |
| **Calm appearance** | Title populates on next fetch/reload/navigation with no entrance animation required. |

**Hierarchy correction (vs. current scaffold)**

The list row scaffold currently renders the title in `body2` + `$color-text-secondary` and the description in `body1` + `$color-text-primary`, which inverts the intended scan order. This spec **elevates the title above the description** typographically. Engineering should align SCSS with §2.3 — a small diff in `TaskListItem.module.scss`, no structural DOM change.

---

## 2. Task List Row (`TaskListItem`)

### 2.1 Row anatomy — two states

**State A — `title` null / empty / whitespace** (default after create, or after silent failure)

```
┌─────────────────────────────────────────────────────────────┐
│  Description text (clamped, up to 3 lines)                 │
│  [ Status icon  Status label ]                                 │
└─────────────────────────────────────────────────────────────┘
```

- Title line **not in DOM** (`{task.title && …}` — falsy after trim-equivalent check).
- Card height is driven by description + badge only.
- Vertical rhythm unchanged from pre-feature rows.

**State B — `title` non-empty** (after background generation + refetch)

```
┌─────────────────────────────────────────────────────────────┐
│  Generated task title (single line, truncated if needed)     │  ← primary scan line
│  Description text (clamped, up to 3 lines)                   │  ← supporting context
│  [ Status icon  Status label ]                                 │
└─────────────────────────────────────────────────────────────┘
```

- Title is the **first child** inside the card `article`.
- Description remains second; status badge remains last.
- Card gains one text line; list `gap` between cards (`$spacing-3`) absorbs height delta — no layout shift in sibling rows.

### 2.2 DOM structure (unchanged)

```tsx
<article className={itemStyles.item} role="button" tabIndex={0} …>
  {task.title && (
    <Text variant="body1" className={itemStyles.title} data-testid="task-ai-summary">
      {task.title}
    </Text>
  )}
  <Text variant="body1" className={descriptionClassName} data-testid="task-description">
    {description}
  </Text>
  <span className={statusBadgeClasses} role="status" …>
    …
  </span>
</article>
```

- Preserve `data-testid="task-ai-summary"` (forward-compatible with existing tests).
- Rename SCSS class `.summary` → `.title` for semantic clarity (optional but recommended).

### 2.3 Title line — typography & color

| Property | Token / value | Notes |
|----------|---------------|-------|
| **Component** | `Text variant="body1"` | 16px Inter body — matches description scale but differentiated by weight/color |
| **Font family** | `$font-family-body` | From `body1` variant |
| **Font size** | `$font-size-body-md` (1rem) | Do not use `body2` (14px) — title must read as the scan line |
| **Font weight** | `$font-weight-medium` (500) | One step above description regular weight |
| **Line height** | `$line-height-relaxed` | From `body1` variant |
| **Color** | `$color-text-primary` | High-contrast scan line on `$color-surface-container` |
| **Transform** | None | No uppercase; title is human prose from LLM |

**SCSS**

```scss
.title {
  color: $color-text-primary;
  font-weight: $font-weight-medium;
}
```

Override `body1`’s default `$color-text-secondary` from `Text.module.scss` via this class (same pattern as `.description` today).

### 2.4 Description line — relationship to title

| Property | State A (no title) | State B (with title) |
|----------|--------------------|----------------------|
| **Role** | Primary content | Supporting context under title |
| **Variant** | `body1` | `body1` (unchanged) |
| **Color** | `$color-text-primary` | `$color-text-secondary` when title present |
| **Weight** | `$font-weight-regular` | `$font-weight-regular` |
| **Clamp** | 3 lines | 3 lines (unchanged) |

When title is present, add a modifier so description de-emphasizes:

```scss
.descriptionWithTitle {
  color: $color-text-secondary;
}
```

Apply via `resolveClassName` when `task.title` is truthy. When title is absent, keep current primary color on description (it remains the main text line).

### 2.5 Spacing

| Relationship | Token | Value |
|--------------|-------|-------|
| Card internal stack | `$spacing-2` | 0.5rem — existing `.item { gap: $spacing-2 }` |
| Title → description | `$spacing-2` | Inherited from column `gap`; **no extra margin** on title |
| Description → status badge | `$spacing-2` | Same column gap |
| Card padding | `$spacing-4` | Unchanged |

No conditional spacing rules: omitting the title node collapses the gap automatically.

### 2.6 Title truncation / line-clamp

Backend caps output at ≤ 8 words, but long words or narrow viewports can still overflow.

| Property | Value |
|----------|-------|
| **Max lines** | 1 |
| **Overflow** | `hidden` |
| **Ellipsis** | `text-overflow: ellipsis` via `-webkit-line-clamp: 1` |
| **Word break** | `overflow-wrap: anywhere` optional fallback for unbroken strings |

```scss
.titleClamp {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

Compose: `resolveClassName(itemStyles.title, itemStyles.titleClamp, 'titleClamp')`.

**Do not** tooltip or expand on hover in v1 — user opens detail page for full string (≤ 8 words fits H1 without clamp).

### 2.7 Status badge & card chrome

No changes. Status badge, hover/focus states, border, and surface tokens remain as implemented in `TaskListItem.module.scss` and `taskStatusStyles.module.scss`.

### 2.8 List-level behavior (post-create)

| Moment | List title line | User perception |
|--------|-----------------|-----------------|
| Immediately after create + list refetch | Hidden (`title: null`) | Normal new task card — description only |
| User reloads / navigates back later | Visible if generation succeeded | Title simply appears — no animation |
| Generation failed | Hidden | Indistinguishable from “not yet generated” |

No list polling for title in v1. Existing task-execution polling on the detail page may incidentally refetch a populated title — that is acceptable and requires no title-specific UI.

---

## 3. Task Detail Page Header

### 3.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [← Back to tasks]              [ Pause ] [ Resume ] [ Retry ]  [ Status ● ] │
├──────────────────────────────────────────────────────────────────────────────┤
│  H1: {task.title}  OR  "Task details"                                        │
└──────────────────────────────────────────────────────────────────────────────┘
│  Description section …                                                        │
```

Implementation already resolves copy in `TaskDetailHeader`:

```ts
const pageTitle = task.title?.trim() ? task.title.trim() : TASK_DETAILS_PAGE_TITLE;
```

### 3.2 H1 — generated title state

| Property | Token / value |
|----------|---------------|
| **Component** | `Text variant="h1"` |
| **Element** | `<h1>` (default for `h1` variant) |
| **Font family** | `$font-family-display` (Space Grotesk) |
| **Font size (default)** | `$font-size-display-md` (2.8rem) |
| **Font size (mobile)** | `$font-size-heading-md` (1.5rem) via `.pageTitle` |
| **Font weight** | `$font-weight-bold` (700) |
| **Line height** | `$line-height-tight` (1.2) |
| **Letter spacing** | `$letter-spacing-tight` |
| **Color** | `$color-text-primary` |
| **Wrap** | Natural multi-line wrap allowed; **no line-clamp** on H1 |
| **data-testid** | `task-detail-title` |

Long titles (up to 8 words) may wrap to 2 lines on narrow viewports. Utility header row wraps independently above — no collision.

### 3.3 H1 — fallback `"Task details"` state

| Question | Decision |
|----------|----------|
| Should fallback look visually different from a real title? | **No** |
| Rationale | Muting the fallback (e.g. `$color-text-secondary`) would imply a **pending or error** state. PRD forbids loading affordances; silent failure must look the same as “title not yet available”. “Task details” is the legitimate page identity when no generated title exists — same as today. |
| Typography | Identical to §3.2 — same `variant="h1"`, same `.pageTitle` class, same responsive size override |
| Copy | Exact string `Task details` from `TASK_DETAILS_PAGE_TITLE` constant |

### 3.4 Spacing & layout impact

| Area | Spec |
|------|------|
| H1 top margin | `margin-top: $spacing-2` on `.pageTitle` (below utility header) — unchanged |
| H1 bottom | No extra margin; `$spacing-6` gap on `.pageStack` separates header from `article.contentColumn` |
| Variable title length | H1 block grows vertically with wrap; content below shifts down naturally |
| Utility header | Unaffected by title presence — actions + badge layout per pause/resume spec |

### 3.5 Browser document title

Existing `buildDocumentTitle` behavior — no visual design change:

| `task.title` | `<title>` |
|--------------|-----------|
| null / empty | `Task details` |
| populated | `{truncated to 60 chars} · Tasks` |

Truncation uses ellipsis character (`…`) when exceeding `DOCUMENT_TITLE_MAX_LENGTH`.

### 3.6 Page load skeleton

`TaskDetailSkeleton` renders a **generic** header bar (`Skeleton width="70%" height="32px"`) — not a title-specific placeholder. **Do not** add a second skeleton line or conditional skeleton for title. On ready phase, H1 resolves directly to title or fallback.

---

## 4. No Loading / Pending State — Design Contract

This is an explicit product + design constraint. Engineering and QA should treat violations as spec defects.

| Surface | Forbidden in v1 | Required behavior |
|---------|-----------------|-------------------|
| Task list card | Title skeleton row, shimmer, “Generating title…”, pulsing placeholder | Omit title line entirely until `task.title` is truthy |
| Task detail H1 | “Generating…”, skeleton swap from generic to title, spinner adjacent to H1 | Show `"Task details"` until `task.title` is truthy on fetch |
| Task detail (ready) | `aria-busy` on title, `aria-live` announcing title arrival | Static text only; no live region for title |
| List (loading) | Extra skeleton line mimicking future title | Existing list skeleton unchanged (description + badge placeholders only) |
| Any surface | Badge, icon, or accent hint that title is pending | None |

**Rationale**

1. **Fire-and-forget backend** — generation may complete in seconds or never; a pending UI promises completion.
2. **Silent failure** — error and in-progress states must be indistinguishable.
3. **Simplicity** — reload/navigation is the v1 refresh model; no polling on the list.
4. **Calm UX** — aligns with Synthetic Luminal; the title simply exists when data arrives.

**Acceptable incidental refresh**

If the user stays on the detail page and an existing task-status poll returns an updated `title`, the H1 may update in place. No special transition — treat as a normal React re-render. Do not add `aria-live` for this update in v1.

---

## 5. Component-Level Handoff

### 5.1 Files & change summary

| File | Change type | Description |
|------|-------------|-------------|
| `apps/web/app/_components/TaskList/TaskListItem.tsx` | **Verify / minor** | Conditional title render exists; apply `body1` + title classes; optional `descriptionWithTitle` modifier |
| `apps/web/app/_components/TaskList/TaskListItem.module.scss` | **Modify** | Add `.title`, `.titleClamp`, `.descriptionWithTitle`; deprecate `.summary` |
| `apps/web/app/tasks/[id]/_components/TaskDetailHeader.tsx` | **Verify** | `pageTitle` resolution already correct — no structural change |
| `apps/web/app/tasks/[id]/TaskDetailPage.module.scss` | **Verify** | `.pageTitle` responsive rule sufficient |
| `apps/web/app/tasks/[id]/useTaskDetailPageHelpers.ts` | **Verify** | `buildDocumentTitle` already handles nullable title |
| `apps/web/app/tasks/[id]/TaskDetailSkeleton.tsx` | **Verify** | No title-specific skeleton added |

### 5.2 SCSS variable / token checklist

| Token | Usage in this feature |
|-------|----------------------|
| `$color-text-primary` | List title line; description when no title; H1 (both states) |
| `$color-text-secondary` | List description when title present |
| `$font-weight-medium` | List title line |
| `$font-weight-regular` | List description |
| `$font-size-body-md` | List title + description (`body1`) |
| `$font-size-display-md` | H1 desktop |
| `$font-size-heading-md` | H1 mobile override |
| `$font-family-display` | H1 (via Text `h1` variant) |
| `$font-family-body` | List title + description |
| `$line-height-relaxed` | List text lines |
| `$line-height-tight` | H1 |
| `$spacing-2` | Card internal gap; H1 `margin-top` |
| `$spacing-4` | Card padding (unchanged) |

**New tokens:** None required.

### 5.3 Patterns to follow

| Pattern | Source | Apply here |
|---------|--------|------------|
| Conditional nullable field | `TaskListItem` title block | Keep `{task.title && …}` |
| Description clamp | `.descriptionClamp` | Unchanged on description; new `.titleClamp` on title |
| H1 responsive downsizing | `TaskDetailPage.module.scss` `.pageTitle` | Unchanged |
| Primary/secondary text pairing | `metadataLabel` / `metadata` rows on detail page | List title/description hierarchy |
| `Text` variant defaults | `ui/system-design/text` | Override color via module class when variant default conflicts |

### 5.4 `Text` variant reference

| Variant | Default color in component | This feature |
|---------|---------------------------|--------------|
| `h1` | `$color-text-primary` | Detail H1 — use as-is |
| `body1` | `$color-text-secondary` | List title + description — override with module classes |
| `body2` | `$color-text-secondary` | **Do not use** for title line (too small for scan line) |

---

## 6. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| **Detail heading hierarchy** | Single `<h1>` per page via `Text variant="h1"` — content is `task.title` or `"Task details"`. No skipped heading levels. |
| **List card semantics** | Card remains `article` with `role="button"`. Title is plain text inside the interactive card, not a heading — avoids nested heading noise in a list of N tasks. |
| **Screen reader — list** | When title present, SR reads title then description inside the same button name (document order). When absent, description only. |
| **Screen reader — detail** | H1 provides page purpose: generated title is ideal; `"Task details"` is an acceptable generic landmark per `task-detail-page/design.md` §3.2. |
| **No misleading busy state** | Do not set `aria-busy` on title/H1 for generation. Page-level skeleton `aria-busy="true"` only during initial task load. |
| **No live region for title** | Do not add `aria-live` on title line or H1 — would announce async arrival and imply a process users should wait for. |
| **Color independence** | Title distinguished by weight + position, not color alone. Primary vs secondary still meets contrast on dark surfaces. |
| **Search** | Existing search matches `title` when populated — no UI change; SR users benefit from find-in-page on list. |
| **Focus** | No focus change when title appears on refetch. |

---

## 7. Responsive Behavior

### 7.1 Task list (`max-width: 42rem`)

| Breakpoint | Title line | Description |
|------------|------------|-------------|
| Mobile (375px) | Single-line clamp with ellipsis | 3-line clamp |
| Tablet+ | Same | Same |

Card width matches list column; no horizontal scroll.

### 7.2 Task detail header

| Breakpoint | H1 behavior |
|------------|-------------|
| `< 768px` (`$media-mobile-only`) | `$font-size-heading-md` (1.5rem); wrap to multiple lines if needed |
| `≥ 768px` | `$font-size-display-md` (2.8rem) |

Utility header wrap rules from pause/resume spec apply independently.

---

## 8. QA Visual Checklist

| # | Scenario | Expected |
|---|----------|----------|
| 1 | New task, list refetch | No title line; description primary color |
| 2 | Task with `title: "Invoice Q3 review"` on list | Title primary/medium above secondary description; single-line ellipsis if forced narrow |
| 3 | Task with `title: null` on list | Identical to pre-feature row |
| 4 | Detail page, `title` null | H1 = “Task details”, full primary H1 styling |
| 5 | Detail page, `title` set | H1 = title string, same styling as fallback |
| 6 | Detail page, initial load | Generic skeleton only — no “generating title” |
| 7 | Generation failed | List + detail match null-title appearance |
| 8 | Browser tab | `Task details` vs `{title} · Tasks` per `buildDocumentTitle` |
| 9 | Search | Task findable by title after population |
| 10 | Long unbroken title token | List title ellipsizes; detail H1 wraps |

---

## 9. Key Layout Decisions

1. **List title is the scan line** — `body1` + medium weight + primary color; description steps down to secondary when title exists.
2. **Fallback H1 is not muted** — avoids implying pending generation; matches silent-failure contract.
3. **Single-line clamp on list title only** — detail H1 shows full string (≤ 8 words).
4. **No loading affordance anywhere** — absence is the only pre-population state.
5. **No new components or packages** — SCSS + existing `Text` variants only.
6. **Preserve `data-testid="task-ai-summary"`** — list title line test hook remains stable.

---

## 10. Out of Scope (v1) — UI

| Item | Notes |
|------|-------|
| Title edit / regenerate controls | No inline edit on list or detail |
| List polling for title | Title appears on reload/navigation/incidental refetch |
| Entrance animation | Optional future polish; not specified |
| Tooltip for clamped list title | Open detail for full text |
| Separate “AI Summary” section on detail | Title **is** the summary; section remains omitted per task-detail-page design |
| Backfill UI for existing tasks | Only new tasks after release |
