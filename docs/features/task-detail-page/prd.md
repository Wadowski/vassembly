# Product Requirements Document: Task Detail Page

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-05-29  
**Primary route:** `/tasks/[id]`  
**Related docs:** `docs/features/task-list-homepage/prd.md`  
**Successor to:** Task List Homepage (completes clickable-row affordance deferred in list v1)

---

## 1. Executive Summary

The Task List Homepage renders clickable task rows but has no destination page, leaving users unable to view full task context without inferring it from a truncated list card. This PRD defines a **view-only Task Detail Page** at `/tasks/[id]` where authenticated task owners can read the full description, status, creation date, assigned agent reference, and (in later phases) a timeline and AI-generated summary. Shipping this feature completes an existing interaction affordance, enables bookmarkable in-session URLs, reduces friction for status review, and lays UI foundation for future AI summary display—without introducing edit/delete flows or cross-user access in v1.

---

## 2. Feature Overview

### User Stories

**Task Creator**  
As a user who just created a task from the homepage composer, I want to click my task in the list and see its full description and current status on a dedicated page, so that I can confirm what was submitted without re-reading a clamped list preview.

**Task Tracker**  
As a user monitoring work over time, I want to open a task detail page that shows status and key dates (and eventually history), so that I can understand where a task stands without searching the list again.

**Returning User**  
As a user who bookmarked or refreshed a task URL during my session, I want the detail page to load my task directly when I am signed in, so that I can resume review without navigating from the homepage.

---

## 3. Scope Definition

### In Scope (Phase 1 — MVP)

- Next.js route: `apps/web/app/tasks/[id]/page.tsx`
- Wire **TaskList row click** → navigate to `/tasks/{taskId}`
- New GraphQL read: **`task(id: ID!)`** (or equivalent single-task query) scoped to authenticated owner
- Detail page sections (Phase 1):
  - **Description** — full text, no line clamp
  - **Metadata** — status badge, created date, assigned agent (ID or name when available)
  - **AI Summary** — display `task.title` when non-null/non-empty; **omit section when null** (see Decisions)
- **Back navigation** — explicit “Back to tasks” link to `/` plus browser back support
- **Deep linking** — `/tasks/[id]` bookmarkable and reloadable within authenticated session
- **Auth** — authenticated users only; unauthenticated → login with `returnUrl=/tasks/{id}`
- **Access control** — owner-only; non-owner or missing task → not-found/error UX (no data leak)
- **Loading states** — page-level skeleton for primary task fetch
- **Error states** — snackbar or inline error for fetch failures; 404 for unauthorized/missing
- Reuse existing UI primitives (Text, Button, Tag/skeleton patterns), SCSS modules, design tokens, and `taskStatusDisplay` mappings from TaskList
- GraphQL for all reads; no REST mutations on this page (view-only)

### Out of Scope (v1 — all phases)

- Edit, delete, archive, or status-change actions on the detail page
- Comments, attachments, or collaboration
- Public or cross-user sharing links
- AI summary **generation** or persistence (display only when `title` is populated by backend)
- Real-time/push updates (refresh on navigation/reload only)
- Task type–specific layouts or custom fields beyond domain model
- Breadcrumb navigation beyond “Back to tasks”
- SEO/public indexing concerns (authenticated app surface)

### Future (Deferred)

| Phase | Deliverable |
|-------|-------------|
| **Phase 2** | Synthetic timeline (lazy-loaded): “Task created” + “Current status” events derived from `createdAt`, `updatedAt`, and `status` |
| **Phase 3** | Real event-history timeline once task event model exists |
| **Phase 3** | AI summary population pipeline + refined empty/pending summary UX when `title` is actively generated |
| **Phase 3** | Agent name enrichment (GraphQL join or `agent(id)` query) and optional link to agent detail |

---

## 4. User Interface Requirements

### Page Layout (top → bottom)

1. **Header row**
   - “Back to tasks” text link or button → `/`
   - Page heading: “Task details” (or design-system equivalent)
2. **AI Summary section** *(conditional — see Empty States)*
3. **Description section**
4. **Metadata section**
5. **Timeline section** *(Phase 2+ only; placeholder region may be omitted in Phase 1)*

