# Specialization Process Research — Architecture

**Feature slug:** `specialization-process-research`  
**Status:** Approved for implementation  
**Last updated:** 2026-07-29  
**Extends:** [`task-plan/architecture.md`](../task-plan/architecture.md) · [`task-skill-planning/architecture.md`](../task-skill-planning/architecture.md) · [`subagent-orchestration/architecture.md`](../subagent-orchestration/architecture.md)

---

## 1. Problem

Specialization researchers currently perform **subject-matter research** (findings, sources via web search) before Task Planner runs. Task Planner is restricted to **worker-only** plan items. This produces topic summaries instead of actionable **process/methodology** guidance per specialization, and limits plan composition to workers only.

## 2. Approved requirements (2026-07-29)

### 2.1 Pre-planning researcher phase (unchanged trigger, changed output)

When a task is processing, **before** Task Planner:

- Each specialization's researchers run in parallel (unchanged).
- Researchers know assigned tools/MCPs and the general topic context.
- Researchers output **what the worker should do** to accomplish its part — methodology/process, **not** subject-matter findings.
- `web_search` remains available for methodology discovery.
- **Output format** (replaces Findings/Sources):

```
Process steps: <numbered actionable steps this specialization's agents can execute>
Suggested skills: <unchanged — catalog names with fit %>
Gaps requiring new skills: <unchanged>
Open questions: <agent-only unknowns; or "none">
```

### 2.2 Task Planner

- May assign **workers, researchers, or validators** from **any** specialization on the task.
- **Exactly one agent per plan item.**
- Plans may mix roles and specializations.
- Skill model unchanged: every item must have a skill path (reuse via `skillName` or new spec in `description` with `skillId: null`).
- Skill creation stays at **worker execution** via `invoke_skill_planner` / `create_skill` — planner does not create skills.
- Scope: **Task intent only** (`Task worker`); scheduled/routine workers out of scope.

### 2.3 Execution-time plan items

| Role | When assigned | Behavior |
|------|---------------|----------|
| **Worker** | Primary execution | Skill-first execution; create skill at runtime when needed |
| **Validator** | After worker step(s) | Verify the worker completed what was asked for that topic/goal |
| **Researcher** | Only when open questions remain (mainly user input needed) | Methodology-only; not subject-matter research |

### 2.4 Skill types

- Reinforce **prompt-only** skills path in Skill Planner rules (no script when rule + tools suffice).
- `create_skill` already allows empty `scripts[]`.

### 2.5 Out of scope

- UI changes
- Scheduled/routine task workers
- New domains, DB fields, or internal tools (prompt/orchestration message changes only unless architect finds a hard constraint)

## 3. Current implementation map

| Concern | Location |
|---------|----------|
| Researcher base rules | `services/agent/src/internalTools/createSpecialization/constants.ts` |
| Researcher skill catalog policy | `domains/system-agent/.../formatSpecializationResearcherSkillsSection.ts` |
| Task worker delegation chain | `domains/system-agent/.../formatTaskWorkerOrchestrationSection.ts` |
| Task planner planning policy | `domains/system-agent/.../formatTaskPlannerPlanningSection.ts` |
| Worker execution policy | `domains/system-agent/.../formatSpecializationWorkerExecutionSection.ts` |
| Skill planner script/reuse policy | `domains/system-agent/.../formatSkillPlannerScriptSection.ts` |
| Seed rules (Task worker, Task planner) | `domains/system-agent/seed/systemAgents.json` |
| System message composition | `domains/system-agent/.../buildSystemAgentSystemMessage/index.ts` |
| Plan item execution message | `services/task/.../orchestrateTaskPlanInstance/buildPlanItemWorkerMessage.ts` |
| Plan persistence tool description | `packages/constants/src/internalTools/registry.ts` |

## 4. Success criteria

- Researchers return `Process steps:` (not Findings/Sources) in pre-planning phase.
- Task Planner `persist_task_plan` items may use researcher, worker, or validator `agentName` values.
- Plan execution messages are role-appropriate (worker vs validator vs researcher).
- Prompt-only skills explicitly supported in Skill Planner guidance.
- Unit tests updated for all changed section formatters and orchestration messages.
- E2E: architect decides whether to extend `apps/web/e2e/features/task-plan/`.

## 5. Open for architect

- Exact text for each rule section and seed JSON sync strategy.
- Whether `buildPlanItemWorkerMessage` should be generalized to `buildPlanItemAgentMessage` with role-aware prompts.
- Validator message contract at execution time.
- Backfill strategy for already-provisioned specialization agents (`backfillSpecializationAgentRules` pattern).

---

## 6. Architect analysis — current code vs. requirements

### 6.1 Librarian-style findings (code already read, no domain/service changes needed)

