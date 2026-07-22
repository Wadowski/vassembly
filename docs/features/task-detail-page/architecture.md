# Task Detail Page — Implementation Architecture

Product feature: authenticated task owners open `/tasks/[id]` to view full description, status, dates, and optional AI summary (`title`). View-only in v1; GraphQL reads only. Phased timeline and agent enrichment deferred.

**References:** `docs/features/task-detail-page/prd.md`, `docs/features/task-detail-page/design.md`, `docs/features/task-list-homepage/architecture.md`, `docs/features/task-domain/architecture.md`.

**Librarian audit (2026-05-29):** Reuse `@vassembly/domain-task`, `@vassembly/service-task`, TaskList app components, `ProtectedAuthRoute`, agent `getModelById` ownership pattern. Greenfield: `getById` query, `getTask` handler, `task(id)` resolver, `useTaskDetail`, `/tasks/[id]` route, TaskList navigation.

---

## Analysis

### Existing reuse

| Area | Reuse from | Notes |
|------|------------|-------|
| Task GraphQL type | `domains/task/src/model/graphql.ts` | `Task` object already exposes all detail fields; no schema field changes for Phase 1 |
| Task DTO mapper | `domains/task/src/model/toTaskResponse.ts` | Same shape as list items |
| List query / auth | `apps/api/src/graphql/resolvers/task.ts` | `UnauthorizedError` when `context.authenticatedUserId` missing |
| Service pass-through | `services/task/src/handlers/listUserTasks/` | Thin handler → domain query |
| Apollo hook pattern | `ui/api-hooks/src/tasks/useUserTasks.ts` | `useApolloLazyQuery`, `withAuth: true`, `fetchPolicy: 'no-cache'` |
| Status UI | `apps/web/app/_components/TaskList/taskStatusDisplay.ts` | Icon + label + color maps |
| Empty description | `apps/web/app/_components/TaskList/constants.ts` | `TASK_EMPTY_DESCRIPTION_LABEL` |
| TaskList row activation | `TaskListItem` | `onClick` + Enter/Space already implemented; wiring missing on homepage |
| Auth shell | `apps/web/lib/auth/ProtectedAuthRoute.tsx` | `requireAuthenticated`, `redirectPath`, `loadingFallback` |
| Agent edit page pattern | `apps/web/app/agents/[id]/edit/` | Phased `loading \| error \| notFound \| ready`, skeleton fallback, inline error (not `not-found.tsx`) |
| Owner-scoped 404 | `domains/agent/src/queries/getModelById/index.ts` | `NotFoundError` for missing **or** `raw.userId !== input.userId` |
| MongoDB | `domains/task/src/clients/mongodb.ts` | `tasks` collection; index `{ userId: 1, createdAt: -1 }` — add `{ id: 1 }` or rely on `_id` lookup only if perf needed |
| Error copy | `apps/web/app/agents/getRequestErrorMessage.ts` | Snackbar messages |
| Design tokens | `@vassembly/ui-system-design/theme` | `sectionCard`, spacing, 42rem column (TaskList-aligned) |

### Gaps (new work)

| Gap | Placement |
|-----|-----------|
| `getModelById` + public `getById` | `domains/task/src/queries/getModelById/`, `getById/` |
| `getTask` service handler | `services/task/src/handlers/getTask/` |
| GraphQL `task(id)` resolver | `apps/api/src/graphql/resolvers/task.ts` |
| `useTaskDetail` hook | `ui/api-hooks/src/tasks/useTaskDetail.ts` + `graphql/getTaskQuery.ts` |
| Detail page + components | `apps/web/app/tasks/[id]/` |
| TaskList → detail nav | `apps/web/app/page.tsx` or `useHomeTaskList` + `TaskList` `onClick` |
| Optional shared badge | `apps/web/app/_components/TaskList/TaskStatusBadge.tsx` (extract from `TaskListItem`) |

### New packages decision

**No new packages.** Extend `@vassembly/domain-task`, `@vassembly/service-task`, `@vassembly/ui-api-hooks`, `@vassembly/api`, `@vassembly/web` only.

Phase 3 may add GraphQL `agent(id)` in `@vassembly/domain-agent` / `apps/api` — not a new package.

### Domain creation justification