### Section Specifications

#### AI Summary (Phase 1)

| State | Behavior |
|-------|----------|
| **Loading** | Included in page skeleton as optional block; if skeleton shows summary area, use 1–2 line placeholders |
| **Populated** | Section visible with heading “Summary”; body = `task.title` |
| **Empty (`title` null/empty)** | **Entire section hidden** — no heading, no placeholder box (consistent with TaskList list item behavior) |
| **Responsive** | Full width; typography matches list summary styling at larger size |

**Rationale:** `title` is always null today; hiding avoids prominent empty chrome and sets expectation that summary is additive content, not a required field.

#### Description

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton paragraph (3–5 lines) |
| **Populated** | Heading “Description”; full text with whitespace preserved; **no line clamp** |
| **Empty string** | Show label “No description” (reuse `TASK_EMPTY_DESCRIPTION_LABEL` from TaskList) |
| **Responsive** | Text wraps naturally; readable line length on desktop |

#### Metadata

| Field | Source | Display |
|-------|--------|---------|
| Status | `task.status` | Same icon + label + color as TaskList (`taskStatusDisplay`) |
| Created | `task.createdAt` | Formatted locale date-time (consistent with app date formatting elsewhere) |
| Assigned agent | `task.agentAssignedId` | Phase 1: “Unassigned” when null; when set, show agent ID or “Assigned agent” label with ID truncated/hidden per design — **agent name deferred to Phase 3** |
| Updated | `task.updatedAt` | Optional secondary line if distinct from created; omit if same calendar day and status unchanged (design discretion) |

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton rows for 2–3 metadata lines |
| **Error** | Metadata block not shown; page-level error applies |

#### Timeline (Phase 2+)

| State | Behavior |
|-------|----------|
| **Phase 1** | Section **not rendered** |
| **Phase 2 loading** | Section heading “Activity”; skeleton list below primary content — **lazy fetch/render after task + metadata paint** |
| **Phase 2 loaded** | Vertical list: (1) “Task created” @ `createdAt`; (2) “Status: {label}” @ `updatedAt` (or `createdAt` if never updated) |
| **Phase 3** | Replace synthetic entries with real events when event API exists |
| **Empty events (Phase 3 edge)** | Fall back to synthetic create + current status |

**Lazy loading rule:** Timeline must not block initial render of description and metadata. Primary `task(id)` query completes first; timeline section mounts/animates in afterward (client-side derived data in Phase 2 requires no extra network call).

### Loading & Skeleton Strategy

- **Initial page load:** Full-page or main-card skeleton covering back link area, description, and metadata.
- **No blocking spinner** over entire viewport after first paint unless hard navigation reload.
- **Timeline (Phase 2):** Independent skeleton inside timeline section only; rest of page remains interactive.

### Empty States Summary

| Condition | UX |
|-----------|-----|
| `title` null/empty | Hide AI Summary section |
| `description` empty | “No description” copy |
| `agentAssignedId` null | “Unassigned” in metadata |
| Task not found / not owned | Dedicated not-found or error view — not an empty detail shell |
| Fetch network error | Error message + retry affordance (refresh or “Back to tasks”) |

### Accessibility

- Page `<title>` or visible h1 identifies page purpose (“Task details”).
- “Back to tasks” is a focusable link/button with clear accessible name.
- Status communicated by **text label**, not icon alone (match TaskList).
- Loading skeletons use busy/loading semantics where design system supports them.
- Keyboard: Back link reachable via Tab; no keyboard trap.
- If timeline renders interactive items in future phases, they must follow list semantics; Phase 2 synthetic timeline is static text (no extra roles required).

### Responsive Behavior

- Single-column layout at all breakpoints.
- Consistent horizontal padding with homepage and agent pages.
- Metadata may stack label/value vertically on narrow viewports.

---

## 5. Data Requirements

### Fields to Display

