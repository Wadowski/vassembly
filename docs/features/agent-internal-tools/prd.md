# Product Requirements Document: Agent Internal Tools

**Document status:** Approved for implementation  
**Last updated:** 2026-06-14  
**Feature slug:** `agent-internal-tools`  
**Related:** [Agent MCP Assignment](../agent-mcp-assignment/prd.md) · [Agent Management](../agent-management/prd.md) · [System Agent](../system-agent/prd.md) · [Async LLM Task Execution](../async-llm-task-execution/prd.md)

---

## 1. Executive Summary

### 1.1 Problem

Agents can be assigned **MCP tools** (external integrations), but cannot use **first-party platform capabilities** such as listing other agents or delegating work to another agent. System agents and personal agents have no persisted internal-tool configuration, and async task execution (`executeTask`) does not load any tools at runtime. Admins and users cannot opt agents into safe, governed in-app behaviors without bespoke prompt hacks.

### 1.2 Solution

Introduce a **static, code-defined internal tool registry** (v1: `use-agent`, `list-agents`). Both **personal agents** and **system agents** store `assignedToolIds: string[]` on their config. Agent create/edit forms expose a **dedicated internal-tools picker** (separate from MCP assignment). At invoke time, assigned internal tools are resolved into LangChain tools, **merged with MCP tools**, and passed to the existing tool-call loop. Tool behavior respects **caller scope** (system vs personal) and **recursion limits** for agent delegation.

### 1.3 Value proposition

| Stakeholder | Value |
|-------------|-------|
| **End user** | Personal agents can orchestrate other personal agents without leaving the platform |
| **Platform admin** | System agents can delegate to catalog agents and user agents with governed credentials |
| **Engineering** | Registry pattern enables new internal tools without schema churn; reuses MCP invoke + `runToolCallLoop` |

### 1.4 Resolved product decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Agent scope | **Both personal and system agents** support internal tool assignment in v1 |
| 2 | Tool source | **Static registry in code** — not user-configurable or DB-seeded |
| 3 | UX placement | **Separate picker** from MCP assignment on personal and system agent forms |
| 4 | Runtime merge | Internal tools **coexist with MCP tools**; merged at invoke before LLM bind |
| 5 | v1 tool catalog | `use-agent`, `list-agents` only (see §6.3) |
| 6 | Per-tool access | Each registry entry declares **system-only** or **system + personal** eligibility |
| 7 | `use-agent` recursion | **Max depth 2** — third nested `use-agent` call is blocked |
| 8 | `use-agent` credentials | Always use credentials of the **invoked** agent (personal: `integrationCredentialId`; system: user preference) |
| 9 | `list-agents` identity | **No `userId` LLM param** — inject `userId` server-side from invoke context |
| 10 | Async tasks | Internal tools **must work** when system agents run via `executeTask` in v1 |
| 11 | API conventions | **GraphQL** for catalog read + `assignedToolIds` on agent types; **REST** for create/update commands |
| 12 | Personal agent naming | **Unique per user** (case-insensitive among active agents) — required for `use-agent` name resolution |
| 13 | System agent naming | **Globally unique** among active system agents (existing rule) — unchanged |

---

## 2. Feature Overview & Scope

### 2.1 In scope (v1)

| Area | Deliverable |
|------|-------------|
| **Registry** | Code-defined catalog of internal tools with id, display name, description, LLM schema, access scope |
| **Data model** | `assignedToolIds: string[]` on personal agents and system agents |
| **Validation** | Ids must exist in registry; respect per-tool access for agent type; unique ids; reject unknown/stale ids on write |
| **GraphQL** | `internalTools` catalog query; `assignedToolIds` on `Agent` and `SystemAgent` types |
| **REST** | `assignedToolIds` on `POST`/`PATCH` personal agents and system agents (admin) |
| **Personal agent form** | `InternalToolAssignmentPicker` — multi-select from eligible registry entries |
| **System agent form** | Same picker component; eligible tools filtered by registry access |
| **Personal invoke** | `POST /agents/:id/invoke` loads internal + MCP tools |
| **System invoke** | `POST /system-agents/:id/invoke` loads internal + MCP tools (when MCP assignment added later, merge applies) |
| **Async tasks** | `executeTask` loads internal tools for assigned system agent |
| **Runtime tools** | `use-agent`, `list-agents` implementations with scope and recursion enforcement |
| **Invoke metadata** | Report `internalToolIdsUsed`, `skippedInternalToolIds` (and existing MCP metadata where applicable) |