**Not required.** Task is already the bounded context; detail is a read variant of the same entity with owner filter.

---

## System Architecture Overview

### High-level data flow (Phase 1)

```
User clicks TaskList row (homepage)
  → router.push(`/tasks/${id}`)
  → apps/web/app/tasks/[id]/page.tsx (client)
      → ProtectedAuthRoute (JWT; redirect /login?returnUrl=...)
      → useTaskDetailPage
          → useTaskDetail (ui/api-hooks) — GraphQL task(id)
          → apps/api POST /graphql
              → registerTaskResolvers.task
                  → auth: context.authenticatedUserId
                  → taskService.getTask({ userId, taskId })
                      → taskDomain.queries.getById({ id, userId })
                          → getModelById → ownership check → toTaskResponse
              ← Task DTO
          ← phase: loading | ready | notFound | error
      → TaskDetailHeader / Description / Metadata
```

### Monorepo placement

| Layer | Package / path | Responsibility |
|-------|----------------|----------------|
| Persistence | `domains/task` | `getModelById`, owner filter, `toTaskResponse` |
| Application | `services/task` | `getTask` orchestration (validation, domain call) |
| API Gateway | `apps/api` | GraphQL resolver only (no business logic) |
| Client hooks | `ui/api-hooks` | `GET_TASK_QUERY`, `useTaskDetail` |
| Web app | `apps/web` | Route, layout, SCSS, TaskList reuse, navigation wire-up |

### Components involved

- **Next.js:** `page.tsx` (client boundary — see Rendering decision)
- **React:** `useTaskDetailPage`, section components, skeleton, error view
- **Apollo:** lazy query with auth headers (`useApolloLazyQuery`)
- **GraphQL:** Pothos builder in `apps/api`; types from `taskDomain.gqlSchema`
- **No REST read** for task on this page (create remains REST elsewhere)

---

## Data Model & GraphQL Strategy

### Existing task fields (Phase 1)

Reuse `Task` GraphQL type and `TaskResponse` as-is:

`id`, `userId`, `description`, `type`, `status`, `agentAssignedId`, `title`, `createdAt`, `updatedAt`.

No MongoDB or mapper changes for Phase 1.

### Recommendation: dedicated `task(id)` query (not `listUserTasks` extension)

| Approach | Verdict |
|----------|---------|
| **New `task(id: ID!): Task`** | **Recommended** |
| Filter `listUserTasks` client-side or add `id` arg to list | **Reject** |

**Rationale:**

- O(1) fetch by primary key vs scanning/filtering a paginated list
- Clear API contract for deep links and cache keys
- Ownership and not-found semantics live in one handler (mirrors `getAgent` / `getModelById`)
- Avoids overloading list query with non-list semantics
- Same `Task` return type as list items — hooks reuse `TaskDto` from `ui/api-hooks/src/tasks/types.ts`

### GraphQL contract (Phase 1)

```graphql
extend type Query {
  task(id: ID!): Task!
}
```

**Registration:** Query field in `apps/api/src/graphql/resolvers/task.ts` only. Object types remain in `domains/task/src/model/graphql.ts` via `taskDomain.gqlSchema(builder)` in `apps/api/src/graphql/index.ts` (already wired).

**Auth:** Resolver throws `UnauthorizedError` if `authenticatedUserId` is undefined (same as `userTasks`).

**Not found:** Domain `getModelById` throws `NotFoundError` when document missing or `task.userId !== userId`. GraphQL layer maps to client-visible not-found (no 403, no existence leak).

### Agent enrichment (Phase 3) — recommendation

| Approach | Verdict |
|----------|---------|
| **Separate GraphQL `agent(id)` + lazy `useAgent` on detail page** | **Recommended default** |
| **Extend `task` query with nested `agent { name }`** | Acceptable if product wants single round-trip |
| **REST `GET /agents/:id` from web** | **Reject** (violates read convention for new UI) |

**Rationale for separate query:**

- Keeps domains isolated (`domain-task` must not import `domain-agent`)
- Service `getTask` stays thin; optional enrichment is explicit in UI or a small Phase 3 `getTaskEnriched` handler if product mandates one hop
- Lazy fetch after metadata paints matches Phase 3 UX; no N+1 in Phase 1
- Reuses future `agent(id)` GraphQL for agent edit and other surfaces

