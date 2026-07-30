# Tool Input Normalization — Runtime — Implementation Architecture

**Status:** Engineering handoff
**Last updated:** 2026-07-29
**Scope:** App runtime only — `packages/client-langchain`, `services/agent`, `packages/constants`, `packages/validation`, MCP integration. **Excludes** all `.cursor/` agents, skills, and rules.
**Related:** [Agent Internal Tools](../agent-internal-tools/architecture.md) · [Task/Skill Planning](../task-skill-planning/architecture.md)

This document defines how tool-call inputs from the LLM are normalized before they reach internal tool handlers and MCP tools, so tool calls stop failing on shape mismatches (stringified JSON, `null` vs `undefined`, missing optional-array defaults) while still **forcing the model to supply every required field** — never inventing business data on its behalf.

---

## Analysis

### Problem statement — two distinct failure classes

Today only one of 14 internal tools (`persist_task_plan`) has any normalization. The other 13 call `tool.invoke(toolCall.args)` directly against a raw Zod schema inside `runToolCallLoop`. Any mismatch throws, is caught generically, and returns an unstructured error string with no retry guidance. This conflates two failure classes that need **opposite** handling:

| Failure class | Example | Correct handling |
|---|---|---|
| **Shape mismatch** (LLM formatting quirk, not missing information) | Args arrive as a stringified JSON blob; optional array field arrives as `null` instead of omitted/`[]`; a number arrives as `"3"`; `skillId` arrives as the string `"none"` instead of `null` | **Coerce silently** — the model already provided the right information, just in a shape `JSON.stringify`/`bindTools` corrupted. Re-shape before validation. |
| **Missing required data** (LLM never provided a required business field) | `use_agent` called without `agentPrompt`; `create_skill` called without `rule` | **Never invent a default.** Fail with a structured, machine-parseable error (`missingFields`) fed back into the loop as a `ToolMessage` so the model retries with the actual value. |

Conflating these two today means real omissions currently surface as opaque thrown errors (`recoverInvalidPersistTaskPlanCalls` swallows the `catch` and drops the call silently for `persist_task_plan`; other tools bubble a raw JS error string with no `missingFields` signal), so the model has no structured way to self-correct.

### What exists vs. what is new

| Area | Exists today | Gap |
|---|---|---|
| `persist_task_plan` shape coercion | `normalizePersistTaskPlanInput` (`packages/client-langchain/src/internalTools/schemas/parsePersistTaskPlanInput.ts`) — JSON repair, null coercion, array defaults, `.parse()` (throws on missing required) | One-off; not reusable; throws raw `Error`, not a structured payload |
| `invalid_tool_calls` recovery | `recoverInvalidPersistTaskPlanCalls` in `runToolCallLoop.ts` — hardcoded to `PERSIST_TASK_PLAN_TOOL_NAME` string | Not registry-driven; silently drops calls that fail to parse (no retry signal) |
| Required-tool nudging | `requiredSuccessfulTool.ts` — `hasRequiredToolSucceeded` / `buildRequiredToolNudgeMessage`, both hardcoded to `persist_task_plan`'s response shape (`taskPlanInstanceId`) | Cannot generalize to any other required tool without new hardcoded branches |
| Handler-level try/catch | Only `task-plan-persist` in `createInternalToolHandlers.ts` wraps normalization in try/catch and returns `JSON.stringify({ error })` | Every other handler throws straight through `tool.invoke` |
| Shared coercion utilities | None — `@vassembly/validation` has `validatorFactory` / `getValidatorIssues`, but both are **Zod v4** typed (`z.ZodError`) | `client-langchain` is pinned to **Zod v3.24.2** (LangChain `DynamicStructuredTool` + `bindTools` compatibility) — cannot import `@vassembly/validation`'s Zod-v4-typed helpers as-is |
| MCP tool input | `loadMcpTools.ts` loads tools with server-owned schemas; no normalization layer at all | External schemas are opaque — cannot coerce required fields, but JSON-repair + enriched errors are still valuable |
| Registry ↔ schema sync | Three independent maps must agree by tool id: `INTERNAL_TOOLS` (`packages/constants/src/internalTools/registry.ts`), `INTERNAL_TOOL_SCHEMAS` (`buildInternalTools.ts`), handler map (`createInternalToolHandlers.ts`) | No automated consistency check; drift only surfaces at runtime as a silently skipped tool (`skippedToolIds`) |

### Reuse assessment

- **`persist_task_plan` is the gold-standard embodiment** of the pattern this feature generalizes — its JSON-repair regexes, nullable coercion, array coercion, and slugify-fallback-for-non-required-field logic are extracted into shared, zod-version-agnostic utilities rather than rewritten.
- **`INTERNAL_TOOL_SCHEMAS`** (already a per-tool id → Zod schema map in `buildInternalTools.ts`) is the natural anchor point for a parallel **`TOOL_NORMALIZERS`** map — same keys, same file layout convention (`internalTools/schemas/*.ts`).
- **`toolNameToInternalToolId`** (already built and threaded into `runToolCallLoop` for usage recording) is reused to resolve a normalizer for *any* tool name in the generalized `invalid_tool_calls` recovery — no new lookup plumbing needed.
- **`requiredSuccessfulTool.ts`**'s loop-continuation mechanism (`requireSuccessfulToolLlmName`, `hasRequiredToolSucceeded`) is reused unchanged at the `runToolCallLoop` level; only its internals become data-driven off the standard error payload instead of tool-name-specific string branches.
- No new packages. No new domains. This is entirely an extension of `client-langchain`, `services/agent`, `constants`, and `validation`.