| UI area | Field(s) | Notes |
|---------|----------|-------|
| AI Summary | `task.title` | Nullable; hidden when empty |
| Description | `task.description` | Required on model; empty string → fallback copy |
| Status | `task.status` | Enum: `created`, `in-progress`, `done`, `failed` |
| Created date | `task.createdAt` | ISO → formatted display |
| Assigned agent | `task.agentAssignedId` | Nullable; name enrichment Phase 3 |
| Timeline (Phase 2) | Derived from `createdAt`, `updatedAt`, `status` | No new backend fields |
| Timeline (Phase 3) | Event log model | TBD when schema exists |

### Queries Required

#### Primary — `task(id: ID!): Task`

- **New** domain query + service handler + GraphQL resolver (does not exist today).
- Input: `id` (task UUID).
- Auth: requires `authenticatedUserId` in GraphQL context.
- Logic:
  1. Fetch task by id.
  2. If not found → not found error.
  3. If `task.userId !== authenticatedUserId` → **same not found response** (no 403 that confirms existence to other users).
- Returns same `Task` shape as list items: `id`, `userId`, `description`, `type`, `status`, `agentAssignedId`, `title`, `createdAt`, `updatedAt`.

#### Secondary — Agent name (Phase 3)

- Today: `listUserTasks` and task model expose `agentAssignedId` only; agent `getById` exists as **REST** in agent service, **no GraphQL `agent(id)`** query.
- Phase 1: display unassigned / agent id stub without second fetch.
- Phase 3 options (engineering choice): add GraphQL `agent(id)` read, enrich task query server-side, or dedicated lazy hook — must remain GraphQL for reads per API conventions.

### Access Control

- Only authenticated users may call `task(id)`.
- Task returned only when `task.userId === context.authenticatedUserId`.
- Cross-user access attempts indistinguishable from missing task (404 / GraphQL not-found).
- **Zero cross-user data exposure** is a hard acceptance requirement.

### API Conventions

- **Reads:** GraphQL only (`task`, and eventually `agent` if needed).
- **Writes:** None on this page in v1.
- No ad-hoc REST fetch for task data from the web app.

---

## 6. Interaction & Navigation

### Entry Points

| Source | Action | Result |
|--------|--------|--------|
| Homepage TaskList | Click task row (or Enter/Space on focused row) | `router.push('/tasks/{id}')` |
| Direct URL | Navigate to `/tasks/{id}` | Load detail if authed + owner |
| Post-login redirect | `returnUrl=/tasks/{id}` | Land on detail after successful auth |

**TaskList change:** Pass `onClick` handler to `TaskListItem` from homepage hook/page that navigates to detail route (row already supports `onClick` and keyboard activation).

### Back Navigation

- “Back to tasks” navigates to `/` (homepage list).
- Browser Back returns to previous history entry (list with prior scroll/search state only if still in session memory — list state persistence unchanged from list PRD).

### Deep Linking

- URL pattern: `/tasks/{taskId}` where `taskId` is task `id` from domain.
- Bookmarkable and shareable **within same authenticated session** (no public access).
- Page reload re-fetches via GraphQL.

### Unauthenticated Access

- `ProtectedAuthRoute` (or equivalent) with `requireAuthenticated`.
- Redirect: `/login?returnUrl=/tasks/{id}` (encode path).
- After login, user returns to intended task detail.

### Not Found / Unauthorized

- Invalid id format, unknown id, or task owned by another user → show not-found or generic error page/message.
- **Do not** reveal whether task exists for non-owners.
- Suggested copy: “Task not found” with link back to homepage.

### Refresh & Session

- Client-side hydration from GraphQL lazy query is acceptable (matches TaskList / agent edit patterns).
- Full SSR optional for Phase 1; must support manual browser refresh without broken state.

---

## 7. Use Cases (Gherkin Syntax)

### Primary Use Case

```gherkin
Scenario: Task owner opens detail from homepage list
  Given I am signed in
  And I own a task with id "task-abc" and description "Fix login redirect"
  When I am on the homepage
  And I click the task row for "task-abc"
  Then I am navigated to "/tasks/task-abc"
  And I see the full description "Fix login redirect" without line clamping
  And I see the task status with icon and text label
  And I see the task created date
```

### Secondary Use Cases

