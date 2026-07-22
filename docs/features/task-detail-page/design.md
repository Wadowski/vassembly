# Task Detail Page — UI/UX Design Specifications

**Document status:** Design handoff for engineering and QA  
**Last updated:** 2026-05-29  
**Route:** `/tasks/[id]` (App Router: `apps/web/app/tasks/[id]/page.tsx`)  
**Related:** `docs/features/task-detail-page/prd.md`, `docs/features/task-list-homepage/prd.md`, `.cursor/rules/design.md`  
**Creative direction:** The Synthetic Luminal — tonal surfaces, no divider lines, Space Grotesk display + Inter body

---

## 1. Design Rationale

The Task Detail Page completes the affordance started on the homepage TaskList: users move from a **clamped preview card** to a **read-only editorial view** of the same task. The layout should feel like an extension of the list item—same status semantics, same empty-description copy, same conditional AI summary—scaled up with more breathing room and full description text.

**Key principles**

| Principle | Application on this page |
|-----------|---------------------------|
| **Continuity with TaskList** | Reuse `taskStatusDisplay` (icon + label + color classes), `TASK_EMPTY_DESCRIPTION_LABEL`, conditional `title` visibility |
| **Calm, view-only shell** | No edit CTAs; back navigation only; metadata reads like a “technical readout” |
| **Progressive disclosure** | Phase 1 paints description + metadata from one GraphQL query; Phase 2+ timeline lazy-mounts without blocking |
| **Owner-only trust** | Error/not-found states are generic; no partial content on failed fetch |
| **Synthetic Luminal** | Tonal `sectionCard` on app `surface`; section labels in tracked `label` + `primary`; avoid extra accent colors (status uses existing semantic tokens only) |

**Canonical conflict resolutions (vs. exploratory asks in brief)**

| Topic | Decision |
|-------|----------|
| Route | `/tasks/[id]` per PRD (not `task/:taskId`) |
| Empty AI summary | **Hide entire Summary block** (PRD); do not show “No AI summary” in Phase 1 |
| Page H1 | **When `title` present:** H1 = `task.title` (display). **When absent:** H1 = “Task details” (keeps accessible page identity) |
| Layout columns | **Phase 1:** single column, max-width column (TaskList-aligned). **Optional Phase 1.5:** desktop metadata aside—see §11 Open Questions |
| Status placement | **Header row** (with back link) *and* repeated in metadata for scanability—or header only with metadata omitting duplicate (engineering: pick one; spec shows header primary) |

---

## 2. Page Layout & Visual Hierarchy

### 2.1 Information architecture (top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  [Back to tasks]                              [Status badge] │  ← utility header row
├─────────────────────────────────────────────────────────────┤
│  H1: task.title OR "Task details"                            │  ← primary headline
│  (Summary section only if title — see §3)                    │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Description                                        │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Details (metadata card)                            │
├─────────────────────────────────────────────────────────────┤
│  SECTION: Activity (Phase 2+ only, lazy)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 DOM / landmark structure

```html
<main class="pageStack">           <!-- ProtectedAuthRoute wraps page -->
  <header class="utilityHeader">   <!-- back + status -->
  <article class="contentColumn">  <!-- sections -->
    <section aria-labelledby="…">  <!-- description -->
    <section aria-labelledby="…">  <!-- metadata -->
    <section aria-labelledby="…">  <!-- timeline Phase 2+ -->
  </article>
</main>
```

- **No footer** in v1.
- **No global sidebar** from `AuthLayout`; content lives in main drawer content area.
- Document `<title>`: `Task details` or `{truncated title} · Tasks` when `title` exists (max ~60 chars).

### 2.3 Container widths & breakpoints

| Breakpoint | Token | Min width | Layout |
|------------|-------|-----------|--------|
| Mobile | `$media-mobile` | 375px | Full width, horizontal padding `$spacing-4` |
| Small / default | — | 320px+ | Same as mobile; min body text **16px** (`$font-size-body-md`) |
| Tablet | `$media-tablet` | 768px | Content column `max-width: 42rem`, centered or left-aligned with app content |
| Desktop | `$media-desktop` | 1024px | Same max-width; optional split layout deferred (§11) |
| Wide | `$media-wide` | 1280px | No change to detail column in Phase 1 |

