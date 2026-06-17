# `@vassembly/constants`

Shared constants and enums used across domains, services, and API gateways. Centralizes fixed values (auth roles, system agent names, intent categories, internal tools) so callers reference a single source of truth.

## Exports

### `SYSTEM_AGENT_NAME`

Enum of catalog system agent display names. Used with `@vassembly/domain-system-agent` `getActiveByName` to resolve seeded agents.

| Member | Value |
|--------|-------|
| `Assistant` | `'Assistant'` |
| `IntentClassifier` | `'Intent classifier'` |
| `QuestionWorker` | `'Question worker'` |
| `TaskWorker` | `'Task worker'` |
| `ScheduledTaskWorker` | `'Scheduled task worker'` |
| `RoutineTaskWorker` | `'Routine task worker'` |
| `TaskTitleGenerator` | `'Task title generator'` |

**`TaskTitleGenerator`** — resolves the system agent used by `@vassembly/service-task` `generateTaskTitle` to produce short task titles from descriptions.

```typescript
import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

const agent = await systemAgentDomain.queries.getActiveByName({
  name: SYSTEM_AGENT_NAME.TaskTitleGenerator,
});
```

See [`src/SystemAgentName.ts`](./src/SystemAgentName.ts).

### Other exports

- `AUTH_TOKEN_ROLE` — JWT role values
- `INTENT_CATEGORIES`, `INTENT_CATEGORY_SLUG`, `getIntentCategoryBySlug`, `getIntentCategorySlugs` — intent routing catalog
- `COUNTRIES` — country list
- `CUSTOM_HEADERS` — shared HTTP header names
- `INTERNAL_TOOLS`, `INTERNAL_TOOL_IDS`, `getInternalToolById`, `getAllInternalTools`, `getInternalToolsForAgentType`, `isToolEligibleForAgentType`, `InternalToolAccessScope`, `MAX_USE_AGENT_DEPTH` — internal tool registry
- `AI_INTEGRATION_PROVIDER_LABELS` — display labels for AI integration providers

Entry point: [`src/index.ts`](./src/index.ts).

## Dependencies

No runtime npm dependencies. Consumed by domains, services, and apps for shared enum and constant values.