### 2.2 Out of scope (v1)

| Item | Notes |
|------|-------|
| User-defined custom internal tools | Registry is code-only |
| Internal tool assignment on MCP detail page | No reverse-lookup UI (unlike MCP agents section) |
| Per-tool ordering semantics for invoke | Array order = display order only |
| Internal tools on platform agents without AI credential path | Invoke still requires resolvable credential for LLM; tool handlers validate target credentials |
| Cross-user agent invocation | Personal agents never target another user's agents |
| Team/shared agents | Personal agents remain per-user |
| Webhook or external callback tools | Future registry entries |
| Admin override of recursion depth | Fixed global limit |
| GraphQL mutations for assignment | REST commands only per API conventions |
| Personal agent name uniqueness backfill migration | Enforce on create/update going forward; existing duplicates resolved at `use-agent` with explicit error |

---

## 3. User Stories & Acceptance Criteria

### Story AIT-1 — View internal tool catalog (read)

**As a** logged-in user or admin, **I want** to see which internal tools exist and who may assign them **so that** I understand available capabilities before editing an agent.

```gherkin
Scenario: GraphQL returns static catalog
  Given I am authenticated
  When I query internalTools
  Then I receive all registry entries with id, displayName, description, and accessScope
  And entries include "use-agent" and "list-agents"

Scenario: Catalog is read-only
  Given I am authenticated
  When I attempt to create or mutate internal tools via API
  Then no such command endpoint exists
  And assignment changes only via agent create/update
```

### Story AIT-2 — Assign internal tools on personal agent create/edit

**As a** logged-in user, **I want** to select internal tools on my agent form **so that** my agent can use platform capabilities at runtime.

```gherkin
Scenario: Assign eligible tools on create
  Given I am authenticated
  And I am creating a personal agent
  When I select "Use agent" and "List agents" in the internal tools picker
  And I save the agent
  Then POST /agents persists assignedToolIds ["use-agent", "list-agents"]

Scenario: Picker excludes system-only tools for personal agents
  Given a registry tool with accessScope "systemOnly" exists in a future release
  When I open the personal agent form internal tools picker
  Then that tool is not available for selection

Scenario: Picker is separate from MCP picker
  Given I am on the agent create/edit form
  Then I see distinct sections for MCP tools and internal tools
  And selections in one picker do not affect the other

Scenario: Remove internal tool from form
  Given I am editing an agent with "List agents" assigned
  When I remove "List agents" and save
  Then assignedToolIds no longer contains "list-agents"

Scenario: Reject unknown tool id via API
  Given I am authenticated
  When I POST /agents with assignedToolIds containing "nonexistent-tool"
  Then the API returns 400 validation error
  And no agent is created

Scenario: Reject duplicate tool ids via API
  Given I am authenticated
  When I PATCH an agent with assignedToolIds ["use-agent", "use-agent"]
  Then the API returns 400 validation error
```

### Story AIT-3 — Assign internal tools on system agent create/edit (admin)

**As a** platform admin, **I want** to assign internal tools when creating or editing system agents **so that** platform agents can orchestrate other agents.

```gherkin
Scenario: Admin assigns tools on system agent create
  Given I am authenticated as admin
  When I create a system agent and select "Use agent" and "List agents"
  Then POST /system-agents persists both tool ids in assignedToolIds

Scenario: Non-admin cannot assign on system agent
  Given I am authenticated as a regular user
  When I POST /system-agents with assignedToolIds
  Then I receive 403 Forbidden

Scenario: System agent form shows internal tools picker
  Given I am admin on the system agent create or edit form
  Then I see the internal tools picker with all registry tools eligible for system agents
```

### Story AIT-4 — Invoke personal agent with internal tools

**As a** logged-in user, **I want** my personal agent invoke to use assigned internal tools **so that** the LLM can list and delegate to my other agents.

