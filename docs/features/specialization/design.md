# Specialization Admin — UI/UX Design Specification

**Status:** Draft for engineering handoff  
**Related PRD:** [`prd.md`](./prd.md)  
**Related specs:** [System Agent](../system-agent/design.md) · [MCP Configuration Management](../mcp-configuration-management/design.md)  
**Design system:** [Synthetic Luminal](/.cursor/rules/design.md) · Theme tokens: `ui/system-design/theme/src/tokens/`

---

## Phase 1.1 — Design Deltas

> Changes to the original design spec introduced in Phase 1.1. Sections below are updated in-place with `[Δ]` markers where affected.

### Δ-1: Dynamic Agents Panel (§5.4 replacement)

**Replaces:** Fixed 3-slot Researcher / Worker / Validator panel  
**New design:** Dynamic list of all agents linked to the specialization

The agents panel no longer renders a fixed set of role slots. Instead, it shows a flat list of all system agents where `agent.specializationId === specialization.id`, ordered by agent name.

**Panel layout change:**

```
┌─ Linked Agents ──────────────┐
│  Text variant="h2"           │
│                              │
│  ┌──────────────────────────┐│
│  │ Legal researcher         ││  ← agent name (body1)
│  │ [Active]      View →     ││  ← status Tag + link
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ Legal worker             ││
│  │ [Active]      View →     ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ Legal validator          ││
│  │ [Active]      View →     ││
│  └──────────────────────────┘│
│  (empty: "No agents linked…") │
└──────────────────────────────┘
```

**Removed:** role label row (Researcher / Worker / Validator above the agent name)  
**Removed:** "Not provisioned" slot for missing roles — no empty slot rendering  
**Added:** Empty state text `"No agents linked to this specialization."` when list is empty

**Component changes:**
- `SpecializationAgentsPanel`: accepts `agents: AgentItem[]` (was `agents: AgentSlot[]`)
- `SpecializationAgentSlot` → renamed to `SpecializationAgentItem`
- `SpecializationAgentItem` renders: name (body1) + status Tag + View link — no role label
- `AGENT_SLOT_ROLES` constant removed from `constants.ts`

**Copy table update for §10.3:**

| Key | String | Status |
|---|---|---|
| `detail.agents.role.researcher` | ~~`Researcher`~~ | **Removed** |
| `detail.agents.role.worker` | ~~`Worker`~~ | **Removed** |
| `detail.agents.role.validator` | ~~`Validator`~~ | **Removed** |
| `detail.agents.notProvisioned` | ~~`Not provisioned`~~ | **Removed** |
| `detail.agents.empty` | `No agents linked to this specialization.` | **New** |

---

### Δ-2: Task Detail — Linked Specializations section (new §5.6)

**New section on the task detail page** (admin-only):

```
┌─ Specializations ────────────────────────────────────┐
│  [Legal ×]  [Engineering ×]                          │  ← Tag chips, linked
└──────────────────────────────────────────────────────┘
```

- Rendered **only** when `task.specializationIds?.length > 0` AND user has admin role
- Location: below task metadata, before LLM response
- Each specialization shown as a `Tag` component with a link to `/specialization/{id}`
- Tag label: `titleCase(specialization.name)`
- Section title: `Text variant="label-sm"` → `SPECIALIZATIONS` (overline style, matches CATALOG pattern)

**Copy:**

| Key | String |
|---|---|
| `task.detail.specializations.title` | `SPECIALIZATIONS` |

---

### Δ-3: MCP Detail — Linked Specializations section (new §5.7)

**New section on the MCP detail/admin page** (admin context only):

```
┌─ Linked Specializations ─────────────────────────────┐
│  [Legal →]  [Engineering →]                          │  ← Tag chips or links
└──────────────────────────────────────────────────────┘
```

- Rendered **only** when `mcp.specializationIds?.length > 0`
- Location: in the MCP detail admin view, alongside existing metadata panels
- Same Tag + link pattern as task detail (above)

**Copy:**

| Key | String |
|---|---|
| `mcp.detail.specializations.title` | `Linked Specializations` |
| `mcp.detail.specializations.empty` | — (section hidden when empty) |

---

### Δ-4: QA Visual Checklist additions (§12)

Add to the existing checklist:

