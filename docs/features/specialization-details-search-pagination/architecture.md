# Architecture: Specialization Details — Search, Pagination & Row Layout

## Overview

Add per-section search, pagination, and row-style layout to the three panels on the specialization details page (`/specialization/[id]`): **Agents**, **MCPs**, and **Skills**.

Feature slug: `specialization-details-search-pagination`

---

## Analysis

### Current State

| Panel | How data is loaded today | Pagination | Search |
|-------|--------------------------|-----------|--------|
| Agents | Bundled inside `getSpecialization` handler via `systemAgentDomain.queries.getBySpecializationId` — returns all rows | None | None |
| MCPs | Bundled inside `getSpecialization` handler via `mcpDomain.queries.getList({ specializationId, page: 0, size: MAX_PAGE_SIZE })` — capped at 50 | None | None |
| Skills | Separate `skillsBySpecialization` GraphQL query; handler `listSkillsBySpecialization` — returns all rows | None | None |

### What Exists and Can Be Reused

| Artifact | Location | Reuse |
|----------|----------|-------|
| `resolvePagination` helper | `domains/specialization/src/queries/shared/pagination.ts` (mirrored in `mcp`, `system-agent`, `task`) | Use in every new paginated domain query |
| `buildNameSearchFilter` | `domains/specialization/src/queries/shared/` | Reuse for skills (name-only filter) |
| `buildNameDescriptionSearchFilter` | `domains/mcp/src/queries/shared/` (used in system-agent too) | Reuse for agents |
| MCP domain `getList` | `domains/mcp/src/queries/getList/` | **Already** supports `specializationId + page + size + search` — no domain change needed |
| `useDebouncedValue` | `apps/web/lib/hooks/useDebouncedValue.ts` | Use in all three panel hooks |
| `Pagination` component | `ui/system-design/pagination/src/Pagination.tsx` | Use in all three panels |
| `SpecializationSearchBar` pattern | `apps/web/app/specialization/_components/SpecializationListContainer/SpecializationSearchBar/` | Copy/adapt for panel search bars |
| `useSpecializationList` hook | `apps/web/app/specialization/_components/SpecializationListContainer/useSpecializationList.ts` | Reference pattern: debounce + page state + URL sync |
| `SystemAgentsList` / `McpsList` GraphQL types | `domains/system-agent/src/model/graphql.ts`, `domains/mcp/src/model/graphql.ts` | Reuse as return types for new resolvers |
| `SkillPage` type (does not exist yet) | needs creation | New — model it on `SpecializationPage` / `SystemAgentsList` |

### Gaps — What Genuinely Needs to Change

1. **`domains/system-agent`** — `getBySpecializationId` returns all rows with no pagination or search. Needs a new paginated query (following the `getAdminList` pattern in the same domain).
2. **`domains/skill`** — `getBySpecializationId` returns all rows with no pagination or search. Needs to be extended.
3. **`domains/skill` GraphQL model** — no `SkillPage` / paged response type exists yet.
4. **`services/specialization`** `getSpecialization` handler — currently bundles ALL agents + ALL MCPs eagerly. Once panels load independently, this bundling can be dropped, simplifying the handler.
5. **`services/agent`** — no handler for `listAgentsBySpecialization`. A new handler is needed (modelled on `listSystemAgents`).
6. **`services/skill`** `listSkillsBySpecialization` — handler needs `page`, `size`, `search` params forwarded.
7. **`apps/api`** GraphQL resolvers — three resolver changes needed (see Implementation Steps).
8. **`ui/api-hooks`** — new/updated query documents and hooks for all three panels.
9. **`apps/web`** — panel components refactored to own their pagination + search state, plus row-layout items.

### What Does NOT Need to Change

- `domains/mcp` — `getList` already accepts `{ specializationId, page, size, search }`.
- `domains/specialization` itself — the parent entity query stays as-is (minus the embedded `agents`/`mcps` sub-fields once panels decouple).
- The `Pagination` and `TextField` UI components — used directly.
- `useDebouncedValue` — used directly.

