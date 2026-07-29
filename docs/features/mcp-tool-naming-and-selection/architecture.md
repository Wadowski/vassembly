# MCP Tool Naming and Selection — Architecture

**Ticket type:** Technical ticket (bug fix / hardening on top of the already-shipped `mcp-usage-tracking` feature). Persisted to `docs/features/mcp-tool-naming-and-selection/architecture.md` per explicit user request; treat as a technical plan, not a new product feature with its own PRD.

**Status:** Ready for implementation planning

**Related:** [mcp-usage-tracking/architecture.md](../mcp-usage-tracking/architecture.md) (this doc extends, not replaces, that design)

---

## 1. Architecture Overview

### 1.1 Problem recap

1. **Wrong MCP selection** — an agent asked to use Notion sometimes calls Wikipedia instead, when both MCPs are assigned to the specialization.
2. **Opaque activity display** — Activity rows show `mcp__6a687eda282888c80d162f8b__list_registries` instead of `wikipedia-mcp - list-registries`.

Both symptoms trace back to the same root cause: **the runtime tool identifier the LLM sees and the identifier persisted for display is `mcp__{mcpId}__{originalToolName}`, where `mcpId` is an opaque Mongo ObjectId, not a human/semantic label.** Everything downstream (LLM tool selection, activity feed rendering) inherits that opacity.

### 1.2 Reuse map (audit result)

| Need | Existing precedent reused | Why it fits |
|---|---|---|
| "Compute a human-readable `{scope} - {action}` label" | `packages/constants/src/internalTools/formatInternalToolName.ts` → `formatInternalToolDisplayName({ domain, action })`, already produces exactly the `wikipedia-mcp - list-registries` shape the PRD-equivalent ask wants (`agent - list`, `task - update`, etc.) | Zero new formatting logic needed — this function's signature is already generic (`domain`/`action`), it's only used for internal tools today by convention, not by type constraint. |
| "Store a precomputed display name alongside the raw identifier, fall back gracefully when absent" | `domains/internal-tool-usage` already does exactly this: `InternalToolUsageEventModel.internalToolDisplayName` is computed once at record time (`createRecordInternalToolUsageEvent.ts` calls `getInternalToolById(...).displayName`) and stored net to `toolName`; `getToolInvocationDisplayName` already prefers `internalToolDisplayName ?? toolName` | `domains/mcp-usage` is the sibling domain for MCP tool calls — same two-phase (`started`/`completed`) command shape, same `McpUsageEventModel` next to `InternalToolUsageEventModel`. Adding one more optional field (`toolDisplayName`) is a pure extension of an existing, working pattern — not a new mechanism. |
| "Resolve `mcpId → mcpSlug` for display" | `services/task/src/handlers/executeTask/createRecordMcpUsageEvent.ts` already calls `mcpDomain.queries.getModelById({ id: input.mcpId })` and stores `mcpSlug` on every event | No new resolution step — `mcpSlug` is already available at exactly the point where the display name needs to be computed. |
| "Capture the tool's owning server without parsing an opaque joined string" | `packages/client-langchain/src/mcp/loadMcpTools.ts` already builds `toolNameToServerName: Map<string, string>` by calling `client.getTools(serverName)` **per server**, one server at a time | The per-server loop already exists — extending it to also capture the pre-prefix (`originalToolName`) is additive to code that's already iterating tool-by-tool, no new traversal needed. |
| "Thread a per-tool-call event through the invoke pipeline" | `RecordMcpUsageEvent` / `McpToolCallRecordInput` already threaded `packages/client-langchain → domains/agent → services/agent → services/task` (see mcp-usage-tracking §3.1) | Same channel carries the one new field (`originalToolName`) — no new plumbing layer. |
| "Rank/gate which MCPs are visible to an agent" | `services/agent/src/helpers/resolveSpecializationMcpIds.ts` (specialization → all linked MCP ids), `resolveMcpConfigs` in `runAgentInvokeWithTools.ts` (drops unconfigured MCPs into `skippedMcpIds`) | Selection-accuracy options (§4) all extend this existing filtering step; no new "MCP resolution" concept is introduced. |
| "Classify natural-language intent against a catalog with an LLM" | `services/agent/src/internalTools/createSpecialization/mapMcpsToSpecialization.ts` already runs a dedicated system agent (`SYSTEM_AGENT_NAME.McpSpecializationClassifier`) to match MCPs to a specialization from a text catalog | If intent-based filtering (§4.2) is ever built, it reuses this exact "small classifier agent over a text catalog" pattern instead of inventing a new classification mechanism. |

### 1.3 Design patterns applied

