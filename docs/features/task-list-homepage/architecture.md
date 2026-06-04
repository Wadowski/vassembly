# Task List Homepage — Implementation Architecture

Product feature: authenticated users see their recent tasks below the home-page task composer, with search, load-more pagination, status display, and skeleton loading.

**Reference implementations:** `domains/agent` (user-scoped paginated list), `apps/api/src/graphql/resolvers/agent.ts`, `ui/api-hooks/src/agents/useAgents.ts`, `apps/web/app/agents/_components/AgentList/`.

**Prior art:** `docs/features/task-domain/architecture.md` (create-only v1 — now extended with queries + GraphQL).

---

## Analysis

### Existing reuse (librarian catalog)

| Area | Reuse from | Notes |
|------|------------|-------|
| Domain list query | `domains/agent/src/queries/getListForUser.ts` | `page`/`size`, regex search, `userId` filter, `createdAt: -1` sort |
| Pagination caps | Same file (`MAX_PAGE_SIZE = 50`) | Duplicate constant in task domain (domains cannot cross-import) |
| Service handler | `services/agent/src/handlers/listAgents/` | Thin pass-through to domain query |
| GraphQL resolver | `apps/api/src/graphql/resolvers/agent.ts` | Auth from context, map to DTO |
| GraphQL schema | `domains/agent/src/model/graphql.ts` | `AgentsList` → `TasksList` |
| API registration | `apps/api/src/graphql/index.ts` | Add `taskDomain.gqlSchema` + `registerTaskResolvers` |
| React hook | `ui/api-hooks/src/agents/useAgents.ts` | `useApolloLazyQuery`, `fetchPolicy: 'no-cache'` |
| Debounced search | `apps/web/lib/hooks/useDebouncedValue.ts` | 300ms debounce (match agents) |
| Skeleton | `@vassembly/ui-skeleton` | `AgentsSkeleton` pattern |
| Status display | `AgentList/tags.ts` | Map object for variant + label; use icons from `@vassembly/ui-icons` |
| Error toasts | `useSnackbar` + `getRequestErrorMessage` | Agent list pattern |
| Task create flow | `TaskInputComposer` + `useCreateTask` | Extend with `onCreateSuccess` callback |
| MongoDB index | `domains/task/src/clients/mongodb.ts` | `{ userId: 1, createdAt: -1 }` already exists |
| Task DTO/mapper | `toTaskResponse`, `TaskResponse` | Extend for optional `title`, new `failed` status |

### Gaps (new work)

| Gap | Placement |
|-----|-----------|
| `listUserTasks` domain query | `domains/task/src/queries/listUserTasks/` |
| `queries` namespace on domain | `domains/task/src/index.ts` |
| `gqlTaskSchema` | `domains/task/src/model/graphql.ts` |
| `listUserTasks` service handler | `services/task/src/handlers/listUserTasks/` |
| GraphQL resolver | `apps/api/src/graphql/resolvers/task.ts` |
| `useUserTasks` hook | `ui/api-hooks/src/tasks/graphql/` |
| `TaskList` UI | `apps/web/app/_components/TaskList/` |
| Homepage wiring | `apps/web/app/page.tsx` + refetch after create |
| `TaskStatus.Failed` | `domains/task/src/model/model.ts` + DTO + tests |

### New packages decision

**No new packages.** Extend existing `@vassembly/domain-task`, `@vassembly/service-task`, `@vassembly/ui-api-hooks`, `@vassembly/web`, `@vassembly/api`.

### AI summary field

Generation is deferred, but the UI must show a summary row. **Do not add `title` to MongoDB in this iteration.** Display rules:

- Render summary line only when `task.title` is non-null/non-empty (field reserved on GraphQL/DTO as optional `String`, always `null` from backend until a future command populates it).
- Search filter uses `$or: [{ description: regex }, { title: regex }]` so it works when the field is added without query changes.

Alternative (simpler v1): omit `title` from GraphQL entirely and hide the summary row until the field ships. **Chosen approach:** include nullable `title` on `TaskResponse`/GraphQL for forward compatibility; mapper returns `null`.

---