---

## Architecture & Package Placement

```
domains/system-agent       ← new paginated query getListBySpecializationId
domains/skill              ← extend getBySpecializationId with page/size/search; add SkillPage GQL type
services/agent             ← new handler listAgentsBySpecialization
services/specialization    ← simplify getSpecialization (remove agent/mcp eager-load)
services/skill             ← update listSkillsBySpecialization to accept page/size/search
apps/api (GraphQL)         ← 3 resolver updates: agentsBySpecialization, mcps(+specializationId), skillsBySpecialization(+page/size/search)
ui/api-hooks               ← new GET_AGENTS_BY_SPECIALIZATION_QUERY; update LIST_MCPS_QUERY; update LIST_SKILLS_BY_SPECIALIZATION_QUERY
apps/web                   ← refactor 3 panels + items; extract shared usePanelList hook
```

### Data Flow (after changes)

```
apps/web — SpecializationDetailPage
  │
  ├── GET_SPECIALIZATION_QUERY  →  api/specialization resolver  →  getSpecialization handler
  │     returns: { id, name, description, agentIds, mcpIds, createdAt, updatedAt }
  │     (agents [] / mcps [] sub-fields removed — counts come from agentIds.length / mcpIds.length)
  │
  ├── SpecializationAgentsPanel (owns page + search state)
  │     └── GET_AGENTS_BY_SPECIALIZATION_QUERY(specializationId, page, size, search)
  │           →  api/systemAgent resolver  →  listAgentsBySpecialization handler
  │           →  systemAgentDomain.queries.getListBySpecializationId({ specializationId, page, size, search })
  │
  ├── SpecializationMcpsPanel (owns page + search state)
  │     └── LIST_MCPS_QUERY(specializationId, page, size, search)
  │           →  api/mcp resolver  →  mcpService.listMcps({ specializationId, page, size, search })
  │           →  mcpDomain.queries.getList (already supports specializationId)
  │
  └── SpecializationSkillsPanel (owns page + search state)
        └── LIST_SKILLS_BY_SPECIALIZATION_QUERY(specializationId, page, size, search)
              →  api/skill resolver  →  listSkillsBySpecialization handler (updated)
              →  skillDomain.queries.getBySpecializationId (extended)
```

### Cross-Package Dependencies

- `domains/*` have no cross-domain deps (each domain is standalone).
- `services/agent` depends on `domains/system-agent` for the new query.
- `services/skill` depends on `domains/skill` for the extended query.
- `services/specialization` simplification depends on removing the domain calls that were bundled.
- `apps/api` depends on updated service handlers.
- `ui/api-hooks` depends only on GraphQL schema shape (generated types).
- `apps/web` depends on `ui/api-hooks`.

---

## Recommendation

**Decouple panel data from the specialization detail query.** Each panel becomes self-contained — it owns its own query, loading state, search input, and page cursor. This is the same pattern used by `SpecializationListContainer`, `McpListContainer`, and other paginated lists in the codebase.

The key simplification is that `getSpecialization` no longer needs to orchestrate three `Promise.all` calls. The service becomes trivial: fetch the specialization entity and return it.

Trade-offs:
- **Pro**: Three independent parallel requests mean the page can show each panel as it loads (progressive rendering), and each panel can refresh without reloading the others.
- **Con**: The header currently derives counts from `agents.length` and `mcps.length`. After decoupling, counts come from `agentIds.length` / `mcpIds.length` (already in the model — no API change needed).
- **No new domains needed**: all changes stay within existing domain packages.

---

## Implementation Steps

### Step 1 — `domains/system-agent`: Add paginated query

Add a new query `getListBySpecializationId` next to the existing `getBySpecializationId`:

- **File to create**: `domains/system-agent/src/queries/getListBySpecializationId/index.ts`
- **File to create**: `domains/system-agent/src/queries/getListBySpecializationId/types.ts`
- **File to update**: `domains/system-agent/src/queries/index.ts` (export new query)
- **File to update**: `domains/system-agent/src/index.ts` (re-export)