- **Adapter** (extended, not replaced): `loadMcpTools.ts` already adapts `MultiServerMCPClient` → `DynamicStructuredTool[]` + `toolNameToServerName`. It is extended to also adapt/enrich the *description* of each tool (see §4.1) and to capture `originalToolName` per tool — the adapter's job (translating a third-party shape into vassembly's shape) doesn't change, only what it captures.
- **Decorator**: enriching each `DynamicStructuredTool`'s `description` with an MCP-identity hint at load time is a decorator around the tool object, matching the existing catalog note "wrapping handlers/clients with logging/retry/metrics" — here it's "wrapping a tool definition with a disambiguation hint," same shape of change, zero effect on `tool.invoke` behavior.
- **Facade**: `createRecordMcpUsageEvent.ts` (already a facade over `mcpDomain` + `mcpUsageDomain`) gains one more line (compute `toolDisplayName`) — the facade boundary is unchanged.
- **Strategy (map object)**: the row-title fallback chain in `getToolInvocationRowDisplay.ts` (`toolDisplayName ?? internalToolDisplayName ?? toolName ?? mcpName`) is an explicit priority list, not branching `if/else` — kept as a flat expression, no new abstraction warranted (YAGNI: a "Strategy map" would add indirection for a 4-item fallback with no runtime-pluggable behavior).
- **Command**: `domains/mcp-usage/src/commands/recordUsageEvent` stays a single command; the new field is additive to its existing Zod schema, not a new command.
- **No new pattern for MCP selection in this pass**: §4 deliberately keeps the recommended first step (tool description enrichment) pattern-free — it's a data change (`description` string), not new control flow. If a future phase adds intent-based filtering, that becomes a new **Strategy** (`mcpSelectionMode → selection function` map) so the classifier-based and prioritization-based approaches can coexist behind a switch — flagged as a *future* pattern, not implemented now.

### 1.4 Scope boundary (what this ticket does NOT touch)

- The `mapMcpsToSpecialization` LLM classifier's *assignment* accuracy (why both Wikipedia and Notion get linked to a specialization in the first place) is a separate, pre-existing concern (prompt/classifier tuning at specialization-creation time). This document only fixes what happens **after** both are already assigned and loaded as tools for one invocation. Flagged under §7 as an out-of-scope follow-up.
- No change to `MultiServerMCPClient`'s transport/connection handling, credential resolution (`genericAdapter.ts`'s header-building logic), or the `resolveMcpServerConfigs` skip-when-unconfigured behavior.

---

## 2. Problem Area A — Human-Readable Tool Naming & Display (quick win)

### 2.1 Root cause detail

- `@langchain/mcp-adapters` defaults (`additionalToolNamePrefix: 'mcp'`, `prefixToolNameWithServerName: true`) produce `mcp__{serverName}__{originalToolName}`.
- Vassembly sets `serverName = mcpId` (`domains/user-mcp-config/.../adapters/genericAdapter.ts:26,49`) — a Mongo ObjectId, chosen because `mcpId` is the stable identity threaded everywhere downstream (`toolNameToServerName` → `McpToolCallRecordStartedInput.mcpId` → `McpUsageEventModel.mcpId` → Mongo joins, retention TTL keyed off it, etc.).
- `loadMcpTools.ts` never overrides the adapter's naming/prefix options, so the LLM-facing tool name **and** the persisted `McpUsageEventModel.toolName` are both the raw opaque string.
- `getToolInvocationDisplayName` (`apps/web/.../getToolInvocationRowDisplay.ts:20-26`) already has a fallback chain for internal tools (`internalToolDisplayName ?? toolName`) but for MCP items falls through to `item.toolName ?? item.mcpName` — i.e. it picks the **opaque raw name first**, only falling back to the (already-resolved!) `mcpName` if `toolName` is somehow empty. `mcpSlug`/`mcpName` is stored and shown in the expanded "Source" field, never composed into the row title.

### 2.2 Decision: `toolDisplayName` field vs. `mcpSlug`-as-`serverName`

The ticket asks to weigh two options. Recommendation: **store `toolDisplayName` at record time**, do **not** change `serverName` to `mcpSlug`.