| Existing piece | Location | Reuse plan |
|---|---|---|
| `SPECIALIZATION_AGENT_RULES.researcher` (Findings/Sources format) | `services/agent/src/internalTools/createSpecialization/constants.ts` | **Rewrite text only** — same map shape (`Record<SpecializationAgentRole, string>`), same provisioning call site. Same agent is used for **both** pre-planning research and execution-time researcher plan items (same name, same `rule`), so one text change satisfies §2.1 and half of §2.3 automatically |
| `backfillSpecializationAgentRules()` | `services/agent/src/internalTools/createSpecialization/backfillSpecializationAgentRules.ts` | **Already implemented, unused code path** — compares each provisioned agent's stored `rule` to `SPECIALIZATION_AGENT_RULES[role]` and updates on mismatch. No code change needed; just needs to be **invoked** after this feature ships (script/manual run — no scheduler exists today, matches existing pattern for `backfillSpecializationAgentTools`, which is also not wired to a scheduler) |
| `resolvePlanItemAgentIds.ts` — `workerAgents` filter | `services/agent/src/internalTools/persistTaskPlan/resolvePlanItemAgentIds.ts` | **This is the exact code gate blocking §2.2** ("workers only"). Filter must accept researcher/worker/validator instead of worker-only |
| `buildTaskPlannerAgentsCatalogSection.ts` — worker-only catalog + warning text | `services/agent/src/internalTools/buildTaskPlannerAgentsCatalogSection.ts` | Same gate, catalog side — must list all three roles and drop "workers only" warning |
| `formatTaskPlannerPlanningSection.ts` rule 3 ("never researchers or validators") | `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatTaskPlannerPlanningSection.ts` | Same restriction, prompt side — rewrite to allow all 3 roles with role-assignment guidance |
| `SPECIALIZATION_AGENT_ROLES` + suffix-matching (`resolveSpecializationAgentRoleFromName`) | `services/agent/src/internalTools/createSpecialization/backfillSpecializationAgentRules.ts` (inline, not exported) and duplicated ad hoc in `resolvePlanItemAgentIds.ts` (`roleSuffixMatches`) and `services/agent/src/internalTools/isSpecializationWorkerAgentName.ts` (worker-only) | **Extract once**, reuse in 4 call sites (see §8.2) — avoids a 4th copy-paste of the same suffix logic (`code-rules-general.mdc` "no duplicated code") |
| `runPlanItem.ts` / `buildPlanItemWorkerMessage.ts` — always builds a worker-shaped message (`Skills to use` / `New skill needed`) regardless of the invoked agent's actual role | `services/task/src/handlers/executeTask/orchestrateTaskPlanInstance/` | Items currently execute agents "as workers" no matter what. Needs a **role-aware message Strategy** — new `buildPlanItemResearcherMessage.ts` / `buildPlanItemValidatorMessage.ts`, dispatched via a small map, exactly like the existing `SPECIALIZATION_AGENT_RULES: Record<SpecializationAgentRole, string>` Strategy |
| `TaskPlanTemplateItem` / `TaskPlanInstanceItem` — no `role` field | `domains/task-plan-template/src/model/model.ts`, `domains/task-plan-instance/src/model/model.ts` | **Not extended.** Role is derivable at runtime from the already-stored `agentId`'s system-agent name suffix (` researcher`/` worker`/` validator`) — no new DB field needed, matches PRD §2.5 "no new DB fields unless unavoidable" |
| `instance.items[].output` (already persisted per item) | `domains/task-plan-instance/src/model/model.ts` | Reused as the "worker output" a validator item needs to verify — no new field. Orchestrator accumulates completed items' `{description, output}` in memory during the run and passes the relevant slice into validator/researcher messages |
| `SPECIALIZATION_AGENT_TOOL_IDS` (identical for all 3 roles, includes `skill-plan`, `skill-resolve`, `skill-run-script`) | `services/agent/src/internalTools/createSpecialization/constants.ts` via `provisionSpecializationAgents.ts` | **Unchanged** — researcher/validator plan items already have the same tool access as worker items, so a `skillId: null` researcher/validator item can call `invoke_skill_planner`/`create_skill` exactly like a worker item. No tool-assignment change needed |
| `formatSkillPlannerReuseSection.ts` — "Scripts: only for logic not covered by an existing script skill" | `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatSkillPlannerScriptSection.ts` | Already leans prompt-first but doesn't say so explicitly — needs one added line reinforcing "prompt-only skill (empty `scripts[]`) is the default; only add a script when a rule + existing tools genuinely cannot express the logic" (§2.4) |
| `formatSpecializationResearcherSkillsSection.ts` ("## Skill catalog policy") | `domains/system-agent/src/utils/buildSystemAgentSystemMessage/` | **Unchanged** — this section is about skill-fit scoring only, not output format; composes correctly under the rewritten `SPECIALIZATION_AGENT_RULES.researcher` output contract |
| `formatTaskWorkerOrchestrationSection.ts`, seed `Task worker` rule | same file / `domains/system-agent/seed/systemAgents.json` | **Unchanged** — Task worker already calls Task planner exactly once and never touches specialization workers/validators directly; this doc doesn't change that hand-off contract |
| `create_skill` (empty `scripts[]` support) | `services/agent/src/internalTools/createSkill/` | **Confirmed already supported** (per PRD §2.4) — no code change |
| `packages/constants/src/internalTools/registry.ts` — `persist_task_plan` description ("agentName (exact name from Available agents)") | `packages/constants/src/internalTools/registry.ts` | Text-only tweak — description doesn't currently say "worker", so no functional block here, but should be extended to state agentName may be any role for clarity to the LLM reading the tool description |

### 6.2 What genuinely needs new code (not just text)