**Phase 1:** Metadata shows **“Unassigned”** only; do not expose raw `agentAssignedId` in UI (design §15).

### Timeline data (Phase 2+)

| Phase | Data source | Network |
|-------|-------------|---------|
| **1** | None — section not mounted | Single `task(id)` query |
| **2** | Synthetic events from `createdAt`, `updatedAt`, `status` | **No extra query** — client derivation after `ready` |
| **3** | Task event domain (TBD) | New GraphQL query e.g. `taskEvents(taskId)` or nested field — design keeps same `TaskDetailTimeline` component, swap data adapter |

---

## API Layer Architecture

### Domain — `getModelById` + `getById`

**Pattern:** Copy `domains/agent/src/queries/getModelById/index.ts` → `domains/task/src/queries/getModelById/index.ts`.

```typescript
// Pseudocode — actual impl uses taskMongodbDao, taskFactory
export const getModelById = async ({ id, userId }: { id: string; userId?: string }) => {
  const raw = await taskMongodbDao.get(taskFactory.create({ id }));
  if (!raw?.id) throw new NotFoundError('Task not found');
  if (userId !== undefined && raw.userId !== userId) throw new NotFoundError('Task not found');
  return { data: taskFactory.create(raw) };
};
```

**Public query** `domains/task/src/queries/getById/index.ts`:

- Input: `{ id: string; userId: string }` (userId required for owner scope)
- Calls `getModelById`, maps with existing `toTaskResponse`

Export from `domains/task/src/queries/index.ts`.

**Tests:** Black-box tests for missing id, wrong owner, happy path (Vitest, colocated).

### Service — `getTask`

**Path:** `services/task/src/handlers/getTask/index.ts`, `types.ts`, `index.test.ts`

```typescript
export interface GetTaskHandlerInput {
  userId: string;
  taskId: string;
}

export const getTask = async (input: GetTaskHandlerInput): Promise<TaskResponse> => {
  if (!input.userId) throw new ValidationError('userId is required');
  const { data } = await taskDomain.queries.getById({
    id: input.taskId,
    userId: input.userId,
  });
  return data;
};
```

Export from `services/task/src/handlers/index.ts`.

### API Gateway — resolver

**File:** `apps/api/src/graphql/resolvers/task.ts`

Add alongside `userTasks`:

```typescript
task: t.field({
  type: 'Task',
  args: { id: t.arg.id({ required: true }) },
  resolve: async (_root, args, context) => {
    const userId = context.authenticatedUserId;
    if (userId === undefined) throw new UnauthorizedError('Authentication required');
    return taskService.getTask({ userId, taskId: args.id });
  },
}),
```

**Tests:** `apps/api/src/graphql/resolvers/task.test.ts` — auth required, returns task, not-found for wrong owner (mock service).

### Frontend hook — `useTaskDetail`

**Files:**

- `ui/api-hooks/src/tasks/graphql/getTaskQuery.ts` — `query GetTask($id: ID!) { task(id: $id) { ...TaskFields } }`
- `ui/api-hooks/src/tasks/useTaskDetail.ts` — mirror `useUserTasks`: `useApolloLazyQuery`, `withAuth: true`, `fetchPolicy: 'no-cache'`
- Optional `mapTaskData.ts` if mapping differs from list item (likely thin wrapper to `TaskDto`)
- Export from `ui/api-hooks/src/tasks/index.ts`

**Error handling in page hook (`useTaskDetailPage`):**

| GraphQL / network | UI phase |
|-------------------|----------|
| `NotFoundError` / 404-equivalent | `notFound` — “Task not found” + back CTA |
| `UnauthorizedError` | Handled by `ProtectedAuthRoute` before fetch |
| Network / 5xx | `error` — snackbar + retry |
| Success | `ready` |

Use `getRequestErrorMessage` for snackbar copy.

---

## Frontend Component Architecture

### Rendering decision: client page (not RSC SSR)

| Option | Verdict |
|--------|---------|
| **Client `page.tsx` + Apollo lazy query** | **Recommended Phase 1** |
| **Server Component async fetch** | Defer — no established RSC GraphQL pattern in app; agent edit uses client + REST |