```gherkin
Scenario: Invoke binds internal and MCP tools
  Given I own personal agent "Orchestrator" with assignedToolIds ["list-agents", "use-agent"]
  And the agent has a connected integrationCredentialId
  And assigned MCPs are configured
  When I POST /agents/{id}/invoke with a message
  Then the LLM call receives merged internal and MCP tools
  And response metadata includes internalToolIdsUsed when tools were invoked

Scenario: Invoke without assigned internal tools
  Given my agent has assignedToolIds []
  When I invoke the agent
  Then only MCP tools (if any) are bound
  And invoke succeeds when credential is valid

Scenario: Skipped unknown internal tool at runtime
  Given my agent persisted a tool id removed from registry in a later deploy
  When I invoke the agent
  Then invoke continues with remaining tools
  And skippedInternalToolIds includes the stale id in metadata
```

### Story AIT-5 — Invoke system agent with internal tools

**As a** logged-in user or admin, **I want** system agent invoke to use assigned internal tools **so that** platform agents can orchestrate work.

```gherkin
Scenario: User invokes system agent with tools
  Given an active system agent has assignedToolIds ["use-agent", "list-agents"]
  And I have a connected system-call preference credential
  When I POST /system-agents/{id}/invoke with a message
  Then internal tools are bound alongside any MCP tools
  And the response follows the standard invoke shape with tool metadata

Scenario: Admin test invoke with connection override
  Given I am admin
  When I invoke a system agent with connectionOverride
  Then the root LLM call uses the override credential
  And nested use-agent calls still use each target agent's credential rules
```

### Story AIT-6 — `list-agents` tool behavior

**As an** agent runtime, **I want** `list-agents` to return agents visible to the caller **so that** the LLM can choose delegation targets without seeing other users' data.

```gherkin
Scenario: Personal agent caller lists only personal agents
  Given personal agent "Helper" with list-agents assigned is invoked for user U
  And user U owns personal agents "A" and "B"
  And system agent "Assistant" exists
  When the LLM calls list-agents with no userId parameter
  Then the tool returns only "A" and "B" for user U
  And system agents are not included

Scenario: System agent caller lists personal and system agents
  Given system agent "Orchestrator" with list-agents is invoked for user U
  And user U owns personal agent "My bot"
  And system agent "Assistant" is active
  When the LLM calls list-agents
  Then the tool returns both personal agents for U and active system agents
  And each entry includes name and sufficient identifier for use-agent

Scenario: userId is never accepted from LLM
  Given any invoke context
  When the LLM attempts list-agents with a userId argument in the tool schema
  Then the exposed tool schema does not include userId
  And the server derives userId from the authenticated invoke context
```

### Story AIT-7 — `use-agent` tool behavior

**As an** agent runtime, **I want** `use-agent` to run another agent by name with a sub-prompt **so that** agents can delegate work safely.

```gherkin
Scenario: Personal agent delegates to another personal agent
  Given personal agent "Manager" with use-agent is invoked for user U
  And user U owns personal agent "Writer" with a connected credential
  When the LLM calls use-agent with name "Writer" and agentPrompt "Draft intro"
  Then the platform invokes "Writer" with agentPrompt as the user message
  And the Writer agent's integrationCredentialId is used for the nested LLM call
  And the tool returns the nested agent's text result to the parent loop

Scenario: Personal agent cannot target system agent
  Given personal agent "Manager" with use-agent is invoked for user U
  And system agent "Assistant" exists
  When the LLM calls use-agent with name "Assistant"
  Then the tool returns an error indicating the target is not allowed for personal callers
  And no system agent invoke occurs

Scenario: System agent targets system agent
  Given system agent "Orchestrator" with use-agent is invoked for user U
  And system agent "Assistant" is active
  When the LLM calls use-agent with name "Assistant" and agentPrompt "Summarize"
  Then the nested invoke uses user U's system-call preference credential
  And the Assistant rule is applied as system context for the nested call

Scenario: System agent targets user's personal agent
  Given system agent "Orchestrator" is invoked for user U
  And user U owns personal agent "My bot" with connected credential
  When the LLM calls use-agent with name "My bot"
  Then the nested invoke uses "My bot" integrationCredentialId

Scenario: Name resolution when system and personal share a name
  Given system agent "Research" and user U's personal agent "Research" both exist
  And a system agent caller invokes use-agent with name "Research"
  Then the system catalog agent is selected first
  And personal agent "Research" is not invoked

Scenario: Target not found
  Given a caller allowed to list agents
  When the LLM calls use-agent with a name that does not exist in allowed scope
  Then the tool returns a clear not-found error
  And the parent tool loop may continue or fail per provider behavior

Scenario: Target missing credential
  Given personal agent "Writer" has no integrationCredentialId or credential is disconnected
  When use-agent targets "Writer"
  Then the tool returns an error indicating the target agent cannot run
  And the error does not leak credential secrets
```

