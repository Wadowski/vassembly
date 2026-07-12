# Skill Composition — Architecture

**Feature slug:** `skill-composition`
**Related architectures:**
- [`skill/architecture.md`](../skill/architecture.md)
- [`skill-script-execution/architecture.md`](../skill-script-execution/architecture.md)
- [`task-skill-planning/architecture.md`](../task-skill-planning/architecture.md)

---

## ID vs name boundary

**Rule:** Skill **IDs** are the only identifier for composition references in the domain and persistence layers. Skill **names** appear only at the LLM / human prompt boundary.

| Layer | Identifier | Examples |
|---|---|---|
| **Domain** (`domains/skill`) | `skillId` | `usesSkillIds`, `getActiveRuleById`, cycle graph keyed by id |
| **Service** (`services/skill`) | `skillId` | create/update validation, `detectCompositionCycle` |
| **API / GraphQL / DTO** | `skillId` | `usesSkillIds: string[]` on `SkillResponse` |
| **Admin UI** | `skillId` in payloads; **name** for display only | Multi-select shows names, submits ids |
| **LLM tools** | `skillName` | `resolve_skill({ skillName })` — unchanged external contract |
| **Rule text** (prompt content) | `skillName` | `use skill contract-review` directives; `## Referenced skill: …` headings |
| **Task model** | `skillId` | `task.skillIdsUsed` — already id-based; no change |

**Name→ID resolution** happens exactly once at the service/agent boundary when the LLM calls `resolve_skill` with a name, or when a rule directive name is parsed from prompt text. All subsequent domain queries and recursion use `skillId`.

---

## Analysis

### Current State

The skill runtime today has three layers:

| Layer | What it does | Limitation |
|---|---|---|
| **Catalog tier** | `getCatalogBySpecializationId` → injected into system-agent system message | Exposes name+description; no composition |
| **Rule tier** | `resolve_skill` tool → `getActiveRuleByName` → returns flat rule string | One skill resolved per call; no child expansion |
| **Script tier** | `run_skill_script` tool + `parseRuleDirectives` auto-runs | Directives only reference scripts within the **same** skill |

`parseRuleDirectives` recognises three patterns — `run_skill_script scripts/x.py`, `run scripts/x.py`, `run skill <basename>` — and all three resolve to filenames on the **current** skill. There is no mechanism to reference another skill's rule or scripts.

`resolveSkillToolHandler` in `services/agent` returns `{ skillName, rule, autoRunResults? }` for a single skill. The LLM can already call `resolve_skill` multiple times to pull multiple rules, but this is ad-hoc orchestration by the model; the platform does not enforce, scope, or guard it.

### What Already Exists and Can Be Reused

| Existing piece | Location | Reuse plan |
|---|---|---|
| `parseRuleDirectives` | `services/agent/src/internalTools/runSkillScript/parseRuleDirectives.ts` | **Extend** — script patterns unchanged; skill composition uses separate `parseUseSkillDirectives` |
| `resolveSkillToolHandler` | `services/agent/src/internalTools/resolveSkill/index.ts` | **Extend** — name→id at entry; call `resolveSkillComposition` by id |
| `getActiveRuleByName` query | `domains/skill/src/queries/getActiveRuleByName/` | **Reuse at LLM boundary only** — returns `skillId`; used when `resolve_skill` receives a name |
| `getModelById` query | `domains/skill/src/queries/getModelById/` | **Base for new** `getActiveRuleById` |
| `getBySpecializationId` query | `domains/skill/src/queries/getBySpecializationId/` | **Reuse** — cycle detection at save time (id-keyed graph) |
| `CREATE_INPUT_SCHEMA` / `UPDATE_INPUT_SCHEMA` | `domains/skill/src/commands/create/`, `commands/update/` | **Extend** — add `usesSkillIds?: string[]` |
| `services/skill/handlers/createSkill`, `updateSkill` | `services/skill/src/handlers/` | **Extend** — validate ids exist in same specialization; cycle check by id |
| `ui/api-hooks/src/skills/types.ts` | existing | **Extend** — add `usesSkillIds` to `SkillItem` |
| `SkillForm` | `apps/web/…/SkillForm/` | **Extend** — multi-select by name, submit ids |

### Genuine Gaps