```gherkin
Scenario: Task owner uses back link to return to list
  Given I am signed in
  And I am viewing "/tasks/task-abc"
  When I click "Back to tasks"
  Then I am navigated to the homepage "/"
```

```gherkin
Scenario: Task owner deep links directly to a task
  Given I am signed in
  And I own task "task-abc"
  When I open "/tasks/task-abc" in the browser
  Then the task detail page loads with my task data
```

```gherkin
Scenario: AI summary shown when title is populated
  Given I am signed in
  And I own a task with title "Login bug summary" and a description
  When I open that task's detail page
  Then I see a Summary section containing "Login bug summary"
```

```gherkin
Scenario: AI summary hidden when title is null
  Given I am signed in
  And I own a task with a null title
  When I open that task's detail page
  Then I do not see a Summary section
  And I still see the description and metadata
```

```gherkin
Scenario: Unassigned agent displayed
  Given I am signed in
  And I own a task with agentAssignedId null
  When I open that task's detail page
  Then I see "Unassigned" for the assigned agent field
```

---

## 8. Edge Cases & Error Handling (Gherkin Syntax)

### Empty States

```gherkin
Scenario: Task with empty description string
  Given I am signed in
  And I own a task whose description is an empty string
  When I open that task's detail page
  Then I see "No description" in the description area
```

### Validation & Access

```gherkin
Scenario: User attempts to view another user's task
  Given I am signed in as User A
  And task "task-xyz" belongs to User B
  When I navigate to "/tasks/task-xyz"
  Then I see a not-found or unauthorized error state
  And no task fields from User B are displayed
```

```gherkin
Scenario: User requests non-existent task id
  Given I am signed in
  When I navigate to "/tasks/does-not-exist"
  Then I see a not-found error state
  And I see a way to return to the homepage
```

### Interrupted Flows

```gherkin
Scenario: Unauthenticated user opens task detail URL
  Given I am not signed in
  When I navigate to "/tasks/task-abc"
  Then I am redirected to login with returnUrl "/tasks/task-abc"
```

```gherkin
Scenario: Task fetch fails due to network or server error
  Given I am signed in
  And I own task "task-abc"
  When the task query fails
  Then I see an error message
  And I can navigate back to the homepage
  And no partial misleading task content is shown
```

```gherkin
Scenario: User refreshes detail page mid-load
  Given I am signed in
  And I am viewing a task detail page that is loading
  When I refresh the browser
  Then the page reloads and fetches the task again
```

### System Errors

```gherkin
Scenario: GraphQL task query without authentication
  Given I am not signed in
  When the client calls the task query
  Then the API returns an authentication error
  And no task payload is returned
```

---

## 9. Non-Functional Requirements

### Performance

- Primary `task(id)` server processing target: **< 200ms** under normal load (excluding network).
- Detail page should become readable (description + metadata) as soon as primary query resolves.
- Timeline (Phase 2) lazy section must not delay first contentful paint of description/metadata.
- No N+1 agent fetches in Phase 1.

### Accessibility

- WCAG-aligned focus order: back link → main content.
- Status icons `aria-hidden` with visible text labels.
- Color is not sole indicator of status (icon + label + color token).

### Platform

- Web only (Next.js App Router).
- Responsive: mobile, tablet, desktop.

### Persistence

- No client persistence of detail state beyond URL.
- Task data always refetched on mount/reload (no stale cache requirement for v1).

### Success Metrics (Product)

| Metric | Target |
|--------|--------|
| Detail view adoption | ≥ 15% of list sessions open at least one detail view |
| Navigation completion | ≥ 80% of row clicks successfully land on detail (non-error) |
| Error rate | < 2% of detail page loads |
| Cross-user access | **Zero** confirmed leaks |

---

## 10. Acceptance Criteria

### Functional — Navigation & Access