**Content column (Phase 1)**

```scss
.contentColumn {
  display: flex;
  flex-direction: column;
  gap: $spacing-6;
  width: 100%;
  max-width: 42rem; // match TaskList.list
}
```

**Page stack** (reuse `AgentsPageView.pageStack` pattern)

```scss
.pageStack {
  display: flex;
  flex-direction: column;
  gap: $spacing-6;
  padding: $spacing-4;

  @media #{$media-tablet} {
    padding: $spacing-6;
  }
}
```

### 2.4 Visual hierarchy (type scale)

| Level | Element | Component | Token / variant |
|-------|---------|-----------|-----------------|
| 1 | Task title or fallback page name | `Text variant="h1"` | `$font-family-display`, `$font-size-heading-lg` (mobile), `$font-size-heading-md` acceptable on very narrow if needed |
| 2 | Section titles (“Description”, “Details”, “Activity”) | `Text variant="h3"` or `variant="label"` + `sectionLabel` class | Section labels: `label` variant, `$color-primary`, uppercase, `$letter-spacing-tracked` |
| 3 | Body / description | `Text variant="body1"` | `$color-text-primary`, `$line-height-relaxed` |
| 4 | Metadata values | `Text variant="body2"` | `$color-text-primary` |
| 5 | Metadata labels | `Text variant="label"` | `$color-text-secondary` |
| 6 | Empty / helper copy | `Text variant="body2"` | `$color-text-secondary` |

### 2.5 Color & surfaces

| Surface role | Token | Usage |
|--------------|-------|-------|
| App background | `$color-surface` | Inherited from layout |
| Metadata / timeline card | `$color-surface-container-high` | `.sectionCard` — matches Settings |
| Optional inset panel | `$color-surface-container` | Timeline rows on Phase 2 |
| Primary text | `$color-text-primary` | Description body |
| Secondary / empty | `$color-text-secondary` | Empty description, labels |
| Status colors | See §4.4 | Same mapping as TaskList |

**Design system note:** Prefer **tonal stacking** (card on surface) over borders. TaskList items use `1px $color-outline` for list affordance; on the detail page use **borderless** `sectionCard` with background only. Do not add divider lines between sections—use `$spacing-6` vertical gap.

### 2.6 Spacing scale (page-level)

| Area | Token | Value |
|------|-------|-------|
| Page vertical rhythm between sections | `$spacing-6` | 1.5rem |
| Section internal gap | `$spacing-4` | 1rem |
| Utility header gap (back ↔ status) | `$spacing-4` | space-between flex |
| Metadata label/value pairs | `$spacing-2` | 0.5rem |
| Metadata rows stack | `$spacing-3` | 0.75rem |
| Section card padding | `$spacing-6` | 1.5rem |
| Back link margin below | `$spacing-2` | 0.5rem before H1 |

---

## 3. Header Section (AI Summary + Utility Row)

### 3.1 Utility header row

| Element | Spec |
|---------|------|
| **Back control** | `Button variant="text"` `color="primary"`, text `← Back to tasks`, navigates to `/`. Pattern: `useAiIntegrationEditPage.tsx` |
| **Status badge** | Right-aligned on desktop; below back link on mobile if narrow. Reuse TaskList status pattern (icon 16px + label), not `Tag`, for **parity with list** |
| **Layout** | `display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: $spacing-2` |

### 3.2 Primary headline (H1)

| `task.title` | H1 content | Summary section |
|--------------|------------|-----------------|
| Non-empty string | `task.title` | **Omit** separate “Summary” section—title *is* the AI summary headline |
| null / empty / whitespace | `Task details` | **Hidden** — no Summary block, no placeholder |

**Rationale:** PRD hides summary when empty; elevating `title` to H1 avoids redundant “Summary” + title. Screen readers get a meaningful H1 in both cases.

### 3.3 Typography — H1 responsive

```scss
.pageTitle {
  // h1 variant from Text component; override if needed:
  @media #{$media-mobile-only} {
    font-size: $font-size-heading-md; // 1.5rem — still ≥ implicit 16px body elsewhere
  }
}
```