| | Option A — `toolDisplayName` at record time (recommended) | Option B — use `mcpSlug` as `serverName` |
|---|---|---|
| What changes | New field on `McpUsageEventModel`/DTO/GraphQL/UI only. `toolCall.name` seen by the LLM is **unchanged**. | `genericAdapter.ts` sets `serverName: slug` instead of `mcpId`; `toolCall.name` becomes `mcp__{slug}__{tool}` everywhere, including in LLM context and in every layer that currently treats "`serverName` = `mcpId`" as an identity invariant. |
| Blast radius | `domains/mcp-usage` (1 field), `packages/client-langchain` (thread one extra string), `services/task` (1 line), `apps/api`/`ui/api-hooks`/`apps/web` (1 field passthrough). | `McpServerConfig` type, `loadMcpTools.ts`, `resolveMcpServerConfigs`/`genericAdapter.ts`, every place that reads `toolNameToServerName.get(name)` and assumes the value is a valid `mcpId` for a domain lookup (`recordMcpToolCall`, `createRecordMcpUsageEvent.ts`, Mongo `mcpId` field itself) — all would need a parallel `slug → mcpId` reverse map threaded alongside. |
| Risk to in-flight/resumed conversations | None — no identifier used in persisted chat/tool-call message history changes shape. | **High**: `mcpId`-shaped `serverName` is embedded in `tool.name`, which is echoed back into `tool_calls`/`ToolMessage` history. A resumed or multi-turn conversation whose stored messages reference `mcp__{oldMcpId}__tool` would silently fail to match if a later turn re-loads tools keyed by `slug` (e.g. after a slug rename, or before/after this change ships mid-conversation). |
| Uniqueness guarantee | N/A (display-only) | Relies on `slug` being unique and immutable per MCP catalog entry — true today (`domains/mcp/src/model/model.ts: slug!: string`), but not enforced as a *tool-identity* invariant anywhere; a future slug-edit feature would become a breaking change for tool-name identity. |
| Does it also help selection (Problem B)? | No, by itself — it only fixes display. Paired with §4.1 (description enrichment) it indirectly helps selection without touching `tool.name`. | Yes, directly — the LLM would see semantically meaningful names. This is real upside, but not worth the blast radius/risk above for a first pass. |

**Recommendation**: ship Option A now (isolated, backward-compatible, mirrors the already-shipped `internal-tool-usage` pattern exactly). Option B is documented here as a rejected-for-now alternative; revisit only if description enrichment (§4.1) proves insufficient for selection accuracy, and only as a deliberate, separately-risk-assessed change (not bundled with the display fix).

### 2.3 Implementation outline (package boundaries)

| Layer | File | Change |
|---|---|---|
| `packages/client-langchain` | `src/mcp/loadMcpTools.ts` | Extend `toolNameToServerName: Map<string, string>` capture in `loadToolsForServer`/the per-server loop to also capture the **pre-prefix** tool name. Since tools are already fetched one server at a time (`client.getTools(serverName)`), and the library performs prefixing internally before returning, the robust approach is to disable the library's own prefixing for the per-server fetch call (`prefixToolNameWithServerName: false` scoped to that call) and apply vassembly's own, single, well-known join (`mcp__{serverName}__{originalName}`) when registering into the returned map — this yields the **identical final tool name string as today** (no behavior change to `tool.name`), but now the original, unprefixed name is captured as a first-class value instead of needing to be recovered later by parsing. Change the map's value type from `string` to `{ mcpId: string; originalToolName: string }` (or add a sibling `toolNameToOriginalName: Map<string, string>` if a narrower diff is preferred — either is acceptable, sibling map is the smaller diff). |
| `packages/client-langchain` | `src/mcp/recordMcpToolCall.ts` | Add `originalToolName: string` to `McpToolCallRecordStartedInput`. |
| `packages/client-langchain` | `src/operations/runToolCallLoop.ts` | In `startToolRecording`, look up `originalToolName` from the new map alongside `mcpId` and pass it through to `recordMcpToolCall`. |
| `services/agent` | `src/internalTools/types.ts` (`RecordMcpUsageEvent`/`McpToolCallEvent`-equivalent, currently re-exported as `RecordMcpUsageEventInput`) | Add `originalToolName` to the started-phase input type, passed through unchanged in `buildRecordMcpToolCall` (`runAgentInvokeWithTools.ts:157-182` already just spreads `...input`, no change needed there beyond the type). |
| `services/task` | `src/handlers/executeTask/createRecordMcpUsageEvent.ts` | After resolving `mcpSlug` (already done, line 15), compute `toolDisplayName = formatToolDisplayName({ domain: mcpSlug ?? input.mcpId, action: input.originalToolName })` and pass it into `mcpUsageDomain.commands.recordUsageEvent(...)`. Falls back to `mcpId` as the domain label when `mcpSlug` is unavailable (deleted/renamed MCP edge case — same pattern the `mcp-usage-tracking` doc already established for `mcpSlug` itself). |
| `packages/constants` | `src/internalTools/formatInternalToolName.ts` | Add a generic-named export `formatToolDisplayName` (identical implementation to `formatInternalToolDisplayName`) so the MCP call site doesn't read oddly as "internal tool" formatting; keep `formatInternalToolDisplayName` as-is (alias or re-export) so no existing call site changes. One function, two names, zero duplicated logic. |
| `domains/mcp-usage` | `src/model/model.ts`, `dto.ts`, `toMcpUsageEventResponse.ts`, `graphql.ts` | Add `toolDisplayName?: string \| null` end-to-end (model → DTO → mapper → GraphQL field), same additive pattern already used for `mcpSlug`. |
| `domains/mcp-usage` | `src/commands/recordUsageEvent` (wherever the started-phase Zod schema and Mongo insert live, mirroring `domains/internal-tool-usage/src/commands/recordUsageEvent/index.ts:13-26,44-63`) | Accept optional `toolDisplayName` in the started schema, persist it (`null` when absent) exactly like `internalToolDisplayName` is persisted today. |
| `services/task` | `src/handlers/getTaskActivityTimeline/mapMcpUsageEventsToTimelineItems.ts`, `types.ts` | Add `toolDisplayName: event.toolDisplayName ?? undefined` to the mapped `TaskActivityMcpInvocationItem`, add the field to `types.ts`. |
| `apps/api` | `src/graphql/resolvers/taskActivity.ts` | Add `toolDisplayName: t.exposeString('toolDisplayName', { nullable: true })`, sibling to the existing `internalToolDisplayName` line (53). |
| `ui/api-hooks` | `src/tasks/graphql/getTaskActivityTimelineQuery.ts`, `mapTaskActivityTimeline.ts` | Add `toolDisplayName` field to the query document and `TaskActivityItemDto`. |
| `ui/api-hooks` | MCP usage history query/hook (`GET_MCP_USAGE_HISTORY_QUERY.ts`, `domains/mcp-usage/src/model/graphql.ts`) | Same additive field for the MCP Detail Page history list, for consistency (not strictly required by the reported bug, but the same opacity exists there — cheap to fix in the same pass since the field is added at the domain level anyway). |
| `apps/web` | `app/tasks/[id]/_components/TaskActivityFeed/activityMcpInvocationRow/getToolInvocationRowDisplay.ts` | Change line 25 from `item.toolName ?? item.mcpName ?? 'Tool'` to `item.toolDisplayName ?? item.toolName ?? item.mcpName ?? 'Tool'`. Also update `getToolInvocationSourceLabel` (line 75) is unaffected — it already prefers `mcpName`, keep as-is. |

