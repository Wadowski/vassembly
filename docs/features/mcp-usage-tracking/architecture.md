# MCP Usage Tracking — Architecture

**PRD:** [mcp-usage-tracking/prd.md](./prd.md)
**Status:** Ready for implementation planning

---

## 1. Architecture Overview

### 1.1 Reuse map (audit result)

| Need | Existing precedent reused | Why it fits |
|---|---|---|
| "Record an event during agent execution, without blocking on write success" | `RecordAgentInvokeProgress` callback threaded from `services/task/executeTask` → `services/agent` `toolContext` → `domains/agent` `invoke` → `client-langchain` `AiProviderInvokeParams` | Exact same shape of problem: an optional callback created at the task-execution boundary, closing over `{ taskId, userId, commentId }`, threaded down through every layer to the point of execution (`runToolCallLoop`). |
| "Merge a new event kind into the task activity feed" | `services/task/getTaskActivityTimeline` (heterogeneous `TaskActivityItem` union, sorted by `occurredAt`/`sortKey`) + `TaskActivityFeedItem.tsx` kind switch + `TaskActivityFilter` groups | Adding a `mcpInvocation` kind is additive to an existing merge/sort/filter pipeline — no new timeline mechanism needed. |
| "Paginated list scoped to an owner, offset-based" | `domains/mcp/src/queries/getList` (`resolvePagination`, `McpsList` GraphQL type: `items/total/page/size`) | MCP usage history pagination is structurally identical. |
| "Strip sensitive fields before persistence" | `domains/task-comment/.../sanitizeUserText.ts`, `domains/task/.../sanitizeDescription.ts` | Same "sanitize in the command, not the mapper" convention — new `sanitizeToolInput.ts` follows this exactly. |
| "Tag/attach MCP identity to a runtime tool" | `services/agent/helpers/resolveMcpRuntimeMetadata.ts` (`{ slug, serverUrl }` per `mcpId`) already resolves `mcpId → slug`; `loadMcpTools` already keys `MultiServerMCPClient` by `serverName = mcpId` | No new mcpId↔slug resolution needed — reuse `resolveMcpRuntimeMetadata` output where a display slug is needed, and reuse `serverName` (already `= mcpId`) as the tool's MCP identity at the point of invocation. |

### 1.2 Why a new domain (`domains/mcp-usage/`)

- **Distinct entity with its own lifecycle**: a usage event is immutable, append-only, and queried independently of any single task (MCP Detail Page needs cross-task history for one `mcpId`). `domain-task-progress` embeds events inside a single per-`commentId` document (`$push` to `events[]`) — that shape is wrong here because (a) MCP usage must be queryable by `mcpId` across many tasks/comments, and (b) AC-4 edge case "MCP invocation outside of a task context" means a record must be able to exist with `taskId: null`, which doesn't fit a doc keyed by `commentId`.
- **Not a fit for `domain-mcp`**: that domain is the MCP *catalog* (static metadata), never per-invocation data.
- **Not a fit for `domain-user-mcp-config`**: that domain is the user's *credential/config* record, not an activity log.
- **No circular dependency risk**: `domain-mcp-usage` only needs primitive IDs (`mcpId`, `userId`, `taskId`, `agentId`, `invocationId`) passed in by the service layer — it does not need to import `domain-mcp`, `domain-task`, or `domain-agent` (domain isolation preserved). Any enrichment (MCP name/slug, agent display name, task title) happens in the **service layer**, exactly as `resolveAgentDisplayNames` already does for `taskActivityTimeline`.

### 1.3 Design patterns applied