- **Mobile:** single column; status may wrap to second row under back link.
- **Tablet+:** status stays on same row as back link (end-aligned).

### 3.4 Phase 3 — pending AI summary

When backend supports generation states (out of Phase 1):

| State | UX |
|-------|-----|
| Generating | Section visible; `Skeleton` 2 lines; `aria-busy="true"`; label “Generating summary…” |
| Failed | `Text variant="body2"` `$color-error`; optional retry if product adds command |

---

## 4. Description Section

### 4.1 Structure

```
SECTION LABEL: "Description"  (technical readout style)
BODY: full task.description OR empty copy
```

### 4.2 Content rules

| State | Display |
|-------|---------|
| Loading | `Skeleton` × 4 lines, widths `100%`, `95%`, `90%`, `60%`, heights `16px`, `gap: $spacing-2` |
| Populated | Full text, `white-space: pre-wrap`, **no line clamp** |
| Empty string | `TASK_EMPTY_DESCRIPTION_LABEL` → **“No description”** (`constants.ts`) |
| Error | Section not rendered; page-level error |

### 4.3 Styling

| Property | Token / value |
|----------|----------------|
| Color | `$color-text-primary` |
| Font | `body1` → `$font-size-body-md` (1rem / 16px) |
| Line height | `$line-height-relaxed` (1.75) |
| Max readable width | Inherited from `42rem` column (~65–75 characters) |

### 4.4 Status colors (reference — shared with TaskList)

| Status | Icon | Label | SCSS class | Color token |
|--------|------|-------|------------|-------------|
| `created` | `TimeClockCircleIcon` | Created | `.statusSecondary` | `$color-text-secondary` |
| `in-progress` | `SingleNeutralCircleIcon` | In progress | `.statusInfo` | `$color-primary` |
| `done` | `CheckCircleIcon` | Done | `.statusSuccess` | `$color-success` |
| `failed` | `AlertCircleIcon` | Failed | `.statusError` | `$color-error` |

**Accessibility:** Icon `aria-hidden="true"`; visible text label always present.

**Optional Tag variant map** (if product prefers pill badges on detail only):

| Status | `Tag` variant |
|--------|----------------|
| created | `default` |
| in-progress | `primary` |
| done | `success` |
| failed | `error` |

Default implementation: **TaskList icon + text** in header; metadata row can repeat same component.

---

## 5. Metadata / Timeline Section

### 5.1 Metadata panel (Phase 1 — eager, same query as page)

Contained in `.sectionCard` with section label **“Details”**.

| Row | Label (label variant) | Value (body2) | Source |
|-----|----------------------|---------------|--------|
| Status | `Status` | Icon + label (duplicate of header acceptable) | `task.status` |
| Created | `Created` | Formatted date-time | `task.createdAt` |
| Last updated | `Last updated` | Formatted date-time; **omit row** if same instant as created (optional simplification) | `task.updatedAt` |
| Assigned agent | `Assigned agent` | `Unassigned` if null; Phase 1: “Assigned” stub or masked ID per security; Phase 3: agent name | `task.agentAssignedId` |

**Date formatting** (align with agents):

- Primary: `toLocaleString()` for created/updated (see `SystemAgentForm.tsx`), **or**
- Date-only: `toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })` + time on second line — **pick one app-wide in implementation**

**Relative time** (optional enhancement): “Created 2 hours ago” via shared formatter — not required Phase 1 if not used elsewhere.

### 5.2 Metadata layout

**Mobile:** stacked label above value (`flex-direction: column`, `gap: $spacing-1` per row).

**Tablet+:** definition list semantics:

```html
<dl class="metadataList">
  <div class="metadataRow">
    <dt>Created</dt>
    <dd>…</dd>
  </div>
</dl>
```

```scss
.metadataList {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}

@media #{$media-tablet} {
  .metadataRow {
    display: grid;
    grid-template-columns: 10rem 1fr;
    gap: $spacing-4;
    align-items: center;
  }
}
```

### 5.3 Timeline section (Phase 2+)

**Phase 1:** **Do not mount** — no placeholder, no heading, no skeleton.

**Phase 2:** Lazy mount after `task` query resolves (`requestAnimationFrame` or `useEffect` defer ≥0ms).