### Story AIT-8 — Recursion depth limit for `use-agent`

**As the** platform, **I want** to cap nested agent delegation **so that** runaway chains cannot exhaust resources.

```gherkin
Scenario: Allow depth 0 to 2
  Given agent A invokes agent B via use-agent at depth 1
  And B invokes agent C via use-agent at depth 2
  Then both nested calls succeed when credentials and assignments allow

Scenario: Block depth 3
  Given the invoke chain has reached recursion depth 2
  When the LLM attempts another use-agent call
  Then the tool returns an error indicating maximum delegation depth exceeded
  And no further nested invoke is started

Scenario: Depth is tracked per root invoke
  Given two separate top-level invokes for the same user
  When each triggers use-agent chains
  Then recursion counters are independent per root invoke
```

### Story AIT-9 — Internal tools in async task execution

**As a** user who created a task, **I want** the assigned system agent's internal tools to work during background execution **so that** task results reflect full agent capability.

```gherkin
Scenario: executeTask loads internal tools
  Given a task is assigned to system agent "Assistant"
  And "Assistant" has assignedToolIds ["list-agents"]
  And the user has a valid system-call preference credential
  When executeTask runs asynchronously after POST /tasks
  Then the LLM invocation includes internal tools from the assigned system agent
  And list-agents uses the task owner's userId from task context

Scenario: executeTask respects recursion limit
  Given executeTask triggers a use-agent chain
  When depth 3 is attempted
  Then the same recursion error applies as synchronous invoke

Scenario: executeTask failure on missing credential
  Given the user has no system-call preference credential
  When executeTask runs
  Then the task fails with the existing MISSING_CREDENTIAL error path
  And no internal tool calls succeed without a root LLM client
```

### Story AIT-10 — Personal agent name uniqueness (enabler)

**As a** user, **I want** my personal agent names to be unique within my account **so that** `use-agent` can resolve targets unambiguously.

```gherkin
Scenario: Reject duplicate personal agent name on create
  Given I already have an active personal agent named "Writer"
  When I POST /agents with name "writer" (case-insensitive match)
  Then the API returns 409 conflict
  And no duplicate agent is created

Scenario: Reject duplicate on update
  Given I have agents "Alpha" and "Beta"
  When I PATCH "Beta" to name "Alpha"
  Then the API returns 409 conflict

Scenario: use-agent error when legacy duplicates exist
  Given two active personal agents share the same name due to legacy data
  When use-agent targets that name
  Then the tool returns an ambiguity error asking the user to rename agents
```

---

## 4. API Specifications

**Conventions:** GraphQL for reads; REST for commands. JWT required. Personal agent operations scoped to authenticated user; system agent writes require admin.

### 4.1 GraphQL — `internalTools` catalog query

```graphql
enum InternalToolAccessScope {
  SYSTEM_AND_PERSONAL
  SYSTEM_ONLY
}

type InternalTool {
  id: ID!
  displayName: String!
  description: String!
  accessScope: InternalToolAccessScope!
}

type Query {
  internalTools: [InternalTool!]!
}
```

- Returns all registry entries (static; same for all authenticated users).
- `accessScope` drives client-side picker filtering; server re-validates on write.

### 4.2 GraphQL — extend `Agent` and `SystemAgent`

```graphql
type Agent {
  # ... existing fields
  assignedToolIds: [ID!]!
}

type SystemAgent {
  # ... existing fields
  assignedToolIds: [ID!]!
}
```

- Default `[]` when unset in persistence layer.
- Exposed on list and detail reads where agent types are returned.

### 4.3 Extend `POST /api/agents` and `PATCH /api/agents/:id`

| Field | Type | Rules |
|-------|------|-------|
| `assignedToolIds` | `string[]` | Optional; default `[]`; unique ids; each id must exist in registry; each id must have `accessScope` allowing personal agents |

**Validation errors (400):**

- Unknown tool id
- Duplicate ids
- Tool not eligible for personal agents (`SYSTEM_ONLY`)

**Personal agent name (new/enforced):**