Input type:
```typescript
interface GetListBySpecializationIdInput {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}
```

Implementation mirrors `getAdminList` (already paginated) but filtered on `specializationId`. Reuse `resolvePagination` and `buildNameDescriptionSearchFilter` from the domain's `shared/` folder.

Return type: reuse existing `SystemAgentsList` (`{ items: SystemAgentModel[], total: number, page: number, size: number }`).

### Step 2 — `domains/skill`: Add pagination to `getBySpecializationId` + add `SkillPage` GraphQL type

- **File to update**: `domains/skill/src/queries/getBySpecializationId/index.ts` — add `page`, `size`, `search` to input; use `resolvePagination` + `buildNameSearchFilter`
- **File to update**: `domains/skill/src/queries/getBySpecializationId/types.ts` — update `GetBySpecializationIdInput`, add `GetBySpecializationIdResult` with `{ items, total, page, size }`
- **File to update**: `domains/skill/src/model/graphql.ts` — add `SkillPage { items: [Skill], total: Int!, page: Int!, size: Int! }`

Add `SkillPage` type:
```typescript
builder.objectType('SkillPage', {
  fields: (t) => ({
    items: t.field({ type: ['Skill'] }),
    total: t.exposeInt('total'),
    page:  t.exposeInt('page'),
    size:  t.exposeInt('size'),
  }),
});
```

### Step 3 — `services/agent`: New handler `listAgentsBySpecialization`

- **Directory to create**: `services/agent/src/handlers/listAgentsBySpecialization/`
- **File to create**: `services/agent/src/handlers/listAgentsBySpecialization/index.ts`
- **File to create**: `services/agent/src/handlers/listAgentsBySpecialization/types.ts`
- **File to update**: `services/agent/src/handlers/index.ts` (export new handler)

Handler signature (modelled on `listSystemAgents`):
```typescript
interface ListAgentsBySpecializationInput {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}
```

Calls `systemAgentDomain.queries.getListBySpecializationId(input)`. Returns `SystemAgentsList`.

### Step 4 — `services/skill`: Update `listSkillsBySpecialization`

- **File to update**: `services/skill/src/handlers/listSkillsBySpecialization/types.ts` — add `page?`, `size?`, `search?` to input; update result to `{ items, total, page, size }`
- **File to update**: `services/skill/src/handlers/listSkillsBySpecialization/index.ts` — forward new params to domain query

### Step 5 — `services/specialization`: Simplify `getSpecialization`

- **File to update**: `services/specialization/src/handlers/getSpecialization/index.ts` — remove the `Promise.all` calls for agents and MCPs; return only the specialization entity
- **File to update**: `services/specialization/src/handlers/getSpecialization/types.ts` — remove `agents` and `mcps` from `GetSpecializationResult`

### Step 6 — `apps/api`: Update GraphQL resolvers

**`apps/api/src/graphql/resolvers/specialization.ts`**
- Remove `agents` and `mcps` from the `specialization` query return shape (handler no longer returns them)

**`apps/api/src/graphql/resolvers/systemAgent.ts`**
- Add new top-level query `agentsBySpecialization`:
  ```typescript
  agentsBySpecialization(specializationId: String!, page: Int, size: Int, search: String): SystemAgentsList
  ```
  Calls `agentService.handlers.listAgentsBySpecialization(...)`.

**`apps/api/src/graphql/resolvers/mcp.ts`**
- Add `specializationId: String` optional arg to existing `mcps` resolver; forward to `mcpService.listMcps`. MCP domain already supports this.

**`apps/api/src/graphql/resolvers/skill.ts`**
- Add `page: Int`, `size: Int`, `search: String` optional args to `skillsBySpecialization`; change return type from `[Skill]` to `SkillPage`; forward to updated handler.

### Step 7 — `ui/api-hooks`: Update/add query documents and hooks