| Aspect | Spec |
|--------|------|
| Section title | `Activity` (h3 / label style) |
| Data | Client-derived: (1) Task created @ `createdAt`; (2) Status: `{label}` @ `updatedAt` (fallback `createdAt`) |
| Layout | Vertical timeline (recommended over table for 2–N narrative events) |
| Loading | Section heading visible immediately; 2–3 `Skeleton` rows `height: 48px` inside card |
| Empty (Phase 3 edge) | “No timeline events” + fallback synthetic entries |

**Timeline row anatomy**

```
●  Task created
   Mar 12, 2026, 3:45 PM

●  Status: In progress
   Mar 12, 2026, 4:10 PM
```

| Element | Spec |
|---------|------|
| Connector | 2px vertical line `$color-outline-variant` at 15% opacity (ghost border) |
| Node | 8px circle `$color-primary` |
| Title | `body2` `$font-weight-medium` |
| Timestamp | `caption` or `label` `$color-text-secondary` |
| Agent | Phase 3 only — “by {Agent Name}” when event model supports |

**Phase 3:** Replace data source with GraphQL event list; **keep same visual component**.

---

## 6. Loading & Empty States

### 6.1 Page load (Phase 1)

`TaskDetailSkeleton` inside `ProtectedAuthRoute` `loadingFallback` (mirror `AgentEditSkeleton` pattern).

| Block | Skeleton |
|-------|----------|
| Back link | `Skeleton width="140px" height="20px"` |
| H1 | `Skeleton width="70%" height="32px" borderRadius="$border-radius-md"` |
| Description | 4 lines (see §4.1) |
| Metadata card | Card padding; 3 rows `label width 80px` + `value width 60%` |

**Do not** skeleton Summary block when unknown—optional 1-line H1 skeleton always (covers both title and fallback).

### 6.2 Timeline lazy load (Phase 2)

- Page interactive after metadata paints.
- Activity section: heading + row skeletons only; **no full-page overlay**.

### 6.3 Empty states summary

| Condition | UX |
|-----------|-----|
| `title` null/empty | No Summary section; H1 = “Task details” |
| `description` empty | “No description” (`$color-text-secondary`) |
| `agentAssignedId` null | “Unassigned” |
| Timeline empty (Phase 3) | “No timeline events” centered in card, `body2` secondary |
| Not found / not owner | Dedicated error view — see §7 |
| Network error | Snackbar + inline retry |

### 6.4 Error state

| Type | UX |
|------|-----|
| Fetch failure | `useSnackbar().show({ variant: 'error', message })` + inline `Alert` or error `Text` in `main` |
| Retry | `Button variant="outlined"` “Try again” re-triggers GraphQL lazy query |
| Not found | Message: “Task not found”; `Button` “Back to tasks” → `/` |
| No partial data | If `phase === 'error'`, do not render description/metadata |

---

## 7. Navigation & Interaction

| Action | Behavior |
|--------|----------|
| Back to tasks | `router.push('/')` |
| Browser back | Native history — no custom handler |
| TaskList row click | `router.push(\`/tasks/${id}\`)` |
| TaskList keyboard | Enter/Space on focused row → same navigation |
| Deep link | `/tasks/{id}` with `returnUrl` on auth redirect |
| Focus order | Back → H1 → description → metadata → (timeline) |
| Hover | Text button: underline or opacity 0.85; `transition: 300ms cubic-bezier(0.22, 1, 0.36, 1)` |
| Focus visible | Theme focus ring on `Button` / links — do not remove outline |

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Checklist

- [ ] **Page purpose:** H1 identifies task (`title` or “Task details”)
- [ ] **Document title:** `<title>` updated on load
- [ ] **Landmarks:** `<main>`, `<header>`, `<section>` with `aria-labelledby` pointing to visible section headings
- [ ] **Back control:** Accessible name “Back to tasks” (visible text sufficient)
- [ ] **Status:** Not conveyed by color alone — icon + text label
- [ ] **Icons:** Decorative icons `aria-hidden="true"`
- [ ] **Loading:** `aria-busy="true"` on skeleton container; remove when loaded
- [ ] **Contrast:** Text primary on surface-container-high ≥ 4.5:1; status colors verified against card background
- [ ] **Touch targets:** Back button min 44×44px tap area (padding)
- [ ] **Motion:** Respect `prefers-reduced-motion` — disable timeline fade-in if added
- [ ] **Keyboard:** No trap; all interactive elements tabbable
- [ ] **Screen reader order:** Matches visual order
- [ ] **Empty description:** Announced as “No description” text, not silent gap
- [ ] **Errors:** `role="alert"` on inline error or snackbar with `aria-live="polite"`

