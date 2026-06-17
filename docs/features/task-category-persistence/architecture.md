# Task Category Persistence — Architecture

## Analysis

### What Exists (Reuse)

| Existing piece | Location | Reuse plan |
|---|---|---|
| `INTENT_CATEGORY_SLUG` enum | `packages/constants/src/intentCategories/types.ts` | Use directly on model and DTO — no new types needed |
| `TaskModel` | `domains/task/src/model/model.ts` | Extend with `category` field |
| `TaskResponse` DTO | `domains/task/src/model/dto.ts` | Extend with `category` field |
| `toTaskResponse` mapper | `domains/task/src/model/toTaskResponse.ts` | Add `category` mapping |
| `updateDbById` helper | `@vassembly/commands` | Used by unified `updateTask` command |
| GraphQL task schema | `domains/task/src/model/graphql.ts` | Add nullable `category` string field |
| `generateTaskTitle` handler | `services/task/src/handlers/generateTaskTitle/` | Update to call `updateTask` instead of `updateTitle`; mirror for `generateTaskCategory` |
| `SYSTEM_AGENT_NAME.IntentClassifier` | `packages/constants/src/SystemAgentName.ts` | Reuse as the classifier agent — no new system agent needed |
| Internal tool registry | `packages/constants/src/internalTools/registry.ts` | Add single `update-task` entry |
| `createInternalToolHandlers` | `services/agent/src/helpers/internalTools/createInternalToolHandlers.ts` | Register new handler |
| `createTask` handler | `services/task/src/handlers/createTask/index.ts` | Add fire-and-forget `generateTaskCategory` call |

### What is Genuinely New

- `updateTask` domain command (`domains/task`) — unified command accepting optional `title` and/or `category`; supersedes the separate `updateTitle` command
- `generateTaskCategory` service handler (`services/task`) — mirrors `generateTaskTitle`; reuses `IntentClassifier` agent instead of creating a new one
- `normalizeGeneratedCategory` utility — validates LLM slug against enum values
- `updateTask` internal tool handler (`services/agent`) — single tool allowing agents to persist `title` and/or `category` during runtime execution

### Simplifications vs. Original Plan

| Original plan | Revised plan | Saving |
|---|---|---|
| `updateTitle` command + `updateCategory` command | Single `updateTask` command | −1 command, −3 files |
| `update-task-category` internal tool | Single `update-task` internal tool | −1 registry entry, −2 files |
| Two separate validation schemas | One schema validating both fields independently | Shared validation logic |
| `generateTaskTitle` calls `updateTitle` | `generateTaskTitle` calls `updateTask({ id, title })` | No additional command needed |

### Layers Involved

```
packages/constants           ← INTENT_CATEGORY_SLUG (read-only, already exists)
                             ← internalTools/registry.ts (new entry: update-task)
domains/task                 ← model + unified updateTask command
services/task                ← generateTaskCategory handler; generateTaskTitle updated
services/agent               ← updateTask internal tool handler
domains/system-agent/seed    ← assign update-task to Assistant (optional, can defer)
apps/api                     ← GraphQL schema already wired; no resolver changes needed
```

### No Migration Needed

MongoDB is schemaless. The `category` field is `optional/nullable` on the model, so existing documents without the field will naturally resolve to `null` through `task.category ?? null` in the mapper.

### Decision: Reuse IntentClassifier, No New System Agent

`generateTaskCategory` invokes `SYSTEM_AGENT_NAME.IntentClassifier` (already seeded, rule already outputs a bare slug). This avoids a new agent entry. `normalizeGeneratedCategory` validates the slug against `Object.values(INTENT_CATEGORY_SLUG)` and returns `{ isValid: false }` for any unrecognised output.

---

## Architecture & Package Placement

### Data Flow

**Post-create (async, fire-and-forget):**
```
POST /tasks
  → createTask handler (services/task)
    → taskDomain.commands.create
    → void generateTaskCategory({ taskId, userId })   ← NEW
    → void generateTaskTitle({ taskId, userId })      ← updated (uses updateTask internally)
  ← returns TaskResponse (category: null initially)

generateTaskTitle (async)
  → taskDomain.queries.getModelById
  → runAgentInvokeWithTools(TitleGenerator, task.description)
  → normalizeGeneratedTitle(rawOutput)
  → taskDomain.commands.updateTask({ id: taskId, title })   ← unified command

generateTaskCategory (async)
  → taskDomain.queries.getModelById
  → systemAgentDomain.queries.getActiveByName(IntentClassifier)
  → runAgentInvokeWithTools(IntentClassifier, task.description)
  → normalizeGeneratedCategory(rawOutput)
  → taskDomain.commands.updateTask({ id: taskId, category })  ← unified command
```