- No `usesSkillIds` field on `SkillModel`.
- No `getActiveRuleById` domain query for id-based rule resolution.
- No `use skill <name>` directive handling in the resolve handler (names parsed from rule text; resolved to ids before domain calls).
- No transitive rule resolution with depth limiting and cycle detection keyed by skill id.
- Child script auto-run: `assertSkillAuthorized` in `runSkillScript` checks `context.specializationIds` — unchanged; child skills remain in the same specialization.

### Design Patterns Applied

| Pattern | Where | Rationale |
|---|---|---|
| **Composite** (Structural) | Skill rule resolution — tree traversed by `skillId` whether leaf or composed | Uniform `resolveSkillComposition({ skillId })` recursion |
| **Adapter** (Structural) | `resolveSkillToolHandler` — adapts LLM `skillName` input to domain `skillId` at the boundary | Domain never receives names for composition |
| **Chain of Responsibility** (Behavioral) | `parseUseSkillDirectives` — regex patterns tried in order | Same structure as `parseRuleDirectives` |
| **Facade** (Structural) | `resolveSkillComposition` — hides depth, visited-set, name→id mapping | Single call from handler |
| **Command** (Behavioral) | `resolveSkillToolHandler` — encapsulates resolve-and-compose | Mirrors `runSkillScriptToolHandler` |

---

## Unified Skill Capability Taxonomy

| Capability | Declaration (domain) | LLM-facing | Resolution point |
|---|---|---|---|
| **Scripts** | `scripts[]` on SkillModel | filenames in rule directives | `run_skill_script` / `parseRuleDirectives` |
| **MCPs** | — (agent-level) | tool names in agent prompt | `runAgentInvokeWithTools` |
| **Web tools** | — (agent-level) | tool names in agent prompt | `assignedToolIds` on specialization agents |
| **Child skills** *(new)* | `usesSkillIds: string[]` on SkillModel | `use skill <name>` in rule text; catalog shows names | `resolveSkillComposition` by id |

Child skills are scoped to the skill itself. A referenced skill must belong to the same specialization as the parent (validated by id lookup).

---

## Composition Patterns

### Delegate — hand off to a child skill's full rule

Rule text of `contract-processor` (LLM prompt — names allowed):
```
Validate the document format first.

use skill contract-review

After the review is complete, generate the summary using the findings above.
```

At resolve time: directive name `contract-review` is mapped to `skillId`, child rule fetched via `getActiveRuleById`, inlined with a **name** heading for the LLM: `## Referenced skill: contract-review`.

### Compose — orchestrate multiple child skills

```
use skill document-extract
use skill contract-review
use skill compliance-check
```

Each directive resolved name→id in order; children fetched and inlined sequentially.

### Fallback — graceful degradation on missing child

When a directive name does not resolve to an active skill id:
1. Replace directive with `<!-- skill "contract-review" is not available -->` (name in notice — LLM-readable)
2. Continue unless `required` modifier is set

---

## Data Model

### `SkillModel` extension (`domains/skill/src/model/model.ts`)

```typescript
export class SkillModel extends Model {
  specializationId!: string;
  name!: string;
  description!: string;
  rule!: string;
  enabled!: boolean;
  scripts!: SkillScript[];
  usesSkillIds?: string[];   // NEW — ids of composed skills; same specialization only
}
```

`usesSkillIds` is the canonical structural dependency list:
- Stored and validated by **skill id** only
- Validated at create/update: all ids must resolve to active skills in the same specialization; cannot include self
- Used for cycle detection at save time (DFS graph keyed by id)
- Displayed in admin UI by resolving ids → names for labels only

### `SkillResponse` DTO extension (`domains/skill/src/model/dto.ts`)

```typescript
export interface SkillResponse {
  // ...existing fields...
  usesSkillIds: string[];   // NEW — empty array if not set
}
```

### GraphQL type extension

```graphql
type Skill {
  # ...existing fields...
  usesSkillIds: [ID!]!
}
```

### Directive syntax (rule text — LLM prompt only)

```
use skill <skillName>
use skill <skillName> required
use skill <skillName> optional
```

- `skillName` is human/LLM-readable text in the rule body — **not stored as a domain reference**.
- At resolve time (`services/agent`): name is looked up within the parent's `specializationId` → `skillId` via `getActiveRuleByName`, then all domain work uses the id.
- Optional: if parent has non-empty `usesSkillIds`, warn or reject when a directive resolves to an id not listed in `usesSkillIds` (recommended — keeps prompt and structural graph aligned).