**Rationale:** PRD allows client hydration; matches `agents/[id]/edit`, `ProtectedAuthRoute`, and authenticated Apollo client. Supports `returnUrl`, snackbar, and retry without new server GraphQL plumbing.

**Trade-off:** No SSR SEO (acceptable — authenticated surface).

### Page shell

| Component | Responsibility | ~LOC target |
|-----------|----------------|-------------|
| `page.tsx` | `'use client'`; compose `ProtectedAuthRoute` + body from `useTaskDetailPage` | &lt; 50 |
| `useTaskDetailPage.ts` | `useParams().id`, login route with `returnUrl`, phase union, `useTaskDetail().fetch`, document title | &lt; 100 |
| `TaskDetailSkeleton.tsx` | Full-page skeleton per design §6.1 | &lt; 80 |
| `TaskDetailPage.module.scss` | `pageStack`, `contentColumn`, `sectionCard`, tokens | shared |

### Section components (`_components/`)

| Component | Responsibility |
|-----------|----------------|
| `TaskDetailHeader.tsx` | Back button (`← Back to tasks` → `/`), status badge (header only per design default), H1 = `title` or “Task details” |
| `TaskDetailDescription.tsx` | Section label “Description”; full text `pre-wrap`; empty → `TASK_EMPTY_DESCRIPTION_LABEL` |
| `TaskDetailMetadata.tsx` | `sectionCard` “Details”; Created, optional Last updated (hide if same instant as created), Assigned agent “Unassigned”; **omit duplicate status row** if header shows status |
| `TaskDetailError.tsx` | Not-found + generic error layouts (or inline in page like agent edit) |
| `TaskStatusBadge.tsx` | **Optional extract** — icon + label from `taskStatusDisplay` (shared by list + detail) |
| `TaskDetailTimeline.tsx` | **Phase 2+** — synthetic events, deferred mount |

### Reuse vs new

| Asset | Action |
|-------|--------|
| `taskStatusDisplay.ts` | Import; optional extract `TaskStatusBadge` |
| `TASK_EMPTY_DESCRIPTION_LABEL` | Import |
| `TaskListItem` status markup | Extract to badge or duplicate minimally once |
| `@vassembly/ui-system-design/button`, `ui-text`, `ui-skeleton`, `ui-snackbar` | Use as in design §10 |
| `Tag` for status | **Do not** default — icon row for list parity |

### Homepage navigation (small change)

In `apps/web/app/page.tsx` or `useHomeTaskList`:

```typescript
const router = useRouter();
const handleTaskClick = (taskId: string) => router.push(`/tasks/${taskId}`);
// Pass to <TaskList onTaskClick={handleTaskClick} />
```

Extend `TaskList` props to pass `onClick` to each `TaskListItem` if not already plumbed.

---

## Authentication & Authorization

| Concern | Implementation |
|---------|----------------|
| Unauthenticated | `ProtectedAuthRoute requireAuthenticated` → `/login?returnUrl=${encodeURIComponent(pathname)}` |
| Authenticated fetch | GraphQL context `authenticatedUserId` from JWT (existing `createApiGraphQLContext`) |
| Ownership | `getModelById` with `userId`; same `NotFoundError` message for wrong owner and missing |
| Client | Map not-found to `TaskDetailError` — never render partial task on error |
| Roles | None beyond authenticated user (same as task list) |

**No middleware-only auth** for Phase 1 — match agent pages (`ProtectedAuthRoute` wrapper).

---

## Error Handling & Edge Cases

| Case | Behavior |
|------|----------|
| Network error | Snackbar + “Try again” retriggers lazy query; no description/metadata |
| 404 / wrong owner | Same copy: “Task not found”; link “Back to tasks” |
| Empty description | `TASK_EMPTY_DESCRIPTION_LABEL` |
| Null `title` | No summary block; H1 = “Task details” |
| Null `agentAssignedId` | “Unassigned” |
| Slow load | `TaskDetailSkeleton` in `loadingFallback` and `phase === 'loading'` |
| Invalid route id format | Treat as fetch miss → not-found after query fails |

**Security:** Never render `userId` or foreign task fields on error paths.

---

## Lazy Loading Strategy