- Case-insensitive unique among active agents for `userId`
- **409 Conflict** on duplicate name at create/update

**Response:** Include `assignedToolIds: string[]` on agent DTO.

### 4.4 Extend `POST /api/system-agents` and `PATCH /api/system-agents/:id` (admin)

| Field | Type | Rules |
|-------|------|-------|
| `assignedToolIds` | `string[]` | Optional; default `[]`; unique ids; each id must exist in registry; system agents may assign any registry tool |

**Validation errors (400):** Unknown id, duplicate ids

**Response:** Include `assignedToolIds` on system agent DTO.

### 4.5 Extend invoke responses (personal and system)

**Success `200 OK`** — extend `metadata`:

```json
{
  "result": { "message": "string", "usage": { "promptTokens": 0, "completionTokens": 0 } },
  "metadata": {
    "model": "string",
    "mcpIdsUsed": ["string"],
    "skippedMcpIds": ["string"],
    "internalToolIdsUsed": ["string"],
    "skippedInternalToolIds": ["string"],
    "maxUseAgentDepth": 2
  }
}
```

- `internalToolIdsUsed`: ids of internal tools whose handlers ran at least once during the invoke.
- `skippedInternalToolIds`: assigned ids not bound (removed from registry or failed validation at load time).

### 4.6 Tool handler contracts (runtime, not public REST)

#### `list-agents`

| Aspect | Specification |
|--------|----------------|
| **LLM-visible params** | None (empty object or no properties) |
| **Server-injected context** | `userId`, `callerAgentType` (`personal` \| `system`), `callerAgentId` |
| **Personal caller result** | Active personal agents for `userId`: `{ name, description, category }` (minimal fields for LLM selection) |
| **System caller result** | Active system agents (catalog) plus active personal agents for `userId` with same field shape; distinguish `agentType` in each row |

#### `use-agent`

| Aspect | Specification |
|--------|----------------|
| **LLM-visible params** | `name: string` (required), `agentPrompt: string` (required, non-empty) |
| **Server-injected context** | `userId`, `callerAgentType`, `callerAgentId`, `recursionDepth` |
| **Target resolution** | Case-insensitive name match within allowed scopes; system catalog checked before personal when both allowed |
| **Nested invoke** | Target agent `rule` as system message; `agentPrompt` as user message; target's credential per product rules |
| **Target tools** | Nested invoke receives target's `assignedToolIds` and `assignedMcpIds` (merged tools) with incremented `recursionDepth` |
| **Depth limit** | Reject when `recursionDepth >= 2` before starting nested invoke |

---

## 5. UI/UX Requirements

### 5.1 `InternalToolAssignmentPicker` (personal + system forms)

- **Placement:** Below or adjacent to MCP assignment section; clearly labeled **Internal tools** (distinct from **MCP tools**).
- **Data source:** GraphQL `internalTools`, filtered client-side by agent type (`SYSTEM_ONLY` hidden on personal forms).
- **Interaction:** Multi-select dropdown or checkbox list; selected tools shown as removable chips with `displayName`.
- **Helper text:** Explain that internal tools are platform capabilities (agent list, delegation), not external integrations.
- **Empty registry state:** If no eligible tools, show short message (should not occur in v1).
- **Stale id:** If persisted id not in catalog (post-deploy removal), show warning chip on edit form; saving without removal fails validation.
- **Visual pattern:** Mirror `McpAssignmentPicker` spacing and chip styles for consistency; do not combine pickers into one control.

### 5.2 Personal agent form (`AgentForm`)

- Add `assignedToolIds` to form state, Zod validation, create/edit REST payloads.
- Show picker for all personal agent categories.

### 5.3 System agent form (`PlatformAgentsSection` / admin create-edit)

- Add `assignedToolIds` to admin form state and REST payloads.
- Show full eligible catalog for system agents.

### 5.4 Invoke modals (read-only summary, optional enhancement)

- Personal `AgentInvokeModal` and `SystemAgentInvokeModal` may show assigned internal tool display names as read-only summary (same pattern as assigned MCP names). Not blocking for v1 if schedule constrained.

### 5.5 Content & messaging