---

## Domain Queries

### New: `getActiveRuleById` (`domains/skill/src/queries/getActiveRuleById/`)

Id-based counterpart to `getActiveRuleByName`. Used for all composition recursion after the LLM boundary.

```typescript
export interface GetActiveRuleByIdParams {
  skillId: string;
}

export interface GetActiveRuleByIdResult {
  skillId: string;
  specializationId: string;
  name: string;           // included for LLM expansion headings only; not used as lookup key
  rule: string;
  scripts: SkillScript[];
  usesSkillIds: string[];
}
```

Filters: `enabled: true`, `removedAt: null`. Throws `NotFoundError` when missing or inactive.

`getActiveRuleByName` remains for the `resolve_skill` tool entry point (LLM supplies name). It already returns `skillId` — composition hands off to `resolveSkillComposition({ skillId })` immediately.

---

## Runtime Design (`services/agent`)

### `parseUseSkillDirectives` — LLM-layer parser

Parses **names** from rule text. Lives in `services/agent` (not domain) because rule text is prompt content.

```typescript
const USE_SKILL_PATTERN =
  /^use\s+skill\s+(?<skillName>[^\s]+)(?:\s+(?<modifier>required|optional))?\s*$/gim;

export interface UseSkillDirective {
  raw: string;
  skillName: string;   // LLM-facing; mapped to skillId before domain calls
  required: boolean;
}
```

### `resolveSkillNameToId` — boundary helper

```typescript
const resolveSkillNameToId = async ({
  specializationId,
  skillName,
}: {
  specializationId: string;
  skillName: string;
}): Promise<string> => {
  const { skillId } = await skillDomain.queries.getActiveRuleByName({
    specializationId,
    skillName,
  });
  return skillId;
};
```

### `resolveSkillComposition` — Composite resolver (id-based)

```typescript
const MAX_COMPOSITION_DEPTH = 3;

interface ResolveSkillCompositionParams {
  skillId: string;
  depth: number;
  visited: Set<string>;   // skill IDs
}

export const resolveSkillComposition = async ({
  skillId,
  depth,
  visited,
}: ResolveSkillCompositionParams): Promise<{
  name: string;
  rule: string;
  scripts: SkillScript[];
}> => {
  if (depth > MAX_COMPOSITION_DEPTH) {
    throw new ValidationError(
      `Skill composition depth limit (${MAX_COMPOSITION_DEPTH}) exceeded at skill id "${skillId}"`,
    );
  }

  if (visited.has(skillId)) {
    throw new ValidationError(
      `Skill composition cycle detected at skill id "${skillId}"`,
    );
  }

  const nextVisited = new Set(visited);
  nextVisited.add(skillId);

  const activeSkill = await skillDomain.queries.getActiveRuleById({ skillId });
  const directives = parseUseSkillDirectives({ rule: activeSkill.rule });

  if (directives.length === 0) {
    return { name: activeSkill.name, rule: activeSkill.rule, scripts: activeSkill.scripts };
  }

  let composedRule = activeSkill.rule;
  const allScripts = [...activeSkill.scripts];

  for (const directive of directives) {
    try {
      const childSkillId = await resolveSkillNameToId({
        specializationId: activeSkill.specializationId,
        skillName: directive.skillName,
      });

      if (
        activeSkill.usesSkillIds.length > 0 &&
        !activeSkill.usesSkillIds.includes(childSkillId)
      ) {
        throw new ValidationError(
          `Skill "${directive.skillName}" is not declared in usesSkillIds`,
        );
      }

      const child = await resolveSkillComposition({
        skillId: childSkillId,
        depth: depth + 1,
        visited: nextVisited,
      });

      const expansion = `\n\n## Referenced skill: ${child.name}\n\n${child.rule}`;
      composedRule = composedRule.replace(directive.raw, expansion);
      allScripts.push(...child.scripts);
    } catch (error: unknown) {
      if (directive.required) {
        throw error;
      }
      composedRule = composedRule.replace(
        directive.raw,
        `<!-- skill "${directive.skillName}" is not available -->`,
      );
    }
  }

  return { name: activeSkill.name, rule: composedRule, scripts: allScripts };
};
```

**Key decisions:**
- `visited` tracks **skill ids** — stable across renames.
- Expansion headings use **child.name** for LLM readability.
- Error messages in depth/cycle paths use ids internally; user/LLM-facing notices use names.

### `resolveSkillToolHandler` update

```typescript
// LLM boundary: skillName → skillId
const entry = await skillDomain.queries.getActiveRuleByName({ specializationId, skillName });

