# Architecture: Task-Category-Only Mode

**Goal:** Temporarily comment out all intent categories except `task`. The `question`, `scheduled_task`, and `routine_task` categories (and their worker agents) must be silenced in every layer — constants, LLM prompts, routing, classification validation, and seed data — while leaving the `task` path fully intact.

**Classification:** Product task (temporary feature toggle on the LLM assistant flow).

---

## Analysis

### What the category system is and how it flows

```
User message
  └─► Assistant agent (system message includes routing table via formatIntentRoutingSection)
        └─► Intent classifier (system message includes valid slugs + descriptions via formatIntentCategoriesSection)
              └─► returns slug → update_task tool → domains/task updateTask command (persists)
        └─► routes to worker agent by slug (entirely LLM-driven via routing table in prompt)

createTask (async path)
  └─► generateTaskCategory handler (services/task)
        └─► invokes Intent classifier
        └─► normalizeGeneratedCategory validates slug against Object.values(INTENT_CATEGORY_SLUG)
        └─► updateTask persists category
```

**Key insight:** There is no programmatic `switch/if` routing on slug values in backend code. The routing from classifier output to a worker agent is 100% LLM-driven via a text routing table injected into the Assistant's system prompt. Commenting out categories from `INTENT_CATEGORIES` (the single source of truth) is sufficient to remove them from both the classifier prompt AND the routing table automatically — because `formatIntentCategoriesSection` and `formatIntentRoutingSection` both iterate `INTENT_CATEGORIES`.

The validation layer (`normalizeGeneratedCategory`, `updateTask` command schema) derives its valid slug set from `Object.values(INTENT_CATEGORY_SLUG)`. Commenting out enum members prevents those slugs from passing validation.

### Design pattern: Registry / Table-driven dispatch