| Context | Copy |
|---------|------|
| Picker label | Internal tools |
| Picker helper | Platform capabilities such as listing agents and delegating to another agent. |
| Stale tool chip | This tool is no longer available. Remove it to save. |
| use-agent depth error (tool result) | Maximum agent delegation depth reached. |
| use-agent not allowed target | That agent cannot be invoked by this agent. |
| use-agent not found | No agent named "{name}" was found. |
| use-agent ambiguous name | Multiple agents match this name. Rename agents to continue. |
| use-agent missing credential | The selected agent does not have a connected AI integration. |

---

## 6. Data Model

### 6.1 Agent extensions

| Collection | Field | Type | Rules |
|------------|-------|------|-------|
| `agents` | `assignedToolIds` | `string[]` | Registry tool ids; unique; default `[]`; validated against registry + personal eligibility |
| `systemAgents` | `assignedToolIds` | `string[]` | Registry tool ids; unique; default `[]`; validated against registry |

No migration backfill required; mappers treat missing as `[]`.

### 6.2 Personal agent name uniqueness

- Enforce **case-insensitive uniqueness** on `{ userId, name }` among agents with `removedAt: null` and `status: active`.
- Add Mongo index to support efficient lookup: `{ userId: 1, name: 1 }` with case-insensitive collation or normalized `nameLower` field per implementation.

### 6.3 Internal tool registry (v1 static entries)

| ID | Display name | Access scope | LLM tool name (suggested) |
|----|--------------|--------------|---------------------------|
| `use-agent` | Use agent | `SYSTEM_AND_PERSONAL` | `use_agent` |
| `list-agents` | List agents | `SYSTEM_AND_PERSONAL` | `list_agents` |

Registry entry shape (code):

| Property | Description |
|----------|-------------|
| `id` | Stable string stored in `assignedToolIds` |
| `displayName` | UI and documentation label |
| `description` | Short text for picker and LLM tool description |
| `accessScope` | `SYSTEM_AND_PERSONAL` or `SYSTEM_ONLY` |
| `parameterSchema` | Zod/JSON schema for LLM-visible params only |
| `handler` | Server-side execution reference (not exposed to client) |

### 6.4 Runtime invocation context (transient, not persisted)

| Field | Purpose |
|-------|---------|
| `userId` | Owning user for personal agents and credential preference lookup |
| `callerAgentType` | `personal` \| `system` |
| `callerAgentId` | Id of agent whose config defined assigned tools |
| `recursionDepth` | Integer; `0` at root invoke; increment on each `use-agent` |
| `rootInvokeId` | Correlation id for logging across nested calls |

### 6.5 Runtime tool merge order

1. Load internal tools from `assignedToolIds` via registry.
2. Load MCP tools from `assignedMcpIds` (personal agents today; system when applicable).
3. Merge into single `DynamicStructuredTool[]` for `runToolCallLoop`.
4. On name collision between internal and MCP tool names, **internal tools take precedence**; log skipped MCP tool binding for observability.

---

## 7. Security & Authorization

| Rule | Specification |
|------|----------------|
| Authentication | All catalog reads and agent writes require JWT |
| Personal agent scope | CRUD and invoke limited to `userId` match |
| System agent writes | Admin only (existing rules) |
| `list-agents` data leakage | Never return another user's personal agents; system catalog entries are non-secret metadata |
| `use-agent` targeting | Personal callers: personal agents for `userId` only. System callers: system catalog + personal agents for `userId` |
| Credentials | Never expose integration secrets in tool inputs or outputs; resolve server-side per target agent |
| Recursion cap | Hard limit depth 2 for all invoke paths including `executeTask` |
| Tool surface minimization | Do not expose `userId`, admin ids, or raw credential ids in LLM tool schemas |
| Invoke errors | Tool errors return user-safe messages; log detailed errors server-side only |
| Archived agents | Excluded from list and cannot be targets of `use-agent` |

---

## 8. Non-Functional Requirements

| Concern | Target |
|---------|--------|
| Tool-call loop iterations | Reuse `MCP_TOOL_MAX_ITERATIONS = 10` for combined internal + MCP tools |
| Invoke timeout | 60 seconds per **root** invoke (nested `use-agent` calls count toward same root timeout budget) |
| Registry access | O(1) lookup by id in memory; no DB round-trip for catalog |
| Nested invoke overhead | p95 nested `use-agent` adds &lt; 15s under normal provider latency |
| Logging | Structured logs for tool load, `use-agent` depth, target resolution, skips |
| Tests | Vitest at domain + service layers for validation, scope, recursion; integration tests for merge + invoke metadata |
| Async parity | `executeTask` and synchronous system invoke share the same tool-loading path |

