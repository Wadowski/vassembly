# `@vassembly/domain-task-plan-instance`

Per-comment execution binding for a task plan — tracks runtime status, item outputs, and retry counts for a single plan run. Each instance references one `@vassembly/domain-task-plan-template` and is uniquely bound to a `commentId` (one instance per comment turn).

**Consumers:** `@vassembly/service-agent` (`persist_task_plan` creates instances), `@vassembly/service-task` (`orchestrateTaskPlanInstance` drives execution), `apps/api` (GraphQL reads, activity timeline enrichment).

**Architecture:** See [Task Plan — Architecture](../../docs/features/task-plan/architecture.md).

## Usage

```typescript
import taskPlanInstanceDomain, {
  TaskPlanInstanceStatus,
} from '@vassembly/domain-task-plan-instance';

const instance = await taskPlanInstanceDomain.commands.create({
  taskPlanTemplateId: 'template-123',
  taskId: 'task-456',
  commentId: 'comment-789',
  inputDetails: { documentReference: 'Q1 report' },
  templateItems: [
    {
      agentId: 'agent-worker-id',
      skillId: 'skill-summarize-id',
      description: 'Summarize the report',
      order: 0,
    },
  ],
});

await taskPlanInstanceDomain.commands.updateItemStatus({
  id: instance.data.id!,
  templateItemIndex: 0,
  status: TaskPlanInstanceStatus.InProgress,
});

await taskPlanInstanceDomain.commands.updateItemStatus({
  id: instance.data.id!,
  templateItemIndex: 0,
  status: TaskPlanInstanceStatus.Done,
  output: { summary: 'Key findings...' },
});
```

Domain writes are not exposed via public REST routes. Instances are created by `persist_task_plan` and updated by the orchestration loop in `@vassembly/service-task`.

## Exports

### Default export (`taskPlanInstanceDomain`)

Object with `commands` and `queries` namespaces.

```typescript
import taskPlanInstanceDomain from '@vassembly/domain-task-plan-instance';

const byComment = await taskPlanInstanceDomain.queries.getByCommentId({
  commentId: 'comment-789',
});
```

### Named type exports

- **`TaskPlanInstanceStatus`** — `pending` | `in-progress` | `done` | `failed`
- **`TaskPlanInstanceItem`** — per-item runtime state (status, timestamps, output, retry count)

### Commands

#### `commands.create(input): CreateTaskPlanInstanceCommandResult`

Creates a run-specific instance seeded from template items. All items start as `pending` with `retryCount: 0`. Enforces unique `commentId` at the DAO layer — duplicate create throws `ConflictError`.

| Field | Type | Description |
|-------|------|-------------|
| `taskPlanTemplateId` | `string` | Reference to the plan template |
| `taskId` | `string` | Parent task |
| `commentId` | `string` | Comment turn (unique per instance) |
| `inputDetails` | `Record<string, unknown>` | Resolved slot values for this run |
| `templateItems` | `array` | Items copied from the template (`agentId`, `skillId`, `description`, `order`) |

#### `commands.updateItemStatus({ id, templateItemIndex, status, output?, errorMessage? })`

Updates a single item's status and timestamps, then recomputes instance-level `status`/`startedAt`/`completedAt`/`failedAt` via `deriveInstanceStatus`.

| Status transition | Item fields set |
|-------------------|-----------------|
| `in-progress` | `startedAt` (first time only) |
| `done` | `completedAt`, `output`; clears `errorMessage`, `failedAt` |
| `failed` | `failedAt`, `errorMessage`; clears `completedAt` |

#### `commands.retryItem({ id, templateItemIndex })`

Resets a failed or in-progress item to `pending`, clears completion/error fields, increments `retryCount`, and sets instance status to `in-progress`. Used by orchestration on comment-level re-entry.

#### `commands.backfillItemSkillId({ id, templateItemIndex, skillId })`

Sets `skillId` on a single instance item after runtime skill creation. Mirrors the template `backfillItemSkillId` command.

### Queries

#### `queries.getByCommentId({ commentId })`

1:1 lookup by unique `commentId` index. Used by `executeTask` to detect whether a plan was persisted for the current comment turn.

#### `queries.getById({ id })` / `queries.getModelById({ id })`

Fetch a single instance. `getModelById` is used by orchestration and commands.

### Models

- **`TaskPlanInstanceModel`** — `taskPlanTemplateId`, `taskId`, `commentId`, `inputDetails`, `status`, `items`, lifecycle timestamps
- **`TaskPlanInstanceItem`** — `templateItemIndex`, `agentId`, `skillId`, `order`, `status`, `startedAt`, `completedAt`, `failedAt`, `output`, `errorMessage`, `retryCount`
- **`TaskPlanInstanceStatus`** — enum for item and instance status
- **`deriveInstanceStatus`** — precedence: any `failed` → `failed`; all `done` → `done`; any non-`pending` → `in-progress`; else `pending`

## Integration with `persist_task_plan` and orchestration

### Creation (`persist_task_plan`)

After template find-or-create, the handler calls `commands.create` with `taskId` and `commentId` from execution context and `inputDetails` from `resolvedInputDetails`. The returned `taskPlanInstanceId` is stored on the task comment via `setAgentResponse`.

### Execution (`orchestrateTaskPlanInstance`)

`@vassembly/service-task` runs after the Task Planner invoke completes:

1. **`getByCommentId`** — `executeTask` checks whether a plan instance exists for the comment
2. **`retryItem`** — on re-entry, reconciles `failed`/`in-progress` items back to `pending`
3. **`getModelById`** — loads instance; loads parent template for item descriptions
4. **`updateItemStatus`** — marks items `in-progress`, then `done` or `failed` per `runPlanItem` result
5. **`backfillItemSkillId`** — updates instance (and template) when a plan item creates a new skill
6. Derives `skillIdsUsed` from resolved item `skillId`s and persists to the comment (replacing the former task-level `skillIdsUsed` field)

Items with the same `order` run in parallel; lower `order` groups complete before higher ones. Execution stops on the first failed group.

## MongoDB

| Setting | Value |
|---------|-------|
| Collection | `taskPlanInstances` |
| Unique index | `commentId` |

## Dependencies

- **@vassembly/client-mongodb** — MongoDB DAO for `taskPlanInstances`
- **@vassembly/commands** — `createDb`, `updateDbById` helpers for writes
- **@vassembly/queries** — `getDbById` helper for reads
- **@vassembly/model** — `Model` base class and factory utilities
- **@vassembly/errors** — `ValidationError`, `NotFoundError`, `ConflictError`
- **zod** — command input schemas