- **Command** (`domains/mcp-usage/src/commands/recordUsageEvent`) — encapsulates the write as its own module, consistent with every other domain's `commands/`.
- **Facade** (`services/task/executeTask`'s new `createRecordMcpUsageEvent.ts`, and the new `services/mcp` handler `getMcpUsageHistory`) — hides the domain + enrichment orchestration behind one call for the API layer.
- **Strategy (map object)** for redaction: `sanitizeToolInput.ts` uses a deny-list **map**, not branching `if/else`, to decide which argument keys get masked (see §7).
- **Adapter** (existing, unchanged): `loadMcpTools` already adapts `MultiServerMCPClient` to `DynamicStructuredTool[]`; extended (not replaced) to also return a `serverName` lookup per tool so the tool-call loop can tag each invocation.
- **Decorator**-style wrapping of `tool.invoke` inside `runToolCallLoop` to add timing/recording behavior around the existing call, without touching the tool's own logic or error semantics (matches "Decorator: wrapping handlers/clients with logging/retry/metrics" from the pattern catalog).

### 1.4 High-level flow (diagram description)

```
Agent tool-call loop (packages/client-langchain)
  runToolCallLoop
    for each tool_call:
      isMcpTool = toolNameToMcpId.has(toolCall.name)          # from loadMcpTools tagging
      startedAt = now()
      try {
        result = await tool.invoke(args)
        status = 'success'
      } catch (err) {
        status = 'error'; errorMessage = err.message
        rethrow err   # unchanged error propagation (AC-1)
      } finally {
        if (isMcpTool && onMcpToolCallComplete) {
          await onMcpToolCallComplete({ mcpId, toolName, args, startedAt, endedAt, status, errorMessage })
            .catch(logOnly)   # never throws into the loop (AC-1 "recording failure must not break execution")
        }
      }
        │
        ▼ (callback threaded down from)
services/agent: InternalToolContext.recordMcpUsageEvent
        │ (created once per comment, closes over taskId/userId/commentId/agentId/invocationId/rootInvokeId)
services/task/executeTask: createRecordMcpUsageEvent({ taskId, userId, commentId, rootInvokeId })
        │
        ▼
domains/mcp-usage: commands.recordUsageEvent(input)
        │  - sanitizeToolInput(args) → redacted/truncated input
        │  - insertOne into `mcpUsageEvents` (flat, append-only)
        ▼
MongoDB: mcpUsageEvents collection

Reads:
  Task Detail Page  →  GraphQL taskActivityTimeline
      services/task.getTaskActivityTimeline
        + mcpUsageDomain.queries.getModelsByTaskId({ taskId })
        + map each usage record → TWO timeline items:
            mcpInvocationStarted (at startedAt)
            mcpInvocationCompleted (at endedAt, when status is terminal)
      → apps/web TaskActivityFeed (+new filter group/rows for started + completed kinds)

  MCP Detail Page   →  GraphQL mcpUsageHistory(mcpId, page, size)
      services/mcp.getMcpUsageHistory
        + mcpUsageDomain.queries.getListByMcpId({ mcpId, userId, page, size })
        + ONE row per record; status field reflects in_progress | success | error
      → apps/web McpUsageHistorySection (new; row updates on poll, no duplicate rows)
```

---

## 2. Data Model

### 2.1 New domain: `domains/mcp-usage/`

Follows `domain-package-structure.mdc` exactly:

```
domains/mcp-usage/
├── src/
│   ├── model/
│   │   ├── model.ts            # McpUsageEventModel
│   │   ├── dto.ts               # McpUsageEventResponse (list-item + task-activity variants)
│   │   ├── factories.ts         # mcpUsageEventFactory
│   │   ├── toMcpUsageEventResponse.ts
│   │   └── index.ts
│   ├── commands/
│   │   ├── recordUsageEvent/    # index.ts, types.ts, shared/sanitizeToolInput.ts, index.test.ts
│   │   └── index.ts
│   ├── queries/
│   │   ├── getListByMcpId/      # public — MCP Detail Page (paginated, DTO)
│   │   ├── getModelsByTaskId/   # internal — Task activity merge (Model[], no DTO)
│   │   ├── shared/pagination.ts
│   │   └── index.ts
│   ├── clients/
│   │   └── mongodb.ts           # mcpUsageMongodbDao + mongodbIndexes()
│   ├── constants.ts             # DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, RETENTION_DAYS, MAX_INPUT_FIELD_LENGTH
│   └── index.ts
├── package.json / tsconfig.json / vitest.config.ts / README.md
```

### 2.2 Model

```typescript
export enum McpUsageStatus {
  Success = 'success',
  Error = 'error',
  InProgress = 'in_progress',   // AC edge case: hanging/long-running call
}

export class McpUsageEventModel extends Model {
  mcpId!: string;
  mcpSlug?: string;              // denormalized display name-at-time-of-use (AC "MCP deleted" edge case)
  toolName!: string;
  userId!: string;
  taskId?: string | null;        // null when invoked outside a task context
  commentId?: string | null;
  agentId!: string;
  invocationId?: string;
  rootInvokeId?: string;
  status!: McpUsageStatus;
  startedAt!: Date;
  endedAt?: Date | null;         // absent while status === InProgress
  durationMs?: number | null;
  input?: Record<string, unknown> | null;   // sanitized + truncated (§7), never raw
  inputTruncated?: boolean;
  errorMessage?: string | null;  // sanitized the same way as input
}
```

### 2.3 MongoDB collection: `mcpUsageEvents` (flat, append-only — no embedding)

**Write pattern**: `insertOne` on start (status `in_progress`), then `updateOne({_id}, {$set: {status, endedAt, durationMs, errorMessage}})` on completion — mirrors the `started` → `completed`/`failed` two-phase pattern already used by `recordAgentInvokeProgress`, and naturally satisfies the "in progress" edge case (AC edge case) without extra modeling.

**Indexes** (via `mongodbIndexes()`, called at boot like every other domain's `clients/mongodb.ts`):

```typescript
await collection.createIndex({ mcpId: 1, userId: 1, startedAt: -1 }, { name: 'idx_mcpId_userId_startedAt' });   // MCP Detail Page history, user-scoped
await collection.createIndex({ taskId: 1, startedAt: 1 }, { name: 'idx_taskId_startedAt' });                     // Task activity merge
await collection.createIndex({ startedAt: 1 }, { name: 'idx_startedAt_ttl', expireAfterSeconds: RETENTION_SECONDS }); // Retention (§8)
```

- `{ mcpId, userId, startedAt: -1 }` — primary read path for the MCP Detail Page (AC-3: user-scoped, reverse-chronological, paginated).
- `{ taskId, startedAt: 1 }` — primary read path for task activity merge (chronological merge with other timeline items).
- TTL index on `startedAt` — retention (§8); MongoDB TTL indexes auto-expire documents, no custom job needed.

---

## 3. Write Path

**No REST endpoint.** Recording is **not** a client-triggered HTTP mutation — it is a server-side call from the agent execution pipeline into a domain command, exactly like `taskProgressDomain.commands.recordProgressEvent` today (which also has no REST route). The `api-calling-conventions.mdc` REST-for-commands rule governs *client → API Gateway* traffic; this is an internal service-to-domain call, same tier as existing progress recording.

### 3.1 Threading the callback (mirrors `RecordAgentInvokeProgress` exactly)

| Layer | File | Change |
|---|---|---|
| `packages/client-langchain` | `src/mcp/loadMcpTools.ts` | Also return `toolNameToServerName: Map<string, string>` built by calling `client.getTools(config.serverName)` per server (instead of one flat `client.getTools()`), so each tool's owning `serverName` (`= mcpId`) is known. |
| `packages/client-langchain` | `src/operations/runToolCallLoop.ts` | Add optional `onMcpToolCallComplete?: (event: McpToolCallEvent) => Promise<void>` param. Wrap each `tool.invoke(toolCall.args)` call with start/end timing + try/catch/finally (Decorator). Only fires when `toolNameToServerName.has(toolCall.name)`. Failures in the callback are caught and `console.error`-logged, never rethrown (AC-1 "recording failure must not break task execution"). Existing error propagation for the tool call itself is untouched. |
| `packages/client-langchain` | `src/operations/invokeWithChatModel.ts`, `src/types.ts` (`AiProviderInvokeParams`) | Pass `onMcpToolCallComplete` through from `invokeParams` to `runToolCallLoop`. |
| `domains/agent` | `src/commands/invoke/types.ts`, `index.ts` | Add `onMcpToolCallComplete` to `ModeledProviderInvokeParams` / `InvokeAgentParams`, pass through unchanged (same shape as `mcpServerConfigs` threading already there). |
| `services/agent` | `src/internalTools/types.ts` | Add `recordMcpUsageEvent?: RecordMcpUsageEvent` to `InternalToolContext`, and the `RecordMcpUsageEvent`/`McpToolCallEvent` types (sibling to `RecordAgentInvokeProgress`/`AgentInvokeProgressEventInput`). |
| `services/agent` | `src/internalTools/runAgentInvokeWithTools.ts` | Pass `toolContext.recordMcpUsageEvent` as `onMcpToolCallComplete` into `agentDomain.commands.invoke` / `systemAgentDomain.commands.invoke` (both call sites, alongside existing `mcpServerConfigs`). |
| `services/task` | `src/handlers/executeTask/createRecordMcpUsageEvent.ts` (new, sibling to `createRecordAgentInvokeProgress.ts`) | Closes over `{ taskId, userId, commentId }` (available in `executeTask` already) and resolves `mcpId → mcpSlug` via the same metadata already resolved earlier in the flow, then calls `mcpUsageDomain.commands.recordUsageEvent(...)`. Wired into `toolContext.recordMcpUsageEvent` next to the existing `recordAgentInvokeProgress` wiring (`executeTask/index.ts` line ~118). |

### 3.2 Command: `domains/mcp-usage/src/commands/recordUsageEvent`

- Uses `createDb`-style validation (Zod) like every other domain command.
- Calls `sanitizeToolInput` (see §7) on `input` **before** constructing the model — never persists raw args.
- On completion calls (`status !== 'in_progress'`), does an `updateOne` against the previously inserted `_id` (returned from the start call) rather than a second `insertOne` — avoiding duplicate records for the same tool call (AC edge case: "each tool call produces its own distinct record").
- Never throws in a way that surfaces to the agent loop as a tool failure — `recordUsageEvent` itself may throw (domain commands are allowed to throw), but the **caller** (`runToolCallLoop`'s wrapper, §3.1) is responsible for catching and logging, per AC-1.

---

## 4. Read Paths

### 4.1 Task Detail Page — merge into `taskActivityTimeline`

- `services/task/src/handlers/getTaskActivityTimeline/index.ts`: add one more parallel fetch alongside `commentsResult`/`questionsResult`:
  ```typescript
  const mcpUsageResult = await mcpUsageDomain.queries.getModelsByTaskId({ taskId });
  ```
  and push one `TaskActivityItem` per event with `kind: 'mcpInvocation'`, `occurredAt: startedAt`, `filterGroup: 'mcpUsage'`. This is an **additive branch** in the existing per-comment loop (or a top-level loop keyed by `commentId` if events aren't tied to a specific comment) — no change to existing item kinds (satisfies AC-2's "existing progress entries render exactly as before").
- `services/task/src/handlers/getTaskActivityTimeline/types.ts`: add `TaskActivityMcpInvocationItem` to the `TaskActivityItem` union and `'mcpUsage'` to `TaskActivityFilterGroup`.
- No new resolver needed — `apps/api/src/graphql/resolvers/taskActivity.ts`'s existing `TaskActivityItem` GraphQL type just gets new nullable fields (`mcpId`, `mcpName`, `toolName`, `status`, `startedAt`, `endedAt`, `duration`) added via `t.exposeString(..., { nullable: true })`, consistent with how `progressEvent`-only fields are already nullable on the same shared type.

### 4.2 MCP Detail Page — new `mcpUsageHistory` query

- New service handler `services/mcp/src/handlers/getMcpUsageHistory/index.ts`:
  ```typescript
  getMcpUsageHistory({ mcpId, userId, page, size }) →
    mcpUsageDomain.queries.getListByMcpId({ mcpId, userId, page, size })   // user-scoped (AC-3 "scoped to the owning user")
    + resolveAgentDisplayNames-style enrichment for agentId → agent name  (reuse existing helper pattern from taskActivity resolver)
  ```
- New GraphQL query in `apps/api/src/graphql/resolvers/mcpUsage.ts` (new file, sibling to existing `mcps` resolvers): `mcpUsageHistory(mcpId: ID!, page: Int, size: Int): McpUsageHistoryList`, following the exact `McpsList { items, total, page, size }` shape already defined in `domains/mcp/src/model/graphql.ts`.
- Query resolver enforces `userId === context.authenticatedUserId` scoping the same way `getUserMcpConfig` queries already scope by `userId` — never trusts a client-supplied `userId`.

---

## 5. API Exposure

| Operation | Type | Location |
|---|---|---|
| Record MCP tool call | Domain command (no HTTP) | `domains/mcp-usage/src/commands/recordUsageEvent` — called in-process from `services/task/executeTask`, same tier as `recordProgressEvent` |
| Task activity (includes MCP invocations) | GraphQL query (existing, extended) | `taskActivityTimeline` in `apps/api/src/graphql/resolvers/taskActivity.ts` |
| MCP usage history | GraphQL query (new) | `mcpUsageHistory` in new `apps/api/src/graphql/resolvers/mcpUsage.ts`, registered in `apps/api/src/graphql/resolvers/index.ts` |

No new REST routes. This is consistent with `api-calling-conventions.mdc` — all reads here are GraphQL; the only "write" is an internal domain call, not a state change exposed to REST clients.

---

## 6. UI Changes

### 6.1 Task Detail Page (`apps/web/app/tasks/[id]/_components/TaskActivityFeed/`)

- `TaskActivityFeedItem.tsx`: add `if (item.kind === 'mcpInvocation') return <ActivityMcpInvocationRow item={item} />;`
- New folder `activityMcpInvocationRow/` (sibling to `activityProgressEventRow/`):
  - `ActivityMcpInvocationRow.tsx` — renders MCP name, tool name, timestamp, duration, status badge (reuses existing badge/row styling from `ActivityProgressEventRow.tsx`).
  - `getMcpInvocationRowTitle.ts`, `getMcpInvocationRowDisplay.ts` — mirrors `getProgressRowTitle.ts` / `getProgressRowDisplay.ts`.
  - `ActivityMcpInvocationRow.test.tsx`.
- `TaskActivityFilter.tsx`: add `'mcpUsage'` as a selectable filter group (extends existing `TaskActivityFilterGroup` checkbox list).
- `useTaskActivityFeed.ts`: no structural change — it already consumes the generic `TaskActivityItemDto[]` from the GraphQL query and filters by `filterGroup`; the new kind flows through automatically once the GraphQL type/handler expose it.
- `ui/api-hooks/src/tasks/useTaskActivityTimeline.ts`: extend the GraphQL query document with the new fields (`mcpId`, `mcpName`, `toolName`, `status`, `startedAt`, `endedAt`, `duration`) and the `TaskActivityItemDto` type.

### 6.2 MCP Detail Page (`apps/web/app/mcps/[id]/`)

- `page.tsx`: add `<McpUsageHistorySection mcpId={mcpId} />` after `<McpAgentsSection ... />` — keeps the existing stacked-section layout (PRD explicitly calls out reusing this, no tabs).
- New folder `_components/McpUsageHistorySection/` (sibling to `McpAgentsSection/`):
  - `McpUsageHistorySection.tsx` — section header + list + pagination controls + empty state (AC-3 "MCP with no usage history shows empty state").
  - `McpUsageHistoryItem.tsx` — one row: agent/task context, tool name, timestamp, duration, status; masked input behind an expand affordance (AC-4).
  - `useMcpUsageHistory.ts` — thin wrapper hook, colocated, calling the new `ui/api-hooks` hook + local page-state.
  - `McpUsageHistorySection.test.tsx`.
- `ui/api-hooks/src/mcps/useMcpUsageHistory.ts` (new, sibling to `useUserConfiguredMcps.ts`) + `ui/api-hooks/src/mcps/queries/GET_MCP_USAGE_HISTORY_QUERY.ts` (new, sibling to `GET_MCP_QUERY.ts`), exported from `ui/api-hooks/src/mcps/index.ts`.

---

## 7. Privacy / Redaction Approach

Implemented as a **Strategy (map object)**, applied at **persistence time** in the domain command — not just at display time (PRD §7 requirement #2 is explicit: "before persistence, not just before display").

`domains/mcp-usage/src/commands/recordUsageEvent/shared/sanitizeToolInput.ts`:

1. **Deny-list by key name** (case-insensitive substring match), not per-tool special-casing: any argument key matching `/token|secret|password|apikey|api_key|credential|authorization|access_key|private_key/i` → value replaced with a fixed `"[REDACTED]"` marker, regardless of tool schema (PRD requirement #2 "regardless of what the tool schema names its arguments").
2. **Truncation**: any remaining string value longer than `MAX_INPUT_FIELD_LENGTH` (constant, e.g. 500 chars) is cut with a `"…[truncated]"` suffix and `inputTruncated: true` is set on the record (PRD requirement #4, AC edge case "very large arguments").
3. **Error messages** run through the same two steps before being stored in `errorMessage` (PRD requirement #6) — reuse the same function, not a parallel implementation.
4. **Output payloads are never captured** — the write path only ever reads `args`/timing/status around `tool.invoke`, never its resolved value (PRD requirement #8). No field exists on the model for it.
5. **Display-side masking** (PRD requirement #3, AC-4) is a **UI-only** default: `McpUsageHistoryItem.tsx` renders `input` collapsed/masked by default with an explicit "show" toggle — this is a UX safeguard layered on top of #1–#2, not a substitute (matches PRD wording exactly). No "reveal raw secret" path exists anywhere because the secret was never stored (#1).
6. **Access scoping** (PRD requirement #1): enforced at the query layer — `getListByMcpId` always requires `userId` and filters by it; the GraphQL resolver always uses `context.authenticatedUserId`, never a client-supplied value (same pattern as existing `userMcpConfig` queries).
7. **Immutability** (PRD requirement #7): no `update`/`remove` command is created for this domain — only `recordUsageEvent` (insert + one completion update, both server-driven). No route or resolver ever allows end-user edits.

---

## 8. Retention Policy Recommendation

No existing domain has TTL/retention precedent (confirmed by discovery), so this is a new decision, not an extension:

- **Recommendation: MongoDB TTL index on `startedAt`, default 90 days.** Rationale:
  - Matches PRD §7 requirement #5 ("default retention window... rather than kept indefinitely by default") and is explicitly deferred from admin tuning in PRD Out-of-Scope ("Configurable data retention/TTL policy... tuning/admin controls are deferred") — so a **fixed, non-configurable constant** is correct for v1, not a config-driven value.
  - A native MongoDB TTL index requires zero application code, zero cron/worker infra, and self-heals collection growth — the simplest mechanism available, consistent with "maximize reuse, minimize new logic."
  - 90 days is chosen as a reasonable audit-trail window (long enough for a user to review "why did this task do that" weeks later; short enough to bound storage for a high-volume, append-only, potentially-large-argument collection). Expose as `RETENTION_SECONDS` in `domains/mcp-usage/src/constants.ts` so it can be tuned by a code change without a migration (no admin UI needed, per Out-of-Scope).
  - If a task's activity feed later needs to show "this task had MCP activity that has since expired," that is explicitly out of scope per PRD (no requirement to preserve MCP rows longer than task/progress data — task progress itself has no stated retention today either).

---

## 9. Implementation Phases (package boundaries)

**Delivery:** All phases ship in a single implementation pass (product decision #6). Logical build order remains `1 → 2 → 3 → (4a, 4b) → 5` for dependency safety, but nothing is gated on the in-progress MCP platform branch.

Ordered phases:

### Phase 1 — `domains/mcp-usage` (new domain, scaffold + full logic)
- New package per §2.1. Model, `sanitizeToolInput`, `recordUsageEvent` command, `getListByMcpId` + `getModelsByTaskId` queries, `mcpUsageMongodbDao` + indexes, README.
- **Test strategy**: `tdd-unit-test-writer` for command (redaction cases, in-progress→completed update path) and both queries (pagination, user-scoping, task-scoping) before implementation.
- No dependency on other phases.

### Phase 2 — `packages/client-langchain` (write-hook plumbing)
- `loadMcpTools.ts` server-name tagging, `runToolCallLoop.ts` `onMcpToolCallComplete` wrapper (Decorator), `invokeWithChatModel.ts` + `types.ts` threading.
- Depends on: nothing from Phase 1 (this package never imports domains — it's a pure client package). Can run in parallel with Phase 1.
- **Test strategy**: `tdd-unit-test-writer` — verify the callback fires only for MCP-sourced tool calls, verify a throwing callback does not affect the tool result or the loop's error propagation (AC-1).

### Phase 3 — `domains/agent` + `services/agent` + `services/task` (threading)
- `domains/agent` invoke types/passthrough → `services/agent` `InternalToolContext` + `runAgentInvokeWithTools` wiring → `services/task` `createRecordMcpUsageEvent.ts` + `executeTask/index.ts` wiring.
- Depends on: Phase 1 (calls `mcpUsageDomain.commands.recordUsageEvent`) and Phase 2 (threads the new callback param).
- **Test strategy**: `tdd-unit-test-writer` for `createRecordMcpUsageEvent` and updated `runAgentInvokeWithTools.test.ts`/`invokePersonalAgent` tests (mock domain, assert callback shape).

### Phase 4a — `services/task` + `apps/api` (Task Detail read path)
- `getTaskActivityTimeline` merge, `TaskActivityItem` type union + GraphQL field additions, resolver update.
- Depends on: Phase 1 (query) and Phase 3 (so real data exists to merge, though the read path can be built/tested against Phase 1's domain alone with fixtures).
- **Test strategy**: `tdd-unit-test-writer` for handler merge/sort logic; existing `getTaskActivityTimeline` test suite extended, not replaced.

### Phase 4b — `services/mcp` + `apps/api` (MCP Detail read path)
- New `getMcpUsageHistory` handler, new `mcpUsageHistory` GraphQL resolver/type.
- Depends on: Phase 1 only. Can run in parallel with Phase 4a.
- **Test strategy**: `tdd-unit-test-writer` for handler (user-scoping, pagination, empty state).

### Phase 5 — `apps/web` (UI, both surfaces) + `ui/api-hooks`
- `ActivityMcpInvocationRow` + `TaskActivityFilter` extension; `McpUsageHistorySection` + hook; `ui/api-hooks` query docs/hooks for both surfaces.
- Depends on: Phase 4a (Task Detail data available) and Phase 4b (MCP Detail data available). Two independent UI todos internally, can be split further per subagent if desired.
- **Test strategy**: Given PRD has full Gherkin AC-2/AC-3/AC-4 scenarios for `apps/web` user flows, add `tdd-e2e-test-writer` todo for `apps/web/e2e/features/mcp-usage/` (Task Detail MCP activity + MCP Detail usage history + redaction-masking scenarios), in parallel with component-level unit/interaction tests.

---

## 10. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Recording write adds latency to every tool call | Slows agent execution, degrades UX | Fire-and-log-only: callback failures are caught and logged, never awaited-and-blocking in a way that fails the tool call (PRD success metric: ≤50ms p95 added). Two lightweight writes (insert + update) using indexed fields only. |
| Redaction deny-list misses a secret-shaped field with an unexpected name | Credential leak via tracking feature itself | Deny-list is regex/substring-based (not exact key match) to catch variants (`api_key`, `apiKey`, `API-KEY`); documented in domain README as the single source of truth so future MCP tool schemas are checked against it; security review called out explicitly as a PRD success metric. |
| High-volume tasks (dozens/hundreds of tool calls) blow up task activity payload size | Slow Task Detail Page load, large GraphQL responses | `getModelsByTaskId` query can cap/paginate at the domain level (same `resolvePagination` shared util) if a task exceeds a threshold; out-of-scope PRD item ("filtering/search beyond default order") means v1 can ship with a hard cap constant and revisit if telemetry shows it's hit. |
| Two-phase write (insert-then-update) leaves an orphaned "in_progress" record if the process crashes mid-call | Stale "in progress" rows displayed forever | Acceptable for v1 per PRD (no requirement for crash recovery); TTL retention (§8) bounds how long a stale row can persist. Documented as a known limitation, not silently ignored. |
| New domain adds a 35th+ package to maintain | Package sprawl | Justified in §1.2 against the explicit domain-creation decision framework; scope kept intentionally minimal (one command, two queries, no update/remove) to avoid over-engineering. |
| `MultiServerMCPClient.getTools(serverName)` per-server call changes existing tool-loading behavior for non-usage-tracking code paths | Regression in existing MCP tool loading/dedup logic | `loadMcpTools`'s public return shape (`tools: DynamicStructuredTool[]`) stays unchanged — only an additional `toolNameToServerName` map is added alongside it; existing callers (`invokeWithChatModel.ts`) ignore the new field until Phase 2 wiring lands, so this is additive, not a behavior change, verified by existing `loadMcpTools.test.ts` continuing to pass unmodified. |