- [ ] **AC-01** Clicking a TaskList row navigates to `/tasks/{id}` for the clicked task.
- [ ] **AC-02** TaskList keyboard activation (Enter/Space) navigates to detail.
- [ ] **AC-03** “Back to tasks” returns user to homepage `/`.
- [ ] **AC-04** Direct URL `/tasks/{id}` loads detail for owning authenticated user.
- [ ] **AC-05** Unauthenticated access redirects to `/login?returnUrl=/tasks/{id}`.
- [ ] **AC-06** Post-login redirect lands on the requested task detail.
- [ ] **AC-07** Non-owner or missing task shows not-found/error; no foreign task data.
- [ ] **AC-08** Browser refresh on detail page successfully reloads task data.

### Functional — Content & States

- [ ] **AC-09** Description renders in full (no 3-line clamp).
- [ ] **AC-10** Empty description shows “No description”.
- [ ] **AC-11** Status renders with same icon, label, and colors as TaskList for all four statuses.
- [ ] **AC-12** Created date displayed in human-readable format.
- [ ] **AC-13** Null `agentAssignedId` shows “Unassigned”.
- [ ] **AC-14** Non-null `title` shows Summary section with title text.
- [ ] **AC-15** Null/empty `title` hides Summary section entirely.
- [ ] **AC-16** Initial load shows skeleton until task data arrives.
- [ ] **AC-17** Fetch failure shows user-facing error without exposing internal codes.

### Functional — Phased (mark N/A until phase ships)

- [ ] **AC-18** *(Phase 2)* Timeline section loads after description/metadata without blocking them.
- [ ] **AC-19** *(Phase 2)* Synthetic timeline shows “Task created” and current status entries.
- [ ] **AC-20** *(Phase 3)* Agent name displayed when `agentAssignedId` set and agent resolvable.
- [ ] **AC-21** *(Phase 3)* Real event history replaces synthetic timeline when event API available.

### Technical

- [ ] **AC-22** New `task(id)` GraphQL query; no REST read for task data.
- [ ] **AC-23** Handler enforces `userId` ownership; indistinguishable error for wrong owner vs missing.
- [ ] **AC-24** No GraphQL mutations or REST writes invoked from detail page.
- [ ] **AC-25** Uses existing UI components and SCSS module + design token patterns.
- [ ] **AC-26** Reuses `taskStatusDisplay` (or shared equivalent) for status rendering.
- [ ] **AC-27** External data limited to task domain (+ agent domain in Phase 3 only).
- [ ] **AC-28** Homepage TaskList regression: list, search, pagination, create refresh unchanged except row navigation wired.

### UI/UX States Checklist

| State | Expected |
|-------|----------|
| Loading | Skeleton for description + metadata |
| Loaded | Full content, back link active |
| Summary absent | No summary block in DOM |
| Not found | Error/not-found view + back link |
| Unauthenticated | Redirect to login with returnUrl |

### Regression

- Task create flow on homepage unchanged.
- TaskList empty/search/load-more behavior unchanged aside from click navigation.
- No new routes conflict with existing agent routes.

---

## 11. Phases & Rollout

### Phase 1 — MVP (recommended first ship)

**Goal:** Validate navigation affordance and core read-only detail shell.

**Deliverables:**
- `task(id)` GraphQL query (domain + service + resolver + api-hooks hook)
- `/tasks/[id]` page with auth guard
- Description (full), metadata (status, created, unassigned agent)
- Conditional AI summary section (hidden when null)
- TaskList → detail navigation wiring
- Loading, error, not-found states
- Unit tests: domain query ownership, resolver auth, hook mapping, page component states

**Explicitly excluded from Phase 1:** Timeline section, agent name fetch, edit/delete.

**Timing:** Ship 1–2 sprints after Task List v1 stabilizes.

### Phase 2 — Synthetic Timeline

**Deliverables:**
- “Activity” section lazy-rendered after primary content
- Client-derived events: created + current status (no new backend model)
- Timeline-specific skeleton
- Component tests for synthetic event ordering and labels

### Phase 3 — Enrichment & Real History

**Deliverables:**
- Task event model + query (when defined)
- Replace synthetic timeline with real events; fallback to synthetic if empty
- GraphQL agent read or server-side enrichment for agent name
- AI summary generation pipeline populates `title`; revisit empty-state UX if “pending” state becomes meaningful
- Optional link from agent metadata to `/agents/[id]/edit` (product confirmation required)