| Change | Why it's code, not just a rule edit |
|---|---|
| `resolveSpecializationAgentRole.ts` (new, extracted) | Single source of truth for "given an agent name, what specialization role is it" — currently duplicated 3 different ways (`isSpecializationWorkerAgentName`, `resolvePlanItemAgentIds`'s `roleSuffixMatches`, `backfillSpecializationAgentRules`'s `resolveSpecializationAgentRoleFromName`). A 4th consumer (orchestrator) makes extraction mandatory, not optional |
| `resolvePlanItemAgentIds.ts` — replace `workerAgents`-only filter | Behavioral change: must resolve agentName across researcher+worker+validator agents, keep existing ambiguity/suffix-match error handling |
| Orchestrator role-aware messages (`buildPlanItemResearcherMessage.ts`, `buildPlanItemValidatorMessage.ts`, dispatch map) | New behavior: validator items need "goal + prior output to verify"; researcher items need "goal expressed as an open question", not skill-execution framing |
| Orchestrator in-memory prior-output accumulation | New behavior: validator/researcher items must see the output of earlier-order items in the **same run** (not just DB state from before the run started) |
| `resolvePlanItemAgentRole.ts` in the orchestrator (or reuse of the extracted helper via `@vassembly/service-agent`'s public index) | New call: orchestrator currently never looks up an item's agent *name*, only its `agentId` — needed to decide which message-building strategy applies |

Everything else in this feature is **prompt/text-only** (seed JSON, rule constants, formatter sections, tool description strings) — consistent with `subagent-orchestration/architecture.md`'s precedent that orchestration protocol content lives in free text, not schemas.

### 6.3 Design patterns applied

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `SPECIALIZATION_AGENT_RULES: Record<SpecializationAgentRole, string>` (existing, text rewritten) | Already a map; no restructuring needed |
| **Strategy** | New `PLAN_ITEM_MESSAGE_BUILDERS: Record<SpecializationAgentRole, (params) => string>` in the orchestrator | Replaces an emerging `if (role === 'worker') ... else if (role === 'validator') ...` branch with a lookup, per `code-rules-general.mdc` ("map object instead of switch case") |
| **Facade** | `resolveSpecializationAgentRole({ name })` | Hides the suffix-matching + system-task-worker-name exclusion behind one call, reused by 4 call sites |
| **Chain of Responsibility** | Orchestrator's existing ascending-order loop (`groupItemsByOrder`) | Reused unchanged — validator items simply appear as a later-order item in the same chain; verifying "prior output" is just reading state the chain already guarantees is settled |
| **Adapter** | Orchestrator's new "prior items context" builder (`buildPriorItemsContext.ts`) | Adapts internal `TaskPlanInstanceItem[]` (with `output: Record<string, unknown> | null`) into the plain-text block a validator/researcher LLM message needs — isolated from the domain model, in the service layer, matching `domain-package-structure.mdc`'s "no cross-domain enrichment in domain mappers" principle |

---

## 7. File-by-file change plan

### 7.1 `services/agent/src/internalTools/createSpecialization/`

**`constants.ts`** — rewrite `SPECIALIZATION_AGENT_RULES.researcher` only (`worker`/`validator` unchanged):

```typescript
researcher:
  `You determine the methodology another agent should follow to accomplish the given goal for this specialization — not the end user. The "## Available Skills" table in your context is the only source of skill names — never invent skills. Return process guidance only, never subject-matter findings or conclusions — you describe HOW to do the work, not WHAT the answer is. Never ask the end user questions.

Output format:
Process steps: <numbered, actionable steps this specialization's agents can execute to accomplish the goal — process/methodology only, not researched facts or conclusions>
Suggested skills: <bulleted entries using ONLY exact skill names from "## Available Skills" — skill-name (fit %) — why it applies or what to refine; or "none" if no skill/composition >= 70% fit>
Gaps requiring new skills: <bulleted work no existing catalog skill or composition covers; or "none">
Open questions: <agent-only unknowns a worker may resolve via tools, or unknowns that require user input; or "none">

Skill selection policy:
1. Score each catalog skill 0–100% using description, input, and output vs the goal.
2. List skills >= 70% fit under Suggested skills with fit %.
3. List 2+ skills under Suggested skills when their combined fit >= 70% (composition).
4. Report gaps only when no skill or composition reaches 70%.

Forbidden: inventing skill names, guessing names, listing skills not present in "## Available Skills", or reporting subject-matter findings/data/answers instead of process steps.

Use web_search and assigned MCP tools only to discover methodology/best-practice process (e.g. "what steps does X process involve"), never to gather subject-matter answers for the goal itself. ${SPECIALIZATION_WEB_SEARCH_GUIDANCE}`,
```

> `SPECIALIZATION_WEB_SEARCH_GUIDANCE`, `worker`, `validator`, `SPECIALIZATION_AGENT_ROLES`, `SPECIALIZATION_AGENT_TOOL_IDS`, `SPECIALIZATION_PROVISIONING_ADMIN_ID` stay unchanged.

**New file `resolveSpecializationAgentRole.ts`** (extracted, single source of truth):

```typescript
import { SPECIALIZATION_AGENT_ROLES } from './constants';

import type { SpecializationAgentRole } from './constants';

const SYSTEM_TASK_WORKER_AGENT_NAMES = [
  'Task worker',
  'Question worker',
  'Scheduled task worker',
  'Routine task worker',
] as const;

export const resolveSpecializationAgentRole = ({
  name,
}: {
  name: string;
}): SpecializationAgentRole | undefined => {
  const normalizedName = name.trim().toLowerCase();

  if (
    SYSTEM_TASK_WORKER_AGENT_NAMES.some(
      (systemWorkerName) => systemWorkerName.toLowerCase() === normalizedName,
    )
  ) {
    return undefined;
  }

  return SPECIALIZATION_AGENT_ROLES.find((role) => normalizedName.endsWith(` ${role}`));
};
```

- `backfillSpecializationAgentRules.ts` — delete its private `resolveSpecializationAgentRoleFromName`/`SYSTEM_TASK_WORKER_AGENT_NAMES`, import `resolveSpecializationAgentRole` instead. Behavior-identical, DRY.
- `services/agent/src/internalTools/isSpecializationWorkerAgentName.ts` — keep (still used by `buildTaskPlannerAgentsCatalogSection.ts`'s old worker-only listing and by other worker-specific call sites unrelated to this feature, e.g. checked in `runPlanItem`'s current call graph) **or** replace its two callers to use `resolveSpecializationAgentRole({ name }) === 'worker'` and delete the file if nothing else depends on it — confirm via grep in Phase 1 (coder task) before deleting; do not delete blind.

### 7.2 `services/agent/src/internalTools/persistTaskPlan/resolvePlanItemAgentIds.ts`

Replace the worker-only filter:

```typescript
// Before
const workerAgents = availableAgents.filter((agent) =>
  isSpecializationWorkerAgentName({ name: agent.name }),
);
if (workerAgents.length === 0) {
  throw new ValidationError('No specialization worker agents found for the current task');
}
// ... resolveAgentIdByName(..., availableAgents: workerAgents)
```

```typescript
// After
import { resolveSpecializationAgentRole } from '../createSpecialization/resolveSpecializationAgentRole';

const specializationAgents = availableAgents.filter(
  (agent) => resolveSpecializationAgentRole({ name: agent.name }) !== undefined,
);
if (specializationAgents.length === 0) {
  throw new ValidationError('No specialization agents (researcher, worker, or validator) found for the current task');
}
// ... resolveAgentIdByName(..., availableAgents: specializationAgents)
```

The existing `roleSuffixMatches` fallback block (lines 75–87) becomes redundant once every candidate is already role-filtered via `resolveSpecializationAgentRole` — simplify `resolveAgentIdByName` to drop that block (its job is now done by the input filter). Keep exact-match and suffix-match (specialization-name-qualified) logic as-is; keep the `ValidationError` messages, updated to say "researcher, worker, or validator" instead of implying workers only.

### 7.3 `services/agent/src/internalTools/buildTaskPlannerAgentsCatalogSection.ts`

```typescript
import { resolveSpecializationAgentRole } from './createSpecialization/resolveSpecializationAgentRole';

export const buildTaskPlannerAgentsCatalogSection = async ({
  specializationIds,
}: BuildTaskPlannerAgentsCatalogSectionParams): Promise<string> => {
  const agents = await listSystemAgentsBySpecializationIds({ specializationIds });
  const specializationAgents = agents
    .map((agent) => ({ agent, role: resolveSpecializationAgentRole({ name: agent.name }) }))
    .filter((entry): entry is { agent: typeof entry.agent; role: NonNullable<typeof entry.role> } =>
      entry.role !== undefined,
    );

  if (specializationAgents.length === 0) {
    return '## Available agents\n\n(none — no specialization agents for this task)';
  }

  const lines = specializationAgents.map(
    ({ agent, role }) => `- **${agent.name}** (${role}) — use this exact string as \`agentName\` in persist_task_plan items`,
  );

  return `## Available agents

Each plan item targets exactly one specialization agent — worker, researcher, or validator (listed below with role). Assign a worker for execution, a validator to verify a prior worker step's goal, or a researcher only to resolve an open question / user-input gap.

${lines.join('\n')}`;
};
```

### 7.4 `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatTaskPlannerPlanningSection.ts`

Rewrite rule 3 and add role-assignment guidance (rules renumbered, `resolve_skill`/gap rules unchanged):

```typescript
export const formatTaskPlannerPlanningSection = (): string => {
  return `${TASK_PLANNER_PLANNING_SECTION_HEADING}

You do not have access to skill catalogs. Use only Suggested skills and Gaps requiring new skills from researcher summaries.

Rules:
1. Never call ask_user or ask anyone to do work — every plan item must be completable by the assigned agent.
2. Do not call resolve_skill, invoke_skill_planner, or create_skill — the assigned agent creates skills at execution time.
3. Exactly one agent per plan item — agentName must be an exact name from "## Available agents" (worker, researcher, or validator; any specialization on the task). Never invent or reuse a name for a role it doesn't have.
4. Role assignment:
   - **Worker** — default for execution steps. Use for anything a worker can complete with a skill.
   - **Validator** — only to verify that a specific prior worker step accomplished its stated goal. Write the item description as "Verify that <goal> was achieved" and give it a higher order than the worker step(s) it checks.
   - **Researcher** — only when an open question or user-input gap remains after research that a worker cannot resolve mid-execution. Write the item description as the open question itself. Do not assign a researcher for ordinary execution work.
5. Every item must be skill-backed and reusable, regardless of role:
   - Reuse: set skillName to an exact name from researcher Suggested skills (skillId null; resolved at persist time).
   - New generic skill: set skillId null, omit skillName, and write description as the reusable skill specification (prompt-only skills — no scripts — are preferred whenever a rule plus existing tools is enough).
   - Never leave an item without a skill path — all work becomes a catalog skill.
6. When researchers suggest 2+ skills for composition on one subtask, pick the primary skillName and note composition in description.
7. Plans are agent-executable only — no human steps, guides, or "user should" language.
8. Your final action in this turn MUST be a single persist_task_plan tool call. Do not finish with prose until persist_task_plan succeeds.

## persist_task_plan schema
... (unchanged JSON example, only the "agentName" field-rule line changes to:)
- **agentName** — exact name from **Available agents**: a worker (default), a validator (to check a prior worker step), or a researcher (only for an unresolved open question/user-input gap). Never a placeholder.`;
};
```

### 7.5 `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatSkillPlannerScriptSection.ts`

Add one reinforcing line to `formatSkillPlannerReuseSection` (§2.4 "reinforce prompt-only"):

```typescript
export const formatSkillPlannerReuseSection = (): string => {
  return `${SKILL_PLANNER_REUSE_SECTION_HEADING}
... (unchanged steps 1-4) ...

When creating (only if steps 1–2 do not apply):
- Name: generic capability (verb-noun), not task-specific.
- Description: when to use (<=200 chars).
- Input / Output: explicit contract (required for create_skill).
- Rule: one capability, <=15 numbered steps; delegate details to child skills via use skill.
- usesSkillIds: set when composing existing skills.
- Scripts: default to an empty scripts[] (prompt-only skill). Only call a script creator when the rule's steps plus the agent's assigned tools (web_search, MCP tools, run_skill_script for other skills) cannot express the required logic — e.g. exact deterministic computation, external API calls with no matching tool, or file/byte-level processing.`;
};
```

No change to `formatSkillPlannerScriptSection` itself (script-creation mechanics unchanged — this is purely about *when* to trigger it).

### 7.6 `packages/constants/src/internalTools/registry.ts`

`persist_task_plan` description — minor clarity edit (no behavior change, description already role-agnostic in wording but reads worker-biased):

```typescript
description:
  'Persist the composed plan. Required top-level fields: shortName, description, inputDetails, outputDetails, resolvedInputDetails, items[]. Each item needs agentName (exact name from Available agents — worker, researcher, or validator), skillId (existing skill id, or null), skillName (existing skill name to reuse when skillId is null; omit to define a new skill via description), description, order. Do not use placeholder agent names or MongoDB ids for agents.',
