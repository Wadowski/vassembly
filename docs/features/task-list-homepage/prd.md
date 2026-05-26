# Product Requirements Document: Task List Homepage

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-05-26  
**Primary route:** `/` (homepage)  
**Related docs:** `docs/features/task-list-homepage/architecture.md`, `docs/features/task-domain/` (task create v1)

---

## 1. Project Overview & Scope

### Feature Name

Task List Homepage

### Target Audience

Authenticated Vassembly users who create tasks from the homepage via `TaskInputComposer` and need to view, search, and browse their recent task history without leaving the homepage.

### In-Scope

- Task list section rendered **below** `TaskInputComposer` on the homepage (`/`)
- Display of the **10 most recent** user tasks on initial load (newest first by `createdAt`)
- Each task row shows:
  - **AI summary** (when non-null/non-empty; field present but always null until a future feature)
  - **Description** (always shown)
  - **Status** with distinct icon + human-readable label
- **Skeleton loaders** during initial list fetch
- **Empty state:** render nothing (no placeholder, illustration, or copy)
- **Load More** pagination: server-side offset pagination, 10 items per page, client-side accumulation
- **Search** input at the bottom of the list (alongside Load More): case-insensitive match on description and AI summary
- **Debounced search** (300ms); resets pagination to page 0 on search change
- **List refresh after task create:** refetch from page 0; clear search input; new task appears at top when it matches current filters
- **Error handling:** snackbar on fetch failure; preserve existing items on Load More failure
- **Auth scoping:** only authenticated users fetch and see the list; users see only their own tasks
- **Task item affordance:** clickable row with hover feedback; navigation to task detail is a **placeholder** (no destination page in this release)
- **Status enum extension:** add `failed` as a supported display status alongside `created`, `in-progress`, and `done`

### Out-of-Scope

- Task detail page (future PR)
- AI summary generation or persistence (future PR; UI supports nullable field only)
- Task status updates via UI
- Bulk actions (delete, archive, etc.)
- Advanced filtering (status, date range, type)
- Export or download of tasks
- Task templates or recurrence
- Real-time/push updates beyond refetch-on-create
- Pagination UI other than Load More (no page numbers or prev/next controls)

---

## 2. User Experience & Logic (The "What")

### User Journeys

**Journey A — View recent tasks**

1. Authenticated user lands on `/`.
2. User sees `TaskInputComposer` at the top (unchanged).
3. Below the composer, skeleton placeholders appear while the first page of tasks loads.
4. Up to 10 most recent tasks render as cards, newest at the top.
5. If the user has no tasks, nothing appears below the composer (no empty-state UI).

**Journey B — Load older tasks**

1. User has more than 10 tasks.
2. A **Load More** button appears below the list (when `hasMore` is true).
3. User clicks **Load More**; button shows a loading state.
4. The next 10 tasks append to the existing list without replacing prior items.
5. When all tasks are loaded, **Load More** is hidden.

**Journey C — Search tasks**

1. User enters text in the search field at the bottom of the list section.
2. After 300ms debounce, the list refetches from page 0 with the search term applied.
3. Only tasks whose **description** or **AI summary** match (case-insensitive) are shown.
4. Load More continues to work against the filtered result set.
5. Clearing search refetches the unfiltered list from page 0.

**Journey D — Create task and see it in the list**

1. User submits a new task via `TaskInputComposer`.
2. On successful create, the search input is cleared and the list refetches from page 0.
3. The new task appears at the top of the list (if it matches the cleared search).

**Journey E — Unauthenticated visitor**

1. Unauthenticated user lands on `/`.
2. User sees `TaskInputComposer` only; no task list section, no list fetch, no login prompt in the list area.
3. Task creation continues to redirect unauthenticated users to login per existing composer behavior.

### Functional Requirements

#### Layout & visibility

- `TaskList` sits directly below `TaskInputComposer` within the homepage main content area.
- The entire list section (items, search, Load More) is **omitted** when:
  - User is not authenticated, OR
  - Initial load completed with zero matching tasks (`!isLoading && tasks.length === 0`)
- On initial load with potential data, show skeleton rows matching approximate task card height (3–5 placeholders).
- Search field and **Load More** render at the **bottom** of the list section, below task items.
- Layout is responsive across mobile, tablet, and desktop.

#### Task item content

| Field | Display rule |
|-------|----------------|
| Title | Show as a distinct text line **only** when `title` is non-null and non-empty; omit the line entirely when null/empty |
| Description | Always shown; truncate visually with line-clamp if needed (no expand/collapse in v1) |
| Status | Icon + label badge using design-system mapping (see Content & Messaging) |
| Created date | Not shown in v1 |

#### Status display