## Architecture Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Pagination strategy | **Offset via `page` + `size` (0-based page), default size 10** | Matches `agents` query across domain/service/GraphQL/hooks; `{ userId, createdAt }` index supports skip/limit; homepage uses **Load More** (client accumulates pages) not page controls |
| 2 | Search implementation | **Case-insensitive regex on `description` (+ `title` when present)** in domain query | Same as agent list; no Atlas Search needed for MVP; filter built in `domains/task/src/queries/shared/buildTaskSearchFilter.ts` |
| 3 | Status enum | **Add `TaskStatus.Failed = 'failed'`** | Requirements explicitly list four statuses; UI maps all four; no existing tasks use it until workflow commands exist |
| 4 | Icon library | **`@vassembly/ui-icons`** (design-system SVG components) | Already used in apps/web; no third-party icon libs |
| 5 | List fetch errors | **Snackbar on error; skeleton only on initial load (`loading && tasks.length === 0`)** | Consistent with agents; failed Load More keeps prior items visible |
| 6 | Apollo caching | **`fetchPolicy: 'no-cache'`**; accumulated list in React state | Matches `useAgents`; avoids cache merge complexity for append pagination |
| 7 | Refetch after create | **`onCreateSuccess` callback on `TaskInputComposer`** → homepage resets to page 0 and refetches | Minimal coupling; no global event bus; create stays REST, list stays GraphQL |

### Status icon mapping

| Status | Icon (`@vassembly/ui-icons`) | Color token (SCSS module) | Label |
|--------|------------------------------|---------------------------|-------|
| `created` | `TimeClockCircleIcon` | `--color-text-secondary` | Created |
| `in-progress` | `SingleNeutralCircleIcon` | `--color-info` | In progress |
| `done` | `CheckCircleIcon` | `--color-success` | Done |
| `failed` | `AlertCircleIcon` | `--color-error` | Failed |

Utilities in `apps/web/app/_components/TaskList/taskStatusDisplay.ts`:

```typescript
export const getStatusIcon = (status: TaskStatus): IconComponent => STATUS_ICON_MAP[status];
export const getStatusColor = (status: TaskStatus): string => STATUS_COLOR_MAP[status];
export const getStatusLabel = (status: TaskStatus): string => STATUS_LABEL_MAP[status];
```

---

## Architecture & Package Placement

### Data flow

```
apps/web (HomePage)
  → useUserTasks (ui/api-hooks) — GraphQL userTasks(page, size, search)
  → apps/api GraphQL /graphql
      → registerTaskResolvers → context.authenticatedUserId
      → listUserTasks (service-task)
          → taskDomain.queries.listUserTasks (domain-task)
              → taskMongodbDao.getManyRaw + countDocuments
          ← { items: TaskModel[], totalCount, page, size }
      ← map with toTaskResponse
  ← TasksList { items, totalCount, page, size }

apps/web TaskInputComposer
  → useCreateTask — POST /tasks (REST, unchanged)
  → onCreateSuccess() → reset page 0, refetch userTasks
```

### GraphQL contract

**Query:** `userTasks(page: Int, size: Int, search: String): TasksList!`

**Type `Task`:** mirrors `TaskResponse` fields exposed via `defineModelSchema`.

**Type `TasksList`:**

```typescript
interface TasksList {
  items: TaskResponse[];
  totalCount: number;
  page: number;
  size: number;
}
```

Use `totalCount` (not `total`) to align with `AgentsList`.

---

## Work Item Specifications

### 1. Backend: Domain Query Handler

**Path:** `domains/task/src/queries/listUserTasks/`

**Files:**

| File | Purpose |
|------|---------|
| `types.ts` | Input/output interfaces |
| `index.ts` | Query implementation |
| `index.test.ts` | Black-box tests |
| `../shared/buildTaskSearchFilter.ts` | Regex `$or` filter |
| `../shared/pagination.ts` | `MAX_PAGE_SIZE = 50`, `resolvePageSize` |
| `../index.ts` | Export `listUserTasks` |

**Signatures:**

```typescript
// types.ts
export interface ListUserTasksQueryInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
}

export interface ListUserTasksQueryResult {
  items: TaskModel[];
  totalCount: number;
  page: number;
  size: number;
}

// index.ts
export const listUserTasks = async (
  input: ListUserTasksQueryInput,
): Promise<ListUserTasksQueryResult>;
```

**Behavior:**