- [ ] Specialization agents panel: dynamic list (not fixed 3 slots); all agents shown
- [ ] Specialization agents panel: empty state `"No agents linked…"` when `agents.length === 0`
- [ ] Task detail (admin): shows SPECIALIZATIONS section with name chips when `specializationIds` non-empty
- [ ] Task detail (non-admin or empty specializationIds): no SPECIALIZATIONS section visible
- [ ] MCP detail (admin): shows Linked Specializations section when `specializationIds` non-empty
- [ ] MCP detail: section hidden when `specializationIds` is empty

---

## 1. Design Rationale

### Problem

Platform operators need visibility into the AI-managed domain taxonomy — which specializations exist, what agents were provisioned for each domain, and which MCPs were mapped — without the ability to mutate catalog data in Phase 1.

### Approach

Deliver a **read-only admin catalog** that mirrors the proven MCP discover list + detail pattern (`apps/web/app/mcps/`). Specializations are observational infrastructure: the UI should feel like an audit console, not a management form. No create, edit, or delete affordances anywhere.

### Design principles applied

| Principle | Application |
|-----------|-------------|
| Pattern reuse over novelty | List/detail shell, search debounce, pagination footer, skeletons, and error states follow MCP catalog implementations |
| Tonal stacking over borders | Page sections and detail panels use `surface-container` / `surface-container-low` nesting; avoid divider lines between list items |
| Primary accent restraint | Blue (`primary`) for links, focus rings, and pagination active state only — one accent per screen |
| Editorial hierarchy | Space Grotesk for page title and specialization name; Inter for descriptions, counts, and metadata |
| Read-only clarity | Absence of toolbar CTAs is intentional; no ghost buttons or disabled edit controls that imply future actions |
| Admin-only visibility | Drawer link and routes gated to `role === admin`; non-admins never see navigation entry |

### Phasing alignment

| Phase | UI deliverable |
|-------|----------------|
| **1 (this spec)** | Admin list + detail; drawer nav; GraphQL reads only |
| 2 | No UI change (worker routing is backend) |
| 3 | End-user specialization tags on task detail (separate spec) |
| 4 | Admin create/edit/merge tooling (new affordances; out of scope here) |

---

## 2. Information Architecture & Routes

| Audience | Route | Purpose |
|----------|-------|---------|
| Admin | `/specialization` | Paginated, searchable specialization catalog |
| Admin | `/specialization/[id]` | Detail: metadata, linked agents, mapped MCPs |
| Non-admin | — | No drawer link; direct URL → forbidden state |

**File structure (recommended)**

```
apps/web/app/specialization/
  page.tsx                          # Route + ProtectedAuthRoute
  SpecializationsPageView.tsx
  SpecializationsPageView.module.scss
  _components/
  SpecializationListContainer/
    SpecializationListContainer.tsx
    SpecializationListContainer.module.scss
    SpecializationListItem/
    SpecializationSearchBar/
    SpecializationListEmptyState/
    SpecializationsSkeleton/
    useSpecializationList.ts
    constants.ts
  [id]/
    page.tsx
    _components/
      SpecializationDetailHeader/
      SpecializationAgentsPanel/
      SpecializationMcpsPanel/
      SpecializationDetailSkeleton/
      SpecializationNotFoundMessage/
      SpecializationDetailPage.module.scss
```

**Auth gates**

```tsx
const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/specialization')}`;
const ADMIN_FORBIDDEN_MESSAGE =
  'Specialization management is available to administrators only.';

<ProtectedAuthRoute
  requireAuthenticated
  redirectPath={LOGIN_ROUTE}
  roles={['admin']}
  loadingFallback={<SpecializationsSkeleton />}
  forbiddenFallback={
    <main className={styles.sectionCard}>
      <Text variant="body1">{ADMIN_FORBIDDEN_MESSAGE}</Text>
    </main>
  }
>
  {children}