| Phase | Strategy |
|-------|----------|
| **1** | Eager: single `task(id)` on mount; no code-split beyond route |
| **2** | After `phase === 'ready'`, defer timeline: `useEffect` + `requestAnimationFrame` or `dynamic(() => import('./TaskDetailTimeline'), { ssr: false })` inside `<Suspense fallback={<TimelineSkeleton />}>` |
| **2 data** | No network — `buildSyntheticTimelineEvents(task)` pure function in `apps/web/app/tasks/[id]/lib/` |
| **3** | Timeline component unchanged; hook calls `useTaskEvents(taskId)` when API exists |

Primary content (description + metadata) must paint before timeline skeleton animates (PRD AC-18).

---

## File Structure & Organization

```
domains/task/src/queries/
  getModelById/index.ts
  getModelById/index.test.ts
  getById/index.ts
  getById/types.ts
  getById/index.test.ts
  index.ts                    # export getById, getModelById

services/task/src/handlers/
  getTask/index.ts
  getTask/types.ts
  getTask/index.test.ts
  index.ts                    # export getTask

apps/api/src/graphql/resolvers/
  task.ts                     # add task(id)
  task.test.ts

ui/api-hooks/src/tasks/
  useTaskDetail.ts
  graphql/getTaskQuery.ts
  index.ts                    # export useTaskDetail

apps/web/app/tasks/[id]/
  page.tsx
  useTaskDetailPage.ts
  TaskDetailPage.module.scss
  TaskDetailSkeleton.tsx
  _components/
    TaskDetailHeader.tsx
    TaskDetailDescription.tsx
    TaskDetailMetadata.tsx
    TaskDetailError.tsx
    TaskStatusBadge.tsx         # optional
    TaskDetailTimeline.tsx      # Phase 2
  lib/
    buildSyntheticTimelineEvents.ts  # Phase 2

apps/web/app/_components/TaskList/
  taskStatusDisplay.ts          # reuse
  constants.ts                  # reuse
  TaskList.tsx                  # add onTaskClick prop (if missing)

apps/web/app/page.tsx           # wire navigation
```

**Note:** Domain GraphQL **types** stay in `domains/task/src/model/graphql.ts`; **query fields** stay in `apps/api` per existing `userTasks` pattern. This resolves the “schema in domain vs API Gateway” blocker: **types = domain, operations = API resolver**.

---

## Recommendation (conservative approach)

1. Add **owner-scoped `getById`** in domain (agent pattern), **`getTask`** in service, **`task(id)`** resolver — smallest vertical slice.
2. **Client page** with `ProtectedAuthRoute` + `useTaskDetail` — no new infrastructure.
3. **Reuse TaskList** status/empty constants; optionally extract **one** `TaskStatusBadge` to avoid drift.
4. **Wire TaskList click** on homepage — completes deferred list affordance.
5. **Phase 2 timeline** without backend — pure client adapter behind lazy component.
6. **Phase 3** — add GraphQL `agent(id)` + optional lazy hook; event domain only when schema is defined.

**Trade-offs accepted:** No SSR; duplicate status only in header (not metadata); agent name delayed; list scroll state not restored on back (PRD).

---

## Implementation Steps (ordered)

1. **Domain** — `getModelById`, `getById`, tests, export queries.
2. **Service** — `getTask` handler + tests.
3. **API** — `task(id)` resolver + tests.
4. **api-hooks** — `getTaskQuery`, `useTaskDetail`, exports.
5. **Web skeleton + hook** — `TaskDetailSkeleton`, `useTaskDetailPage`, SCSS module.
6. **Web sections** — Header, Description, Metadata, Error.
7. **Web page** — `page.tsx` + `ProtectedAuthRoute`.
8. **Homepage** — TaskList `onClick` → `/tasks/[id]`.
9. **QA** — AC-01–AC-17, AC-22–AC-28 from PRD.

---

## Todo Plan

1. **@vassembly/domain-task** — Type: extend domain  
   - Changes: `getModelById`, `getById` with owner-scoped `NotFoundError`  
   - Files: `domains/task/src/queries/getModelById/*`, `getById/*`, `queries/index.ts`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer (README queries section)  
   - Dependencies: None  