const { name, rule: composedRule, scripts: allScripts } = await resolveSkillComposition({
  skillId: entry.skillId,
  depth: 0,
  visited: new Set(),
});

const autoRunResults = await runAutoScriptsFromRule({
  rule: composedRule,
  skillName: name,          // LLM-facing name of root skill
  scripts: allScripts,
  context,
});

return JSON.stringify({
  skillName: name,
  rule: composedRule,
  ...(autoRunResults.length > 0 ? { autoRunResults } : {}),
});
```

External contract unchanged: LLM calls `resolve_skill({ skillName })` and receives `{ skillName, rule }`.

### Cycle detection at save time (id-keyed)

```typescript
const detectCompositionCycle = ({
  skillId,
  usesSkillIds,
  allSkills,
}: {
  skillId: string;
  usesSkillIds: string[];
  allSkills: Array<{ id: string; usesSkillIds?: string[] }>;
}): void => {
  const graph = new Map(allSkills.map((s) => [s.id, s.usesSkillIds ?? []]));
  graph.set(skillId, usesSkillIds);

  const visit = (currentId: string, visited: Set<string>): void => {
    if (visited.has(currentId)) {
      throw new ValidationError(`Skill composition cycle detected involving id "${currentId}"`);
    }
    visited.add(currentId);
    for (const depId of graph.get(currentId) ?? []) {
      visit(depId, new Set(visited));
    }
  };

  visit(skillId, new Set());
};
```

Validation in `services/skill` handlers:
1. All `usesSkillIds` must exist as active skills in the same `specializationId`.
2. Cannot include the skill's own id.
3. Run `detectCompositionCycle` before persist.

---

## Alignment with agentskills.io Phase 4

Phase 4 `allowed-tools` frontmatter will map to platform fields. Skill references in that frontmatter resolve to **ids** at import time; names remain in the imported rule text for LLM consumption.

---

## API / Admin UI Impact

### REST create / update

`POST /api/skills` and `PATCH /api/skills/:id` accept `usesSkillIds?: string[]` (not names).

Validation (`services/skill`):
1. Every id must resolve to an active skill in the same specialization.
2. Must not include self id.
3. No cycles in the id graph.

### Admin UI — SkillForm

- Multi-select displays skill **names**; form state and submit payload store **ids**.
- Skill detail: resolve `usesSkillIds` → names for chip labels via existing `skillsBySpecialization` query.

---

## Architecture & Package Placement

```
domains/skill
  ↑ model: usesSkillIds
  ↑ queries/getActiveRuleById (new)
  ↑ commands/create + update: persist usesSkillIds

services/skill
  ↑ handlers: id validation + detectCompositionCycle

services/agent
  ↑ parseUseSkillDirectives (parses names from rule text)
  ↑ resolveSkillNameToId (name→id at boundary)
  ↑ resolveSkillComposition (recurses by skillId)
  ↑ resolveSkillToolHandler (entry: LLM skillName → skillId)

apps/api / ui/api-hooks / apps/web
  ↑ usesSkillIds in API; names for display only
```

### Data flow at resolve time

```
LLM: resolve_skill({ skillName: "contract-processor" })
  → getActiveRuleByName → { skillId: "abc-123", ... }
  → resolveSkillComposition({ skillId: "abc-123", visited: {} })
      → getActiveRuleById("abc-123") → rule contains "use skill contract-review"
      → parseUseSkillDirectives → { skillName: "contract-review" }
      → getActiveRuleByName(specId, "contract-review") → { skillId: "def-456" }
      → resolveSkillComposition({ skillId: "def-456", ... })
          → getActiveRuleById("def-456") → leaf
      → inline child rule under "## Referenced skill: contract-review"
  → return { skillName: "contract-processor", rule: composedRule }