**Runtime (during executeTask, via internal tool):**
```
executeTask → Assistant → calls update_task(taskId, title?, category?)  ← NEW single tool
           → updateTask handler
             → taskDomain.commands.updateTask({ id: taskId, title?, category? })
```

**Read (GraphQL):**
```
query { task(id) { category } }
  → taskResolver → taskService.getTask → toTaskResponse (category included)
```

### Cross-Package Dependencies

- `domains/task` gains import of `INTENT_CATEGORY_SLUG` from `@vassembly/constants` (already a valid dependency direction — domain → constants package)
- `services/agent` gains import of `taskDomain` from `@vassembly/domain-task` (service → domain — follows the pattern)
- No circular dependencies introduced

---

## Recommendation

Use a single unified `updateTask` command for all task field updates. This eliminates parallel command structures (separate `updateTitle` / `updateCategory`) and ensures atomic updates with shared validation logic. A single `update-task` internal tool replaces what would have been two separate tools, reducing registry surface area and handler code.

**Trade-off noted:** Using `IntentClassifier` for post-create category generation means the same agent is called twice per task (once during `executeTask` routing, once for category persistence). This is acceptable at MVP scale. A future optimisation can capture the category from the `executeTask` classification step directly and skip the second LLM call.

---

## Implementation Steps

### Step 1 — Extend TaskModel, DTO, mapper, and GraphQL schema (`domains/task`)

**`domains/task/src/model/model.ts`** — add field:
```typescript
import type { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
// ...
category?: INTENT_CATEGORY_SLUG | null;
```

**`domains/task/src/model/dto.ts`** — add field to `TaskResponse`:
```typescript
import type { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
// ...
category: INTENT_CATEGORY_SLUG | null;
```

**`domains/task/src/model/toTaskResponse.ts`** — add mapping:
```typescript
category: task.category ?? null,
```

**`domains/task/src/model/graphql.ts`** — add GraphQL field:
```typescript
category: t.exposeString('category', { nullable: true }),
```

---

### Step 2 — Add unified `updateTask` domain command (`domains/task`)

This single command replaces both `updateTitle` and the planned `updateCategory`. It accepts optional `title` and/or `category`, validates each field independently, and performs an atomic update.

New folder: `domains/task/src/commands/updateTask/`

**`types.ts`:**
```typescript
import type { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import type { TaskModel } from '../../model';

export interface UpdateTaskCommandInput {
  id: string;
  title?: string;
  category?: INTENT_CATEGORY_SLUG;
}

export interface UpdateTaskCommandResult {
  data: TaskModel | undefined;
}
```

**`index.ts`:**
```typescript
import { updateDbById } from '@vassembly/commands';
import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory } from '../../model';
import type { UpdateTaskCommandInput, UpdateTaskCommandResult } from './types';

const VALID_SLUGS = Object.values(INTENT_CATEGORY_SLUG) as [string, ...string[]];

const UPDATE_TASK_INPUT_SCHEMA = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(120).optional(),
    category: z.enum(VALID_SLUGS).optional(),
  })
  .refine((data) => data.title !== undefined || data.category !== undefined, {
    message: 'At least one of title or category must be provided',
  });

const UPDATE_TASK_DB_SCHEMA = z.object({
  title: z.string().min(1).max(120).optional(),
  category: z.enum(VALID_SLUGS).optional(),
});

const persistUpdateTask = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: UPDATE_TASK_DB_SCHEMA,
});

export const updateTask = async ({
  id,
  title,
  category,
}: UpdateTaskCommandInput): Promise<UpdateTaskCommandResult> => {
  const parsed = UPDATE_TASK_INPUT_SCHEMA.safeParse({ id, title, category });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const data: Partial<Pick<TaskModel, 'title' | 'category'>> = {};
  if (parsed.data.title !== undefined) {
    data.title = parsed.data.title;
  }
  if (parsed.data.category !== undefined) {
    data.category = parsed.data.category as INTENT_CATEGORY_SLUG;
  }

  return persistUpdateTask({ id: parsed.data.id, data });
};
```