### 8.1 Accessibility (picker UI)

- Picker keyboard navigable; chips removable via keyboard.
- Screen readers announce tool display name and description.

### 8.2 Persistence

- `assignedToolIds` persisted on agent document only; no separate assignment collection.
- Removing a tool from registry in a future deploy does not auto-strip ids from agents; edit validation and runtime skip apply (mirror MCP stale behavior).

---

## 9. Implementation Phasing

| Phase | Deliverable | Dependencies |
|-------|-------------|--------------|
| **P1 — Registry & domain model** | Code registry, `assignedToolIds` on both agent models, validation schemas, personal name uniqueness | — |
| **P2 — Service & API** | REST create/update validation; GraphQL `internalTools` + type extensions; personal name 409 | P1 |
| **P3 — Runtime loaders** | Internal tool factory, merge with MCP in `client-langchain` / domain invoke path, metadata fields | P1, P2 |
| **P4 — Tool handlers** | `list-agents` and `use-agent` with scope, credentials, recursion | P3 |
| **P5 — UI pickers** | `InternalToolAssignmentPicker` on personal and system agent forms | P2 |
| **P6 — Invoke & async wiring** | Personal invoke, system invoke, `executeTask` share tool loading and depth tracking | P3, P4 |

Phases P5 and P6 can proceed in parallel after P4. P6 must complete for v1 acceptance.

---

## 10. Acceptance Criteria (QA checklist)

### Functional

- [ ] GraphQL `internalTools` returns exactly two entries in v1 with correct access scopes.
- [ ] Personal agent create/edit saves and reloads `assignedToolIds`.
- [ ] System agent admin create/edit saves and reloads `assignedToolIds`.
- [ ] Internal tools picker is visually and logically separate from MCP picker on both forms.
- [ ] Personal invoke with `list-agents` returns only that user's personal agents.
- [ ] System invoke with `list-agents` returns system + user's personal agents.
- [ ] `use-agent` uses target agent credentials (personal vs preference).
- [ ] Personal `use-agent` cannot invoke system agents.
- [ ] Third nested `use-agent` is blocked with clear error.
- [ ] `executeTask` loads internal tools for assigned system agent.
- [ ] Duplicate personal agent name returns 409 on create/update.
- [ ] Unknown `assignedToolIds` rejected on write with 400.

### UI/UX states

- [ ] Picker loading, empty eligible list, selected chips, stale tool warning.
- [ ] Invoke metadata shows `internalToolIdsUsed` / `skippedInternalToolIds` when applicable.

### Regression

- [ ] MCP assignment and invoke continue to work unchanged for personal agents.
- [ ] System agent invoke without internal tools assigned behaves as before.
- [ ] Task creation and failure paths (missing credential) unchanged except new tool behavior when assigned.

---

## 11. Success Metrics

| Metric | Definition |
|--------|------------|
| Internal tool adoption | % of active personal and system agents with ≥1 `assignedToolIds` entry |
| `use-agent` utilization | % of invokes where `internalToolIdsUsed` contains `use-agent` |
| Recursion blocks | Count of depth-exceeded errors per week (should be low) |
| Invoke success rate | Successful root invokes / total attempts with internal tools assigned |

---

## 12. Assumptions & Dependencies

- [Agent MCP Assignment](../agent-mcp-assignment/prd.md) patterns for assignment UX and invoke metadata are reference implementations.
- [Agent Management](../agent-management/prd.md) personal agent CRUD and [System Agent](../system-agent/prd.md) admin CRUD are live.
- `@vassembly/client-langchain` `runToolCallLoop` accepts arbitrary tool arrays; internal tools use same loop as MCP.
- Personal agents use per-agent `integrationCredentialId`; system agents and tasks use per-user system-call preference.
- [Async LLM Task Execution](../async-llm-task-execution/prd.md) `executeTask` handler is the async entry point for system agents.
- System agent invoke will be extended to structured invoke params (system message + tools) as part of this feature or a prerequisite refactor.
- MCP tools on system agents may be out of scope today; merge logic must still support MCP when added without rework.

---

*Document version: 1.0 — Ready for architecture design and phased implementation.*