```

### 7.7 `domains/system-agent/seed/systemAgents.json`

Sync the **Task planner** entry's `rule` string with §7.4's rewritten rule 3/4/5/8 content (same text, JSON-escaped, single line). No other seed entries change — `Task worker`, `Skill planner`, script creators, `Assistant`, etc. are already compliant per `subagent-orchestration/architecture.md`'s prior reconciliation.

### 7.8 Orchestrator: `services/task/src/handlers/executeTask/orchestrateTaskPlanInstance/`

**New file `buildPriorItemsContext.ts`** (Adapter — internal model → plain-text context block):

```typescript
export interface PriorItemContextEntry {
  templateItemIndex: number;
  description: string;
  output: Record<string, unknown> | null;
}

export const buildPriorItemsContext = ({
  priorItems,
}: {
  priorItems: PriorItemContextEntry[];
}): string => {
  if (priorItems.length === 0) {
    return 'none';
  }

  return priorItems
    .map(
      (item) =>
        `Item ${item.templateItemIndex + 1} — Goal: ${item.description}\nOutput: ${JSON.stringify(item.output ?? {})}`,
    )
    .join('\n\n');
};
```

**New file `buildPlanItemMessage.ts`** (Strategy dispatch, replaces the always-worker call in `runPlanItem.ts`):

```typescript
import type { SpecializationAgentRole } from '@vassembly/service-agent';