**`domains/task/src/commands/index.ts`** — replace `updateTitle` export with `updateTask`:
```typescript
export { updateTask } from './updateTask';
export type { UpdateTaskCommandInput, UpdateTaskCommandResult } from './updateTask/types';
```

> **Note:** Remove the `updateTitle` export from `index.ts`. The `updateTitle` folder can be deleted since `updateTask` fully covers its use case.

---

### Step 3 — Add `generateTaskCategory` service handler; update `generateTaskTitle` (`services/task`)

#### 3a — Update `generateTaskTitle` to use `updateTask`

**`services/task/src/handlers/generateTaskTitle/index.ts`** — change the persistence call:
```typescript
// Before:
await taskDomain.commands.updateTitle({ id: taskId, title });

// After:
await taskDomain.commands.updateTask({ id: taskId, title });
```

#### 3b — New `generateTaskCategory` handler

New folder: `services/task/src/handlers/generateTaskCategory/`

**`types.ts`:**
```typescript
export interface GenerateTaskCategoryHandlerInput {
  taskId: string;
  userId: string;
}
```

**`logTaskCategoryEvent.ts`** — mirrors `logTaskTitleEvent.ts`:
```typescript
import { logger } from '@vassembly/logger';

export type TaskCategoryLogEvent =
  | 'task.category.started'
  | 'task.category.completed'
  | 'task.category.failed'
  | 'task.category.skipped';

export interface LogTaskCategoryEventParams {
  event: TaskCategoryLogEvent;
  taskId: string;
  userId: string;
  durationMs?: number;
  reason?: string;
}

export const logTaskCategoryEvent = ({
  event,
  taskId,
  userId,
  durationMs,
  reason,
}: LogTaskCategoryEventParams): void => {
  logger(event, {
    meta: { sessionId: 'TASK_CATEGORY_GENERATION', taskId, userId },
    data: {
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(reason !== undefined ? { reason } : {}),
    },
  });
};
```

**`normalizeGeneratedCategory.ts`** — validates raw LLM output against the enum:
```typescript
import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

export type NormalizeGeneratedCategoryResult =
  | { isValid: true; category: INTENT_CATEGORY_SLUG }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedCategoryParams {
  rawOutput: string;
}

export const normalizeGeneratedCategory = ({
  rawOutput,
}: NormalizeGeneratedCategoryParams): NormalizeGeneratedCategoryResult => {
  const normalized = rawOutput.trim().split('\n')[0]!.trim().toLowerCase();

  if (normalized === '') {
    return { isValid: false, reason: 'empty_output' };
  }

  if (!VALID_SLUGS.has(normalized)) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return { isValid: true, category: normalized as INTENT_CATEGORY_SLUG };
};
```

**`index.ts`** — mirrors `generateTaskTitle/index.ts`, calls `updateTask`:
```typescript
import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain from '@vassembly/domain-task';
import { runAgentInvokeWithTools } from '@vassembly/service-agent';

import { logTaskCategoryEvent } from './logTaskCategoryEvent';
import { normalizeGeneratedCategory } from './normalizeGeneratedCategory';
import type { GenerateTaskCategoryHandlerInput } from './types';

export const generateTaskCategory = async ({
  taskId,
  userId,
}: GenerateTaskCategoryHandlerInput): Promise<void> => {
  const startedAt = Date.now();

  try {
    logTaskCategoryEvent({ event: 'task.category.started', taskId, userId });

    const taskResult = await taskDomain.queries.getModelById({ id: taskId });
    const task = taskResult.data;

    if (task?.category != null) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'already_set' });
      return;
    }

    if (!task?.description?.trim()) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'empty_description' });
      return;
    }

    const preference = await systemAgentDomain.queries.getPreferenceByUserId({ userId });
    const integrationCredentialId = preference.data?.integrationCredentialId;

    if (!integrationCredentialId) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: 'missing_credential' });
      return;
    }

    const agentResult = await systemAgentDomain.queries.getActiveByName({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
    });

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: agentResult.data.id!,
      message: task.description,
      connectionOverride: { integrationCredentialId },
      toolContext: {} as Parameters<typeof runAgentInvokeWithTools>[0]['toolContext'],
    });

    const normalized = normalizeGeneratedCategory({ rawOutput: invokeResult.message });

    if (!normalized.isValid) {
      logTaskCategoryEvent({ event: 'task.category.skipped', taskId, userId, reason: normalized.reason });
      return;
    }

    await taskDomain.commands.updateTask({ id: taskId, category: normalized.category });

    logTaskCategoryEvent({
      event: 'task.category.completed',
      taskId,
      userId,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logTaskCategoryEvent({
      event: 'task.category.failed',
      taskId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
};
```