---

## 12. Decisions & Rationale

### Decision 1 — Timeline MVP scope

**Recommendation:** **No timeline in Phase 1.** Phase 2 ships a **synthetic timeline** (task created + current status) derived from existing fields. Phase 3 replaces with real event log when model exists.

**Rationale:**
- No event model or API exists today; synthetic timeline still requires design/build/test.
- Phase 1 focus is completing navigation and full description/metadata—highest user pain from list clamp.
- Synthetic timeline delivers 80% of “history” UX without schema work; real events avoid rework of client-only fiction later by swapping data source behind same UI.

**Rejected alternative:** Full event log in Phase 1 — blocked on undefined event schema; delays list-click completion.

### Decision 2 — Empty AI summary UX

**Recommendation:** **Hide the Summary section entirely** when `task.title` is null or empty.

**Rationale:**
- Consistent with Task List Homepage PRD (summary line omitted in list).
- Field is always null today; a visible “Summary pending” box implies broken or loading functionality.
- When Phase 3 introduces async summary generation, introduce explicit states: hidden (not started), skeleton (“Generating summary…”), populated, or failed — separate PRD amendment.

**Rejected alternatives:**
- Placeholder box — adds visual noise for 100% of tasks today.
- “Summary pending” — misleading without a generation pipeline.

### Decision 3 — Phase approach

**Recommendation:** **Phase 1 = detail shell without timeline** (summary + description + metadata + navigation). Timeline Phase 2. Agent name + real events + AI population Phase 3.

**Rationale:**
- Minimizes scope creep and unblocks engineering on one new query + one page.
- Validates success metrics (adoption, navigation completion) before investing in timeline UX.
- Agent enrichment is low value while `agentAssignedId` is rarely populated.

---

## 13. Dependencies & Risks

### Hard Blockers

| Blocker | Owner | Notes |
|---------|-------|-------|
| GraphQL `task(id)` query does not exist | Engineering | Requires domain query, service handler, resolver, client hook |
| Product sign-off on Phase 1 scope (no timeline) | Product | This PRD recommends Phase 1 without timeline |
| TaskList navigation wiring | Engineering | Small homepage change; depends on route existing |

### Soft Risks

| Risk | Mitigation |
|------|------------|
| Agent name requires second fetch; only REST `getAgent` today | Defer to Phase 3; show “Unassigned” / ID stub in Phase 1 |
| `title` always null → Summary never visible | Expected; section hidden; no user confusion if section omitted |
| List scroll/search state lost on back navigation | Accept for v1 (list PRD: session memory only); no new requirement |
| 404 vs 403 semantics for wrong owner | Use not-found pattern everywhere |

### Team Dependencies

- **Product:** Approve phased scope, empty summary UX, and not-found copy.
- **Design:** Detail page layout, skeleton, error/not-found screen, date format.
- **Engineering:** Schema extension, page route, hook, TaskList onClick, tests.
- **QA:** Execute AC checklist per phase.

---

## 14. Assumptions & Open Questions

### Assumptions

1. Task `id` in URL is the domain UUID string already exposed in list queries.
2. Date formatting follows an existing app-wide utility or pattern (no new locale product work).
3. Phase 1 agent display is textual (“Unassigned”) without link to agent management.
4. Error copy reuses `getRequestErrorMessage` patterns where applicable.
5. `ProtectedAuthRoute` + login `returnUrl` pattern matches agent settings pages.

### Open Questions

| # | Question | Proposed default |
|---|----------|------------------|
| 1 | Show `updatedAt` in metadata when different from `createdAt`? | Yes, as secondary “Last updated” line |
| 2 | Phase 3: link agent name to agent edit page? | No link until product confirms |
| 3 | Dedicated `not-found.tsx` under `/tasks/[id]` vs inline error component? | Inline error in page shell (match agent edit error phase) |
| 4 | Include `task.type` in metadata for v1? | Out of scope unless design requests |

---

## Acceptance Criteria Count

**Phase 1 testable AC:** 28 items (AC-01–AC-17, AC-22–AC-28); AC-18–AC-21 marked phased.