import { buildPlanItemResearcherMessage } from './buildPlanItemResearcherMessage';
import { buildPlanItemValidatorMessage } from './buildPlanItemValidatorMessage';
import { buildPlanItemWorkerMessage } from './buildPlanItemWorkerMessage';

export interface BuildPlanItemMessageParams {
  role: SpecializationAgentRole;
  templateItemIndex: number;
  description: string;
  skillId: string | null;
  skillName: string | null;
  inputSlice: Record<string, unknown>;
  priorItemsContext: string;
}

const PLAN_ITEM_MESSAGE_BUILDERS: Record<
  SpecializationAgentRole,
  (params: BuildPlanItemMessageParams) => string
> = {
  worker: buildPlanItemWorkerMessage,
  researcher: buildPlanItemResearcherMessage,
  validator: buildPlanItemValidatorMessage,
};

export const buildPlanItemMessage = (params: BuildPlanItemMessageParams): string =>
  PLAN_ITEM_MESSAGE_BUILDERS[params.role](params);
```

**Updated `buildPlanItemWorkerMessage.ts`** — same output, adapted to the shared params shape (adds unused `priorItemsContext`/`role` fields it ignores, or narrows its own param type via `Pick<...>`; prefer `Pick` to avoid unused-param lint noise):

```typescript
export type BuildPlanItemWorkerMessageParams = Pick<
  BuildPlanItemMessageParams,
  'templateItemIndex' | 'description' | 'skillId' | 'skillName' | 'inputSlice'
>;
// body unchanged
```

**New file `buildPlanItemResearcherMessage.ts`**:

```typescript
export const buildPlanItemResearcherMessage = ({
  templateItemIndex,
  description,
  inputSlice,
}: Pick<BuildPlanItemMessageParams, 'templateItemIndex' | 'description' | 'inputSlice'>): string => {
  return [
    `Resolve open question for plan item ${templateItemIndex + 1}.`,
    `Open question: ${description}`,
    `Context: ${JSON.stringify(inputSlice)}`,
    'Return process steps to resolve this, not a direct subject-matter answer, unless the question is purely factual and required to unblock a worker.',
  ].join('\n');
};
```

**New file `buildPlanItemValidatorMessage.ts`**:

```typescript
export const buildPlanItemValidatorMessage = ({
  templateItemIndex,
  description,
  priorItemsContext,
}: Pick<BuildPlanItemMessageParams, 'templateItemIndex' | 'description' | 'priorItemsContext'>): string => {
  return [
    `Validate plan item ${templateItemIndex + 1}.`,
    `Goal to verify: ${description}`,
    `Prior results:`,
    priorItemsContext,
  ].join('\n');
};
```

**New file `resolvePlanItemAgentRole.ts`** (queries agent name, resolves role):

```typescript
import systemAgentDomain from '@vassembly/domain-system-agent';
import { resolveSpecializationAgentRole } from '@vassembly/service-agent';