| Status value | Label | Icon | Color token |
|--------------|-------|------|-------------|
| `created` | Created | `TimeClockCircleIcon` | secondary |
| `in-progress` | In progress | `SingleNeutralCircleIcon` | info |
| `done` | Done | `CheckCircleIcon` | success |
| `failed` | Failed | `AlertCircleIcon` | error |

#### Pagination

- Default page size: **10**; API accepts `page` (0-based) and `size`.
- **Load More** visible only when `tasks.length < totalCount` (`hasMore === true`).
- Clicking **Load More** requests `page + 1` with current search term and **appends** results.
- **Load More** hidden when all items loaded.
- **Load More** disabled and shows loading indicator while a load-more request is in flight.
- Maximum page size enforced by API: **50** per request.

#### Search

- Single text input; no separate submit button (search triggers on debounced input change).
- Debounce interval: **300ms**.
- Any search input change resets client pagination to page 0 and **replaces** (does not append) accumulated tasks.
- Search is case-insensitive and matches substrings in `description` or `title`.
- Whitespace-only search is treated as empty search (returns unfiltered list).
- On successful task create, search input value is **cleared** before refetch.

#### Task item interaction (placeholder)

- Each task row is visually interactive: pointer cursor, subtle hover effect (e.g., slight scale or elevation).
- Row acts as a clickable target prepared for future navigation; **no task detail route ships in this PR** — click may be inert or use a no-op placeholder until detail page exists.

#### Refresh after create

- `TaskInputComposer` exposes an optional success callback invoked after successful task creation (after success snackbar).
- Homepage list hook resets to page 0, clears search, and refetches.

#### Data contract (behavioral, not implementation)

- GraphQL query `userTasks(page, size, search)` returns `{ items, totalCount, page, size }`.
- Each task includes: `id`, `userId`, `description`, `type`, `status`, `agentAssignedId`, `title` (nullable), `createdAt`, `updatedAt`.
- List is sorted by **creation date descending** (newest first).
- Query is scoped to the authenticated user's `userId` only.

### Content & Messaging

| Context | Copy |
|---------|------|
| Task create success (existing) | Task created successfully |
| List fetch error (snackbar) | Unable to load tasks. Please try again. |
| Load More fetch error (snackbar) | Unable to load more tasks. Please try again. |
| Search placeholder | Search tasks… |
| Load More button | Load More |
| Status labels | Created, In progress, Done, Failed |

Error copy may reuse existing `getRequestErrorMessage` patterns where applicable; user-facing messages must not expose internal error codes or stack traces.

---

## 3. Use Cases (Gherkin Syntax)

### Primary Use Case

```gherkin
Scenario: Authenticated user views recent tasks on homepage
  Given I am signed in
  And I have at least one task
  When I navigate to the homepage
  Then I see TaskInputComposer at the top
  And I see up to 10 of my most recent tasks below the composer
  And tasks are ordered with the newest first
  And each task shows its description and status icon with label
```

### Secondary Use Cases

```gherkin
Scenario: User loads additional tasks with Load More
  Given I am signed in
  And I have 15 tasks
  And the homepage shows my 10 most recent tasks
  When I click "Load More"
  Then 5 additional tasks are appended below the existing list
  And the "Load More" button is no longer visible
```

```gherkin
Scenario: User searches tasks by description
  Given I am signed in
  And I have tasks with descriptions "Fix login bug" and "Update homepage"
  When I type "login" into the search field
  And 300ms have elapsed since my last keystroke
  Then only tasks matching "login" in description or AI summary are shown
  And the list resets to the first page of search results
```

```gherkin
Scenario: New task appears after creation
  Given I am signed in
  And the task list is visible with an active search term
  When I create a new task successfully via TaskInputComposer
  Then the search field is cleared
  And the task list refetches from the first page
  And my new task appears at the top of the list
```

```gherkin
Scenario: User with no tasks sees no list section
  Given I am signed in
  And I have zero tasks
  When I navigate to the homepage
  Then I see TaskInputComposer
  And I do not see task list skeletons, items, search, or Load More
```

```gherkin
Scenario: Unauthenticated visitor does not see task list
  Given I am not signed in
  When I navigate to the homepage
  Then I see TaskInputComposer
  And no task list is rendered
  And no task list data is requested
```

---

## 4. Edge Cases & Error Handling (Gherkin Syntax)

### Empty States

```gherkin
Scenario: Search returns no matches
  Given I am signed in
  And I have tasks that do not match "xyz"
  When I search for "xyz"
  And the debounced search completes
  Then the task list section is not rendered
  And no empty-state message is shown
```

```gherkin
Scenario: AI summary is null
  Given I am signed in
  And a task has a null AI summary
  When the task appears in the list
  Then the description and status are shown
  And no summary line is shown for that task
```