- Validate with Zod (`userId` min 1, `page` int ≥ 0, `size` int ≥ 1).
- Cap `size` at 50.
- Filter: `{ $and: [{ userId }, optionalSearchFilter] }`.
- Sort: `{ createdAt: -1 }`.
- Skip: `page * cappedSize`; limit: `cappedSize`.
- Parallel `getManyRaw` + `countDocuments`.
- Map rows through `taskFactory.create`.

**Domain index update:**

```typescript
import * as queries from './queries';

const taskDomain = { commands, queries, gqlSchema: gqlTaskSchema, mongodbIndexes };
export { commands, queries, gqlTaskSchema as gqlSchema, mongodbIndexes };
```

### 2. Backend: Service Handler

**Path:** `services/task/src/handlers/listUserTasks/`

```typescript
// types.ts
export interface ListUserTasksHandlerInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
}

export interface ListUserTasksHandlerOutput {
  items: TaskModel[];
  totalCount: number;
  page: number;
  size: number;
}

// index.ts
export const listUserTasks = async (
  input: ListUserTasksHandlerInput,
): Promise<ListUserTasksHandlerOutput> => {
  return taskDomain.queries.listUserTasks(input);
};
```

Auth scoping: `userId` comes from API context only — handler does not accept `userId` from client GraphQL args.

Export from `services/task/src/handlers/index.ts`.

### 3. Backend: GraphQL Layer

**Domain schema:** `domains/task/src/model/graphql.ts`

```typescript
export const gqlTaskSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Task',
    fields: (t) => ({
      userId: t.exposeString('userId'),
      description: t.exposeString('description'),
      type: t.exposeString('type'),
      status: t.exposeString('status'),
      agentAssignedId: t.exposeString('agentAssignedId', { nullable: true }),
      title: t.exposeString('title', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  builder.objectType('TasksList', { /* items, totalCount, page, size */ });
};
```

**Resolver:** `apps/api/src/graphql/resolvers/task.ts`

```typescript
export const registerTaskResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      userTasks: t.field({
        type: 'TasksList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
        },
        resolve: async (_root, args, context) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) throw new UnauthorizedError('Authentication required');

          const result = await taskService.listUserTasks({
            userId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
          });

          return {
            items: result.items.map((task) => toTaskResponse({ task: task as TaskModel })),
            totalCount: result.totalCount,
            page: result.page,
            size: result.size,
          };
        },
      }),
    }),
  });
};
```

**Register in** `apps/api/src/graphql/index.ts`:

```typescript
import * as taskDomain from '@vassembly/domain-task';
import { registerTaskResolvers } from './resolvers/task';

taskDomain.gqlSchema(builder);
registerTaskResolvers(builder);
```

**DTO/mapper updates** (`domains/task/src/model/dto.ts`, `toTaskResponse.ts`):

- Add `title: string | null` (always `null` until future command).
- Extend status union with `'failed'`.

### 4. Frontend: GraphQL Query Hook

**Paths:**

| File | Purpose |
|------|---------|
| `ui/api-hooks/src/tasks/graphql/listUserTasksQuery.ts` | Query document |
| `ui/api-hooks/src/tasks/types.ts` | Extend with list types (or `listTypes.ts`) |
| `ui/api-hooks/src/tasks/mapUserTasksListData.ts` | GraphQL → app types |
| `ui/api-hooks/src/tasks/useUserTasks.ts` | Lazy query hook |
| `ui/api-hooks/src/tasks/index.ts` | Re-export |

**Query:**

```graphql
query ListUserTasks($page: Int, $size: Int, $search: String) {
  userTasks(page: $page, size: $size, search: $search) {
    items {
      id
      userId
      description
      type
      status
      agentAssignedId
      title
      createdAt
      updatedAt
    }
    totalCount
    page
    size
  }
}
```

**Hook signature:**

```typescript
export interface UserTasksListQuery {
  page?: number;
  size?: number;
  search?: string;
}

export const useUserTasks = () => {
  // useApolloLazyQuery with fetchPolicy: 'no-cache', withAuth: true
  return { data, isLoading, error, fetch };
};

// fetch({ query?: UserTasksListQuery }): Promise<UserTasksListResponse | undefined>
```

Re-export `TaskStatus` from domain for consumers.