### 2.4 Backward compatibility for existing usage records

Existing `mcpUsageEvents` documents (written before this change ships) have `toolName` = the opaque `mcp__{mcpId}__{tool}` string and already have `mcpSlug` populated (added in the original `mcp-usage-tracking` pass), but **no** `toolDisplayName`.

- **No migration required for correctness.** The UI fallback chain (`toolDisplayName ?? toolName ?? mcpName`) already degrades gracefully — old rows keep showing the opaque name until they age out via the existing 90-day TTL retention (`RETENTION_SECONDS`, `mcp-usage-tracking/architecture.md §8`), which is an acceptable bound for a display-only cosmetic gap.
- **Optional one-off backfill** (recommended if the opaque names are visible for long enough to bother users before TTL expiry): a small script under `domains/mcp-usage` (or a one-time `scripts/` entry, following whatever precedent exists for one-off backfills in this repo) that:
  1. Scans `mcpUsageEvents` where `toolDisplayName` is absent and `mcpSlug` is present.
  2. Derives `originalToolName` from the legacy `toolName` by stripping the known, fixed prefix pattern `mcp__{mcpId}__` (safe to do here — and only here, as a best-effort backfill, not as a runtime dependency — because `mcpId` is a known, fixed-format Mongo ObjectId already stored on the same document, so the split point is unambiguous: strip `mcp__{event.mcpId}__` as a literal prefix rather than a general regex).
  3. Sets `toolDisplayName = formatToolDisplayName({ domain: mcpSlug, action: derivedOriginalToolName })` via `$set`.
  - This backfill is **optional** and explicitly deferred — call out as a follow-up task, not a blocking phase, per "keep scope minimal."

---

## 3. Problem Area B — MCP Selection Accuracy

### 3.1 Root cause detail

- There is no server-side MCP router: `runAgentInvokeWithTools` → `invokePersonalAgent`/`invokeSystemAgent` load **every** MCP linked to the agent/specialization (`resolveSpecializationMcpIds` returns *all* linked ids, `resolveMcpConfigs` builds a server config for each one that has valid credentials) and hand **all** their tools to `runToolCallLoop`/`model.bindTools`. Tool **selection** is entirely delegated to the LLM's own function-calling judgment.
- Wikipedia requires no credentials (`genericAdapter.ts` `mapping.kind === 'none'` path always succeeds), so it is *never* skipped. Notion requires a token; if unconfigured, `resolveMcpServerConfigs` skips it (`config.enabled` / missing field values → `skippedMcpIds`) — but when Notion **is** configured, both tools remain simultaneously bound, and the model has no naming signal to prefer one over the other for a given request.
- Today's opaque tool names (`mcp__{mcpId}__...`) give the LLM literally zero semantic signal to disambiguate — every tool description is written by the third-party MCP server itself and may not mention which product/service it represents by a name the user used in their instruction (e.g. a Notion tool's description may say "search pages" without ever saying "Notion").