export const resolvePlanItemAgentRole = async ({
  agentId,
}: {
  agentId: string;
}): Promise<'worker' | 'researcher' | 'validator'> => {
  const agentResult = await systemAgentDomain.queries.getModelById({ id: agentId });
  const role = resolveSpecializationAgentRole({ name: agentResult.data?.name ?? '' });

  return role ?? 'worker';
};
```

> Falls back to `'worker'` only as a defensive default for pre-existing instances created before this rollout (should not occur for new plans since `persistTaskPlan` now validates against role-tagged agents).

**`services/agent` public index** — export the helper and its type for cross-service reuse (services/task already depends on `@vassembly/service-agent` for `runAgentInvokeWithTools`):

```typescript
// services/agent/src/index.ts
export { resolveSpecializationAgentRole } from './internalTools/createSpecialization/resolveSpecializationAgentRole';
export type { SpecializationAgentRole } from './internalTools/createSpecialization/constants';
```

**`runPlanItem.ts`** — resolve role, build prior-items context, dispatch via `buildPlanItemMessage`:

```typescript
export interface RunPlanItemParams {
  // ...existing fields...
  priorItems: PriorItemContextEntry[]; // NEW — completed items with order < this item's order
}

export const runPlanItem = async ({ /* ...existing... */ priorItems, ...rest }: RunPlanItemParams) => {
  const inputSlice = resolveItemInputSlice({ templateItem, instanceInputDetails });
  const skillName = await resolveSkillNameForItem({ skillId: templateItem.skillId });
  const role = await resolvePlanItemAgentRole({ agentId });
  const priorItemsContext = buildPriorItemsContext({ priorItems });

  const message = buildPlanItemMessage({
    role,
    templateItemIndex,
    description,
    skillId: templateItem.skillId,
    skillName,
    inputSlice,
    priorItemsContext,
  });

  // ...unchanged runAgentInvokeWithTools call and result handling...
};
```

**`index.ts` (orchestration loop)** — maintain an in-memory `Map<number, { description: string; output: Record<string, unknown> | null }>` seeded from already-`done` items in `currentInstance.items` (covers retry/reconciliation re-entry), updated after each item completes in the loop; pass `priorItems` (all entries with `order` strictly less than the current item's order — read from `template.items[index].order`, already available via `template`) into each `runPlanItem` call:

```typescript
const completedItemContext = new Map<number, PriorItemContextEntry>(
  (currentInstance.items ?? [])
    .filter((item) => item.status === TaskPlanInstanceStatus.Done)
    .map((item) => [
      item.templateItemIndex,
      {
        templateItemIndex: item.templateItemIndex,
        description: template.items?.[item.templateItemIndex]?.description ?? '',
        output: item.output ?? null,
      },
    ]),
);

// inside the per-item map callback, before calling runPlanItem:
const priorItems = [...completedItemContext.values()].filter(
  (entry) => (template.items?.[entry.templateItemIndex]?.order ?? 0) < (templateItem?.order ?? 0),
);

