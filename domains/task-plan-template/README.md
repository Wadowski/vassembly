# `@vassembly/domain-task-plan-template`

Reusable task-plan shape definitions — the canonical structure of a composed plan (metadata, input/output details, and ordered subtask items). Templates are deduplicated across runs so equivalent plans share one record; each comment execution binds to a separate instance in `@vassembly/domain-task-plan-instance`.

**Consumers:** `@vassembly/service-agent` (`persist_task_plan` internal tool), `@vassembly/service-task` (orchestration reads template item descriptions), `apps/api` (GraphQL reads).

**Architecture:** See [Task Plan — Architecture](../../docs/features/task-plan/architecture.md).

## Usage

```typescript
import taskPlanTemplateDomain, { normalizeDescriptionHash } from '@vassembly/domain-task-plan-template';

const equivalent = await taskPlanTemplateDomain.queries.findEquivalent({
  shortName: 'Quarterly report review',
  normalizedDescriptionHash: normalizeDescriptionHash({
    description: 'Review and summarize the quarterly report',
  }),
});

if (!equivalent.data) {
  await taskPlanTemplateDomain.commands.create({
    shortName: 'Quarterly report review',
    description: 'Review and summarize the quarterly report',
    inputDetails: { documentReference: 'Q1 report' },
    outputDetails: { summaryFormat: 'bullet points' },
    items: [
      {
        agentId: 'agent-researcher-id',
        skillId: 'skill-summarize-id',
        description: 'Summarize {{documentReference}}',
        order: 0,
      },
    ],
  });
}
```

Domain writes are not exposed via public REST routes. The primary write path is the `persist_task_plan` internal tool in `@vassembly/service-agent`, which calls `findEquivalent` and `create` on behalf of the Task Planner.

## Exports

### Default export (`taskPlanTemplateDomain`)

Object with `commands` and `queries` namespaces.

```typescript
import taskPlanTemplateDomain from '@vassembly/domain-task-plan-template';

const template = await taskPlanTemplateDomain.queries.getModelById({ id: '...' });
```

### `normalizeDescriptionHash({ description }): string`

Shared helper for template deduplication. Lowercases text, collapses whitespace, strips punctuation, then returns a SHA-256 hex digest. Used by `create` (to persist the hash) and by `persist_task_plan` (to look up equivalents before creating).

### Commands

#### `commands.create(input): CreateTaskPlanTemplateCommandResult`

Persists a new template with structural validation. Computes and stores `normalizedDescriptionHash` from `description`. Does **not** validate `agentId`/`skillId` existence — that happens in the `persist_task_plan` service handler.

| Field | Type | Constraints |
|-------|------|-------------|
| `shortName` | `string` | 1–120 chars |
| `description` | `string` | 1–500 chars |
| `inputDetails` | `Record<string, unknown>` | Max 32 KB JSON |
| `outputDetails` | `Record<string, unknown>` | Max 32 KB JSON |
| `items` | `TaskPlanTemplateItem[]` | Min 1 item; each has `agentId`, `skillId` (nullable), `description` (1–500), `order` (non-negative int) |

Returns `{ data: TaskPlanTemplateModel }`.

#### `commands.backfillItemSkillId({ id, templateItemIndex, skillId })`

Sets `skillId` on a single template item after runtime skill creation during orchestration. Does not modify other items or fields.

### Queries

#### `queries.findEquivalent({ shortName, normalizedDescriptionHash })`

Returns the first non-removed template matching **exact `shortName`** OR **exact `normalizedDescriptionHash`**. Used by `persist_task_plan` to reuse an existing template instead of creating a duplicate.

#### `queries.getById({ id })` / `queries.getModelById({ id })`

Fetch a single template. `getById` returns the model (no DTO mapper in this domain yet); `getModelById` is the internal variant used by commands.

### Models

- **`TaskPlanTemplateModel`** — domain entity with `shortName`, `description`, `normalizedDescriptionHash`, `inputDetails`, `outputDetails`, `items`
- **`TaskPlanTemplateItem`** — `{ agentId, skillId, description, order }`
- **`taskPlanTemplateFactory`** — model factory

## Integration with `persist_task_plan`

The Task Planner calls `persist_task_plan` after composing its subtask list. The handler (`services/agent/src/internalTools/persistTaskPlan/index.ts`) orchestrates this domain:

1. Validates `agentId` and non-null `skillId` references against `@vassembly/domain-system-agent` and `@vassembly/domain-skill`
2. Computes `normalizedDescriptionHash` via `normalizeDescriptionHash`
3. Calls `queries.findEquivalent` — reuses template when a match exists
4. Otherwise calls `commands.create` with plan metadata and items
5. Passes the resulting `taskPlanTemplateId` to `@vassembly/domain-task-plan-instance` `commands.create`

Returns `{ taskPlanTemplateId, taskPlanInstanceId, reusedExistingTemplate }` as JSON.

During plan execution, `@vassembly/service-task` `orchestrateTaskPlanInstance` loads the template via `queries.getModelById` to resolve item descriptions, and calls `commands.backfillItemSkillId` when a plan item creates a new skill at runtime.

## MongoDB

| Setting | Value |
|---------|-------|
| Collection | `taskPlanTemplates` |

## Dependencies

- **@vassembly/client-mongodb** — MongoDB DAO for `taskPlanTemplates`
- **@vassembly/commands** — `createDb`, `updateDbById` helpers for writes
- **@vassembly/queries** — `getDbById` helper for reads
- **@vassembly/model** — `Model` base class and factory utilities
- **@vassembly/errors** — `ValidationError`, `NotFoundError`
- **zod** — command input schemas and item structural validation