**New**:
- `ui/api-hooks/src/specializations/GET_AGENTS_BY_SPECIALIZATION_QUERY.ts`
- `ui/api-hooks/src/specializations/useAgentsBySpecialization.ts`

**Updated**:
- `ui/api-hooks/src/specializations/GET_SPECIALIZATION_QUERY.ts` — remove `agents { }` and `mcps { }` sub-fields
- `ui/api-hooks/src/specializations/useSpecialization.ts` — update types to match (no agents/mcps arrays)
- `ui/api-hooks/src/mcps/LIST_MCPS_QUERY.ts` — add `$specializationId: String` variable
- `ui/api-hooks/src/mcps/useMcpCatalog.ts` (or relevant hook) — accept and forward `specializationId`
- `ui/api-hooks/src/skills/LIST_SKILLS_BY_SPECIALIZATION_QUERY.ts` — add `$page: Int`, `$size: Int`, `$search: String`; change return type to `SkillPage { items { ... } total page size }`
- `ui/api-hooks/src/skills/useSkillsBySpecialization.ts` — accept page/size/search params

### Step 8 — `apps/web`: Refactor detail page panels

**`SpecializationDetailPage.tsx` and `useSpecializationDetail.ts`**:
- Remove `agents` and `mcps` from returned shape (now panel-owned)
- Panels receive only `specializationId`

**Extract shared hook `usePanelList`** (optional but recommended to avoid triple duplication):
- Location: `apps/web/app/specialization/[id]/_components/hooks/usePanelList.ts`
- Manages: `searchInput`, `debouncedSearch`, `page`, `handleSearchChange`, `handlePageChange`
- Pattern mirrors `useSpecializationList.ts`

**`SpecializationAgentsPanel`**:
- Add local state via `usePanelList` (or inline)
- Replace `useSpecializationDetail` agents prop with `useAgentsBySpecialization({ specializationId, page, debouncedSearch })`
- Add `PanelSearchBar` + `Pagination` inside the panel
- Update `SpecializationAgentItem` to row layout (see Row Layout section)

**`SpecializationMcpsPanel`**:
- Add local state via `usePanelList`
- Replace prop with `useMcpCatalog({ specializationId, page, debouncedSearch })`
- Add `PanelSearchBar` + `Pagination`
- Update `SpecializationMcpListItem` to row layout

**`SpecializationSkillsPanel`**:
- Extend `useSkillsBySpecialization` call to pass `page`, `debouncedSearch`
- Add `PanelSearchBar` + `Pagination`
- Update `SpecializationSkillListItem` to row layout

### Row Layout

Each item component currently renders a card. Switch to a horizontal row matching the pattern used in `SpecializationListContainer` list items or the system agents list:

```
┌──────────────────────────────────────────────────────────┐
│  [Icon/Avatar]  Name                   Status  [Actions] │
└──────────────────────────────────────────────────────────┘
```

- Items use `display: flex; align-items: center` with spacing via CSS modules
- Rows are separated by a bottom border or divider (not cards/grid)
- On mobile (use `useIsMobileLayout` already in the page) columns collapse

---

## Todo Plan