2. **@vassembly/service-task** — Type: extend service  
   - Changes: `getTask` handler  
   - Files: `services/task/src/handlers/getTask/*`, `handlers/index.ts`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)  
   - Dependencies: #1  

3. **@vassembly/api** — Type: extend app  
   - Changes: GraphQL `task(id)` resolver  
   - Files: `apps/api/src/graphql/resolvers/task.ts`, `task.test.ts`  
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)  
   - Dependencies: #2  

4. **@vassembly/ui-api-hooks** — Type: extend package  
   - Changes: `useTaskDetail`, `getTaskQuery`  
   - Files: `ui/api-hooks/src/tasks/useTaskDetail.ts`, `graphql/getTaskQuery.ts`, `tasks/index.ts`  
   - Workflow: unit-test-writer → coder  
   - Dependencies: #3  

5. **@vassembly/web** — Type: extend app (Phase 1 UI)  
   - Changes: `/tasks/[id]` page, components, skeleton, hook, SCSS; optional `TaskStatusBadge`  
   - Files: `apps/web/app/tasks/[id]/**`, optional `TaskList/TaskStatusBadge.tsx`  
   - Workflow: coder ↔ code-reviewer (max 2)  
   - Dependencies: #4  

6. **@vassembly/web** — Type: extend app (navigation)  
   - Changes: TaskList row → detail route  
   - Files: `apps/web/app/page.tsx`, `TaskList.tsx`, `useHomeTaskList.ts` (if needed)  
   - Workflow: coder  
   - Dependencies: #5 (route must exist)  