### Validation Rules

```gherkin
Scenario: API rejects oversized page request
  Given I am signed in
  When the client requests a page size greater than 50
  Then the API returns at most 50 items for that request
```

```gherkin
Scenario: Search with only whitespace
  Given I am signed in
  And I have entered only spaces in the search field
  When the debounced search runs
  Then the list behaves as if search were empty
  And all my tasks matching default pagination are eligible to appear
```

### Interrupted Flows

```gherkin
Scenario: Initial list fetch fails
  Given I am signed in
  When the first page of tasks fails to load
  Then an error snackbar is displayed
  And no task items are shown
  And the user can retry by refreshing the page or adjusting search later
```

```gherkin
Scenario: Load More fails after partial list loaded
  Given I am signed in
  And I have already loaded 10 tasks successfully
  When clicking "Load More" fails
  Then an error snackbar is displayed
  And the 10 previously loaded tasks remain visible
  And I can click "Load More" again to retry
```

```gherkin
Scenario: Search changes while a request is in flight
  Given I am signed in
  And a list request for search term "alpha" is in progress
  When I change the search term to "beta" before the prior request completes
  Then the list eventually reflects results for "beta" only
  And results from "alpha" do not remain visible if they do not match "beta"
```

### System Errors

```gherkin
Scenario: Unauthenticated GraphQL request for userTasks
  Given I am not signed in
  When a client attempts to query userTasks
  Then the API responds with an authentication error
  And no task data is returned
```

```gherkin
Scenario: User attempts to view another user's tasks
  Given I am signed in as User A
  When the userTasks query executes
  Then only tasks belonging to User A are returned
  And tasks belonging to other users are never included
```

---

## 5. Non-Functional Requirements

### Performance

- Initial list fetch target: **< 200ms** server processing under normal load (excluding network latency).
- Search debounce: **300ms** minimum between query executions driven by input changes.
- Pagination query uses indexed sort/filter on `{ userId: 1, createdAt: -1 }`.
- Client avoids unnecessary re-renders when updating accumulated task arrays or debounced search state.

### Accessibility (a11y)

- Search input is keyboard-focusable with a visible focus indicator.
- Load More is a native button (or equivalent) operable via keyboard and screen readers.
- Status is conveyed by **text label**, not icon alone; icons are decorative/supplementary.
- Skeleton loaders use appropriate busy/loading semantics where the design system supports them.
- Task rows prepared as interactive elements must expose correct role and name when click behavior is wired (even if navigation is deferred).

### Platform Specifics

- **Web only** (Next.js homepage); responsive layout for mobile, tablet, and desktop.
- Follow existing homepage and agents-list interaction patterns for debounced search and snackbar errors.

### Persistence

- Task list state (accumulated pages, search input) is **session-scoped in client memory** only; no localStorage persistence for list filters in v1.
- Task draft persistence for unauthenticated composer input remains unchanged (`taskSessionStorage`).

---

## 6. Acceptance Criteria (For QA/Testers)

### Functional Checklist

1. **Homepage placement:** `TaskList` renders below `TaskInputComposer` on `/` for authenticated users with at least one matching task (after load completes).
2. **Default page size:** Initial fetch requests 10 tasks; newest appear first.
3. **Task fields:** Each item shows description, status icon + label; AI summary line only when value is present.
4. **Initial loading:** Skeleton placeholders shown while `isLoading && tasks.length === 0`.
5. **Empty state:** When `!isLoading && tasks.length === 0`, no list UI (no message, no search, no Load More).
6. **Status coverage:** All four statuses (`created`, `in-progress`, `failed`, `done`) render with distinct icon and color.
7. **Load More visibility:** Button shown only when `hasMore === true` (`tasks.length < totalCount`).
8. **Load More behavior:** Appends next 10 tasks; button hidden when all loaded.
9. **Load More loading state:** Button disabled with loading indicator during fetch.
10. **Search placement:** Search input at bottom of list section alongside Load More.
11. **Search matching:** Case-insensitive substring match on description and AI summary.
12. **Search debounce:** Queries fire ~300ms after typing stops, not on every keystroke.
13. **Search pagination reset:** Changing search replaces list and resets to page 0.
14. **Create refresh:** After successful create, search clears and list refetches from page 0 with new task at top.
15. **Fetch error:** Initial load failure shows error snackbar; no stale task rows from failed fetch.
16. **Load More error:** Failure keeps existing items visible and shows error snackbar.
17. **Auth — authenticated:** Only signed-in users trigger list fetch and see list UI.
18. **Auth — scoping:** Returned tasks belong exclusively to the authenticated user.
19. **Auth — unauthenticated:** No list section and no list fetch for signed-out users.
20. **Task row affordance:** Rows show hover/interactive styling; detail navigation explicitly out of scope.