### 5. Frontend: Task List Component

**Path:** `apps/web/app/_components/TaskList/`

| File | Purpose |
|------|---------|
| `TaskList.tsx` | Presentational list + search + Load More |
| `TaskListItem.tsx` | Single row: summary, description, status |
| `TaskListSkeleton.tsx` | Skeleton rows (3–5 placeholders) |
| `taskStatusDisplay.ts` | Icon/color/label maps |
| `types.ts` | Component prop interfaces |
| `constants.ts` | `TASK_LIST_PAGE_SIZE = 10`, `SEARCH_DEBOUNCE_MS = 300` |
| `TaskList.module.scss` | Layout |

**Props (`TaskList.tsx`):**

```typescript
export interface TaskListProps {
  tasks: TaskDto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
}
```

**Rendering rules:**

- Initial load: `TaskListSkeleton` when `isLoading && tasks.length === 0`.
- Empty: render `null` when `!isLoading && tasks.length === 0` (per requirements).
- Summary: show `Text` line only if `task.title` is truthy.
- Description: always shown (truncated with CSS `line-clamp` if needed).
- Status: icon + label from `taskStatusDisplay.ts`.
- Search + Load More at bottom of list section.
- Load More: hidden when `!hasMore`; disabled + loading state when `isLoadingMore`.

### 6. Frontend: Status Icon Mapping

See decision table above. File: `apps/web/app/_components/TaskList/taskStatusDisplay.ts`.

Import icons from `@vassembly/ui-icons`. Colors via SCSS classes in `TaskListItem.module.scss` (e.g. `.statusCreated`, `.statusInProgress`, …) referencing design tokens.

### 7. Frontend: Homepage Integration

**New hook:** `apps/web/app/_components/TaskList/useHomeTaskList.ts`

```typescript
export const useHomeTaskList = () => {
  const { fetch, isLoading, error } = useUserTasks();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = tasks.length < totalCount;

  const loadPage = useCallback(async ({ page, append }: { page: number; append: boolean }) => { ... }, []);
  const refreshFromStart = useCallback(async () => { setPage(0); await loadPage({ page: 0, append: false }); }, []);
  const handleLoadMore = useCallback(async () => { ... append page+1 ... }, []);
  const handleSearchChange = useCallback((value: string) => { setSearchInput(value); setPage(0); }, []);

  // useEffect: refetch when debouncedSearch changes
  // useEffect: snackbar on error

  return { tasks, isLoading, isLoadingMore, hasMore, searchInput, handleSearchChange, handleLoadMore, refreshFromStart };
};
```

**Page update:** `apps/web/app/page.tsx` becomes a client section or uses `HomePageContent` client component:

```tsx
const HomePageContent = () => {
  const { tasks, isLoading, isLoadingMore, hasMore, searchInput, handleSearchChange, handleLoadMore, refreshFromStart } =
    useHomeTaskList();

  return (
    <main className={styles.page}>
      <TaskInputComposer onCreateSuccess={refreshFromStart} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onLoadMore={handleLoadMore}
      />
    </main>
  );
};
```

**TaskInputComposer change:** add optional prop:

```typescript
export interface TaskInputComposerProps {
  onCreateSuccess?: () => void;
}
```

Call `onCreateSuccess?.()` after successful create in `TaskInputComposer.tsx` (after snackbar).

**Auth:** Only fetch list when authenticated (match agents — use `useUserAuth().isAuthenticated` guard in `useHomeTaskList`).

---

## Dependencies & Integration Points

| Integration | Mechanism |
|-------------|-----------|
| Create → list refresh | `onCreateSuccess` → `refreshFromStart()` resets page 0, replaces tasks |
| Auth | GraphQL `withAuth: true`; unauthenticated users see composer only, no list fetch |
| Search reset | Debounced search change resets `page` to 0 and replaces accumulated tasks |
| Domain ↔ service | `taskDomain.queries.listUserTasks` called by service only |
| API ↔ service | Resolver calls `taskService.listUserTasks`, never domain directly |
| Types | `TaskResponse`/`TaskDto` shared via `@vassembly/domain-task` + api-hooks mapper |

**Sequential dependencies:**

1. Domain query (+ model/DTO/status changes) → 2. Service handler → 3. GraphQL → 4. api-hooks → 5. TaskList UI → 6. Homepage wiring