7. **@vassembly/web** — Type: extend app (Phase 2 — can parallel after #5 ships)  
   - Changes: `TaskDetailTimeline`, `buildSyntheticTimelineEvents`, lazy mount  
   - Files: `apps/web/app/tasks/[id]/_components/TaskDetailTimeline.tsx`, `lib/buildSyntheticTimelineEvents.ts`  
   - Workflow: unit-test-writer → coder  
   - Dependencies: #5  

8. **@vassembly/domain-agent + @vassembly/api + @vassembly/web** — Type: Phase 3 (deferred)  
   - Changes: GraphQL `agent(id)`, lazy agent name on detail, optional event query  
   - Dependencies: Product event schema; separate architecture amendment  

---

## Phase 1 MVP Deliverables (engineer checklist)

- [ ] `domains/task` — `getModelById` + `getById` + unit tests (ownership → `NotFoundError`)
- [ ] `services/task` — `getTask` + unit tests
- [ ] `apps/api` — `task(id: ID!): Task!` resolver + tests (auth + not-found)
- [ ] `ui/api-hooks` — `GET_TASK_QUERY`, `useTaskDetail`
- [ ] `apps/web/app/tasks/[id]/page.tsx` — client + `ProtectedAuthRoute`
- [ ] `useTaskDetailPage` — phases: loading | ready | notFound | error
- [ ] `TaskDetailSkeleton`, `TaskDetailHeader`, `TaskDetailDescription`, `TaskDetailMetadata`, error UI
- [ ] `TaskDetailPage.module.scss` — 42rem column, `sectionCard`, tokens
- [ ] Homepage — TaskList click → `/tasks/{id}` (keyboard included via `TaskListItem`)
- [ ] Reuse `taskStatusDisplay`, `TASK_EMPTY_DESCRIPTION_LABEL`
- [ ] H1 rules: title if present else “Task details”; hide summary section when no title
- [ ] Agent: “Unassigned” only; no UUID in UI
- [ ] Tests: domain ownership, resolver auth, hook mapping, page state components (Vitest)

**Explicitly out of Phase 1:** Timeline, agent name fetch, edit/delete, REST task read, `task.type` in metadata.

---

## Implementation Roadmap & Effort

| Phase | Scope | Estimate | Dependencies |
|-------|--------|----------|--------------|
| **Phase 1** | Query + page + nav + states | **1–2 sprints** | Task list v1 stable |
| **Phase 2** | Synthetic timeline + lazy UI | **+0.5–1 sprint** | Phase 1 shipped |
| **Phase 3** | Agent GraphQL, event model, AI summary pipeline | **+1–2 sprints** | Event schema PRD; agent GraphQL decision |

---

## Dependencies, Blockers & Open Decisions

### Hard blockers (resolved in this doc)

| Blocker | Resolution |
|---------|------------|
| GraphQL `task(id)` missing | Implement domain → service → resolver chain above |
| Schema location | **Types:** `domains/task/src/model/graphql.ts`; **Query field:** `apps/api/src/graphql/resolvers/task.ts` |
| TaskList has no destination | Wire `onClick` in Phase 1 |

### Soft dependencies

| Item | Notes |
|------|-------|
| Agent name | Phase 3; Phase 1 “Unassigned” |
| `title` always null | Summary/H1 fallback expected |
| Event model | Phase 3 only |

### Open decisions (team)

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Duplicate status in header + metadata? | **Header only** (design §15) |
| 2 | Show `updatedAt` when ≠ `createdAt`? | **Yes** — “Last updated” row |
| 3 | Dedicated `not-found.tsx`? | **Inline error** (agent edit pattern) |
| 4 | Extract `TaskStatusBadge`? | **Yes** if duplication &gt; ~15 lines; else import helpers in both places |
| 5 | Phase 3 agent link to edit page? | **Defer** until product confirms |
| 6 | Phase 3 one query vs two for agent name? | **Separate `agent(id)` GraphQL** + lazy hook |

---

## Code Reuse Inventory

| Asset | Status | Location |
|-------|--------|----------|
| `Task` GraphQL type | Exists | `domains/task/src/model/graphql.ts` |
| `toTaskResponse` | Exists | `domains/task/src/model/toTaskResponse.ts` |
| `userTasks` resolver pattern | Exists | `apps/api/src/graphql/resolvers/task.ts` |
| `useUserTasks` hook pattern | Exists | `ui/api-hooks/src/tasks/useUserTasks.ts` |
| `taskStatusDisplay` | Exists | `apps/web/app/_components/TaskList/taskStatusDisplay.ts` |
| `TASK_EMPTY_DESCRIPTION_LABEL` | Exists | `apps/web/app/_components/TaskList/constants.ts` |
| `TaskListItem` onClick/keyboard | Exists | Needs parent `onClick` wire-up |
| `ProtectedAuthRoute` | Exists | `apps/web/lib/auth/ProtectedAuthRoute.tsx` |
| `getModelById` ownership pattern | Exists (agent) | Copy to task domain |
| `task(id)` query | **New** | Domain + service + resolver |
| `useTaskDetail` | **New** | ui/api-hooks |
| Detail page/components | **New** | apps/web/app/tasks/[id] |
| Timeline / events | **New Phase 2–3** | Client pure fn → later domain |
| GraphQL `agent(id)` | **New Phase 3** | api + domain-agent |

---

## Architectural Risks & Assumptions

### Assumptions

1. Task `id` in URL is the MongoDB/domain UUID string already returned by `userTasks`.
2. `fetchPolicy: 'no-cache'` is correct for detail (always fresh on mount/reload).
3. GraphQL errors for `NotFoundError` are distinguishable in Apollo error handling (verify with existing agent patterns).
4. Date display uses `toLocaleString()` (align with `SystemAgentForm` per design §15).

### Risks

| Risk | Mitigation |
|------|------------|
| Apollo not-found detection brittle | Centralize mapping in `useTaskDetailPage`; add resolver integration test |
| Status UI drift list vs detail | Extract `TaskStatusBadge` or shared subcomponent |
| Phase 2 synthetic timeline replaced | Keep timeline UI data-driven via adapter interface |
| Wrong-owner probe via timing | Single generic message; no 403; avoid timing side channels in logs |
| Engineers put query in domain `gqlSchema` | Follow `userTasks` — resolvers only in `apps/api` |

### Team discussion

- Confirm Phase 1 **no timeline** scope with product (PRD aligned).
- Confirm **H1 = title** when present (design overrides PRD separate “Summary” section — no duplicate Summary heading).
- Phase 3 event schema needs separate PRD/amendment before domain work.

---

## Subagent Workflows (summary)

| Package | Pattern |
|---------|---------|
| domain-task, service-task, api | Test-first → coder → review (≤2 loops) |
| ui-api-hooks | Test-first → coder |
| web Phase 1 | Coder → review |
| web navigation | Simple coder |
| web Phase 2 | Test-first → coder |

---

*End of architecture document.*