### 8.2 Mobile text sizing

- Minimum **16px** for description and metadata values (`body1` / `body2` at default scale).
- Do not use `$font-size-label-sm` (12px) for primary reading content.

---

## 9. Responsive Design

### 9.1 Mobile (320px – 767px)

- Single column `padding: $spacing-4`
- Utility header stacks if needed
- Metadata label/value stacked
- H1 `$font-size-heading-md` if long titles overflow (wrap, no truncation in Phase 1)

### 9.2 Tablet (768px – 1023px)

- `padding: $spacing-6`
- Metadata grid label column 10rem
- Content `max-width: 42rem`

### 9.3 Desktop (1024px+)

- Phase 1: same single column (PRD)
- **Optional layout (product decision):** `grid-template-columns: minmax(0, 42rem) minmax(280px, 320px)` — description left, metadata card right sticky — see §11

---

## 10. Component Mapping

| UI area | Package | Component / pattern | Notes |
|---------|---------|---------------------|-------|
| Page auth | app | `ProtectedAuthRoute` | `loadingFallback={<TaskDetailSkeleton />}` |
| Back nav | `@vassembly/ui-system-design/button` | `Button variant="text"` | `← Back to tasks` |
| Headlines / body | `@vassembly/ui-system-design/text` | `Text` variants `h1`, `h3`, `body1`, `body2`, `label`, `caption` | |
| Status (header + metadata) | app shared | Extract `TaskStatusBadge` from TaskList item | Uses `@vassembly/ui-system-design/icons` + `taskStatusDisplay` |
| Status (alt) | `@vassembly/ui-system-design/tag` | `Tag` + icon | Only if design switches to pills |
| Metadata container | SCSS module | `.sectionCard` | Settings pattern — no `ui-card` package |
| Description | `@vassembly/ui-system-design/text` | `body1` | |
| Timeline rows | `@vassembly/ui-system-design/text` | labels + timestamps | Phase 2; custom SCSS timeline |
| Timeline (tabular alt) | `@vassembly/ui-system-design/table` | `Table` | Use only if >5 homogeneous events in Phase 3 |
| Page skeleton | `@vassembly/ui-system-design/skeleton` | `Skeleton` | |
| Timeline skeleton | `@vassembly/ui-system-design/skeleton` | 2–3 row placeholders | Phase 2 |
| Errors | `@vassembly/ui-system-design/snackbar` | `useSnackbar` | `variant: 'error'` |
| Inline error | `@vassembly/ui-system-design/alert` | `Alert` | Optional beside retry |
| Retry | `@vassembly/ui-system-design/button` | `outlined` / `contained` | |
| Not found | `@vassembly/ui-system-design/text` + `Button` | — | |
| Breadcrumbs | `@vassembly/ui-system-design/breadcrumbs` | — | **Not used** in web app v1 |

### 10.1 Suggested file structure

```
apps/web/app/tasks/[id]/
  page.tsx
  TaskDetailPage.module.scss
  TaskDetailSkeleton.tsx
  useTaskDetailPage.ts
  _components/
    TaskDetailHeader.tsx
    TaskDetailDescription.tsx
    TaskDetailMetadata.tsx
    TaskDetailTimeline.tsx      # Phase 2+
    TaskStatusBadge.tsx         # shared extract
```

### 10.2 Shared modules to import

- `apps/web/app/_components/TaskList/taskStatusDisplay.ts`
- `apps/web/app/_components/TaskList/constants.ts` (`TASK_EMPTY_DESCRIPTION_LABEL`)
- `@vassembly/ui-api-hooks` — `TaskDto`, `TaskStatus`, future `useTask(id)`