**Update `services/task/src/handlers/createTask/index.ts`** — add fire-and-forget call (after `generateTaskTitle`):
```typescript
void generateTaskCategory({ taskId: result.data.id!, userId }).catch((error: unknown) => {
  logger('task.category.unhandled', {
    meta: { sessionId: 'TASK_CATEGORY_GENERATION', taskId: result.data.id, userId },
    data: { error: error instanceof Error ? error.message : String(error) },
  });
});
```

**Update `services/task/src/handlers/index.ts`** — add export:
```typescript
export { generateTaskCategory } from './generateTaskCategory';
export type { GenerateTaskCategoryHandlerInput } from './generateTaskCategory/types';
```

---

### Step 4 — Add `update-task` internal tool (`packages/constants` + `services/agent`)

**`packages/constants/src/internalTools/registry.ts`** — add single entry to `INTERNAL_TOOLS`:
```typescript
{
  id: 'update-task',
  displayName: 'Update task',
  description: 'Persist title and/or category for a task by its ID',
  accessScope: InternalToolAccessScope.SYSTEM_ONLY,
  llmToolName: 'update_task',
},
```

New folder: `services/agent/src/helpers/internalTools/updateTask/`

**`types.ts`:**
```typescript
export interface UpdateTaskArgs {
  taskId: string;
  title?: string;
  category?: string;
}
```

**`index.ts`:**
```typescript
import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import taskDomain from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

import type { UpdateTaskArgs } from './types';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

export const updateTask = async (args: Record<string, unknown>): Promise<string> => {
  const { taskId, title, category } = args as UpdateTaskArgs;

  if (typeof taskId !== 'string' || !taskId) {
    throw new ValidationError('taskId is required');
  }

  if (title === undefined && category === undefined) {
    throw new ValidationError('At least one of title or category must be provided');
  }

  if (title !== undefined && (typeof title !== 'string' || !title)) {
    throw new ValidationError('title must be a non-empty string');
  }

  if (category !== undefined && !VALID_SLUGS.has(category)) {
    throw new ValidationError(`category must be one of: ${[...VALID_SLUGS].join(', ')}`);
  }

  await taskDomain.commands.updateTask({
    id: taskId,
    ...(title !== undefined ? { title } : {}),
    ...(category !== undefined ? { category: category as INTENT_CATEGORY_SLUG } : {}),
  });

  const updated = [title !== undefined ? `title` : null, category !== undefined ? `category` : null]
    .filter(Boolean)
    .join(' and ');

  return `Updated ${updated} for task ${taskId}`;
};
```

**Update `services/agent/src/helpers/internalTools/createInternalToolHandlers.ts`:**
```typescript
import { updateTask } from './updateTask';

// add to handler map:
'update-task': (args) => updateTask(args),
```

---

### Step 5 — Assign tool to Assistant in seed (optional, can defer) (`domains/system-agent`)

**`domains/system-agent/seed/systemAgents.json`** — add `update-task` to Assistant's `assignedToolIds`:
```json
{
  "name": "Assistant",
  "assignedToolIds": ["use-agent", "list-agents", "update-task"]
}
```

This enables the Assistant to persist title and/or category during `executeTask`. Deferring this is safe — the post-create `generateTaskCategory` handler covers the primary persistence path.

---

### Step 6 — No database migration required

MongoDB is schemaless. Documents without `category` will return `undefined` on read, which the mapper converts to `null`. No index is needed for MVP (category is not a query filter in existing queries).

If category-based filtering is added later, add an index in the domain's MongoDB client bootstrap alongside existing indexes.

---