The `INTENT_CATEGORIES` array is a **Registry** (catalog variant of the [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) + [Strategy](https://refactoring.guru/design-patterns/strategy) patterns). It is the single source of truth for:
1. Valid slugs (enum `INTENT_CATEGORY_SLUG`)
2. LLM descriptions for the classifier (`formatIntentCategoriesSection`)
3. LLM routing table for the assistant (`formatIntentRoutingSection`)
4. Persistence validation (`normalizeGeneratedCategory`, `updateTask` schema)
5. Seed data for worker agents (`systemAgents.json` — independent, must be commented out separately)

**Consequence:** Commenting out 3 entries in `INTENT_CATEGORIES` + 3 members in `INTENT_CATEGORY_SLUG` cascades automatically through prompts and runtime validation. Only two additional touch points require explicit changes: the seed JSON (independent data) and the disambiguation note inside the Intent classifier rule.

### Layers affected

| Layer | File | Change type |
|---|---|---|
| Constants (definition) | `packages/constants/src/intentCategories/types.ts` | Comment out enum members |
| Constants (registry) | `packages/constants/src/intentCategories/registry.ts` | Comment out 3 registry entries |
| LLM prompts (auto) | `formatIntentCategoriesSection.ts`, `formatIntentRoutingSection.ts` | **No change needed** — derived from registry |
| Seed data | `domains/system-agent/seed/systemAgents.json` | Comment out 3 worker agent objects + update Intent classifier rule |
| Tests (constants) | `packages/constants/src/intentCategories/registry.test.ts` | Comment out tests for removed slugs |
| Tests (domain) | `domains/task/src/commands/updateTask/index.test.ts` | Comment out non-task category test cases |
| Tests (system-agent prompt) | `domains/system-agent/src/utils/buildSystemAgentSystemMessage/index.test.ts` | Comment out assertions for removed slugs |

### What does NOT need to change

- `formatIntentCategoriesSection.ts` — iterates `INTENT_CATEGORIES`, changes automatically
- `formatIntentRoutingSection.ts` — same
- `normalizeGeneratedCategory.ts` — iterates `Object.values(INTENT_CATEGORY_SLUG)`, changes automatically
- `domains/task/src/commands/updateTask/types.ts` — `VALID_CATEGORY_SLUGS = Object.values(INTENT_CATEGORY_SLUG)`, changes automatically
- `services/task/src/handlers/generateTaskCategory/index.ts` — no slug enumeration
- `services/agent/src/internalTools/updateTask/index.ts` — validates against `INTENT_CATEGORY_SLUG` values, changes automatically
- All GraphQL/REST routes — `category` remains a nullable string field; no filtering by slug
- Frontend (`apps/web`, `ui/`) — no direct category slug references

### Risk areas

| Risk | Severity | Notes |
|---|---|---|
| Intent classifier routes to a worker that is no longer seeded | Low | If LLM output is `task`, `Task worker` remains active. Non-task workers are commented out in seed — they won't be found by `list_agents` / `use_agent` calls. LLM will fail gracefully. |
| LLM hallucinates a removed slug | Low | `normalizeGeneratedCategory` and `updateTask` schema both reject invalid slugs; falls back to `skipped` / `invalid_output` path. |
| Tests fail on removed slugs | Medium | Unit tests asserting 4 categories will fail. Must be commented out in tandem (see Todo 3 and 4). |
| Seed data re-seeded on deploy | Medium | If a seeder runs on deploy, worker agents will be recreated from seed. Because we are commenting them out of the JSON, they will not be re-added. Verify seed behavior in CI. |
| `SYSTEM_AGENT_NAME` enum has stale entries | Low | `QuestionWorker`, `ScheduledTaskWorker`, `RoutineTaskWorker` remain in the enum but are only referenced by the registry entries being commented out. No runtime effect. Comment them out for clarity (optional — see Todo 1 note). |

---

## Architecture & Package Placement

Only `packages/constants` (the registry/enum) and `domains/system-agent/seed` (the LLM agent definitions) need explicit edits. Everything else derives from those two sources.

```
packages/constants              ← primary source of truth
  intentCategories/types.ts     ← comment out 3 enum members
  intentCategories/registry.ts  ← comment out 3 INTENT_CATEGORIES entries

domains/system-agent/seed
  systemAgents.json             ← comment out 3 worker objects + update classifier rule

(auto-derived, no changes needed)
  formatIntentCategoriesSection.ts
  formatIntentRoutingSection.ts
  normalizeGeneratedCategory.ts
  updateTask/types.ts schema
```

---

## Recommendation

**Most conservative approach:** Touch exactly 2 production files + 3 test files. All other layers are auto-derived.

No feature flags are needed for a temporary code-level change. Comments in the code (e.g. `// TEMPORARILY DISABLED — task-category-only-mode`) serve as the marker. Restore by un-commenting.

---

## Implementation Steps

### Step 1 — `packages/constants/src/intentCategories/types.ts`

Comment out the 3 inactive enum members:

```typescript
export enum INTENT_CATEGORY_SLUG {
  // Question = 'question',          // TEMPORARILY DISABLED — task-category-only-mode
  Task = 'task',
  // ScheduledTask = 'scheduled_task', // TEMPORARILY DISABLED — task-category-only-mode
  // RoutineTask = 'routine_task',    // TEMPORARILY DISABLED — task-category-only-mode
}
```

Also optionally comment out the stale worker name members in `packages/constants/src/SystemAgentName.ts`:

```typescript
// QuestionWorker = 'Question worker',         // TEMPORARILY DISABLED — task-category-only-mode
TaskWorker = 'Task worker',
// ScheduledTaskWorker = 'Scheduled task worker', // TEMPORARILY DISABLED — task-category-only-mode
// RoutineTaskWorker = 'Routine task worker',  // TEMPORARILY DISABLED — task-category-only-mode
```

> **Note:** `SystemAgentName.ts` entries are only referenced by `registry.ts` entries being commented out. If not commenting them, a TypeScript error may arise because the registry entries that reference them will be commented out. Check for any remaining references after Step 2.

### Step 2 — `packages/constants/src/intentCategories/registry.ts`

Comment out the 3 inactive category objects in `INTENT_CATEGORIES`:

```typescript
export const INTENT_CATEGORIES: IntentCategoryDefinition[] = [
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.Question,
  //   ...
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.QuestionWorker,
  // },
  {
    slug: INTENT_CATEGORY_SLUG.Task,
    label: 'Task',
    description: '...',
    examples: [...],
    targetSystemAgentName: SYSTEM_AGENT_NAME.TaskWorker,
  },
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.ScheduledTask,
  //   ...
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.ScheduledTaskWorker,
  // },
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.RoutineTask,
  //   ...
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.RoutineTaskWorker,
  // },
];
```

**Auto-cascades to (no changes needed):**
- `formatIntentCategoriesSection.ts` — prompt now shows only `Valid slugs: task`
- `formatIntentRoutingSection.ts` — routing table now shows only `task → "Task worker"`
- `normalizeGeneratedCategory.ts` — valid set becomes `{ 'task' }`
- `domains/task/src/commands/updateTask/types.ts` — `VALID_CATEGORY_SLUGS` becomes `['task']`
- `services/agent/src/internalTools/updateTask/index.ts` — validates only `task`

### Step 3 — `domains/system-agent/seed/systemAgents.json`

Two changes:

**3a. Comment out the 3 worker agent objects.** JSON does not support comments natively; wrap each disabled block with a JSON-incompatible comment approach. Since JSON doesn't allow comments, the practical options are:

- **Option A (recommended):** Add a `"_disabled": true` field to each inactive agent object and filter in the seeder. Check whether the seeder already has such a filter; if not, add one.
- **Option B:** Move disabled agents to a separate file (`systemAgents.disabled.json`) and only seed from the main file.
- **Option C:** Delete the 3 objects from the JSON (least safe for temporary change — harder to restore).

> Inspect the seeder logic (`domains/system-agent/seed/` or wherever seed is invoked) to pick the least-invasive option.

**3b. Update the Intent classifier rule** to remove mention of non-task slugs in its disambiguation section:

Before:
```
## Disambiguation
- Action implied without schedule → task (not question).
- Both schedule and recurrence → routine_task if pattern repeats; otherwise scheduled_task.
- If truly ambiguous → task.
```

After (commented inline or replaced):
```
## Disambiguation
- All inputs → task.
// TEMPORARILY DISABLED — task-category-only-mode: removed question/scheduled_task/routine_task disambiguation
```

### Step 4 — Tests: `packages/constants/src/intentCategories/registry.test.ts`

Comment out test cases that assert 4 categories (count, specific slugs `question`, `scheduled_task`, `routine_task`, routing targets `Question worker`, etc.).

### Step 5 — Tests: `domains/task/src/commands/updateTask/index.test.ts`

Comment out test cases that pass `INTENT_CATEGORY_SLUG.Question` (and any other non-task slugs) as valid input, if the test asserts a success path for those values. Tests asserting `task` pass through as-is.

### Step 6 — Tests: `domains/system-agent/src/utils/buildSystemAgentSystemMessage/index.test.ts`

Comment out assertions that expect the classifier prompt to include `question`, `scheduled_task`, `routine_task` slugs or their routing table entries. Keep assertions for `task`.

---

## Todo Plan

### Order of implementation

Steps 1 and 2 must happen together (one package). Step 3 is independent (different package). Steps 4–6 are test-only and can happen in parallel with or after steps 1–3.

---

1. **packages/constants** — modify existing package
   - Changes needed: Comment out 3 `INTENT_CATEGORY_SLUG` enum members (types.ts) + 3 `INTENT_CATEGORIES` registry entries (registry.ts). Optionally comment out 3 stale `SYSTEM_AGENT_NAME` members.
   - Files to modify:
     - `packages/constants/src/intentCategories/types.ts`
     - `packages/constants/src/intentCategories/registry.ts`
     - `packages/constants/src/SystemAgentName.ts` (optional but clean)
   - Suggested subagent workflow: `coder → Done`
   - Dependencies: None

2. **domains/system-agent seed** — modify existing seed data
   - Changes needed: Disable 3 worker agent entries in `systemAgents.json` (choose `"_disabled": true` field approach or move to `.disabled.json`). Update Intent classifier rule to remove non-task disambiguation.
   - Files to modify:
     - `domains/system-agent/seed/systemAgents.json`
     - Possibly seed runner if `_disabled` field needs a filter
   - Suggested subagent workflow: `coder → Done`
   - Dependencies: None (parallel with Todo 1)

3. **packages/constants tests** — update test suite
   - Changes needed: Comment out test cases asserting 4-category counts, `question`/`scheduled_task`/`routine_task` slugs, and their routing targets.
   - Files to modify:
     - `packages/constants/src/intentCategories/registry.test.ts`
     - `packages/constants/src/SystemAgentName.test.ts` (if it tests worker names being commented out)
   - Suggested subagent workflow: `coder → Done`
   - Dependencies: Todo 1 (test changes must match constants changes)

4. **domains/task tests** — update test suite
   - Changes needed: Comment out test cases using non-task `INTENT_CATEGORY_SLUG` values as valid inputs in the updateTask command tests.
   - Files to modify:
     - `domains/task/src/commands/updateTask/index.test.ts`
   - Suggested subagent workflow: `coder → Done`
   - Dependencies: Todo 1

5. **domains/system-agent prompt tests** — update test suite
   - Changes needed: Comment out assertions expecting `question`, `scheduled_task`, `routine_task` slugs in the classifier/routing prompt output.
   - Files to modify:
     - `domains/system-agent/src/utils/buildSystemAgentSystemMessage/index.test.ts`
     - `domains/system-agent/src/commands/invoke/index.test.ts` (if it asserts category prompt content)
   - Suggested subagent workflow: `coder → Done`
   - Dependencies: Todo 1

---

## Reverting

To restore all categories, un-comment:
1. `types.ts` enum members
2. `registry.ts` array entries
3. `SystemAgentName.ts` members (if commented)
4. `systemAgents.json` worker entries (or move back from `.disabled.json`)
5. Intent classifier disambiguation text
6. All commented-out test cases

Search marker for all changes: `TEMPORARILY DISABLED — task-category-only-mode`