---

## 11. Design Tokens & Styling Reference

### 11.1 SCSS import

```scss
@import '@vassembly/ui-system-design/theme/src/tokens/index.scss';
```

### 11.2 Spacing (most used)

| Token | rem | Use |
|-------|-----|-----|
| `$spacing-2` | 0.5 | Icon gap, tight stacks |
| `$spacing-3` | 0.75 | List-like gaps |
| `$spacing-4` | 1rem | Section inner, mobile page padding |
| `$spacing-6` | 1.5rem | Section gap, card padding |
| `$spacing-8` | 2rem | Top offset below app chrome (if needed) |

### 11.3 Border radius

| Token | Use |
|-------|-----|
| `$border-radius-lg` | `sectionCard`, skeleton blocks |
| `$border-radius-md` | Skeleton headline |
| `$border-radius-card` | Optional timeline row inset |

### 11.4 Elevation

- No drop shadows on static cards.
- Optional Phase 2 timeline: ambient glow on hover N/A (static v1).
- Floating snackbar per `ui-snackbar` defaults.

### 11.5 Motion

- Section reveal (Phase 2 timeline): `opacity` + `translateY(8px)` over **300ms** `cubic-bezier(0.22, 1, 0.36, 1)`.
- Reduced motion: instant show.

---

## 12. Phase 1 vs Phase 2 vs Phase 3

| Element | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Route + auth + back nav | ✅ | — | — |
| GraphQL `task(id)` | ✅ | — | — |
| H1 / title display | ✅ | — | AI generating/failed states |
| Full description | ✅ | — | — |
| Metadata (status, dates, unassigned) | ✅ | — | Agent name + link TBD |
| Header status badge | ✅ | — | — |
| Timeline section | ❌ hidden | ✅ synthetic lazy | ✅ real events API |
| TaskList → detail nav | ✅ | — | — |
| Snackbar errors | ✅ | — | — |
| `updatedAt` row | Optional ✅ | — | — |
| Tag vs icon status | Icon (default) | — | Product may unify |

---

## 13. Visual Mockups (ASCII)

### 13.1 Desktop (Phase 1 — single column)

```
┌──────────────────────────────────────────────────────────────────┐
│  App drawer + main content area (surface #1a1a1e)                │
│                                                                  │
│   ← Back to tasks                          [◷ In progress]      │
│                                                                  │
│   Fix login redirect loop after OAuth                            │  ← H1 (title)
│                                                                  │
│   DESCRIPTION                                                    │  ← label, primary, tracked
│   User reports that after Google OAuth the app sends them to     │
│   /login again instead of home. Repro on Safari iOS…             │  ← body1, full wrap
│                                                                  │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │  DETAILS                                    (sectionCard) │ │
│   │  Status          [◷ In progress]                          │ │
│   │  Created         Mar 12, 2026, 3:45 PM                    │ │
│   │  Last updated    Mar 12, 2026, 4:10 PM                    │ │
│   │  Assigned agent  Unassigned                                 │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   max-width: 42rem                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 13.2 Desktop (optional split — not Phase 1 PRD)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to tasks                         [✓ Done]              │
│  H1 title                                                       │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │ DESCRIPTION (full text)     │  │ DETAILS (sticky card)   │ │
│  │                             │  │ Status / dates / agent  │ │
│  └─────────────────────────────┘  └─────────────────────────┘ │
│  ACTIVITY (Phase 2, full width below)                           │
└────────────────────────────────────────────────────────────────┘
```

### 13.3 Mobile (stacked)

```
┌─────────────────────────┐
│ ← Back to tasks         │
│ [◷ In progress]         │  ← status wraps below if needed
│                         │
│ Task details            │  ← H1 when no title
│                         │
│ DESCRIPTION             │
│ No description          │
│                         │
│ ┌─────────────────────┐ │
│ │ DETAILS             │ │
│ │ Status              │ │
│ │   [◷ In progress]   │ │
│ │ Created             │ │
│ │   Mar 12, 2026…     │ │
│ │ Assigned agent      │ │
│ │   Unassigned        │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 13.4 Timeline (Phase 2)

```
  ACTIVITY
  ┌──────────────────────────────────────┐
  │  ●── Task created                    │
  │  │   Mar 12, 2026, 3:45 PM          │
  │  │                                   │
  │  ●── Status: In progress             │
  │      Mar 12, 2026, 4:10 PM           │
  └──────────────────────────────────────┘
