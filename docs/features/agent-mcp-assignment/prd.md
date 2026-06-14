# Product Requirements Document: Agent MCP Assignment

**Document status:** Approved for implementation  
**Last updated:** 2026-06-13  
**Feature slug:** `agent-mcp-assignment`  
**Related:** [Architecture](./architecture.md) · [Agent Management](../agent-management/prd.md) · [MCP Configuration Management](../mcp-configuration-management/prd.md) · [System Agent](../system-agent/prd.md)

---

## 1. Executive Summary

### 1.1 Problem

Users can configure MCP integrations with their own credentials, but cannot attach those MCPs to agents. Agents therefore cannot use MCP tools at runtime. There is also no visibility into which agents use a given MCP, and no way to remove an assignment from the MCP detail page.

### 1.2 Solution

Extend **all personal user agents** (categories: `coding`, `personal`, `utility`) with up to **five** assigned MCPs from the user's **configured** MCP catalog. Users manage assignments on the agent create/edit screen and view or remove assignments from the MCP detail page (configured MCPs only). When a user invokes a personal agent, assigned MCPs are resolved into **tools** and passed to the LLM call. A **Run agent** modal mirrors the existing platform-agent invoke experience.

### 1.3 Value proposition

| Stakeholder | Value |
|-------------|-------|
| **End user** | Agents can act on email, search, and other MCP-backed capabilities using saved credentials |
| **Platform** | Completes the MCP configuration → agent → runtime loop started in MCP Configuration Management |
| **Engineering** | Reuses agent ↔ AI credential patterns (~70%); indexed reverse lookup; GraphQL reads / REST commands |

### 1.4 Resolved product decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Agent scope | **All personal user agents** (all categories). System/platform agents remain out of scope. |
| 2 | MCP config delete with assigned agents | **Allow delete with warning** — mirror AI credential delete; stale `mcpId` may remain on agents until user edits or unassigns |
| 3 | Personal agent invoke UI | **Include invoke modal** on agent list/detail, patterned after `SystemAgentInvokeModal` |
| 4 | Runtime MCP coverage (v1) | **User confirmed:** implement runtime adapters for **both** seed catalog MCPs — `google-workspace-mcp` (Gmail MCP) and `brave-search-mcp`. Unknown future slugs are skipped at invoke with a warning; assignment UX still works. |
| 5 | Assignment storage | `assignedMcpIds: string[]` on agent document (catalog MCP ids, max 5) |

---

## 2. Feature Overview & Scope

### 2.1 In scope (v1)

| Area | Deliverable |
|------|-------------|
| **Data model** | `assignedMcpIds` on personal agents; Mongo indexes for reverse lookup |
| **Agent form** | `McpAssignmentPicker` — multi-select from configured MCPs; selected list with remove; `N/5` counter |
| **Agent create/edit API** | `assignedMcpIds` on `POST` / `PATCH /agents` with validation |
| **MCP detail page** | `McpAgentsSection` — agents using this MCP (configured MCPs only); remove with confirm |
| **Reverse lookup API** | GraphQL `mcpWithAgents`; `agentUsageCount` on MCP list/detail |
| **Unassign from MCP detail** | `DELETE /mcps/:mcpId/agents/:agentId` |
| **Personal agent invoke** | `POST /agents/:id/invoke` with MCP tools in LLM call |
| **Invoke UI** | `AgentInvokeModal` on personal agent list (Run action), mirroring platform agent modal |
| **Runtime adapters** | `google-workspace-mcp`, `brave-search-mcp` |

### 2.2 Out of scope (v1)

| Item | Notes |
|------|-------|
| System/platform agent MCP assignment | Separate `domain-system-agent` |
| Team/shared MCP configs | One config per user per MCP |
| Dedicated MCP ordering semantics for invoke | Array order = display order only |
| Auto-strip stale `mcpId` from agents on config delete | Warn only; user must fix via edit or unassign |
| Enriched `assignedMcps` GraphQL join | Return ids only; client resolves names via `userConfiguredMcps` |
| Admin MCP catalog CRUD | Catalog remains seed-driven |
| MCP config schema versioning | Unchanged from MCP Configuration Management |

---

## 3. User Stories & Acceptance Criteria

### Story AMA-1 — Assign configured MCPs on agent create/edit