### UI/UX States

| State | Expected UI |
|-------|-------------|
| Initial loading | Skeleton rows only (no task cards, no empty message) |
| Loaded with data | Task cards + search + Load More (if applicable) |
| Loaded empty | Nothing below composer |
| Loading more | Prior tasks visible; Load More in loading/disabled state |
| Search active | Filtered results; pagination applies to filtered `totalCount` |
| Error | Snackbar error; prior data retained on Load More failure |

### Regression Check

- `TaskInputComposer` create flow, validation, and unauthenticated redirect-to-login behavior unchanged.
- Homepage heading and composer layout unchanged aside from added list section.
- Existing task create REST endpoint behavior unchanged.
- No task detail route regressions (none exists yet).

---

## 7. Test Plan Outline

### Unit Tests — Domain (`listUserTasks` query)

- Returns user-scoped tasks sorted `createdAt` descending.
- Pagination: page 0 vs page 1 slices; `totalCount` stable across pages.
- Search matches description; search matches `title` when populated in fixture.
- Empty/whitespace search returns unfiltered user tasks.
- Invalid input throws validation error.
- Requested `size` > 50 capped to 50.

### Unit Tests — Service Handler

- Pass-through to domain with identical parameters.
- Domain errors propagate.

### Unit Tests — GraphQL Resolver

- Authenticated context returns mapped `TasksList`.
- Missing auth throws unauthorized error.
- Response includes nullable `title` and `failed` status when present on model.

### Unit Tests — Model / Mapper

- `TaskStatus.Failed` recognized.
- `toTaskResponse` includes `title: null` until field is populated.

### Unit Tests — `useUserTasks` Hook

- Lazy query invoked with correct `page`, `size`, `search` variables.
- Auth-enabled fetch behavior matches existing api-hooks patterns.
- Response mapped to client DTO types.

### Unit Tests — `useHomeTaskList` Hook (if extracted)

- Debounced search triggers refetch from page 0.
- Load More appends and increments page.
- `refreshFromStart` clears search and replaces tasks.
- `hasMore` derived from `tasks.length` vs `totalCount`.

### Component Tests — `TaskList` / `TaskListItem` (recommended)

- Renders skeleton when loading with empty tasks.
- Renders null when not loading and empty.
- Renders summary line conditionally.
- Status badge for each enum value.
- Load More hidden when `hasMore` false.

### Component Tests — `taskStatusDisplay`

- Icon, label, and color mapping for all four statuses.

### Manual / E2E

1. Sign in → homepage shows up to 10 tasks, newest first.
2. Create task → appears at top; search cleared.
3. Load More with 15+ tasks → 10 then 5; button disappears.
4. Search filters list; clear search restores full list.
5. Sign out → list absent; composer still visible.
6. Simulate API failure → snackbar; Load More failure retains prior rows.

---

## 8. Assumptions & Open Questions

### Assumptions

1. **Empty state applies to the entire list section**, including search and Load More, when there are zero matching tasks after load or search.
2. **Search and Load More are hidden** until the user has at least one visible task (list section only appears when `tasks.length > 0` after loading completes).
3. **Task row click** is a visual placeholder only in v1 — no navigation, or explicit no-op — until the task detail PR defines the route.
4. **`title` is always null** from the backend in this release; search still accepts the field for forward compatibility.
5. **Unauthenticated users** see composer only; no dedicated "sign in to view tasks" prompt in the list area (login prompt remains on create attempt).
6. **Maximum 50 items per API page** is a server-enforced cap; homepage uses 10.

### Blocking Questions

| # | Question | Default if unanswered |
|---|----------|----------------------|
| 1 | Should task rows navigate anywhere on click in v1 (e.g., `#`, disabled cursor), or remain purely visual? | Visual hover only; click is no-op |
| 2 | When search returns zero results but the user previously had tasks, should search input remain visible to allow clearing? | **Yes** — keep search visible when user has typed a search term, even if results are empty; otherwise user cannot recover without refresh. **(Recommend revising strict "show nothing" for this sub-case.)** |
| 3 | Exact description truncation: max lines before clamp? | 2–3 lines via CSS line-clamp (design discretion) |

**Note on Q2:** Strict "show nothing" when `tasks.length === 0` conflicts with search UX. **Recommended PRD clarification:** hide entire section only when unfiltered empty (no tasks at all); when user has active search with zero hits, show search control (and optionally "no results" — currently out of scope per empty-state rule). Flag for product/design confirmation.

---

## Acceptance Criteria Checksum

**Total: 20** functional acceptance criteria (Section 6, items 1–20), covering display, pagination, search, errors, auth, and interaction placeholder.