### 3.2 Options, ranked by complexity

#### Option 1 — Tool description enrichment (lowest complexity, recommended first)

Decorate each loaded tool's `description` at load time with an explicit MCP-identity prefix, e.g. `"[Notion MCP] " + tool.description`, computed in `loadMcpTools.ts` using the already-resolved `mcpSlug`/name (today only `mcpId` flows into `McpServerConfig`; add an optional `label` field — see below — populated from the same `slug` that `resolveMcpConfigs` already looks up via `resolveMcpRuntimeMetadata` before calling `resolveMcpServerConfigs`).

- **What changes**: `McpServerConfig` gains an optional `label?: string` (the display name, e.g. `slug`), threaded from `services/agent/resolveMcpConfigs` → `userMcpConfigDomain.commands.resolveMcpServerConfigs` (which already receives `slug` per `mcpId` in its input, per `types.ts:13`, but currently discards it, only using it to pick a credential adapter) → `McpServerConfig.label`. `loadMcpTools.ts` clones each `DynamicStructuredTool` returned for a server with `description: `[${label}] ${tool.description}`` before adding it to the `tools[]` array — a Decorator around the tool object, `tool.name`/`tool.invoke`/`tool.schema` untouched.
- **Why lowest risk**: never touches `tool.name` (no resumed-conversation risk, per §2.2's Option B analysis), no schema/domain changes, no extra LLM calls, no added latency beyond one string concat per tool at load time (already O(tools) work).
- **Expected effect**: gives the model the same kind of signal a human would use ("the user said Notion, and this tool is literally labeled `[Notion MCP]`") without any new infrastructure.
- **Limitation**: still probabilistic — an LLM can still pick the wrong tool. This is a strict improvement, not a guarantee.

#### Option 2 — Intent-based filtering (medium complexity)

Before binding tools for a given user message, run a lightweight pre-filter that ranks the assigned MCPs against the incoming message/task intent and only binds tools from the top-ranked MCP(s) — reusing the exact "small classifier system-agent over a text catalog" pattern already implemented in `mapMcpsToSpecialization.ts` (which classifies MCPs against a specialization's *name/description*; this would classify against the *current message* instead).

- **New service-layer helper**: `services/agent/src/helpers/selectRelevantMcpIds.ts`, sibling to `resolveSpecializationMcpIds.ts`, called from `invokeSystemAgent`/`invokePersonalAgent` right after `resolveSpecializationMcpIds`/`agent.assignedMcpIds` resolve the *full* candidate list, narrowing it before `resolveMcpConfigs` builds server configs.
- **Facade**: wraps a `runAgentInvokeWithTools`-style call to a new or existing lightweight classifier agent (reuse `SYSTEM_AGENT_NAME.McpSpecializationClassifier`'s pattern, or a new sibling system agent) with `credentialScope: 'platform'` like `mapMcpsToSpecialization` does.
- **Cost**: one extra LLM round-trip per user message (latency + spend), a new system agent definition if reused agent isn't a good fit for per-message classification prompts, and a decision about failure/timeout behavior (must fail open — i.e. fall back to "bind everything" — never fail closed and silently drop a legitimately-needed MCP).
- **Where it fits as a Strategy**: if built, expose it behind a `mcpSelectionMode` config value so both "always bind everything" (today's behavior) and "intent-filtered" can coexist during rollout — a map object (`Record<'all' | 'intentFiltered', SelectMcpIdsFn>`), not a boolean flag with branching.

#### Option 3 — Specialization MCP prioritization (highest complexity)

Let a specialization's MCP assignment carry an explicit priority/ordering (e.g. "primary" vs. "auxiliary" per linked MCP), then bias both tool binding order and the system prompt (e.g. inject "Prefer the primary MCP(s) below unless the user explicitly asks for another service") based on that ranking.

- **Requires a schema change**: `domains/mcp`'s specialization-link data (wherever `addSpecializationId`/`getList({ specializationId })` store the association) needs an extra field (priority/rank), which is a domain model + migration change, not just a service-layer helper.
- **Requires a product decision**: is priority manually set by an admin (new UI), inferred from `mapMcpsToSpecialization`'s classifier confidence score (would require capturing and storing that score, which it doesn't today), or something else? This is the most powerful lever (deterministic bias vs. probabilistic classification) but has the largest blast radius and needs explicit product sign-off before an architecture can be finalized for it.
- **Recommendation**: **defer**. Not part of this pass. Revisit only if Options 1–2 don't sufficiently reduce misselection in practice, and treat it as its own product-task ticket (would warrant a PRD, unlike this one).

### 3.3 Recommendation for this pass

Ship **Option 1 (description enrichment)** alongside the Problem-A display fix — same low-risk, no-new-infrastructure profile, and it's the option explicitly ranked lowest-complexity. Do **not** build Option 2 or 3 in this pass; call them out as follow-ups gated on measuring whether Option 1 (plus the `mcpSlug`-carrying `label` field it introduces) meaningfully reduces misselection reports.

---

## 4. Implementation Phases (package boundaries)

Ordered for dependency safety; Phase 1 and Phase 2 can ship independently of each other (Phase 2 does not depend on Phase 1's new fields), but both are recommended together as "the quick-win pass."

### Phase 1 — Display fix (Problem A)
**Packages touched**: `packages/constants`, `packages/client-langchain`, `services/agent` (types only), `services/task`, `domains/mcp-usage`, `apps/api`, `ui/api-hooks`, `apps/web`.

1. `packages/constants/src/internalTools/formatInternalToolName.ts` — add `formatToolDisplayName` generic export (no logic change, alias of existing function).
2. `packages/client-langchain/src/mcp/loadMcpTools.ts` — capture `originalToolName` per tool alongside existing `toolNameToServerName`, without changing the final `tool.name` string.
3. `packages/client-langchain/src/mcp/recordMcpToolCall.ts`, `src/operations/runToolCallLoop.ts` — thread `originalToolName` through the started-phase recording call.
4. `domains/mcp-usage` — add `toolDisplayName` to model/DTO/mapper/GraphQL schema and to the `recordUsageEvent` started-phase schema + Mongo write.
5. `services/task/src/handlers/executeTask/createRecordMcpUsageEvent.ts` — compute and pass `toolDisplayName`.
6. `services/task/src/handlers/getTaskActivityTimeline/mapMcpUsageEventsToTimelineItems.ts` + `types.ts` — surface the new field on `TaskActivityMcpInvocationItem`.
7. `apps/api/src/graphql/resolvers/taskActivity.ts` — expose the field.
8. `ui/api-hooks` — extend the GraphQL query document + `TaskActivityItemDto`.
9. `apps/web/.../getToolInvocationRowDisplay.ts` — update the fallback chain.
10. *(Optional, same phase or deferred)* backfill script for existing opaque records (§2.4).

**Test strategy**: `tdd-unit-test-writer` for `formatToolDisplayName` (trivial, may just extend existing `formatInternalToolName.test.ts`), the extended `loadMcpTools.test.ts` (assert `tool.name` is unchanged, `originalToolName` capture is correct), `domains/mcp-usage`'s command tests (assert `toolDisplayName` persisted/omitted correctly), and `mapMcpUsageEventsToTimelineItems.test.ts` (already exists — extend it). Existing `getToolInvocationRowDisplay` UI logic is plain functions — extend its existing unit tests (if none exist yet, this is a good place for `tdd-unit-test-writer` to add them) rather than full E2E, since this is a pure display/formatting change with no new user flow.

### Phase 2 — Selection accuracy, Option 1 only (Problem B)
**Packages touched**: `domains/user-mcp-config` (types only), `packages/client-langchain`.

1. `domains/user-mcp-config/src/commands/resolveMcpServerConfigs/types.ts` — `McpServerConfig` gains optional `label?: string`; `ResolveMcpServerConfigsParams.mcpConfigs[].slug` (already present) is passed through into the built `serverConfig.label` in `resolveMcpServerConfigs/index.ts` (currently only used to pick the adapter — add one line to copy `slug` onto the result of `adapter.toServerConfig`, or extend `McpRuntimeAdapter.toServerConfig` to accept/return it — smallest diff is copying it onto the result in `resolveMcpServerConfigs/index.ts` right after `adapter.toServerConfig(...)` returns, so `genericAdapter.ts` itself doesn't need to change).
2. `packages/client-langchain/src/mcp/loadMcpTools.ts` — when building each server's tools, clone each `DynamicStructuredTool` with `description` prefixed by `[${config.label}]` when `label` is present (Decorator; skip decoration when `label` is absent, e.g. legacy configs — fail open to today's behavior, never throw).

**Test strategy**: `tdd-unit-test-writer` — extend `loadMcpTools.test.ts` to assert descriptions are prefixed when `label` is present and untouched when absent; extend `adapters.test.ts`/`resolveMcpServerConfigs` tests to assert `label` passthrough.

**Dependencies**: none on Phase 1. Can run in parallel.

### Phase 3 — Deferred / out of scope for this pass
- Option 2 (intent-based filtering) and Option 3 (specialization MCP prioritization) — see §3.2/§3.3. Not scheduled; revisit as separate tickets pending observed impact of Phase 2.
- `mapMcpsToSpecialization` classifier prompt/assignment-accuracy tuning — separate concern from tool-call-time selection, flagged in §1.4.
- Optional backfill script for legacy `toolName`-only records (§2.4) — can ship any time after Phase 1's `toolDisplayName` field exists; not a blocking dependency of anything.

---

## 5. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `loadMcpTools.ts`'s per-server prefix-override changes the exact bytes of `tool.name` unintentionally (e.g. a subtle difference in how the library joins vs. how we manually join) | Would break resumed conversations / mid-flight tool-call matching the same way Option B in §2.2 would | Compute the manual join using the **same literal separator and prefix** the library already uses (`mcp__{serverName}__{originalName}`), and add a unit test asserting byte-for-byte equality between the old (library-prefixed) and new (manually-prefixed) `tool.name` for the same inputs before this ships — treat it as a refactor-with-golden-output, not a rename. |
| Cloning `DynamicStructuredTool` to override `description` accidentally drops or mutates its `schema`/`func`/`invoke` binding | Tool execution breaks silently for MCP tools (regression far worse than the display bug being fixed) | Use a shallow clone that only overrides `description` (e.g. `Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, { description })` or the library's own clone helper if `DynamicStructuredTool` exposes one) and cover with a test that invokes the decorated tool and asserts identical behavior to the undecorated one. |
| `toolDisplayName`/`label` computed from `mcpSlug`, which is itself best-effort (MCP could be deleted between load time and record time) | Fallback text could show `undefined - toolName` or similar malformed string | `formatToolDisplayName` call sites always pass a non-empty fallback (`mcpSlug ?? mcpId`) — never call the formatter with a possibly-undefined `domain`; add a unit test for the "MCP deleted" edge case (mirrors the equivalent case already tested in `mcp-usage-tracking`). |
| Description enrichment (Phase 2) increases prompt token count slightly for every MCP tool, on every invocation | Marginal cost/latency increase, compounding with many assigned MCPs | Keep the prefix short (`"[{label}] "`), and since this only runs when `label` is present, legacy/edge-case configs are unaffected; no unbounded growth since it's O(1) per tool, not per message history. |
| Fixing display makes the *existing* wrong-selection behavior more visible/confusing to users (they can now clearly see "Wikipedia" was used when they asked for Notion, where before the opaque ID masked which MCP actually ran) | Could look like a regression ("now I can see it's broken") even though it's strictly more informative | Ship Phase 1 and Phase 2 together where possible — the description enrichment directly reduces the frequency of the very misselection the clearer display now makes visible, so the two fixes are complementary rather than sequential-only. |
| Optional backfill script (§2.4) runs against a live, append-only, potentially large collection | Could be slow or contend with write traffic if run naively | Same as any other one-off backfill in this repo: batch with a bounded page size and a delay between batches, filter to `toolDisplayName: { $exists: false }` so it's naturally idempotent/resumable, and treat as strictly optional/non-blocking per §2.4. |

---

## 6. Todo Plan

1. **`packages/constants`** — extend existing formatter
   - Changes needed: add `formatToolDisplayName` generic export alongside `formatInternalToolDisplayName` (same implementation).
   - Files to modify: `src/internalTools/formatInternalToolName.ts`, `src/internalTools/formatInternalToolName.test.ts`.
   - Suggested subagent workflow: `coder → Done` (trivial, no review loop needed — Pattern 4).
   - Dependencies: None.

2. **`packages/client-langchain`** — capture original tool name + description enrichment
   - Changes needed: (a) extend `loadMcpTools.ts` to capture `originalToolName` without changing `tool.name`'s final bytes (Phase 1); (b) add `McpServerConfig.label` passthrough and description-decoration in the same file (Phase 2); (c) thread `originalToolName` through `recordMcpToolCall.ts` / `runToolCallLoop.ts`.
   - Files to modify: `src/mcp/loadMcpTools.ts`, `src/mcp/loadMcpTools.test.ts`, `src/mcp/recordMcpToolCall.ts`, `src/operations/runToolCallLoop.ts`, `src/mcp/types.ts`.
   - Suggested subagent workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer` (Pattern 1 — golden-output byte-equality test for `tool.name` is the critical safety net here per §5).
   - Dependencies: None (pure client package, no domain imports).

3. **`domains/user-mcp-config`** — thread `label` into `McpServerConfig`
   - Changes needed: pass already-available `slug` input through into the returned `McpServerConfig.label`.
   - Files to modify: `src/commands/resolveMcpServerConfigs/types.ts`, `src/commands/resolveMcpServerConfigs/index.ts`, `src/commands/resolveMcpServerConfigs/adapters/adapters.test.ts`.
   - Suggested subagent workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer`.
   - Dependencies: None (independent of item 2; item 2 only *consumes* `McpServerConfig.label` once this exists — sequence for integration, but can be coded in parallel).

4. **`domains/mcp-usage`** — add `toolDisplayName` field end-to-end
   - Changes needed: model, DTO, mapper, GraphQL schema, `recordUsageEvent` started-phase schema + Mongo write.
   - Files to modify: `src/model/model.ts`, `src/model/dto.ts`, `src/model/toMcpUsageEventResponse.ts`, `src/model/graphql.ts`, `src/commands/recordUsageEvent/*`.
   - Suggested subagent workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer`.
   - Dependencies: None (additive field, independent of items 1–3; can be built in parallel using fixtures).

5. **`services/agent` + `services/task`** — thread `originalToolName` → compute `toolDisplayName`
   - Changes needed: extend `RecordMcpUsageEventInput`-equivalent type in `services/agent`; compute `toolDisplayName` in `createRecordMcpUsageEvent.ts`.
   - Files to modify: `services/agent/src/internalTools/types.ts`, `services/task/src/handlers/executeTask/createRecordMcpUsageEvent.ts`, associated test files.
   - Suggested subagent workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer`.
   - Dependencies: item 1 (`formatToolDisplayName`), item 2 (`originalToolName` must exist on the recording input), item 4 (`recordUsageEvent` must accept `toolDisplayName`).

6. **`services/task` (read path)** — surface `toolDisplayName` in task activity timeline
   - Changes needed: extend `mapMcpUsageEventsToTimelineItems.ts` + `types.ts` to carry `toolDisplayName`.
   - Files to modify: `src/handlers/getTaskActivityTimeline/mapMcpUsageEventsToTimelineItems.ts`, `.../types.ts`, `.../mapMcpUsageEventsToTimelineItems.test.ts`.
   - Suggested subagent workflow: `coder → Done` (trivial additive mapping, existing test file just needs one more assertion — Pattern 4).
   - Dependencies: item 4 (`McpUsageEventModel.toolDisplayName` must exist).

7. **`apps/api`** — expose `toolDisplayName` on the `taskActivity` GraphQL type
   - Changes needed: add one `t.exposeString('toolDisplayName', { nullable: true })` field.
   - Files to modify: `src/graphql/resolvers/taskActivity.ts`.
   - Suggested subagent workflow: `coder → Done` (Pattern 4).
   - Dependencies: item 6.

8. **`ui/api-hooks`** — extend query documents + DTOs
   - Changes needed: add `toolDisplayName` to `getTaskActivityTimelineQuery.ts`/`mapTaskActivityTimeline.ts` and (optionally, same pass) the MCP usage history query.
   - Files to modify: `src/tasks/graphql/getTaskActivityTimelineQuery.ts`, `src/tasks/mapTaskActivityTimeline.ts`, `src/mcps/queries/GET_MCP_USAGE_HISTORY_QUERY.ts` (optional).
   - Suggested subagent workflow: `coder → Done` (Pattern 4).
   - Dependencies: item 7.

9. **`apps/web`** — fix the row-title fallback chain
   - Changes needed: update `getToolInvocationDisplayName` priority order in `getToolInvocationRowDisplay.ts`.
   - Files to modify: `app/tasks/[id]/_components/TaskActivityFeed/activityMcpInvocationRow/getToolInvocationRowDisplay.ts`, plus any colocated test file (add one if none covers this function yet).
   - Suggested subagent workflow: `tdd-unit-test-writer → coder ↔ code-reviewer (loop: max 2 iterations) → documentation-writer` (small function, but worth a regression test given it's the exact bug being fixed).
   - Dependencies: item 8.

10. **`domains/mcp-usage` (optional backfill)** — one-off migration for legacy opaque records
    - Changes needed: batch script deriving `toolDisplayName` for existing records missing it (§2.4).
    - Files to modify/create: new script location per repo's existing one-off-script convention (not a new permanent domain file).
    - Suggested subagent workflow: `coder → Done` (Pattern 4/5 — scaffolding-style, no ongoing logic).
    - Dependencies: item 4. Explicitly optional/non-blocking — can be scheduled after everything else ships.