**As a** logged-in user, **I want** to select MCPs from my configured list when creating or editing an agent **so that** the agent can use those tools at runtime.

```gherkin
Scenario: Assign configured MCPs on create
  Given I am authenticated
  And I have configured MCPs "Gmail MCP" and "Brave Search MCP"
  When I create an agent and select both MCPs in the assignment picker
  Then the agent is saved with both catalog ids in assignedMcpIds
  And both appear in the selected MCP list on the form

Scenario: Picker shows only configured MCPs
  Given I am authenticated
  And "Brave Search MCP" is not configured for me
  When I open the agent form MCP picker
  Then "Brave Search MCP" is not available for selection
  And I see a link to configure MCPs at /mcps

Scenario: Maximum five MCPs
  Given I have five MCPs already selected on the agent form
  When I attempt to add a sixth
  Then the picker prevents selection
  And the counter shows "5/5"

Scenario: Reject more than five via API
  Given I have six configured MCPs
  When I POST /agents with six assignedMcpIds
  Then the API returns 400 validation error
  And no agent is created

Scenario: Reject unconfigured MCP via API
  Given "Brave Search MCP" is not configured for me
  When I PATCH an agent with its catalog id in assignedMcpIds
  Then the API returns 400 with message indicating MCP is not configured
```

### Story AMA-2 — View and remove MCPs on agent form

**As a** logged-in user, **I want** to see my selected MCPs and remove any I no longer need **so that** I control what tools the agent uses.

```gherkin
Scenario: Remove MCP from agent form
  Given I am editing an agent with "Gmail MCP" and "Brave Search MCP" assigned
  When I remove "Brave Search MCP" from the selected list
  And I save the agent
  Then assignedMcpIds contains only the Gmail MCP catalog id

Scenario: Stale MCP warning on edit
  Given my agent references an MCP I deleted configuration for
  When I open the agent edit form
  Then I see a warning on the stale MCP chip
  And saving without removing it fails configured-only validation
```

### Story AMA-3 — Same MCP on multiple agents

**As a** logged-in user, **I want** to assign the same MCP to multiple agents **so that** I reuse integrations across use cases.

```gherkin
Scenario: Shared MCP across agents
  Given I have agents "Research bot" and "Email triage"
  When I assign "Gmail MCP" to both
  Then both agents persist the same mcpId in assignedMcpIds
```

### Story AMA-4 — MCP detail shows agents (configured only)

**As a** logged-in user, **I want** to see which agents use a configured MCP **so that** I understand impact before changing configuration.

```gherkin
Scenario: Agents section on configured MCP detail
  Given I have configured "Gmail MCP"
  And assigned it to agent "Research bot"
  When I open /mcps/{gmailId}
  Then I see an "Agents using this MCP" section listing "Research bot"

Scenario: Agents section hidden when not configured
  Given "Brave Search MCP" is not configured for me
  When I open /mcps/{braveId}
  Then the agents section is not shown

Scenario: Empty agents state
  Given I have configured "Gmail MCP" but no agents use it
  When I open /mcps/{gmailId}
  Then I see an empty state in the agents section
```

### Story AMA-5 — Remove MCP from agent on MCP detail

**As a** logged-in user, **I want** to remove an MCP from an agent from the MCP detail page **so that** I can manage assignments without opening each agent.

```gherkin
Scenario: Unassign from MCP detail
  Given "Gmail MCP" is assigned to "Research bot"
  When I click Remove next to "Research bot" and confirm
  Then DELETE /mcps/{gmailId}/agents/{agentId} succeeds
  And "Research bot" no longer lists "Gmail MCP" in assignedMcpIds
  And the agents section updates without full page reload
```

### Story AMA-6 — MCP config delete with assigned agents

**As a** logged-in user, **I want** to delete an MCP configuration even when agents reference it **so that** I am not blocked, but I am warned about impact.

```gherkin
Scenario: Delete config with warning
  Given "Gmail MCP" is assigned to one or more agents
  When I delete my Gmail MCP configuration
  Then deletion succeeds after I acknowledge a warning listing affected agent count
  And agents retain the mcpId in assignedMcpIds until edited or unassigned
  And invoke skips the deleted config
```

### Story AMA-7 — Invoke personal agent with MCP tools

**As a** logged-in user, **I want** to run my agent from the UI **so that** assigned MCPs are used in the LLM response.