## Todo Plan

```
1. domains/task — extend model, DTO, mapper, GraphQL schema
   Changes needed: Add optional nullable category field throughout the model layer
   Files to modify:
     - domains/task/src/model/model.ts          (add category field)
     - domains/task/src/model/dto.ts             (add category to TaskResponse)
     - domains/task/src/model/toTaskResponse.ts  (map category field)
     - domains/task/src/model/graphql.ts         (expose category as nullable string)
   Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer
   Dependencies: none

2. domains/task — unified updateTask command (replaces updateTitle + planned updateCategory)
   Changes needed: New command accepting optional title and/or category with independent validation;
                   remove updateTitle export from commands/index.ts; delete updateTitle folder
   Files to create:
     - domains/task/src/commands/updateTask/index.ts
     - domains/task/src/commands/updateTask/types.ts
   Files to modify:
     - domains/task/src/commands/index.ts (replace updateTitle export with updateTask)
   Files to delete:
     - domains/task/src/commands/updateTitle/ (superseded by updateTask)
   Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations)
   Dependencies: todo #1 (category field must exist on model)

3. packages/constants — add update-task internal tool definition
   Changes needed: Register single SYSTEM_ONLY internal tool in the registry
   Files to modify:
     - packages/constants/src/internalTools/registry.ts
   Suggested subagent workflow: coder → Done
   Dependencies: none

4. services/task — generateTaskCategory handler + update generateTaskTitle + wire into createTask
   Changes needed: New handler mirroring generateTaskTitle (calls updateTask for category);
                   update generateTaskTitle to call updateTask instead of updateTitle;
                   fire-and-forget generateTaskCategory call in createTask
   Files to create:
     - services/task/src/handlers/generateTaskCategory/index.ts
     - services/task/src/handlers/generateTaskCategory/types.ts
     - services/task/src/handlers/generateTaskCategory/logTaskCategoryEvent.ts
     - services/task/src/handlers/generateTaskCategory/normalizeGeneratedCategory.ts
     - services/task/src/handlers/generateTaskCategory/normalizeGeneratedCategory.test.ts
   Files to modify:
     - services/task/src/handlers/generateTaskTitle/index.ts (updateTitle → updateTask call)
     - services/task/src/handlers/createTask/index.ts (add fire-and-forget call)
     - services/task/src/handlers/index.ts (add export)
   Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer
   Dependencies: todos #1 and #2

5. services/agent — updateTask internal tool handler
   Changes needed: New handler folder accepting taskId + optional title/category; register in createInternalToolHandlers
   Files to create:
     - services/agent/src/helpers/internalTools/updateTask/index.ts
     - services/agent/src/helpers/internalTools/updateTask/types.ts
   Files to modify:
     - services/agent/src/helpers/internalTools/createInternalToolHandlers.ts
   Suggested subagent workflow: tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations)
   Dependencies: todos #2 and #3

6. domains/system-agent — assign update-task to Assistant (optional)
   Changes needed: Add tool id to Assistant's assignedToolIds in seed file
   Files to modify:
     - domains/system-agent/seed/systemAgents.json
   Suggested subagent workflow: coder → Done
   Dependencies: todo #3
```

### Parallelism

- Todos #1 and #3 have no dependencies — run in parallel.
- Todo #2 depends on #1 only.
- Todos #4 and #5 can run in parallel once their respective deps are done.
- Todo #6 is purely a seed data change, can be done any time after #3.

### Test Coverage

| File | Test type | Notes |
|---|---|---|
| `domains/task/src/commands/updateTask/index.ts` | Unit | No fields provided (validation error), title-only, category-only, both fields, invalid title (too long), invalid category slug, invalid id |
| `domains/task/src/model/toTaskResponse.ts` | Unit | Existing test file; add cases for `category: null` and `category: 'task'` |
| `services/task/src/handlers/generateTaskCategory/normalizeGeneratedCategory.ts` | Unit | Empty string, valid slugs, invalid slug, extra whitespace |
| `services/task/src/handlers/generateTaskCategory/index.ts` | Unit | Already-set skip, missing credential skip, invalid slug skip, happy path |
| `services/agent/src/helpers/internalTools/updateTask/index.ts` | Unit | Missing taskId, no fields provided, invalid category, title-only, category-only, both fields |