```

### 13.5 Loading skeleton

```
  [████████████░░░░░░░░]  ← back
  [████████████████░░░░]  ← H1
  DESCRIPTION
  [████████████████████]
  [█████████████████░░░]
  [██████████████░░░░░░]
  ┌─────────────────────┐
  │ [████] [████████░░] │
  │ [████] [██████░░░░] │
  │ [████] [████████░░] │
  └─────────────────────┘
```

### 13.6 Empty / error states

**No title:** H1 “Task details”; no extra gray placeholder box.

**No description:**
```
  DESCRIPTION
  No description          ← body2, $color-text-secondary
```

**Not found:**
```
  Task not found
  This task may have been removed or you do not have access.
  [ Back to tasks ]
```

**Fetch error:** Snackbar “Could not load task” + [ Try again ] [ Back to tasks ]

---

## 14. Developer Handoff

### 14.1 Implementation order

1. `task(id)` hook + `useTaskDetailPage` phased union: `loading | ready | error | notFound`
2. `TaskDetailSkeleton` + `ProtectedAuthRoute`
3. `TaskDetailHeader` (back, status, H1)
4. `TaskDetailDescription`
5. `TaskDetailMetadata` in `sectionCard`
6. Wire TaskList `onClick` → `/tasks/[id]`
7. Phase 2: `TaskDetailTimeline` deferred mount + synthetic events

### 14.2 Do / Don’t

| Do | Don’t |
|----|-------|
| Reuse `taskStatusDisplay` | Invent new status colors |
| Hide summary when no `title` | Show “No AI summary” in Phase 1 |
| GraphQL for task read | REST GET for task |
| Match TaskList empty description copy | Different empty string |
| 42rem content column | Full-bleed ultra-wide text lines |
| Tonal `sectionCard` | Heavy borders between sections |

### 14.3 `data-testid` suggestions

| Element | id |
|---------|-----|
| Back | `task-detail-back` |
| H1 | `task-detail-title` |
| Description | `task-detail-description` |
| Status | `task-detail-status` |
| Metadata card | `task-detail-metadata` |
| Skeleton | `task-detail-skeleton` |
| Timeline | `task-detail-timeline` (Phase 2) |

---

## 15. Open Design Decisions (product / engineering)

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | H1 = `title` vs fixed “Task details” when title exists | **H1 = title**; improves bookmarkability and SR context |
| 2 | Duplicate status in header and metadata | **Header only** to reduce noise; metadata starts at Created |
| 3 | Desktop two-column metadata aside | **Defer** — ship PRD single column; revisit if analytics show wide viewport |
| 4 | `Tag` pill vs TaskList icon row | **Icon row** for list parity |
| 5 | Show raw `agentAssignedId` in Phase 1 | **No** — “Unassigned” only; avoid exposing UUIDs |
| 6 | `updatedAt` when === `createdAt` | **Hide Last updated row** |
| 7 | Date format: `toLocaleString` vs short date | **`toLocaleString`** for consistency with system agent form |
| 8 | Dedicated `not-found.tsx` | **Inline error phase** in page shell (agent edit pattern) |
| 9 | Include `task.type` in metadata | **Out of scope** Phase 1 |
| 10 | Link agent to `/agents/[id]/edit` | **Phase 3** — confirm with product |

---

## 16. Accessibility Checklist (copy for QA)

- [ ] H1 present in all title/null combinations
- [ ] Back link keyboard operable, visible focus
- [ ] Status has text label at 4 statuses
- [ ] Empty description announced
- [ ] Unassigned agent text present
- [ ] Loading skeleton → content swap without focus loss on back link
- [ ] Error state: no foreign task fields
- [ ] Snackbar errors exposed to AT
- [ ] 16px minimum body text on 320px viewport
- [ ] Color contrast AA on metadata card
- [ ] Phase 2 timeline: static text, no false interactive roles

---

*End of design specifications.*