```gherkin
Scenario: Invoke via modal
  Given I own agent "Research bot" with a connected AI integration and assigned MCPs
  When I click Run on the agent list and submit a message in the invoke modal
  Then POST /agents/{id}/invoke is called
  And I see the LLM response in the modal
  And response metadata includes mcpIdsUsed when tools were bound

Scenario: Invoke without AI integration
  Given my agent has no integrationCredentialId or credential is disconnected
  When I open the invoke modal
  Then I see a blocking warning to configure an AI integration first

Scenario: Invoke skips unconfigured or unsupported MCPs
  Given my agent has a stale mcpId or an MCP slug without a runtime adapter
  When I invoke the agent
  Then invoke continues with remaining tools
  And skipped MCPs are reported in metadata

Scenario: Invoke uses agent's integration credential
  Given my agent has integrationCredentialId set to a connected credential
  When I invoke without override
  Then the LLM call uses that credential
```

---

## 4. API Specifications

**Conventions:** GraphQL for reads; REST for commands. All endpoints require JWT. Operations scoped to authenticated user.

### 4.1 Extend `POST /api/agents` and `PATCH /api/agents/:id`

| Field | Type | Rules |
|-------|------|-------|
| `assignedMcpIds` | `string[]` | Optional; default `[]`; max 5; unique ids; each must exist in catalog and have user config |

**Validation errors (400):**

- More than 5 ids
- Duplicate ids
- Catalog id not found
- MCP not configured for user (`"MCP is not configured"`)

**Response:** Include `assignedMcpIds: string[]` on agent DTO.

### 4.2 GraphQL — extend `Agent` and add `mcpWithAgents`

```graphql
type Agent {
  # ... existing fields
  assignedMcpIds: [ID!]!
}

type McpWithAgents {
  mcp: Mcp!
  configurationStatus: McpConfigurationStatus!
  agentUsageCount: Int!
  agents: [Agent!]!
  totalCount: Int!
  page: Int!
  size: Int!
}

type Query {
  mcpWithAgents(mcpId: ID!, page: Int, size: Int): McpWithAgents!
}
```

Extend `Mcp` type with `agentUsageCount: Int!` on list and detail queries.

### 4.3 `DELETE /api/mcps/:mcpId/agents/:agentId`

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Effect** | Remove `mcpId` from `assignedMcpIds` on owned agent |
| **Preconditions** | User owns agent; MCP catalog id valid |
| **Success** | `200 OK` with updated agent or `{ success: true }` |

**Errors:** `401`, `404` (agent not found / not owned / mcpId not on agent)

### 4.4 `POST /api/agents/:id/invoke`

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Body** | `{ "message": string }` — required, non-empty |
| **Preconditions** | Agent owned by user; `integrationCredentialId` resolves to connected credential |
| **Behavior** | Resolve MCP tools from `assignedMcpIds` + user configs; invoke LLM with tool loop |

**Success:** `200 OK`

```json
{
  "result": {
    "message": "string",
    "usage": { "promptTokens": 0, "completionTokens": 0 }
  },
  "metadata": {
    "model": "string",
    "mcpIdsUsed": ["string"],
    "skippedMcpIds": ["string"]
  }
}
```

**Errors:** `401`, `404`, `400` (missing message, no credential, invoke failure)

### 4.5 Extend MCP configuration delete

When deleting user MCP configuration, if `agentUsageCount > 0`, return or surface a **warning** with count of affected agents before confirming. Deletion proceeds on confirm (no block).

---

## 5. UI/UX Requirements

### 5.1 Agent form — `McpAssignmentPicker`

- Placed on create and edit agent forms (all agent categories).
- Data source: `useUserConfiguredMcps` (configured MCPs only).
- Selected MCPs shown as removable chips/list with name and icon.
- Counter: `N/5` assigned.
- Empty state: message + link to `/mcps` to configure MCPs.
- Stale MCP chip: warning style when config no longer exists.
- Mirror visual patterns from `IntegrationCredentialPicker`.

### 5.2 MCP detail — `McpAgentsSection`

- Visible only when `configurationStatus === 'configured'`.
- Lists agent name, category, link to edit; Remove action with confirm dialog.
- Pagination if more than default page size.
- Empty state when no agents use this MCP.

### 5.3 Agent list — invoke modal (`AgentInvokeModal`)

Pattern after `SystemAgentInvokeModal`:

| Element | Behavior |
|---------|----------|
| **Trigger** | Run action on personal agent row/card |
| **Header** | Agent name, category tag, description |
| **Message** | Required multiline input |
| **Connection** | Show agent's `integrationCredentialId` credential name and connection status |
| **Blocking state** | Warn if no credential or not connected |
| **Assigned MCPs** | Read-only summary of assigned MCP names (from `userConfiguredMcps` lookup) |
| **Response** | Display LLM message; usage summary when available |
| **Actions** | Cancel, Run, Run again after success |

No connection override required for v1 unless product adds debug override later.

### 5.4 MCP list cards (optional enhancement)

- Show `agentUsageCount` badge when > 0 (from enriched MCP list query).

---

## 6. Data Model

### 6.1 Agent extension

| Field | Type | Rules |
|-------|------|-------|
| `assignedMcpIds` | `string[]` | Catalog `McpModel.id`; max 5; unique; default `[]` |

Stored on existing `agents` collection. No migration backfill; mapper treats missing as `[]`.

### 6.2 Indexes

- `{ assignedMcpIds: 1 }` (multikey)
- `{ userId: 1, assignedMcpIds: 1 }`

### 6.3 Runtime MCP adapters (v1)

Each catalog MCP has a **slug**. At invoke time, a **runtime adapter** per slug maps user config → `McpServerConfig`; `@langchain/mcp-adapters` (`MultiServerMCPClient` in `client-langchain`) discovers tools and wires them to the LLM.

| Slug | Catalog name | v1 runtime |
|------|--------------|------------|
| `google-workspace-mcp` | Gmail MCP | Required |
| `brave-search-mcp` | Brave Search MCP | Required |
| *(unknown)* | Future catalog entries | Skipped at invoke; assignment still allowed if configured |

**Note:** *Test adapters* (used by "Test connection" on MCP config) verify credentials. *Runtime adapters* map config to server connection params. *`@langchain/mcp-adapters`* handles MCP protocol, tool discovery, and LangChain tool binding.

---

## 7. Security & Authorization

- All operations scoped to authenticated user.
- Agent writes and invoke: `userId` must match JWT.
- `mcpWithAgents` and unassign: only agents owned by user; MCP must be configured for user to show agents section.
- MCP credentials never returned in assignment or invoke APIs; resolved server-side only.
- Invoke errors must not leak raw MCP secrets or provider tokens.

---

## 8. Non-Functional Requirements

| Concern | Target |
|---------|--------|
| Tool-call loop | Max `MCP_TOOL_MAX_ITERATIONS = 10` |
| Invoke timeout | 60 seconds |
| Reverse lookup | Indexed Mongo queries (no full agent collection scan) |
| Tests | Vitest at domain + service layers; E2E for picker and MCP agents section |

---

## 9. Implementation Phasing

| Phase | Deliverable |
|-------|-------------|
| **P1** | Domain model, queries, indexes |
| **P2** | Service validation, REST + GraphQL API |
| **P3** | Agent form `McpAssignmentPicker` |
| **P4** | Reverse lookup + `agentUsageCount` |
| **P5** | MCP detail `McpAgentsSection` |
| **P6** | `@langchain/mcp-adapters` in `client-langchain`, runtime adapters, invoke API + `AgentInvokeModal` |

Phases P3 and P4 can run in parallel after P2. P6 depends on P2.

---

## 10. Success Metrics

| Metric | Definition |
|--------|------------|
| Assignment adoption | % of active agents with ≥1 assigned MCP |
| Invoke with tools | % of personal invokes where `mcpIdsUsed.length > 0` |
| Unassign from MCP detail | Count of unassign actions per month |
| Invoke success rate | Successful invokes / total attempts |

---

## 11. Assumptions & Dependencies

- [MCP Configuration Management](../mcp-configuration-management/prd.md) is shipped.
- [Agent Management](../agent-management/prd.md) CRUD and `integrationCredentialId` are live.
- Personal agents use per-agent AI integration credential (not system preference).
- `@langchain/mcp-adapters` integrated in `@vassembly/client-langchain` for MCP tool loading (no separate `client-mcp` package).
- System agent invoke (`SystemAgentInvokeModal`) is the UI reference for personal invoke modal.

---

*Document version: 1.0 — Approved for phased implementation per [architecture.md](./architecture.md).*