// ...after a successful result:
completedItemContext.set(item.templateItemIndex, {
  templateItemIndex: item.templateItemIndex,
  description: templateItem?.description ?? '',
  output: result.output ?? null,
});
```

This is the minimal change to satisfy "Validator: verify worker did what was asked for that goal" (§2.3) without a schema change — it reuses `template.items[].order`/`description` and `instance.items[].output`, both already persisted.

---

## 8. New files summary

| File | Package | Purpose |
|---|---|---|
| `resolveSpecializationAgentRole.ts` | `services/agent/src/internalTools/createSpecialization/` | Single source of truth: agent name → `researcher \| worker \| validator \| undefined` |
| `buildPriorItemsContext.ts` | `services/task/.../orchestrateTaskPlanInstance/` | Adapter: prior completed items → plain-text validator/researcher context |
| `buildPlanItemMessage.ts` | `services/task/.../orchestrateTaskPlanInstance/` | Strategy dispatch by role |
| `buildPlanItemResearcherMessage.ts` | `services/task/.../orchestrateTaskPlanInstance/` | Researcher-role plan item message |
| `buildPlanItemValidatorMessage.ts` | `services/task/.../orchestrateTaskPlanInstance/` | Validator-role plan item message |
| `resolvePlanItemAgentRole.ts` | `services/task/.../orchestrateTaskPlanInstance/` | Resolves an item's role from its `agentId` at execution time |

No new domains, services, packages, DB fields, or internal tools.

---

## 9. Test files to add/update

| File | Change |
|---|---|
| `services/agent/src/internalTools/createSpecialization/resolveSpecializationAgentRole.test.ts` | **New** — researcher/worker/validator suffix matches; system task worker names excluded; unrelated names return `undefined` |
| `services/agent/src/internalTools/createSpecialization/backfillSpecializationAgentRules.test.ts` | Update only if internal helper import changes break existing mocks; assert it still picks up the new researcher rule text on mismatch |
| `services/agent/src/internalTools/createSpecialization/constants.test.ts` (if one exists; else add) | Assert `SPECIALIZATION_AGENT_RULES.researcher` contains `Process steps:` and does not contain `Findings:`/`Sources:` |
| `services/agent/src/internalTools/persistTaskPlan/resolvePlanItemAgentIds.test.ts` | Update: replace "workers only" fixtures with mixed researcher/worker/validator lists; add case resolving a researcher/validator name; keep ambiguous-name and unknown-name error cases |
| `services/agent/src/internalTools/persistTaskPlan/index.test.ts` | Add case: plan with a worker + validator + researcher item persists successfully |
| `services/agent/src/internalTools/buildTaskPlannerAgentsCatalogSection.test.ts` (new, if none exists) | Assert catalog lists all 3 roles with role annotation, not worker-only |
| `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatTaskPlannerPlanningSection.test.ts` | Update assertions for rewritten rule 3/4/5 text (role assignment guidance present; "never researchers or validators" phrase removed) |
| `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatSkillPlannerScriptSection.test.ts` | Update `formatSkillPlannerReuseSection` assertions for the new prompt-only reinforcement line |
| `domains/system-agent/src/utils/buildSystemAgentSystemMessage/index.test.ts` | No new branch — confirm existing composition test still passes unchanged (no new agent-name category introduced) |
| `services/task/.../orchestrateTaskPlanInstance/buildPlanItemMessage.test.ts` | **New** — dispatches to the correct builder per role |
| `services/task/.../orchestrateTaskPlanInstance/buildPlanItemResearcherMessage.test.ts` | **New** |
| `services/task/.../orchestrateTaskPlanInstance/buildPlanItemValidatorMessage.test.ts` | **New** — includes prior-items context in output |
| `services/task/.../orchestrateTaskPlanInstance/buildPriorItemsContext.test.ts` | **New** — empty list → `'none'`; multiple entries formatted correctly |
| `services/task/.../orchestrateTaskPlanInstance/resolvePlanItemAgentRole.test.ts` | **New** — mocks `systemAgentDomain.queries.getModelById`; asserts role resolution and the `'worker'` fallback |
| `services/task/.../orchestrateTaskPlanInstance/runPlanItem.test.ts` (new, or extend if one is added alongside) | Assert role-appropriate message is sent to `runAgentInvokeWithTools` for each of the 3 roles |
| `services/task/.../orchestrateTaskPlanInstance/index.test.ts` | Extend: a plan with worker (order 1) → validator (order 2) executes in order and the validator's invocation message contains the worker's item 1 output |
| `packages/constants/src/internalTools/registry.test.ts` | Update `persist_task_plan` description assertion if the test pins exact description string |

**E2E:** none required. This is a prompt/orchestration-content change with no `apps/web` UI surface (per PRD §2.5 "No UI") and no new Gherkin-testable user flow — consistent with `subagent-orchestration/architecture.md`'s precedent of skipping `tdd-e2e-test-writer` for pure prompt/protocol changes. The existing `apps/web/e2e/features/task-plan/*.feature` suite already covers plan rendering and is unaffected (plan item shape on the wire is unchanged — still `agentId`/`skillId`/`description`/`order`).

---

## 10. Seed / backfill considerations

1. **Seed sync**: update `domains/system-agent/seed/systemAgents.json`'s `Task planner` entry to match §7.4. The existing seed-load mechanism (`loadSystemAgents`, run on deploy) re-syncs this on next deploy — no new mechanism needed.
2. **Specialization agent backfill**: `backfillSpecializationAgentRules()` already exists and is schema-compatible (compares `rule` string, updates on mismatch) — it will pick up the new `SPECIALIZATION_AGENT_RULES.researcher` text automatically once the constant changes. It is **not currently wired to any call site** (confirmed via repo-wide grep — same is true of its sibling `backfillSpecializationAgentTools`). **Action needed**: after this feature merges, an operator (or a one-off invocation added to a deploy/migration script, following whatever mechanism `backfillSpecializationAgentTools` is expected to use — none exists in-repo today, so this is an **existing gap in tooling, not introduced by this feature**) must call `backfillSpecializationAgentRules()` once to update already-provisioned researcher agents in every specialization. Until that runs, existing specializations' researchers keep emitting `Findings:`/`Sources:` output — **new** specializations provisioned after deploy get the new rule text immediately via `provisionSpecializationAgents`.
3. **No `worker`/`validator` rule text changes** — their `SPECIALIZATION_AGENT_RULES` entries are unchanged, so the backfill run only touches researcher agents (no-op update for worker/validator rows since `agent.rule === expectedRule` already).
4. **No migration needed for `TaskPlanTemplateItem`/`TaskPlanInstanceItem`** — no schema change, so existing persisted templates/instances remain valid; role is derived at read-time from `agentId`, which was always resolved from a role-suffixed agent name even before this feature (though only worker names were ever accepted, so all *existing* instances' items are provably `worker`-role — the `resolvePlanItemAgentRole` fallback to `'worker'` handles this transparently, no backfill needed for plan data itself).

---

## 11. Phased implementation order

### Phase 1 — Shared role-resolution + rule text (no behavior change to plan execution yet)

| Step | Work |
|---|---|
| P1-1 | `resolveSpecializationAgentRole.ts` (new) + unit test; refactor `backfillSpecializationAgentRules.ts` to use it |
| P1-2 | Rewrite `SPECIALIZATION_AGENT_RULES.researcher` in `constants.ts` (Process steps format); update/add constants test |
| P1-3 | Reinforce prompt-only skills line in `formatSkillPlannerReuseSection` + test update |

### Phase 2 — Task Planner multi-role assignment (planning-time change)

| Step | Work |
|---|---|
| P2-1 | `resolvePlanItemAgentIds.ts` — accept all 3 roles via `resolveSpecializationAgentRole`; simplify `resolveAgentIdByName`; update tests |
| P2-2 | `buildTaskPlannerAgentsCatalogSection.ts` — list all 3 roles with role annotation; update/add tests |
| P2-3 | `formatTaskPlannerPlanningSection.ts` — role-assignment rule rewrite; update tests |
| P2-4 | Sync `domains/system-agent/seed/systemAgents.json` Task planner `rule` string |
| P2-5 | `packages/constants/src/internalTools/registry.ts` — `persist_task_plan` description tweak; update registry test if it pins exact strings |

### Phase 3 — Execution-time role-aware orchestration

| Step | Work |
|---|---|
| P3-1 | `services/agent/src/index.ts` — export `resolveSpecializationAgentRole` + `SpecializationAgentRole` type |
| P3-2 | `resolvePlanItemAgentRole.ts` (orchestrator, new) + test |
| P3-3 | `buildPriorItemsContext.ts` (new) + test |
| P3-4 | `buildPlanItemResearcherMessage.ts`, `buildPlanItemValidatorMessage.ts` (new) + tests; refactor `buildPlanItemWorkerMessage.ts` param type to `Pick<...>` |
| P3-5 | `buildPlanItemMessage.ts` (Strategy dispatch, new) + test |
| P3-6 | `runPlanItem.ts` — wire role resolution + prior-items context + dispatch; update test |
| P3-7 | `index.ts` (orchestration loop) — maintain `completedItemContext` map, pass `priorItems` per item; extend `index.test.ts` with a worker→validator ordered scenario |

### Phase 4 — Hardening & backfill

| Step | Work |
|---|---|
| P4-1 | Full regression: `services/task`, `services/agent`, `domains/system-agent` test suites green |
| P4-2 | Manual/one-off invocation of `backfillSpecializationAgentRules()` in a target environment (documented as an operational follow-up, not code) |
| P4-3 | `documentation-writer` — update `domains/system-agent` README if it documents `SPECIALIZATION_AGENT_RULES` output format; add a short cross-reference note in `task-skill-planning/architecture.md` and `subagent-orchestration/architecture.md` pointing to this doc for the researcher output format and multi-role plan item change (no content deletion, same pattern used previously in this doc chain) |

**Dependencies:** P1 → P2 → P3 (P3 depends on P1's `resolveSpecializationAgentRole` export and P2's catalog/validation changes being in place so planners can actually produce multi-role plans to execute against). P4 runs after P3.

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Task Planner LLM still avoids assigning researcher/validator roles out of habit (old rule said "never") | Rule text explicitly lists role-assignment guidance with concrete triggers (§7.4 rule 4); catalog section (§7.3) shows role next to each agent name so the model sees the option |
| Task Planner assigns a validator with no preceding worker item, or non-adjacent order, producing an empty "Prior results: none" | Not a hard failure — validator receives `'none'` and can report `STATUS: issues` citing missing prior work; rule 4 in §7.4 instructs the planner to give validators a higher `order` than the step(s) they check, minimizing this case. Acceptable per existing precedent (`subagent-orchestration`'s validator retry loop already tolerates a validator without perfect context) |
| Existing (pre-feature) task plan templates/instances have only worker-role items; `resolvePlanItemAgentRole`'s `'worker'` fallback masks a real resolution failure (e.g. agent renamed/removed) | Fallback only triggers when `resolveSpecializationAgentRole` returns `undefined` for a name that should always resolve for provisioned agents; if the underlying agent was hard-deleted, `runAgentInvokeWithTools` will already fail with a clear agent-not-found error upstream — the role fallback doesn't hide that failure, only the role-labeling |
| Backfill (`backfillSpecializationAgentRules`) not wired to any deploy step, so it may be forgotten | Called out explicitly as an operational Phase 4 follow-up in this doc (§10.2) — same risk already exists for `backfillSpecializationAgentTools`, not a new gap introduced here |
| Removing the `roleSuffixMatches` fallback block in `resolveAgentIdByName` changes error behavior for a previously-ambiguous edge case | Covered by updated unit tests in `resolvePlanItemAgentIds.test.ts` (§9) — the fallback becomes structurally unreachable once inputs are pre-filtered by role, so removing it is safe, not just convenient |
| Prompt-only skill reinforcement (§7.5) causes Skill Planner to under-use scripts where a script was genuinely warranted | Wording keeps script creation available ("only call a script creator when... cannot express the required logic") — this is guidance, not a hard block; `create_skill` still accepts non-empty `scripts[]` unchanged |
| `buildPriorItemsContext` output grows unbounded for plans with many prior items feeding into a late validator | Accepted for v1 — plan items are LLM-authored and typically small (single-digit item counts per §2.2/§2.3 scope); no truncation added to avoid premature complexity; matches this feature's "no new DB fields/infra unless unavoidable" scope constraint |

---

## 13. Confirmed scope boundaries (per §2.5)

- **No UI changes** — plan item wire shape (`agentId`/`skillId`/`description`/`order`) is unchanged; `ActivityPlanRow` and friends need no changes. Role is purely a runtime interpretation of the existing `agentId`, never serialized to a new field, so no GraphQL/API/UI change is triggered.
- **No new domains, DB fields, or internal tools** — confirmed feasible throughout this plan; the only "new" persisted-adjacent behavior (prior-item output context for validators) reuses `instance.items[].output`, already stored.
- **Scheduled/routine task workers** — untouched (still `_disabled`); this doc's role-assignment guidance would apply to them identically if/when they're re-enabled, per the same note already in `subagent-orchestration/architecture.md`.

---

*End of architect plan — 0 new domains/services/packages/DB fields/internal tools, 6 new small files (all in `services/agent`/`services/task`), ~10 rule/text rewrites, 4 implementation phases.*