### Design principles

1. **Coerce shape at the LLM boundary.** Stringified JSON, `null → undefined`, `"none"/"null" → null` for nullable fields, missing optional arrays `→ []`, numeric strings `→ number` — all applied *before* Zod validation, and only for fields where coercion cannot mask missing business meaning.
2. **Validate strictly at the domain/tool boundary.** After coercion, the tool's existing Zod schema is the single source of truth for "is this valid" — required fields with no default remain required. We do not loosen any schema's required-ness to make validation pass.
3. **Fail soft, not throw, for missing required fields.** A `ZodError` on a *required* field is caught and converted into a structured JSON string returned as the tool's `ToolMessage` content (like a normal tool result) — never re-thrown to abort the loop. This keeps the model in the loop and gives it something actionable.
4. **Never invent defaults for required business fields.** Only shape-level defaults are permitted (empty array for an optional list, `null` normalization for optional nullable). Anything a human/business would consider "data" (an agent name, a skill's rule text, a task description) is never synthesized.
5. **Registry-driven, not hardcoded.** Every mechanism (`normalizeToolInput`, `invalid_tool_calls` recovery, required-tool nudging) is keyed by the internal tool id shared with `INTERNAL_TOOL_SCHEMAS` and `INTERNAL_TOOLS`, so adding tool #15 requires adding one registry entry, not editing `runToolCallLoop.ts`.

### Design patterns applied

| Pattern | Where | Why |
|---|---|---|
| **Strategy** (map object, per `code-rules-general.mdc`) | `TOOL_NORMALIZERS: Record<toolId, ToolNormalizer>` | Swap coercion/validation behavior per tool without branching in `runToolCallLoop` or handlers |
| **Adapter** | Individual normalizer entries (e.g. `useAgentNormalizer`, `createSkillNormalizer`) | Each adapts one tool's raw/corrupted LLM shape to its strict Zod input type |
| **Facade** | `normalizeToolInput({ toolId, raw })` | Single entry point hiding shape coercion + Zod parse + structured-error construction from callers (handlers, recovery logic) |
| **Decorator** | `withNormalizedInput({ toolId, handler })` | Wraps an existing handler with normalization behavior without changing the handler's own signature/logic |
| **Chain of Responsibility** (already present) | `getToolCalls` → `recoverInvalidPersistTaskPlanCalls` in `runToolCallLoop.ts` | Generalized into `recoverInvalidToolCalls`, iterating every `invalid_tool_calls` entry through the matching registry normalizer |

---

## Architecture & Package Placement

### Layer responsibilities

| Package | Responsibility | New / modified |
|---|---|---|
| `@vassembly/validation` | Zod-version-agnostic, pure shape-coercion primitives + standard error payload builder. No LangChain, no tool-registry knowledge. | Extend (new `toolInput/` module) |
| `@vassembly/constants` | Unchanged data (`INTERNAL_TOOLS`, `INTERNAL_TOOL_IDS`) — remains the single canonical id list all consistency tests compare against | No change |
| `@vassembly/client-langchain` | Per-tool `TOOL_NORMALIZERS` registry (Strategy/Adapter), `normalizeToolInput` Facade, generalized `invalid_tool_calls` recovery, generalized required-tool nudging, MCP thin normalization layer | Extend |
| `services/agent` | `withNormalizedInput` handler wrapper applied uniformly across `createInternalToolHandlers.ts` | Extend |

### Why coercion utilities live in `@vassembly/validation` but stay Zod-version-agnostic

`@vassembly/validation` is on **Zod v4** (`validatorFactory`, `getValidatorIssues` both type against `z.ZodError`/`z.ZodTypeAny`). `client-langchain` is pinned to **Zod v3.24.2** because `@langchain/core`'s `DynamicStructuredTool` and `bindTools` are typed against the Zod v3 `ZodObject` shape it ships with. Importing `@vassembly/validation`'s existing Zod-v4-typed exports into `client-langchain` today would either (a) force a premature, risky Zod v4 bump across all 14 LangChain tool schemas and every `@langchain/*` dependency simultaneously, or (b) require running two Zod majors side by side in one package (dependency and type-identity hazard: a Zod v3 `ZodError` is not `instanceof` a Zod v4 `ZodError`).

**Resolution:** the new coercion utilities added to `@vassembly/validation` operate on **plain JS values and a minimal, version-agnostic issue shape** — they never import `zod` at all:

```typescript
// packages/validation/src/toolInput/types.ts
export interface ToolInputIssueLike {
  path: Array<string | number>;
  message: string;
  code?: string;
}

export interface ToolInputErrorPayload {
  error: string;
  code: 'MISSING_REQUIRED_FIELDS' | 'INVALID_SHAPE' | 'PARSE_ERROR';
  missingFields?: string[];
  hint?: string;
}
```

Both Zod v3 (`ZodIssue[]` from `error.issues`) and Zod v4 (`error.issues`) satisfy `ToolInputIssueLike` structurally, so the same builder works for `client-langchain` (v3) today and for any future v4 consumer without change. This keeps `@vassembly/validation` the single source of truth for the *shape* of coercion/error primitives while deferring the Zod major-version question entirely (see Phase 6).

### Shared coercion utilities — API (`@vassembly/validation`)

**Directory:** `packages/validation/src/toolInput/`

```
toolInput/
├── index.ts                      # public exports
├── types.ts                      # ToolInputIssueLike, ToolInputErrorPayload, ShapeCoercionConfig
├── coerceStringifiedJson.ts       # string -> parsed object (JSON.parse, best-effort)
├── coerceNullableFields.ts        # null/'null'/'none' -> undefined|null, per-field allowlist
├── coerceArrayDefaults.ts         # null/undefined -> [] for a named allowlist of fields
├── coerceNumericFields.ts         # numeric-looking strings -> number, per-field allowlist
├── buildMissingFieldsErrorPayload.ts   # ToolInputIssueLike[] -> ToolInputErrorPayload
└── normalizeToolInputShape.ts      # facade combining the coercers per ShapeCoercionConfig
```

```typescript
// normalizeToolInputShape.ts
export interface ShapeCoercionConfig {
  nullableToUndefinedFields?: string[];
  arrayDefaultFields?: string[];
  numericFields?: string[];
}

export const normalizeToolInputShape = ({
  raw,
  config,
}: {
  raw: unknown;
  config: ShapeCoercionConfig;
}): Record<string, unknown> => {
  const parsed = coerceStringifiedJson({ raw });
  const withNullableDefaults = coerceNullableFields({
    record: parsed,
    fields: config.nullableToUndefinedFields ?? [],
  });
  const withArrayDefaults = coerceArrayDefaults({
    record: withNullableDefaults,
    fields: config.arrayDefaultFields ?? [],
  });

  return coerceNumericFields({ record: withArrayDefaults, fields: config.numericFields ?? [] });
};
```

```typescript
// buildMissingFieldsErrorPayload.ts
export const buildMissingFieldsErrorPayload = ({
  issues,
  toolLabel,
}: {
  issues: ToolInputIssueLike[];
  toolLabel: string;
}): ToolInputErrorPayload => {
  const missingFields = issues
    .filter((issue) => issue.code === 'invalid_type' || issue.code === 'too_small')
    .map((issue) => issue.path.join('.'))
    .filter((field) => field.length > 0);

  if (missingFields.length === 0) {
    return {
      error: `${toolLabel} received an invalid payload`,
      code: 'INVALID_SHAPE',
      hint: issues.map((issue) => issue.message).join('; '),
    };
  }

  return {
    error: `${toolLabel} is missing required fields: ${missingFields.join(', ')}`,
    code: 'MISSING_REQUIRED_FIELDS',
    missingFields,
    hint: `Call ${toolLabel} again including: ${missingFields.join(', ')}. Do not guess values — use the actual data from context.`,
  };
};
```

`coerceStringifiedJson` reuses the JSON-repair heuristics currently private to `parsePersistTaskPlanInput.ts` (`repairLlmToolArgumentsJson`), promoted to a shared, generic utility (`packages/validation/src/toolInput/repairLlmJson.ts`) parameterized by an ordered list of regex repairs rather than hardcoded to the task-plan corruption pattern.

### `TOOL_NORMALIZERS` registry + `normalizeToolInput` flow (`client-langchain`)

**Directory:** `packages/client-langchain/src/internalTools/normalization/`

```
normalization/
├── index.ts
├── types.ts                 # ToolNormalizer, NormalizeToolInputResult
├── toolNormalizers.ts        # TOOL_NORMALIZERS: Record<toolId, ToolNormalizer>  (Strategy map)
├── normalizeToolInput.ts     # Facade: coerce -> safeParse -> success | structured error
└── withNormalizedInput.ts    # Decorator used by services/agent handlers
```

```typescript
// types.ts
export interface ToolNormalizer<T = Record<string, unknown>> {
  schema: ZodObject<ZodRawShape>;
  shapeCoercion: ShapeCoercionConfig;      // from @vassembly/validation
}

export type NormalizeToolInputResult<T> =
  | { success: true; data: T }
  | { success: false; errorPayload: ToolInputErrorPayload };
```

```typescript
// normalizeToolInput.ts  (Facade)
export const normalizeToolInput = <T>({
  toolId,
  raw,
}: {
  toolId: string;
  raw: unknown;
}): NormalizeToolInputResult<T> => {
  const normalizer = TOOL_NORMALIZERS[toolId];
  const definition = getInternalToolById(toolId);

  if (!normalizer || !definition) {
    return {
      success: false,
      errorPayload: { error: `Unknown internal tool: ${toolId}`, code: 'INVALID_SHAPE' },
    };
  }

  const shaped = normalizeToolInputShape({ raw, config: normalizer.shapeCoercion });
  const result = normalizer.schema.safeParse(shaped);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    errorPayload: buildMissingFieldsErrorPayload({
      issues: result.error.issues,
      toolLabel: definition.llmToolName,
    }),
  };
};
```

`TOOL_NORMALIZERS` reuses the exact schemas already registered in `INTERNAL_TOOL_SCHEMAS` (`buildInternalTools.ts`) — each entry only adds the `shapeCoercion` config for that tool's known corruption modes (see per-tool priority below). Tools with no known shape-mismatch risk get an empty `shapeCoercion: {}` (coercion is a no-op; strict validation still applies).

### Handler wrapper pattern — `withNormalizedInput` (`services/agent`)

```typescript
// packages/client-langchain/src/internalTools/normalization/withNormalizedInput.ts
export const withNormalizedInput = <T>({
  toolId,
  handler,
}: {
  toolId: string;
  handler: (args: T) => Promise<string>;
}): InternalToolHandler => {
  return async (rawArgs: Record<string, unknown>): Promise<string> => {
    const result = normalizeToolInput<T>({ toolId, raw: rawArgs });

    if (!result.success) {
      return JSON.stringify(result.errorPayload);
    }

    return handler(result.data);
  };
};
```

`services/agent/src/internalTools/createInternalToolHandlers.ts` wraps every entry uniformly (replacing the one-off `task-plan-persist` try/catch):

```typescript
export const createInternalToolHandlers = ({ toolContext }): InternalToolHandlerMap => ({
  'agent-list': withNormalizedInput({ toolId: 'agent-list', handler: (args) => listAgents({ args, context: toolContext }) }),
  'agent-use': withNormalizedInput({ toolId: 'agent-use', handler: (args) => useAgent({ args, context: toolContext }) }),
  'task-update': withNormalizedInput({ toolId: 'task-update', handler: (args) => updateTaskToolHandler(args, toolContext) }),
  'task-plan-persist': withNormalizedInput({ toolId: 'task-plan-persist', handler: (args) => persistTaskPlanToolHandler(args, toolContext) }),
  // ... one line per remaining tool, same shape
});
```

`withNormalizedInput` lives in `client-langchain` (co-located with `normalizeToolInput` and the registry it depends on) and is imported by `services/agent`, mirroring the existing import of `normalizePersistTaskPlanInput` from `@vassembly/client-langchain` in the current `createInternalToolHandlers.ts` — no new dependency direction introduced.

### Standard error JSON

Every failed normalization — internal tool or MCP — returns the same shape as the `ToolMessage` content:

```json
{
  "error": "use_agent is missing required fields: agentPrompt",
  "code": "MISSING_REQUIRED_FIELDS",
  "missingFields": ["agentPrompt"],
  "hint": "Call use_agent again including: agentPrompt. Do not guess values — use the actual data from context."
}
```

`code` is one of `MISSING_REQUIRED_FIELDS | INVALID_SHAPE | PARSE_ERROR | MCP_TOOL_ERROR`. This is the contract both the generalized `invalid_tool_calls` recovery and the generalized required-tool nudging parse to decide how to react.

### Forcing LangChain to provide all required data

Three reinforcing mechanisms, all registry-driven and generalized beyond `persist_task_plan`:

1. **Structured missing-field errors returned as tool results** (above) — the model sees exactly which fields it omitted on its *next* turn, because the `ToolMessage` is appended to `currentMessages` like any successful call.
2. **Generalized `invalid_tool_calls` recovery** — today `getToolCalls`/`recoverInvalidPersistTaskPlanCalls` in `runToolCallLoop.ts` only rescues malformed `persist_task_plan` calls (when LangChain fails to parse the tool-call args into valid JSON entirely, it lands in `response.invalid_tool_calls` as a raw string instead of `response.tool_calls`). Generalized version:

   ```typescript
   const recoverInvalidToolCalls = ({
     response,
     toolNameToInternalToolId,
   }: {
     response: BaseMessage;
     toolNameToInternalToolId?: Map<string, string>;
   }): Array<{ name: string; args: Record<string, unknown>; id?: string }> => {
     if (!('invalid_tool_calls' in response) || !Array.isArray(response.invalid_tool_calls)) {
       return [];
     }

     return response.invalid_tool_calls
       .filter((call) => typeof call.args === 'string' && call.args.trim().length > 0)
       .flatMap((call) => {
         const toolId = toolNameToInternalToolId?.get(call.name);
         if (!toolId) {
           return [];
         }

         const result = normalizeToolInput({ toolId, raw: call.args });
         return result.success
           ? [{ name: call.name, args: result.data as Record<string, unknown>, id: call.id }]
           : [];
       });
   };
   ```

   Calls that still fail to normalize (genuinely missing required data, not just malformed JSON) are now **not silently dropped** — they fall through to the standard tool-execution path in the next section as a normal tool call with the *original raw string* as args, so `withNormalizedInput` handles them uniformly and returns the structured missing-fields error as a `ToolMessage`, keeping the model in the loop instead of the call vanishing with no feedback (today's behavior for anything other than `persist_task_plan`).

3. **Generalized required-tool nudging** — `requiredSuccessfulTool.ts`'s `isSuccessfulRequiredToolResult` / `buildRequiredToolNudgeMessage` currently branch on the literal string `persist_task_plan` and its bespoke `taskPlanInstanceId` success marker. Generalized to parse the **standard error payload**:

   ```typescript
   const isSuccessfulRequiredToolResult = ({ content }: { content: string }): boolean => {
     const parsed = tryParseJson(content) as { code?: string; error?: string } | null;
     if (parsed?.code || parsed?.error) {
       return false; // any standard error payload = not successful, regardless of tool
     }
     return content.trim().length > 0;
   };

   const buildRequiredToolNudgeMessage = ({ requiredSuccessfulToolName, executedToolResults }) => {
     const lastAttempt = findLastAttempt({ toolName: requiredSuccessfulToolName, executedToolResults });
     const parsed = lastAttempt ? (tryParseJson(lastAttempt.content) as ToolInputErrorPayload | null) : null;

     if (parsed?.missingFields?.length) {
       return `${requiredSuccessfulToolName} failed: ${parsed.error}. ${parsed.hint ?? ''} Do not reply with prose until it succeeds.`;
     }

     return `You must call ${requiredSuccessfulToolName} successfully before finishing.`;
   };
   ```

   This keeps `persist_task_plan`'s existing behavior (still the only tool passed as `requireSuccessfulToolLlmName` today) while making the mechanism reusable for any future required tool without new hardcoded branches — a direct answer to "extend beyond `persist_task_plan`" without expanding the loop's public API.

### Per-tool normalizer priority

| Priority | Tools | Rationale |
|---|---|---|
| **P0** | `use_agent` (`agent-use`), `run_skill_script` (`skill-run-script`) | Highest blast radius: `use_agent` sits on the recursive delegation path (nested `runAgentInvokeWithTools` calls) — a shape failure here wastes an entire nested agent invocation (tokens + latency) before the caller even learns the call failed, and its two fields (`name`, `agentPrompt`) are both required with zero coercible shape (only null/stringified-JSON envelope risk). `run_skill_script` executes in an isolated sandbox — malformed `input`/`env`/`args` (LLM sending `null` instead of omitting, or a JSON-string blob for `input`) either crashes the sandbox invocation or silently runs with wrong arguments; both are expensive to retry and currently invisible to the model. |
| **P1** | `create_skill` (`skill-create`), `update_task` (`task-update`), `invoke_skill_planner` (`skill-plan`) | Mutate durable, cross-task state (skills, task metadata) — shape bugs here are hard to unwind. `create_skill`'s `scripts`/`usesSkillIds` already declare `.optional().default([])` in Zod, but Zod v3 `.default()` only fires on `undefined`, **not** `null` — an LLM sending `scripts: null` throws today instead of defaulting; this is a pure shape-coercion fix, not a required-field question. `update_task.category` needs the same null-to-undefined treatment. `invoke_skill_planner.specializationId` is optional and prone to `null`/empty-string confusion from nested worker callers. |
| **P2** | `list_agents` (`agent-list`), `ask_user` (`user-ask`), `web_search` (`web-search`), `web_page_content` (`web-page-content`), `classify_specialization` (`specialization-classify`), `create_specialization` (`specialization-create`), `resolve_skill` (`skill-resolve`), `persist_task_plan` (`task-plan-persist`) | Lower risk: `list_agents`/`ask_user`/`web_*` have simple or empty schemas with little coercible surface; `classify_specialization`/`create_specialization`/`resolve_skill` are lower call frequency; `persist_task_plan` already has the gold-standard implementation and only needs to be re-wired onto the shared `normalizeToolInput` facade (its bespoke `normalizePersistTaskPlanInput` becomes the reference `shapeCoercion` config, not new logic). |

### Registry ↔ Zod schema sync — single source of truth + CI consistency test

`INTERNAL_TOOL_IDS` (`packages/constants/src/internalTools/registry.ts`) is the canonical id list. Two independent consistency tests — one per package that can legally depend on `constants` — assert every other map has exactly the same keys, without violating the "services never import `client-langchain`" rule or an inverted `client-langchain → services` dependency:

```typescript
// packages/client-langchain/src/internalTools/normalization/toolNormalizers.test.ts
import { INTERNAL_TOOL_IDS } from '@vassembly/constants';
import { TOOL_NORMALIZERS } from './toolNormalizers';
import { INTERNAL_TOOL_SCHEMAS } from '../buildInternalTools';

it('has a normalizer and schema for every registered internal tool id', () => {
  expect(Object.keys(TOOL_NORMALIZERS).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
  expect(Object.keys(INTERNAL_TOOL_SCHEMAS).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
});
```

```typescript
// services/agent/src/internalTools/createInternalToolHandlers.test.ts (extend existing)
import { INTERNAL_TOOL_IDS } from '@vassembly/constants';
import { createInternalToolHandlers } from './createInternalToolHandlers';

it('registers a handler for every internal tool id', () => {
  const handlers = createInternalToolHandlers({ toolContext: mockToolContext });
  expect(Object.keys(handlers).sort()).toEqual([...INTERNAL_TOOL_IDS].sort());
});
```

Both tests already exist in spirit (`buildInternalTools` silently drops unknown ids into `skippedToolIds`); this makes drift a **build-time test failure** instead of a **silent runtime skip**.

### MCP thin layer — `normalizeMcpToolInput.ts`

**File:** `packages/client-langchain/src/mcp/normalizeMcpToolInput.ts`

External MCP schemas are opaque — we cannot know their required fields, so we cannot build a `missingFields` list for them. The MCP layer is intentionally **thin**: best-effort JSON repair (reusing the promoted `repairLlmJson` utility from `@vassembly/validation`) plus an enriched, structured `ToolMessage` on failure instead of a raw stack-trace string.

```typescript
export const normalizeMcpToolInput = ({ raw }: { raw: unknown }): unknown => {
  if (typeof raw !== 'string') {
    return raw;
  }

  const direct = tryParseJson({ raw });
  if (direct !== null) {
    return direct;
  }

  const repaired = repairLlmJson({ raw });
  const repairedParsed = tryParseJson({ raw: repaired });

  return repairedParsed ?? raw; // fall through to the MCP server's own validation error
};
```

`runToolCallLoop.ts`'s tool-execution catch block (currently returns `error.message` verbatim as `ToolMessage` content) is extended so MCP-bound tool calls (`toolNameToServerName.has(toolCall.name)`) wrap the caught error into the standard payload:

```typescript
{
  "error": "MCP tool \"search_docs\" (server: docs) rejected the arguments",
  "code": "MCP_TOOL_ERROR",
  "hint": "Original error: <server error message>. Re-check the argument shape against the tool's schema and retry."
}
```

This gives the model the same "keep trying with corrected shape" signal for external tools as it gets for internal ones, without requiring us to know or enforce the external tool's required fields.

---

## Zod v3 → v4 migration plan for `client-langchain`

**Not a blocker for Phases 1–5.** All shared coercion utilities are Zod-version-agnostic by design (see above), so normalization ships fully functional on Zod v3.

| Step | Work | Gate |
|---|---|---|
| 1. Compatibility spike | Verify `@langchain/core@^0.3.80`, `@langchain/anthropic`, `@langchain/openai`, `@langchain/google-genai`, `@langchain/mcp-adapters@^0.5.0` accept Zod v4 `ZodObject` instances in `DynamicStructuredTool`/`bindTools` (LangChain's own Zod-version support matrix must be checked against the installed versions — this is an **external dependency risk**, not something this repo controls) | Must confirm before any schema file changes |
| 2. Bump `zod` to `^4.x` in `packages/client-langchain/package.json` | Single dependency bump; no code changes required if v4 is a drop-in for the subset of Zod API surface used (`z.object`, `z.string`, `z.array`, `z.record`, `z.enum`, `.optional()`, `.default()`, `.min()`, `.max()`) | Step 1 passes |
| 3. Migrate the 14 schema files under `internalTools/schemas/*.ts` | Mechanical — Zod v3→v4 API is source-compatible for the subset in use; re-run full test suite | Step 2 lands |
| 4. Adopt `@vassembly/validation`'s `validatorFactory`/`getValidatorIssues` directly in `normalizeToolInput` in place of the hand-rolled `safeParse` + `buildMissingFieldsErrorPayload` call, now that both packages share Zod v4 `ZodError` identity | Step 3 lands |
| 5. Retire the version-agnostic `ToolInputIssueLike` shim in favor of `@vassembly/validation`'s native `z.ZodIssue[]` typing (optional cleanup — the shim can also stay indefinitely since it costs nothing) | Step 4 lands |

This plan is sequenced as **Phase 6** below and is explicitly allowed to slip without blocking the normalization feature itself.

---

## Recommendation

**Most conservative approach:** Promote the existing `persist_task_plan` coercion pattern into shared, Zod-version-agnostic primitives in `@vassembly/validation`; build one Strategy map (`TOOL_NORMALIZERS`) and one Facade (`normalizeToolInput`) in `client-langchain` keyed by the same tool ids already used by `INTERNAL_TOOL_SCHEMAS`; wrap every handler in `services/agent` with one Decorator (`withNormalizedInput`); generalize the two existing `persist_task_plan`-specific mechanisms in `runToolCallLoop.ts` (`invalid_tool_calls` recovery, required-tool nudging) to be data-driven off the standard error payload instead of adding tool-specific branches. No new packages, no new domains, no Zod major-version bump required to ship.

**Trade-offs:**

| Decision | Choice | Alternative rejected |
|---|---|---|
| Where coercion utilities live | `@vassembly/validation`, Zod-version-agnostic | Duplicate coercion logic directly in `client-langchain` — rejected: violates "no duplicated code" rule and blocks future reuse by other Zod-v4 consumers |
| Zod v4 adoption timing | Deferred to Phase 6, non-blocking | Forcing Zod v4 bump before shipping normalization — rejected: couples a risk-bearing external-dependency migration to an urgent reliability fix |
| Missing required fields | Structured JSON error returned as `ToolMessage`, loop continues | Throwing and aborting the tool-call loop — rejected: gives the model zero chance to self-correct, directly violates the "force the model to retry" requirement |
| MCP tool required fields | No enforcement (schema is opaque); JSON repair + enriched error only | Attempting to introspect and enforce required fields on arbitrary MCP schemas — rejected: MCP schemas are not owned by this repo, over-engineering with no reliable implementation |
| `invalid_tool_calls` recovery scope | Every tool id with a registered normalizer | Keep `persist_task_plan`-only — rejected: leaves 13 tools' malformed-JSON calls silently dropped with zero model feedback |

---

## Implementation Phases (file-level)

No Phase 0 — all phases are runtime/app scope only.

### Phase 1 — Shared coercion utilities (`@vassembly/validation`)

| File | Action |
|---|---|
| `packages/validation/src/toolInput/types.ts` | **Create** — `ToolInputIssueLike`, `ToolInputErrorPayload`, `ShapeCoercionConfig` |
| `packages/validation/src/toolInput/coerceStringifiedJson.ts` | **Create** |
| `packages/validation/src/toolInput/coerceNullableFields.ts` | **Create** |
| `packages/validation/src/toolInput/coerceArrayDefaults.ts` | **Create** |
| `packages/validation/src/toolInput/coerceNumericFields.ts` | **Create** |
| `packages/validation/src/toolInput/repairLlmJson.ts` | **Create** — generalized from `repairLlmToolArgumentsJson` in `parsePersistTaskPlanInput.ts` |
| `packages/validation/src/toolInput/buildMissingFieldsErrorPayload.ts` | **Create** |
| `packages/validation/src/toolInput/normalizeToolInputShape.ts` | **Create** — facade combining coercers |
| `packages/validation/src/toolInput/index.ts` | **Create** — public exports |
| `packages/validation/src/index.ts` | **Modify** — re-export `toolInput/*` |
| `packages/validation/src/toolInput/*.test.ts` | **Create** — one per coercer + facade |

### Phase 2 — `TOOL_NORMALIZERS` registry + `normalizeToolInput` Facade (`client-langchain`)

| File | Action |
|---|---|
| `packages/client-langchain/src/internalTools/normalization/types.ts` | **Create** — `ToolNormalizer`, `NormalizeToolInputResult` |
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.ts` | **Create** — Strategy map, one entry per tool id (empty `shapeCoercion: {}` default for P2 tools) |
| `packages/client-langchain/src/internalTools/normalization/normalizeToolInput.ts` | **Create** — Facade |
| `packages/client-langchain/src/internalTools/normalization/index.ts` | **Create** |
| `packages/client-langchain/src/internalTools/schemas/parsePersistTaskPlanInput.ts` | **Modify** — reduce to schema export + register its `shapeCoercion` config in `toolNormalizers.ts`; retire bespoke `normalizePersistTaskPlanInput` in favor of the shared facade path |
| `packages/client-langchain/src/index.ts` | **Modify** — export `normalizeToolInput`, `withNormalizedInput` (added Phase 3) for `services/agent` |
| `packages/client-langchain/src/internalTools/normalization/normalizeToolInput.test.ts` | **Create** |
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.test.ts` | **Create** — registry ↔ schema ↔ constants consistency test |

### Phase 3 — Handler wrapper + generalized loop mechanisms

| File | Action |
|---|---|
| `packages/client-langchain/src/internalTools/normalization/withNormalizedInput.ts` | **Create** — Decorator |
| `packages/client-langchain/src/operations/runToolCallLoop.ts` | **Modify** — replace `recoverInvalidPersistTaskPlanCalls` with registry-driven `recoverInvalidToolCalls`; wrap MCP tool-execution errors in standard payload |
| `packages/client-langchain/src/operations/requiredSuccessfulTool.ts` | **Modify** — generalize `isSuccessfulRequiredToolResult` / `buildRequiredToolNudgeMessage` to parse the standard error payload instead of `persist_task_plan`-specific string checks |
| `services/agent/src/internalTools/createInternalToolHandlers.ts` | **Modify** — wrap every handler entry with `withNormalizedInput`; remove the one-off `task-plan-persist` try/catch |
| `packages/client-langchain/src/operations/runToolCallLoop.test.ts` | **Modify/extend** — generalized recovery test cases |
| `packages/client-langchain/src/operations/requiredSuccessfulTool.test.ts` | **Modify/extend** |
| `services/agent/src/internalTools/createInternalToolHandlers.test.ts` | **Modify/extend** — consistency test (Phase 2 registry test) + normalization-error passthrough case |

### Phase 4 — Per-tool normalizer rollout (P0 → P1 → P2)

| File | Action |
|---|---|
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.ts` | **Modify** — add `shapeCoercion` config for `agent-use`, `skill-run-script` (P0) |
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.ts` | **Modify** — add `shapeCoercion` config for `skill-create`, `task-update`, `skill-plan` (P1) |
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.ts` | **Modify** — add `shapeCoercion` config (mostly empty/no-op) for remaining P2 tools: `agent-list`, `user-ask`, `web-search`, `web-page-content`, `specialization-classify`, `specialization-create`, `skill-resolve`, `task-plan-persist` |
| `packages/client-langchain/src/internalTools/normalization/toolNormalizers.test.ts` | **Modify** — corrupted-fixture cases per P0/P1 tool (see Test Strategy) |

### Phase 5 — MCP thin layer

| File | Action |
|---|---|
| `packages/client-langchain/src/mcp/normalizeMcpToolInput.ts` | **Create** |
| `packages/client-langchain/src/mcp/normalizeMcpToolInput.test.ts` | **Create** |
| `packages/client-langchain/src/operations/runToolCallLoop.ts` | **Modify** — apply `normalizeMcpToolInput` before invoking MCP-bound tools; wrap failures in `MCP_TOOL_ERROR` payload (may already be touched in Phase 3 — same file, additive change) |
| `packages/client-langchain/src/operations/runToolCallLoop.test.ts` | **Modify/extend** — MCP repair + enriched-error test cases |

### Phase 6 — Zod v3 → v4 migration for `client-langchain` (non-blocking)

| File | Action |
|---|---|
| *(spike, no file changes)* | Confirm `@langchain/core`, `@langchain/anthropic`, `@langchain/openai`, `@langchain/google-genai`, `@langchain/mcp-adapters` Zod v4 support at currently pinned versions |
| `packages/client-langchain/package.json` | **Modify** — bump `zod` to `^4.x` (only after spike passes) |
| `packages/client-langchain/src/internalTools/schemas/*.ts` (14 files) | **Modify** — mechanical Zod v3→v4 syntax pass |
| `packages/client-langchain/src/internalTools/normalization/normalizeToolInput.ts` | **Modify** — adopt `@vassembly/validation`'s `validatorFactory`/`getValidatorIssues` directly |
| `packages/validation/src/toolInput/*.ts` | **No change required** — already Zod-agnostic; stays valid post-migration |

---

## Test Strategy

| Layer | File | Cases |
|---|---|---|
| **Coercion primitives** | `packages/validation/src/toolInput/*.test.ts` | Stringified JSON parse; malformed JSON repair; `null`/`"none"`/`"null"` → `undefined`/`null`; missing optional array → `[]`; numeric string → number; pass-through when already correct shape |
| **Corrupted-LLM fixtures per tool** | `packages/client-langchain/src/internalTools/normalization/toolNormalizers.test.ts` (or per-tool `*.test.ts` colocated with each normalizer entry) | For each P0/P1 tool: (1) well-formed input passes unchanged, (2) stringified-JSON envelope coerces to success, (3) `null` optional field coerces to success, (4) **missing required field returns `MISSING_REQUIRED_FIELDS` with correct `missingFields` list and does not throw** |
| **`runToolCallLoop` recovery** | `packages/client-langchain/src/operations/runToolCallLoop.test.ts` | Malformed `invalid_tool_calls` entry for a *non*-`persist_task_plan` tool is recovered and executed; entry with genuinely missing required data falls through to a structured `ToolMessage` (not silently dropped); MCP-bound tool call gets JSON-repaired; MCP failure returns `MCP_TOOL_ERROR` payload |
| **Required-tool nudging** | `packages/client-langchain/src/operations/requiredSuccessfulTool.test.ts` | Nudge message includes `missingFields` from the last failed structured payload; loop continues (not marked successful) when payload has `code`/`error`; existing `persist_task_plan` behavior unchanged |
| **Handler wrapper** | `services/agent/src/internalTools/createInternalToolHandlers.test.ts` | `withNormalizedInput` returns the handler's result unchanged on valid input; returns `JSON.stringify(errorPayload)` (never throws) on invalid input; handler function itself is never invoked when normalization fails |
| **Registry ↔ schema consistency (CI)** | `packages/client-langchain/src/internalTools/normalization/toolNormalizers.test.ts`, `services/agent/src/internalTools/createInternalToolHandlers.test.ts` | `TOOL_NORMALIZERS`, `INTERNAL_TOOL_SCHEMAS`, and the handler map each expose exactly `INTERNAL_TOOL_IDS` from `@vassembly/constants` — fails the build on any drift |

---

## Todo Plan

1. **`@vassembly/validation`** — [Type: extend utility]
   - Changes needed: Zod-agnostic shape-coercion primitives + standard error payload builder
   - Files to modify/create: `src/toolInput/**` (Phase 1 table)
   - Suggested subagent workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (loop: max 2 iterations) → `documentation-writer`
   - Dependencies: None

2. **`@vassembly/client-langchain`** (normalization core) — [Type: extend package]
   - Changes needed: `TOOL_NORMALIZERS` Strategy map, `normalizeToolInput` Facade, `withNormalizedInput` Decorator, generalized `runToolCallLoop` recovery + nudging
   - Files to modify/create: Phase 2 + Phase 3 tables (excluding `services/agent` files)
   - Suggested subagent workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (loop: max 2 iterations) → `documentation-writer`
   - Dependencies: Todo 1

3. **`services/agent`** (handler wiring) — [Type: extend service]
   - Changes needed: Wrap all `createInternalToolHandlers.ts` entries with `withNormalizedInput`; remove bespoke `task-plan-persist` try/catch
   - Files to modify/create: `src/internalTools/createInternalToolHandlers.ts`, `createInternalToolHandlers.test.ts`
   - Suggested subagent workflow: `coder` ↔ `code-reviewer` (loop: max 2 iterations)
   - Dependencies: Todo 2

4. **`@vassembly/client-langchain`** (per-tool rollout P0/P1/P2) — [Type: extend package]
   - Changes needed: Populate `shapeCoercion` configs per tool priority tier; corrupted-fixture tests per tool
   - Files to modify/create: Phase 4 table
   - Suggested subagent workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (loop: max 2 iterations)
   - Dependencies: Todo 2, Todo 3

5. **`@vassembly/client-langchain`** (MCP thin layer) — [Type: extend package]
   - Changes needed: `normalizeMcpToolInput.ts` (JSON repair) + enriched `MCP_TOOL_ERROR` on tool-execution failure in `runToolCallLoop.ts`
   - Files to modify/create: Phase 5 table
   - Suggested subagent workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (loop: max 2 iterations)
   - Dependencies: Todo 2 (shares `runToolCallLoop.ts`; sequence after Todo 3 lands to avoid merge conflicts)

6. **`@vassembly/client-langchain`** (Zod v3→v4 migration spike) — [Type: technical debt / migration]
   - Changes needed: Confirm LangChain package Zod v4 compatibility; if confirmed, bump dependency and migrate 14 schema files; adopt `@vassembly/validation`'s native Zod-v4 helpers
   - Files to modify/create: Phase 6 table
   - Suggested subagent workflow: `coder` → `code-reviewer` (spike + mechanical migration; no new tests needed beyond existing suite passing)
   - Dependencies: Todos 1–5 (non-blocking; can start independently but should not land before Todo 4 to avoid rebasing 14 schema files mid-rollout)

---

*Ready for phased implementation. Phases 1–3 establish the mechanism; Phase 4 rolls it out by risk tier (P0 → P1 → P2); Phase 5 extends the same JSON-repair primitive to MCP; Phase 6 is an optional, non-blocking cleanup once LangChain's Zod v4 support is confirmed.*