</ProtectedAuthRoute>
```

Mirror: `apps/web/app/agents/system-agents/create/page.tsx`.

---

## 3. Navigation Integration

### 3.1 Drawer placement

Add **Specializations** as the **last item** in the existing **Workspace** section (same section as Agents and MCPs). Visible only when the user is authenticated **and** `role.trim().toLowerCase() === 'admin'`.

```
┌─ Workspace ─────────────────┐
│  Home                       │
│  Agents                     │
│  MCPs                       │
│  Specializations            │   ← admin only, last item in section
└─────────────────────────────┘
```

**Implementation touchpoints**

| File | Change |
|------|--------|
| `ui/components/layout/src/presets/main.tsx` | Extend `BuildMainDrawerSectionsParams` with `isAdmin?: boolean`; append Specializations link after MCPs when `isAuthenticated && isAdmin` |
| `ui/components/layout/src/resolveLayoutConfig.ts` | Pass `isAdmin` derived from `drawer.userRole` |
| `apps/web/lib/layout/AuthLayout.tsx` | Already passes `userRole: user?.role` — no change needed once preset reads it |

### 3.2 Drawer item specification

| Property | Value |
|----------|-------|
| `id` | `specializations` |
| `kind` | `link` |
| `label` | `Specializations` |
| `href` | `/specialization` |
| `icon` | `TagsIcon` from `@vassembly/ui-icons` |
| Visibility | Admin role only; hidden for unauthenticated and non-admin users |
| Active state | `currentPath` starts with `/specialization` |

`TagsIcon` fits domain taxonomy without competing with Agents (`TeamMeetingChatIcon`) or MCPs (`SearchIcon`). Alternative: `AwardBadgeStarIcon` if product prefers a “curated domain” metaphor.

### 3.3 Admin gating layers

1. **Drawer** — link not rendered for non-admins (discoverability).
2. **Route** — `ProtectedAuthRoute` with `roles={['admin']}` (access control).
3. **API** — GraphQL queries return 403 for non-admin (data layer; outside UI scope).

Non-admin direct navigation shows the same `forbiddenFallback` copy as system agent create routes — no redirect to login if already authenticated.

---

## 4. List Page — `/specialization`

### 4.1 Layout wireframe (desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Drawer Nav]                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Specializations                     ← Text variant="h1", Space Grotesk     │
│  AI-generated domain tags and their linked agents and MCPs.  ← body2 muted  │
│                                                                             │
│  ┌─ CATALOG ─────────────────────────────────────────────────────────────┐  │
│  │  [🔍 Search specializations…………………]  [✕ clear]                       │  │
│  │                                                                       │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐ │  │
│  │  │ legal              │  │ engineering        │  │ finance         │ │  │
│  │  │ Covers legal rese… │  │ Software develop…  │  │ Financial analy…│ │  │
│  │  │ 3 agents · 2 MCPs  │  │ 3 agents · 5 MCPs  │  │ 2 agents · 0 MCPs│ │
│  │  │ Created 2 days ago │  │ Created 1 week ago │  │ Created 3 days ago│ │  │
│  │  └────────────────────┘  └────────────────────┘  └─────────────────┘ │  │
│  │                                                                       │  │
│  │  (empty / loading / error states — see §4.4)                          │  │
│  │                                                                       │  │
│  │  Showing 1–20 of 42 total                        [◀ 1 2 3 ▶]         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  (no Create button, no row actions menu)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Layout wireframe (mobile)

```
┌──────────────────────────┐
│ Specializations          │
│ Subtitle (body2)         │
│                          │
│ CATALOG                  │
│ [Search…………………]          │
│ ┌──────────────────────┐ │
│ │ legal                │ │
│ │ Description (clamp)  │ │
│ │ 3 agents · 2 MCPs    │ │
│ │ Created 2 days ago   │ │
│ └──────────────────────┘ │
│ (single-column cards)    │
│ Showing 1–20 of 42       │
│ [Pagination]             │
└──────────────────────────┘
```

### 4.3 List item fields

| Field | Source | Display | Notes |
|-------|--------|---------|-------|
| Name | `specialization.name` | `Text variant="h3"` | Title-cased for display if stored lowercase (e.g. `legal` → `Legal`) |
| Description | `specialization.description` | `Text variant="body2"`, truncated 80 chars + ellipsis | CSS line-clamp or util truncate |
| Agent count | derived from `agentIds.length` | `"{n} agent"` / `"{n} agents"` | Pluralize at 1 vs other |
| MCP count | derived from `mcpIds.length` | `"{n} MCP"` / `"{n} MCPs"` | Middle dot separator: `3 agents · 2 MCPs` |
| Created date | `specialization.createdAt` | Relative time via `formatRelativeTime` | Reuse `apps/web/app/tasks/[id]/lib/formatRelativeTime.ts` or extract to shared util |

**Row interaction**

- Entire card is a navigable `<a href="/specialization/{id}">` with `router.push` on click — same pattern as `McpListItem`.
- `aria-label`: `View specialization {name}`.
- Hover: border shifts to `$color-primary`; focus-visible: 2px primary outline (reuse `McpListItem.module.scss` card styles).
- No overflow menu, checkboxes, or inline action buttons.

### 4.4 Search behavior

| Rule | Value |
|------|-------|
| Component | `SpecializationSearchBar` — clone of `McpSearchBar` with specialization-specific placeholder |
| Debounce | 300 ms via `useDebouncedValue` (`apps/web/lib/hooks/useDebouncedValue.ts`) |
| Min characters | 1 — API call includes `search` only when `trimmedSearch.length >= 1` |
| Reset page | Setting search resets `page` to 0 |
| Clear control | Trailing `CloseIcon` button, `aria-label="Clear search"` |
| Disabled while loading | `isDisabled={loading}` on `TextField` |
| Accessible name | `aria-label="Search specializations"` on the search `TextField` |

**URL state preservation (for back navigation from detail)**

Persist `?search={query}&page={n}` in the list URL when filters are active. Detail back link returns to `/specialization` with query string intact. Hook reads initial state from `useSearchParams()` on mount.

### 4.5 Pagination

| Rule | Value |
|------|-------|
| Page size | 20 (`SPECIALIZATION_LIST_PAGE_SIZE`) |
| Component | `Pagination` from `@vassembly/ui-pagination` |
| `ariaLabel` | `"Specialization list pagination"` |
| Previous/Next | Inherit accessible labels from `Pagination` component |
| Range text | `Text variant="body2"`: `Showing {rangeStart}–{rangeEnd} of {total} total` |
| Hide pagination | When `totalPages < 2` (same as MCP list) |
| Page index | 0-based internally; `Pagination` receives `currentPage = page + 1` |

### 4.6 States

| State | Trigger | UI |
|-------|---------|-----|
| **Loading** | Initial fetch or page/search change | `Loader` with `ariaLabel="Loading specializations"` **or** skeleton card grid (`SpecializationsSkeleton` — mirror `McpsSkeleton`) |
| **Ready** | `items.length > 0` | Card grid |
| **Empty (catalog)** | `total === 0` and no active search | `SpecializationListEmptyState` variant `no-specializations` |
| **Empty (search)** | `total === 0` and search active | `SpecializationListEmptyState` variant `no-results` with interpolated query |
| **Error** | GraphQL/network failure | `Alert variant="error"` + retry `Button` (`variant="outlined"`, text `"Try again"`) |

**Skeleton spec** (`SpecializationsSkeleton`)

- Page title skeleton (120px × 32px)
- Search bar skeleton (100% × 40px)
- 6 card skeletons in responsive grid (`repeat(auto-fill, minmax(18rem, 1fr))`)

### 4.7 Visual specifications

| Element | Token / class | Notes |
|---------|---------------|-------|
| Page root | `main.pageStack`, `gap: $spacing-6` | `SpecializationsPageView.module.scss` |
| Page header | `header.pageHeader`, `gap: $spacing-2` | h1 + optional subtitle |
| Catalog section | `section` with `aria-label="Catalog"` | Overline: `Text variant="label-sm"` uppercase `"CATALOG"` in `$color-primary` |
| Card grid | `.grid`: `repeat(auto-fill, minmax(18rem, 1fr))`, `gap: $spacing-4` | Match `McpListContainer.module.scss` |
| Card surface | `background: $color-surface-container`, `border-radius: $border-radius-lg` | Reuse MCP card hover/focus transitions |
| Metadata row | `Text variant="caption"`, `$color-text-secondary` | Counts + created date on one line |
| Footer | `.footer`: centered column, `gap: $spacing-3` | Count above pagination |

---

## 5. Detail Page — `/specialization/[id]`

### 5.1 Layout wireframe (desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Specializations          ← Link, $color-primary                   │
│                                                                             │
│  Legal                               ← Text variant="h1"                    │
│  Covers legal research, contract drafting, regulatory compliance, and       │
│  related tasks.                      ← Text variant="body2", full description │
│  Created 2 days ago                  ← Text variant="caption", secondary    │
│                                                                             │
│  ┌─ Linked Agents ──────────────┐  ┌─ Mapped MCPs ──────────────────────┐ │
│  │  Text variant="h2"           │  │  Text variant="h2"                  │ │
│  │                              │  │                                     │ │
│  │  Researcher                  │  │  ┌──────────────────────────────┐  │ │
│  │  Legal researcher            │  │  │ [icon] Court records MCP     │  │ │
│  │  [Active]         View →     │  │  │ court-records                │  │ │
│  │                              │  │  └──────────────────────────────┘  │ │
│  │  Worker                      │  │  ┌──────────────────────────────┐  │ │
│  │  Legal worker                │  │  │ [icon] Doc parser MCP        │  │ │
│  │  [Active]         View →     │  │  │ doc-parser                   │  │ │
│  │                              │  │  └──────────────────────────────┘  │ │
│  │  Validator                   │  │                                     │ │
│  │  Not provisioned             │  │  (empty: "No MCPs mapped…")         │ │
│  │  [Not provisioned]           │  │                                     │ │
│  └──────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                             │
│  (no Edit, Delete, or Configure buttons)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Layout wireframe (mobile)

```
┌──────────────────────────┐
│ ← Back to Specializations│
│ Legal                    │
│ Full description…        │
│ Created 2 days ago       │
│                          │
│ Linked Agents            │
│ (stacked agent slots)    │
│                          │
│ Mapped MCPs              │
│ (stacked MCP cards)      │
└──────────────────────────┘
```

Panels stack vertically below `$media-mobile-only`; side-by-side `grid-template-columns: 1fr 1fr` on desktop with `gap: $spacing-6`.

### 5.3 Metadata header (`SpecializationDetailHeader`)

| Element | Component | Notes |
|---------|-----------|-------|
| Back link | `Link` from `next/link` | `href` includes preserved list query string; label: `"Back to Specializations"` |
| Name | `Text variant="h1" as="h1"` | Display-formatted name |
| Description | `Text variant="body2"` | Full text, no truncation |
| Created | `Text variant="caption"` | `Created {relativeTime}` |

No status badge on the specialization itself (immutable, always active in Phase 1).

### 5.4 Agents panel (`SpecializationAgentsPanel`)

**Title:** `Linked Agents` — `Text variant="h2" as="h2"`

**Fixed slots (always render 3 rows in this order)**

| Slot label | Expected agent name pattern | Link when provisioned |
|------------|----------------------------|------------------------|
| Researcher | `{Name} researcher` | `/agents/system-agents/{agentId}/edit` via `systemAgentEditPath(id)` |
| Worker | `{Name} worker` | same |
| Validator | `{Name} validator` | same |

**Row layout (per slot)**

```
┌─────────────────────────────────────────────────────┐
│  Researcher                    ← label-sm, secondary  │
│  Legal researcher              ← body1, or em dash    │
│  [Active]            View →    ← Tag + text link      │
└─────────────────────────────────────────────────────┘
```

| Agent state | Name display | Status badge | Action |
|-------------|--------------|--------------|--------|
| Provisioned + active | Agent name | `Tag size="small" variant="success"` → `"Active"` | `Link` text `"View"` → system agent edit page |
| Provisioned + archived/disabled | Agent name | `Tag` with `getSystemAgentStatusVariant` | `"View"` link still available |
| Not provisioned | `—` | `Tag size="small" variant="warning"` → `"Not provisioned"`, `role="status"` | No link |

Reuse status helpers from `apps/web/app/agents/_components/PlatformAgentsSection/tags.ts`.

**Panel container:** `background: $color-surface-container-low`, `padding: $spacing-6`, `border-radius: $border-radius-lg`, `display: flex; flex-direction: column; gap: $spacing-4`.

Slot rows separated by `$spacing-4` vertical gap — no divider lines.

### 5.5 MCPs panel (`SpecializationMcpsPanel`)

**Title:** `Mapped MCPs` — `Text variant="h2" as="h2"`

**MCP item layout** (read-only card row, not clickable to MCP config in Phase 1 — optional link to `/mcps/{id}` for cross-navigation)

```
┌──────────────────────────────────────────┐
│  [icon 40×40]  Court records MCP         │  ← body1
│                court-records             │  ← caption, secondary (slug)
│                Description if loaded…    │  ← body2, optional 2-line clamp
└──────────────────────────────────────────┘
```

| Field | Display |
|-------|---------|
| Icon | `<img src={mcp.iconPath} alt="" />` when available; omit icon container when missing |
| Name | `mcp.name` |
| Slug | `mcp.slug` in caption style |
| Description | Optional secondary line if resolved from MCP query |

**Empty state:** `Text variant="body2"`: `"No MCPs mapped to this specialization yet."`

**MCP row link (recommended):** Wrap name in `Link href="/mcps/{id}"` for admin cross-audit; external navigation opens MCP detail in same tab. Use `stopPropagation` only if row becomes composite later.

### 5.6 Detail states

| State | UI |
|-------|-----|
| **Loading** | `SpecializationDetailSkeleton` — header skeleton + two panel skeletons (mirror `McpDetailSkeleton`) |
| **Not found** | `SpecializationNotFoundMessage` — h1 `"Specialization not found."` + back link (mirror `McpNotFoundMessage`) |
| **Error** | `Alert variant="error"` message `"Failed to load specialization details."` + `"Try again"` button |
| **Ready** | Header + two panels |

---

## 6. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥768px) | 2-column detail panels; multi-column list grid (`minmax(18rem, 1fr)`) |
| Mobile (`$media-mobile-only`) | Single-column list grid; stacked detail panels; search bar full width |
| Toolbar | No secondary filters in Phase 1 — search only; no horizontal scroll |
| Touch targets | Cards and back link meet 44×44px minimum via padding |
| Typography | No scale reduction — rely on wrapping and line-clamp |

`data-layout="mobile" | "desktop"` attribute on detail `main` (optional, matches MCP detail pattern in `useIsMobileLayout`).

---

## 7. Component Reuse Map

### 7.1 Reuse directly (no changes)

| Component | Package / path | Usage |
|-----------|----------------|-------|
| `Text` | `@vassembly/ui-text` | All headings, body, captions |
| `TextField` | `@vassembly/ui-text-field` | Search input |
| `Pagination` | `@vassembly/ui-pagination` | List footer |
| `Loader` | `@vassembly/ui-loader` | List/panel loading |
| `Skeleton` | `@vassembly/ui-skeleton` | Page skeletons |
| `Alert` | `@vassembly/ui-alert` | Error banners |
| `Tag` | `@vassembly/ui-tag` | Agent status, not-provisioned |
| `Button` | `@vassembly/ui-button` | Retry only |
| `ProtectedAuthRoute` | `apps/web/lib/auth/ProtectedAuthRoute.tsx` | Route guard |
| `useDebouncedValue` | `apps/web/lib/hooks/useDebouncedValue.ts` | Search debounce |
| `formatRelativeTime` | `apps/web/app/tasks/[id]/lib/formatRelativeTime.ts` | Created dates |
| `systemAgentEditPath` | `apps/web/app/agents/systemAgentRoutes.ts` | Agent detail links |
| `getSystemAgentStatusLabel` / `getSystemAgentStatusVariant` | `PlatformAgentsSection/tags.ts` | Agent status tags |
| `CloseIcon`, `TagsIcon`, `SearchIcon`, `BookOpenTextIcon` | `@vassembly/ui-icons` | Search clear, drawer, empty states |

### 7.2 Adapt from existing (copy + rename)

| Source | New component | Changes |
|--------|---------------|---------|
| `McpListContainer` | `SpecializationListContainer` | Remove tag filter; wire `useSpecializationList` GraphQL hook |
| `McpSearchBar` | `SpecializationSearchBar` | Placeholder + `aria-label` only |
| `McpListItem` | `SpecializationListItem` | Replace icon/tags/links with counts + created date |
| `McpListEmptyState` | `SpecializationListEmptyState` | New copy variants |
| `McpsSkeleton` | `SpecializationsSkeleton` | Drop second toolbar skeleton |
| `McpNotFoundMessage` | `SpecializationNotFoundMessage` | Copy + back href |
| `McpDetailSkeleton` | `SpecializationDetailSkeleton` | Two-panel skeleton |

### 7.3 New components

| Component | Responsibility |
|-----------|----------------|
| `SpecializationAgentsPanel` | Fixed 3-slot agent display with role labels |
| `SpecializationAgentSlot` | Single slot row (label, name, status, link) |
| `SpecializationMcpsPanel` | MCP list for specialization |
| `SpecializationMcpListItem` | Icon + name + slug + description |
| `SpecializationDetailHeader` | Back link + metadata (simpler than `McpDetailHeader` — no status badge on entity) |
| `useSpecializationList` | Pagination + debounced search state machine |
| `useSpecializationDetail` | Detail query + agent/MCP resolution |

### 7.4 Explicitly not used (Phase 1)

| Component | Reason |
|-----------|--------|
| `Table` / `ColumnDef` | Card grid matches MCP discover pattern per PRD FR-UI-9 |
| `Button` create CTAs | Read-only Phase 1 |
| `SystemAgentForm` | No edit |
| `McpConfigForm` | No MCP configuration on this page |
| `Dropdown` / `MultiSelect` | No filters beyond search |

---

## 8. SCSS & Styling Conventions

### 8.1 Module structure

- Co-located `ComponentName.module.scss` per component folder.
- Page-level: `SpecializationsPageView.module.scss`, `SpecializationDetailPage.module.scss`.
- Import tokens: `@import '@vassembly/theme/src/tokens/index.scss';`

### 8.2 Recurring layout classes

| Class | Definition | Source reference |
|-------|------------|------------------|
| `.pageStack` | `flex column; gap: $spacing-6` | `McpsPageView.module.scss` |
| `.pageHeader` | `flex column; gap: $spacing-2` | `McpsPageView.module.scss` |
| `.sectionCard` | Padded tonal block for forbidden fallback | `SystemAgentCreatePage.module.scss` |
| `.grid` | Responsive card grid | `McpListContainer.module.scss` |
| `.footer` | Centered pagination block | `McpListContainer.module.scss` |
| `.toolbar` | Search row | `McpListContainer.module.scss` |
| `.panel` | Detail side panel | New; `surface-container-low` + `$spacing-6` padding |
| `.panelsRow` | `display: grid; grid-template-columns: 1fr 1fr; gap: $spacing-6` | New; collapses on mobile |
| `.backLink` | Primary color link | `McpDetailPageStates.module.scss` |
| `.emptyState` | Centered icon + message | `McpListEmptyState.module.scss` |

### 8.3 Card styling

Reuse `McpListItem.module.scss` card rules:

- `background-color: $color-surface-container`
- `border: 1px solid $color-outline` (existing MCP pattern; ghost border acceptable per implementation precedent)
- Hover: `border-color: $color-primary`
- Focus-visible: `outline: 2px solid $color-primary; outline-offset: 2px`
- Transition: `300ms` with `cubic-bezier(0.22, 1, 0.36, 1)` for hover states

### 8.4 Typography tokens

| Usage | Variant |
|-------|---------|
| Page title | `h1` |
| Section title (panels) | `h2` |
| Card name | `h3` |
| Description | `body2` |
| Subtitle under page title | `body2` + `$color-text-secondary` |
| Counts / dates | `caption` + `$color-text-secondary` |
| Section overline "CATALOG" | `label-sm` + primary color + uppercase |

### 8.5 Motion

- Search results: no layout animation on filter (instant swap).
- Card hover: 300ms border-color transition.
- Skeleton → content: no fade required (match MCP pages).

---

## 9. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Heading hierarchy | One `h1` per page; panel titles are `h2`; card names are `h3` inside list links |
| Keyboard navigation | List cards are focusable links; pagination keyboard-operable via `Pagination` |
| Search label | `aria-label="Search specializations"` on `TextField` |
| Pagination | `ariaLabel="Specialization list pagination"` on `Pagination` |
| Loading | `Loader` with descriptive `ariaLabel`; skeleton pages don't trap focus |
| Not provisioned | `role="status"` on the `"Not provisioned"` `Tag` |
| Empty states | Icon `aria-hidden`; message in visible `Text` |
| Back link | Descriptive text `"Back to Specializations"` — not icon-only |
| Color contrast | Status tags use existing `Tag` variants (tested in design system) |
| Reduced motion | Respect `prefers-reduced-motion` for hover transitions (inherit global theme behavior) |

---

## 10. Copy & User-Facing Strings

### 10.1 Navigation

| Key | String |
|-----|--------|
| `nav.adminSection` | `Admin` |
| `nav.specializations` | `Specializations` |

### 10.2 List page

| Key | String |
|-----|--------|
| `list.title` | `Specializations` |
| `list.subtitle` | `AI-generated domain tags and their linked agents and MCPs.` |
| `list.sectionLabel` | `CATALOG` |
| `list.searchPlaceholder` | `Search specializations` |
| `list.searchAriaLabel` | `Search specializations` |
| `list.clearSearch` | `Clear search` |
| `list.agentCount.one` | `{n} agent` |
| `list.agentCount.other` | `{n} agents` |
| `list.mcpCount.one` | `{n} MCP` |
| `list.mcpCount.other` | `{n} MCPs` |
| `list.created` | `Created {relativeTime}` |
| `list.range` | `Showing {start}–{end} of {total} total` |
| `list.empty.catalog` | `No specializations have been created yet. They are generated automatically as users submit tasks.` |
| `list.empty.search` | `No specializations match "{query}".` |
| `list.error` | `Failed to load specializations.` |
| `list.retry` | `Try again` |
| `list.cardAriaLabel` | `View specialization {name}` |

### 10.3 Detail page

| Key | String |
|-----|--------|
| `detail.back` | `Back to Specializations` |
| `detail.created` | `Created {relativeTime}` |
| `detail.agents.title` | `Linked Agents` |
| `detail.agents.role.researcher` | `Researcher` |
| `detail.agents.role.worker` | `Worker` |
| `detail.agents.role.validator` | `Validator` |
| `detail.agents.notProvisioned` | `Not provisioned` |
| `detail.agents.view` | `View` |
| `detail.mcps.title` | `Mapped MCPs` |
| `detail.mcps.empty` | `No MCPs mapped to this specialization yet.` |
| `detail.notFound` | `Specialization not found.` |
| `detail.error` | `Failed to load specialization details.` |
| `detail.retry` | `Try again` |

### 10.4 Auth

| Key | String |
|-----|--------|
| `auth.forbidden` | `Specialization management is available to administrators only.` |

### 10.5 Display name formatting

Store names lowercase per PRD (e.g. `legal`). Display with `titleCase(specialization.name)` for headings while keeping slug-style names in MCP/agent cross-links as returned by API.

---

## 11. Data & Hook Contracts (UI-facing)

### 11.1 List query

```graphql
specializations(search: String, page: Int, size: Int): SpecializationPage!
```

`useSpecializationList` mirrors `useMcpList`:

- `page` 0-based internally
- `search` sent only when `trimmed.length >= 1`
- `size = 20`
- Returns view model: `items`, `loading`, `errorMessage`, `currentPage`, `totalPages`, `total`, `rangeStart`, `rangeEnd`, `isEmpty`, `isFilteredEmpty`, handlers

### 11.2 Detail query

```graphql
specialization(id: ID!): Specialization
```

Detail hook resolves:

- `agentIds` → fetch agent names/status (batch or nested GraphQL field)
- `mcpIds` → fetch MCP name, slug, iconPath, description

Map agents to fixed slots by name suffix (`researcher`, `worker`, `validator`) or by explicit role metadata if API provides it.

---

## 12. QA Visual Checklist

- [ ] Drawer shows **Specializations** under **Admin** for admin only
- [ ] Non-admin: no drawer item; direct URL shows forbidden message
- [ ] List: search debounces 300ms; min 1 character triggers filtered query
- [ ] List: pagination at 20 items; range text accurate
- [ ] List: no create/edit/delete controls
- [ ] List: empty catalog vs empty search messages distinct
- [ ] Detail: three agent slots always visible; missing agent shows **Not provisioned**
- [ ] Detail: provisioned agents link to system agent edit page
- [ ] Detail: MCP panel shows name + slug (+ icon when available)
- [ ] Detail: back link preserves list search/page query params
- [ ] Loading skeletons on list and detail routes
- [ ] Error states show retry
- [ ] 404 for unknown specialization ID
- [ ] Keyboard: tab through search → cards → pagination → back link
- [ ] Mobile: single-column list; stacked detail panels

---

## 13. Out of Scope (Phase 1 UI)

| Item | Deferred |
|------|----------|
| Create / edit / delete specialization | Phase 4 |
| Merge / split tooling | Phase 4 |
| End-user task specialization tags | Phase 3 |
| Bulk selection / export | Future |
| Specialization confidence scores | Future |
| Inline MCP configuration | Use `/mcps/[id]` via optional link only |

---

*End of design spec — ready for architecture alignment and implementation.*