Items 4–6 can start with mocked data after GraphQL schema is stable.

---

## Test Strategy

### Domain — `domains/task/src/queries/listUserTasks/index.test.ts`

| Case | Expectation |
|------|-------------|
| Happy path | Returns items for `userId`, sorted newest first |
| Pagination | Page 1 returns next slice; `totalCount` unchanged |
| Search matches description | Filter applied |
| Search matches title (when field populated in fixture) | `$or` filter works |
| Empty search | Returns all user tasks |
| Invalid input | Validation error |
| Size cap | Requests > 50 capped to 50 |

Mock `taskMongodbDao.getManyRaw` and `collection.countDocuments`.

### Domain — model/mapper tests

Update/create tests for `TaskStatus.Failed` and `title: null` in `toTaskResponse`.

### Service — `services/task/src/handlers/listUserTasks/index.test.ts`

| Case | Expectation |
|------|-------------|
| Delegates to domain with same params | Pass-through |
| Domain error propagates | Throws |

### API — `apps/api/src/graphql/resolvers/task.test.ts` (new)

| Case | Expectation |
|------|-------------|
| Authenticated | Returns mapped list |
| Unauthenticated | `UnauthorizedError` |

### api-hooks — `ui/api-hooks/src/tasks/useUserTasks.test.ts`

Mirror `useAgents.test.ts`: mock Apollo, verify variables and mapped response.

### Frontend — optional component tests

Low priority for v1; manual QA on homepage. If added: `taskStatusDisplay.test.ts` for icon/label mapping per status.

---

## Recommendation

**Most conservative approach:** Clone the **agents list vertical slice** with these deltas:

1. Simpler filter (no status filter in v1 — show all statuses).
2. Load More accumulation instead of table pagination.
3. Add `TaskStatus.Failed` + nullable `title` on DTO for forward compatibility.
4. Empty list renders nothing; skeleton only on first load.
5. Refetch via `onCreateSuccess` callback — no Apollo cache invalidation.

This reuses four established layers (domain query → service → GraphQL resolver → lazy hook) and minimizes new patterns.

---

## Todo Plan

1. **`@vassembly/domain-task`** — [Type: domain extension]
   - Changes: Add `queries.listUserTasks`, shared search/pagination helpers, `gqlTaskSchema`, `TaskStatus.Failed`, optional `title` on DTO/mapper, wire `queries` + `gqlSchema` in index
   - Files: `domains/task/src/queries/**`, `domains/task/src/model/graphql.ts`, `domains/task/src/model/dto.ts`, `domains/task/src/model/toTaskResponse.ts`, `domains/task/src/index.ts`, tests
   - Workflow: unit-test-writer → coder → code-reviewer → documentation-writer
   - Dependencies: None

2. **`@vassembly/service-task`** — [Type: service extension]
   - Changes: Add `listUserTasks` handler
   - Files: `services/task/src/handlers/listUserTasks/**`, `services/task/src/handlers/index.ts`, tests
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: Todo 1

3. **`@vassembly/api`** — [Type: app extension]
   - Changes: Register task GraphQL schema + `userTasks` resolver
   - Files: `apps/api/src/graphql/resolvers/task.ts`, `apps/api/src/graphql/index.ts`, tests
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: Todos 1, 2

4. **`@vassembly/ui-api-hooks`** — [Type: UI package extension]
   - Changes: `listUserTasksQuery`, `mapUserTasksListData`, `useUserTasks`, exports
   - Files: `ui/api-hooks/src/tasks/graphql/**`, `ui/api-hooks/src/tasks/useUserTasks.ts`, `ui/api-hooks/src/tasks/index.ts`, tests
   - Workflow: unit-test-writer → coder → code-reviewer
   - Dependencies: Todo 3

5. **`@vassembly/web`** — [Type: app extension]
   - Changes: `TaskList` component tree, `useHomeTaskList`, homepage integration, `TaskInputComposer.onCreateSuccess`
   - Files: `apps/web/app/_components/TaskList/**`, `apps/web/app/_components/TaskInputComposer/**`, `apps/web/app/page.tsx`
   - Workflow: coder → code-reviewer
   - Dependencies: Todo 4