```
1. domains/system-agent — extend with paginated specialization query
   - Changes: Add getListBySpecializationId query with page/size/search support
   - Files to create: domains/system-agent/src/queries/getListBySpecializationId/index.ts, types.ts
   - Files to update: domains/system-agent/src/queries/index.ts, domains/system-agent/src/index.ts
   - Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer
   - Dependencies: None

2. domains/skill — extend getBySpecializationId with pagination/search + add SkillPage GQL type
   - Changes: Add page/size/search to input; return paged result; add SkillPage type to graphql.ts
   - Files to update: domains/skill/src/queries/getBySpecializationId/index.ts, types.ts; domains/skill/src/model/graphql.ts
   - Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer
   - Dependencies: None

3. services/agent — new handler listAgentsBySpecialization
   - Changes: New handler that calls systemAgentDomain.queries.getListBySpecializationId
   - Files to create: services/agent/src/handlers/listAgentsBySpecialization/index.ts, types.ts
   - Files to update: services/agent/src/handlers/index.ts
   - Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer
   - Dependencies: Todo #1

4. services/skill — update listSkillsBySpecialization handler
   - Changes: Add page/size/search params to input; forward to updated domain query; update result type
   - Files to update: services/skill/src/handlers/listSkillsBySpecialization/index.ts, types.ts
   - Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations)
   - Dependencies: Todo #2

5. services/specialization — simplify getSpecialization handler
   - Changes: Remove Promise.all agents/MCPs eager-load; return only specialization entity + agentIds/mcpIds
   - Files to update: services/specialization/src/handlers/getSpecialization/index.ts, types.ts
   - Suggested subagent workflow: coder ↔ code-reviewer (loop: max 1 iteration)
   - Dependencies: None (can run in parallel with todos #1 and #2)

6. apps/api — update GraphQL resolvers (3 files)
   - Changes:
     - specialization.ts: remove agents/mcps sub-fields from specialization query
     - systemAgent.ts: add agentsBySpecialization(specializationId, page, size, search): SystemAgentsList
     - mcp.ts: add specializationId arg to mcps query
     - skill.ts: add page/size/search to skillsBySpecialization; return SkillPage
   - Files to update: apps/api/src/graphql/resolvers/specialization.ts, systemAgent.ts, mcp.ts, skill.ts
   - Suggested subagent workflow: coder ↔ code-reviewer (loop: max 1 iteration)
   - Dependencies: Todos #3, #4, #5

7. ui/api-hooks — update/add GraphQL query documents and hooks
   - Changes:
     - Remove agents/mcps sub-fields from GET_SPECIALIZATION_QUERY
     - Add GET_AGENTS_BY_SPECIALIZATION_QUERY + useAgentsBySpecialization hook
     - Add specializationId to LIST_MCPS_QUERY + relevant hook
     - Add page/size/search to LIST_SKILLS_BY_SPECIALIZATION_QUERY; update useSkillsBySpecialization
   - Files to create: ui/api-hooks/src/specializations/GET_AGENTS_BY_SPECIALIZATION_QUERY.ts, useAgentsBySpecialization.ts
   - Files to update: GET_SPECIALIZATION_QUERY.ts, LIST_MCPS_QUERY.ts, LIST_SKILLS_BY_SPECIALIZATION_QUERY.ts, useSkillsBySpecialization.ts, relevant mcp hook
   - Suggested subagent workflow: coder ↔ code-reviewer (loop: max 1 iteration)
   - Dependencies: Todo #6

8. apps/web — refactor specialization detail panels (UI)
   - Changes:
     - SpecializationDetailPage / useSpecializationDetail: remove agents/mcps from data shape
     - Extract usePanelList hook (shared debounce + page state)
     - SpecializationAgentsPanel: own query + search + pagination + row layout
     - SpecializationMcpsPanel: own query + search + pagination + row layout
     - SpecializationSkillsPanel: own query + search + pagination + row layout
     - Update each *Item component to row layout (flex row, not card)
   - Files to update: useSpecializationDetail.ts, SpecializationDetailPage.tsx, all 3 panel tsx + item tsx + scss
   - Files to create: _components/hooks/usePanelList.ts (optional extract)
   - Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations)
   - Dependencies: Todo #7
```

---

## Decisions (resolved)

1. **Page size per panel** — **10** items per panel (default `size: 10`).
2. **URL state for panel search/page** — **Local only**; panel search and page reset on navigate. No URL params.
3. **Panel agents count in header** — **Confirmed**: use `agentIds.length` and `mcpIds.length` from the specialization entity.
4. **Search scope** — **Name + description** for agents, MCPs, and skills.
5. **Row layout spec**:
   - **Agents row**: name, description
   - **MCPs row**: icon, name, description
   - **Skills row**: name, description
6. **Backward compatibility of `GET_SPECIALIZATION_QUERY`** — Remove `agents {}` and `mcps {}` sub-fields; verify no other consumers during implementation.