```

Domain isolation preserved: `domains/system-agent` does not import `domains/skill`.

---

## Recommendation

Extend existing resolve infrastructure with **id-based composition in the domain** and **name-based authoring at the LLM prompt edge**. No new packages or internal tools.

`usesSkillIds` is the minimal persistent graph. Rule `use skill <name>` directives keep rules human-readable; the agent layer maps names to ids before any domain query.

**Trade-offs:**
- Skill rename does not break `usesSkillIds` references (ids are stable).
- Rule directives still use names — if a skill is renamed, rule text must be updated separately (same as any other prose in the rule).
- Optional `usesSkillIds` enforcement on directives prevents undeclared composition.

---

## Implementation Steps

**SC-1 — `domains/skill` model: `usesSkillIds`**

- `domains/skill/src/model/model.ts` — `usesSkillIds?: string[]`
- `domains/skill/src/model/dto.ts` — `usesSkillIds: string[]`
- `domains/skill/src/model/toSkillResponse.ts` — `usesSkillIds: skill.usesSkillIds ?? []`

**SC-1b — `domains/skill` query: `getActiveRuleById`**

- `domains/skill/src/queries/getActiveRuleById/index.ts` + `types.ts`
- Export from `domains/skill/src/queries/index.ts`

**SC-2 — `domains/skill` commands: persist `usesSkillIds`**

- Extend create/update schemas and types with `usesSkillIds?: string[]`

**SC-3 — `services/skill` handlers: id validation + cycle detection**

- `services/skill/src/handlers/shared/detectCompositionCycle.ts` — id-keyed graph
- `createSkill` / `updateSkill` — validate ids exist, same specialization, not self, no cycle

**SC-4 — `services/agent` composition runtime**

- `parseUseSkillDirectives.ts` — parse names from rule text
- `resolveSkillNameToId.ts` — thin wrapper over `getActiveRuleByName`
- `resolveSkillComposition.ts` — recurse by `skillId` via `getActiveRuleById`
- Update `resolveSkill/index.ts`

**SC-5 — `apps/api` + GraphQL: `usesSkillIds`**

**SC-6 — `ui/api-hooks`: `usesSkillIds` in types and HTTP clients**

**SC-7 — `apps/web` SkillForm: display names, submit ids**

---

## Todo Plan

```
SC-1.  domains/skill — usesSkillIds on model, DTO, mapper
SC-1b. domains/skill — getActiveRuleById query
SC-2.  domains/skill — create/update commands for usesSkillIds
SC-3.  services/skill — id validation + detectCompositionCycle
SC-4.  services/agent — composition runtime (name parse → id recurse)
SC-5.  apps/api — usesSkillIds passthrough + GraphQL
SC-6.  ui/api-hooks — usesSkillIds types + HTTP
SC-7.  apps/web — SkillForm (display names, submit ids)
```

### Parallelism

- **Batch A:** `SC-1`, `SC-1b`, `SC-4` (SC-4 mocks `getActiveRuleById` until SC-1b lands)
- **Batch B:** `SC-2` (after SC-1)
- **Batch C:** `SC-3` (after SC-2)
- **Batch D–F:** `SC-5` → `SC-6` → `SC-7`

---

## Test Strategy

| Package | Key scenarios |
|---|---|
| `domains/skill` (`getActiveRuleById`) | Returns rule+name+usesSkillIds for active skill; throws for archived/disabled/missing id |
| `domains/skill` (commands) | Persists `usesSkillIds`; defaults to `[]` |
| `services/skill` | Rejects unknown id; rejects self-reference; rejects id cycle; rejects id from other specialization |
| `services/agent` (`parseUseSkillDirectives`) | Parses `use skill foo`; required/optional modifiers |
| `services/agent` (`resolveSkillComposition`) | Recurses by id; cycle by id; depth limit; name headings in output; optional undeclared id enforcement |
| `services/agent` (handler) | `resolve_skill({ skillName })` entry unchanged; internal path uses ids |
| `apps/web` (E2E) | Form submits ids; detail shows names; runtime composes by id |

---

## Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| R-1 | Rule directive name out of sync after skill rename | Document that rule text is LLM prose; `usesSkillIds` stays stable |
| R-2 | Directive resolves to id not in `usesSkillIds` | Enforce when `usesSkillIds` is non-empty |
| R-3 | Deep trees bloat context | Max depth 3; catalog tier stays name+description only |
| R-4 | Name→id lookup fails silently on optional directive | Graceful `<!-- skill "name" is not available -->` notice |

---

*End of Skill Composition architecture. Domain references use skill ids; names are confined to LLM prompts and rule text.*
