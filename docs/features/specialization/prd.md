# Product Requirements Document: Specialization (Vassembly)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-06-24  
**Related PRDs:** [System Agent](../system-agent/prd.md), [Agent MCP Assignment](../agent-mcp-assignment/prd.md), [Async LLM Task Execution](../async-llm-task-execution/prd.md)  
**Feature slug:** `specialization`

---

## Phase 1.1 — Delta Requirements

> These requirements refine or extend Phase 1 requirements based on post-implementation review. They do not replace existing requirements.

| ID | Change | Affected §§ |
|---|---|---|
| Δ-FR-EX-1 | Classification must be **idempotent**: if `task.specializationIds` is already set (resume/retry), skip classification silently — do not re-classify | §8.2 (new skip condition) |
| Δ-FR-UI-2 | **Task detail page** must display linked specialization(s) — name + link to `/specialization/[id]` — for admin users when `task.specializationIds` is non-empty | §4.6 new row, §7 new subsection |
| Δ-FR-UI-3 | **MCP detail page** must display linked specialization(s) — name + link to `/specialization/[id]` — for admin users when `mcp.specializationIds` is non-empty | §4.6 new row |
| Δ-FR-UI-4 | **Specialization list** must show correct agent and MCP counts (currently always 0 due to missing enrichment) | §4.6 FR-UI-4 — bug fix |
| Δ-FR-UI-5 | **Specialization detail agents panel** must show a **dynamic list** of all agents linked to the specialization — not fixed researcher/worker/validator slots | §7.3 replaces fixed slot design |
| Δ-FR-AG-1 | After provisioning new specialization agents, an async LLM call must generate a concise description for each agent (fire-and-forget, non-blocking) | §4.4 new row FR-IT-9 |

### Δ-FR-EX-1: Classification skip condition addition

Add to §8.2 (Classification invocation rules), after the existing skip conditions:

> **Additional skip condition (idempotency):** If `task.specializationIds` is already populated (non-empty array), skip classification entirely. This ensures resume and retry flows do not re-classify tasks that have already been classified.

### Δ-FR-UI-5: Dynamic agents panel (replaces fixed slots)

Replaces the fixed researcher/worker/validator slot design in §7.3:

- The agents panel on the specialization detail page renders **all agents** where `agent.specializationId === specialization.id`
- Each agent row: name, status badge, link to system agent edit page
- Empty state: "No agents linked to this specialization." when `agents.length === 0`
- No fixed role labels (Researcher / Worker / Validator) — roles are implicit in agent names
- Future-proof: additional agent roles per specialization are supported without UI changes

### Δ-FR-AG-1: Agent description auto-generation

Adds FR-IT-9 to §4.4:

| FR-IT-9 | After agent creation, fire-and-forget an LLM call to generate a description for each newly provisioned agent. Must not block specialization creation, agent provisioning, or task execution. Failure is logged but does not roll back any created resources. | Agents may briefly have empty descriptions until LLM call completes (seconds–minutes). |

---

## 1. Executive Summary

### 1.1 Problem

The Vassembly platform currently routes all tasks through generic worker agents regardless of the domain knowledge required. A legal research task, a software engineering task, and a financial analysis task all reach the same "Task worker" with no domain-specific context, tools, or instructions. As the platform grows, general-purpose agents produce lower-quality outputs for domain-specific work, and there is no mechanism for the platform to acquire or organize domain knowledge systematically.

Additionally, MCPs (Model Context Protocol servers) are not mapped to any domain — administrators cannot tell which MCPs are relevant to legal work versus engineering work without manual inspection.

### 1.2 Solution

**Specialization** is an AI-managed domain taxonomy that classifies tasks into subject-matter areas (e.g., "legal", "engineering", "finance") and provisions purpose-built agent sets for each domain. The system introduces:

1. A **Specialization entity** — an immutable, AI-generated domain tag with a name and description.
2. A **Specialization Classifier** system agent — invoked in the Assistant agent flow after intent classification to assign up to 3 specializations to a task or create new ones on demand.
3. A **MCP Specialization Classifier** system agent — triggered when a new specialization is created; maps relevant MCPs to it automatically.
4. An **internal tool** — `create-specialization` — that orchestrates creation of a new specialization plus its full agent set (researcher, worker, validator) when the classifier determines a new domain is needed.
5. A **read-only admin UI** — for operators to observe the specialization catalog, their linked agents, and their mapped MCPs.

Phase 1 delivers the infrastructure layer and admin visibility. Worker routing (using specialization-scoped agents to resolve tasks) is Phase 2.

### 1.3 Success metrics

| Metric | Target (90 days post Phase 1) | Measurement |
|--------|-------------------------------|-------------|
| Specialization coverage | ≥ 70% of new tasks receive at least 1 specialization ID | `task.specializationIds` fill-rate in task collection |
| Classification accuracy | ≥ 85% admin-rated accuracy on sampled classifications (spot-check) | Admin review via specialization detail view |
| MCP mapping quality | ≥ 80% of MCPs mapped to ≥ 1 specialization within 30 days of first classification | MCP `specializationIds` fill-rate |
| Agent-set provisioning | 100% of new specializations have all 3 agents (researcher, worker, validator) created within 60 s | Agent creation audit log |
| Duplicate prevention | 0 duplicate specialization names in the collection | DB unique index enforcement |

### 1.4 Phasing summary

| Phase | Deliverable |
|-------|-------------|
| **1 — Infrastructure** | Specialization entity, classifier agent, MCP mapping agent, internal provisioning tool, admin read-only UI, GraphQL reads, REST commands (internal) |
| **2 — Worker routing** | Route task/schedule/routine/question workers to use specialization-scoped agents when a matching specialization agent exists |
| **3 — End-user visibility** | Specialization tags displayed on task detail page for end users |
| **4 — Admin governance** | Admin create/edit specializations manually; merge/split tooling |

---

## 2. User Personas

| Persona | Description | Primary interaction |
|---------|-------------|---------------------|
| **End User** | Creates tasks via prompt; has no awareness of specialization internals | Specialization assigned automatically; visible in Phase 3 |
| **Platform Admin** | Inspects specialization catalog, linked agents, and MCP mappings | Read-only admin UI (Phase 1) |
| **System (AI)** | The Specialization Classifier and internal tool acting as automated actors | Creates specializations, provisions agent sets, maps MCPs |

---

## 3. User Stories

Stories use **Gherkin** acceptance criteria. IDs follow the `SP-N` convention.

### End-user stories

**SP-1 — Task automatically classified into specializations**

```gherkin
As an end user
I want my task prompt to be automatically classified into relevant specialization domains
So that the platform can use domain-appropriate agents (Phase 2) and I can understand my task context (Phase 3)

Scenario: Prompt classified into existing specialization
  Given I am authenticated and submit a task prompt
  And at least one specialization exists that matches the domain
  When the Assistant agent flow processes my prompt
  Then my task record has specializationIds populated with 1–3 matching specialization IDs
  And the classification completes within the task processing flow

Scenario: Prompt triggers new specialization creation
  Given I am authenticated and submit a task prompt
  And no existing specialization matches the domain
  When the Specialization Classifier determines a new specialization is needed
  Then a new specialization is created with a generated name and description
  And the researcher, worker, and validator agents are provisioned for the new specialization
  And relevant MCPs are mapped to the new specialization
  And my task record has specializationIds populated with the new specialization ID

Scenario: Classification skipped on missing credential
  Given I am authenticated and submit a task prompt
  And my AI integration credential is missing or inactive
  When the Specialization Classifier runs
  Then classification is skipped gracefully
  And my task is processed without specializationIds set
  And no error is surfaced to me
```

**SP-2 — Task receives at most 3 specializations**

```gherkin
As an end user
I want my task to be focused on the most relevant specializations
So that domain routing remains precise rather than over-broad

Scenario: Classifier respects maximum of 3 specializations
  Given a task prompt touches multiple domains
  When the Specialization Classifier assigns specializations
  Then at most 3 specialization IDs are written to task.specializationIds
  And the classifier system prompt guides it to prefer fewer specializations

Scenario: Single-domain prompt gets one specialization
  Given a task prompt is clearly within one domain (e.g., "draft an NDA")
  When the Specialization Classifier runs
  Then exactly 1 specialization ID is returned
```

### Admin stories

**SP-3 — Browse specialization catalog**

```gherkin
As a platform admin
I want to view all existing specializations in a paginated, searchable list
So that I can audit which domains the platform has acquired

Scenario: Admin views paginated specialization list
  Given I am authenticated as admin
  And at least one specialization exists
  When I navigate to the Specializations admin page
  Then I see a paginated list of specializations (name, description, agent count, MCP count, created date)
  And I can search by name

Scenario: Empty catalog
  Given no specializations exist
  When I navigate to the Specializations admin page
  Then I see an empty state: "No specializations have been created yet."
```

**SP-4 — View specialization detail**

```gherkin
As a platform admin
I want to view the detail of a single specialization
So that I can see its linked agents and mapped MCPs

Scenario: Admin views specialization detail
  Given a specialization "Legal" exists with 3 agents and 2 linked MCPs
  When I click the specialization in the list
  Then I see: name, description, the 3 linked system agents (researcher, worker, validator), and the linked MCPs

Scenario: Detail shows unlinked agents
  Given a specialization exists but provisioning of one agent failed
  When I view the specialization detail
  Then I see the missing agent slot with a "Not provisioned" indicator
```

**SP-5 — Admin cannot mutate specializations (Phase 1)**

```gherkin
As a platform admin
I want to understand that specializations are read-only in Phase 1
So that I do not expect edit or delete controls

Scenario: No create/edit/delete UI in Phase 1
  Given I am on the Specializations admin page
  Then there is no "Create specialization" button
  And there is no edit or delete action on any specialization item
```

---

## 4. Functional Requirements

Each requirement includes **acceptance criteria** checkboxes for QA.

### 4.1 Specialization data model

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-DM-1 | A `specializations` MongoDB collection stores name (unique, required), description (required), createdAt, updatedAt. | Duplicate name returns 409; no userId ownership. |
| FR-DM-2 | Specializations are immutable once created: no update, no archive, no delete in Phase 1. | No PATCH/DELETE route exposed on the specialization resource. |
| FR-DM-3 | `TaskModel` gains `specializationIds: string[]` — nullable, defaults absent (undefined/null). | Existing tasks without field are unaffected; no migration required (MongoDB schemaless). |
| FR-DM-4 | `SystemAgentModel` gains optional `specializationId: string` — links a system agent to its owning specialization. | Existing system agents without field are unaffected. |
| FR-DM-5 | `McpModel` gains `specializationIds: string[]` — set automatically by MCP Specialization Classifier, never via user input. | Existing MCPs without field are unaffected; field may be empty array or absent. |

**Specialization document shape**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required; max 100; unique (case-insensitive); trimmed |
| `description` | string | Required; max 500; AI-generated |
| `id` | string | System-set |
| `createdAt` | timestamp | System-set on create |
| `updatedAt` | timestamp | System-set on create; immutable after Phase 1 |

**Updated model additions**

| Model | New field | Type | Rules |
|-------|-----------|------|-------|
| `TaskModel` | `specializationIds` | `string[] \| null` | Max 3 items; set by classifier flow only |
| `SystemAgentModel` | `specializationId` | `string \| null` | References parent specialization; set on agent creation |
| `McpModel` | `specializationIds` | `string[]` | Set by MCP Specialization Classifier; never by user |

### 4.2 Specialization Classifier system agent

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SC-1 | A new system agent named `"Specialization classifier"` is added to the system agent seed. | Agent present in `systemAgents.json` seed after migration. |
| FR-SC-2 | The agent has no tools assigned (`assignedToolIds: []`). | Invocation uses no external tools. |
| FR-SC-3 | The agent's rule instructs it to: (a) return 1–3 specialization names from the existing catalog when a match exists, or (b) return a new specialization name + description when no existing match fits. | System prompt documented in seed entry. |
| FR-SC-4 | The Specialization Classifier is invoked in the **Assistant agent flow only**, after intent classification resolves. | No invocation in async task-create handlers (e.g., `generateTaskCategory`, `generateTaskTitle`). |
| FR-SC-5 | The classifier output is normalized: validated against existing specialization names, max 3, deduplicated. | `normalizeGeneratedSpecializations` utility returns `{ specializationIds: string[] }` or `{ isNew: true, name: string, description: string }`. |
| FR-SC-6 | On valid existing specialization match: `task.specializationIds` is updated via the existing `updateTask` command. | Field persists in DB; verified via GraphQL `task.specializationIds`. |
| FR-SC-7 | On new specialization signal: the `create-specialization` internal tool is invoked with the returned name + description. | Tool call visible in agent execution log. |
| FR-SC-8 | Graceful degradation: skip on empty task description, missing AI credential, or malformed classifier output — mirror `generateTaskCategory` skip logic. | Task processed without specializationIds; no error surfaced to user. |

### 4.3 MCP Specialization Classifier system agent

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-MC-1 | A new system agent named `"MCP specialization classifier"` is added to the system agent seed. | Agent present in seed; has no tools. |
| FR-MC-2 | This agent is invoked **only** when a new specialization is created, as part of the `create-specialization` internal tool flow. | Not invoked on existing specialization assignments. |
| FR-MC-3 | The agent receives the new specialization's name and description plus the full list of MCP names and descriptions. | Prompt constructed from specialization + MCP catalog data. |
| FR-MC-4 | The agent returns 0 or more MCP IDs/slugs it considers relevant to the specialization. | Output parsed and validated against known MCP IDs. |
| FR-MC-5 | For each returned MCP, the specialization ID is appended to `mcp.specializationIds` via an internal MCP update command — no admin approval required. | `mcp.specializationIds` updated in DB; verified via GraphQL `mcp.specializationIds`. |
| FR-MC-6 | Graceful degradation: if MCP classifier fails, malformed output, or empty catalog — skip MCP mapping silently; specialization and agents still created. | No rollback of specialization/agents on MCP mapping failure. |

### 4.4 `create-specialization` internal tool

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-IT-1 | A new internal tool `create-specialization` is implemented following existing internal tool patterns (e.g., `update-task`). | Tool registered and callable within agent execution context. |
| FR-IT-2 | Input: `{ name: string, description: string }`. | Validated at tool boundary. |
| FR-IT-3 | The tool first checks for an existing specialization by name (case-insensitive) — if found, returns existing ID without creating a duplicate. | Idempotent: concurrent calls with same name yield one specialization. |
| FR-IT-4 | On new specialization: creates the specialization document, then provisions 3 system agents: `"{name} researcher"`, `"{name} worker"`, `"{name} validator"` (title-cased name, space-separated, matching existing naming convention). | All 3 agents have `specializationId` set; `category` follows system agent category rules. |
| FR-IT-5 | Each provisioned agent has no tools assigned (`assignedToolIds: []`) and a default rule appropriate for its role (researcher, worker, validator). | Rules set at creation; editable by admin later. |
| FR-IT-6 | After specialization + agents are created, the tool invokes the MCP Specialization Classifier (FR-MC-2 through FR-MC-6). | MCP mapping triggered after agent creation; failures do not block tool completion. |
| FR-IT-7 | The tool returns `{ specializationId: string, isNew: boolean }`. | Callers can distinguish creation from idempotent retrieval. |
| FR-IT-8 | All steps are logged with structured events (created, agents-provisioned, mcps-mapped, skipped, failed). | Observable via platform logs. |

### 4.5 System agent seed additions

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SS-1 | `"Specialization classifier"` added to `systemAgents.json` seed with: category `utility`, no tools, appropriate rule. | Seed idempotent on re-run; agent not duplicated. |
| FR-SS-2 | `"MCP specialization classifier"` added to `systemAgents.json` seed with: category `utility`, no tools, appropriate rule. | Seed idempotent on re-run. |
| FR-SS-3 | Both agents added to `SYSTEM_AGENT_NAME` enum in `packages/constants`. | TypeScript compilation passes with new enum members. |
| FR-SS-4 | Neither new agent appears in the user-facing catalog (they are internal utility agents). | Catalog API filters by relevant category/type if applicable. |

### 4.6 Admin UI — Specializations page

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-UI-1 | A new **Specializations** link appears in the Workspace navbar (after MCPs). | Link visible only to admin role; routes to `/specialization`. |
| FR-UI-2 | The page renders a paginated list of specializations (default 20 per page). | Pagination controls visible when total > 20. |
| FR-UI-3 | Search input filters by specialization name (debounced, min 1 char). | Results update without full page reload. |
| FR-UI-4 | Each list row displays: name, description (truncated to 80 chars), agent count, MCP count, creation date. | Counts accurate to DB state. |
| FR-UI-5 | Clicking a row navigates to the specialization detail page `/specialization/[id]`. | Back navigation returns to list with state preserved. |
| FR-UI-6 | Detail page displays: name, full description, the 3 linked system agents (name, status), linked MCPs (name, slug). | Data fetched via GraphQL. Missing agents shown as "Not provisioned". |
| FR-UI-7 | No create, edit, or delete controls exist on the list or detail page (Phase 1 read-only). | UI has no mutation affordance. |
| FR-UI-8 | Admin role required for all Specializations routes — non-admins receive 403 / redirect. | Role enforced server-side and in route guard. |
| FR-UI-9 | Loading, empty, and error states implemented for list and detail views following MCP catalog UI patterns (`apps/web/app/mcps/`). | All three states visually distinct. |

### 4.7 API surface

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-API-1 | GraphQL query `specializations(search, page, size)` returns paginated specialization list. | Returns `{ items, page, size, total }`. |
| FR-API-2 | GraphQL query `specialization(id)` returns single specialization with linked agent IDs and MCP IDs. | Returns null / error for unknown ID. |
| FR-API-3 | No user-facing REST write endpoints for specializations in Phase 1 (creation is internal only). | No `POST /api/specializations` or `PATCH /api/specializations/:id` exposed. |
| FR-API-4 | Internal REST command for specialization creation is accessible only within the service boundary (not exposed through API gateway). | No external route registered. |
| FR-API-5 | All GraphQL specialization queries require authenticated admin role. | Non-admin queries return 403. |

### 4.8 Authorization

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-AZ-1 | All specialization GraphQL queries require `role === admin`. | Non-admin → 403. |
| FR-AZ-2 | Specialization creation is only possible through the `create-specialization` internal tool (not via REST or GraphQL from outside the service). | No public create endpoint. |
| FR-AZ-3 | MCP `specializationIds` updates are system-initiated — not settable via user or admin APIs. | MCP update endpoint ignores / rejects `specializationIds` field from external input. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Area | Target |
|------|--------|
| Specialization list query | p95 < 300 ms for ≤ 500 specializations |
| Specialization detail query | p95 < 200 ms |
| Classification step in Assistant flow | p95 < 5 s (LLM call); server overhead < 100 ms excluding provider |
| `create-specialization` tool end-to-end | p95 < 30 s (3 agent creations + MCP classifier LLM call) |
| MCP specialization mapping (async) | Non-blocking to task processing; completes within 60 s of specialization creation |

### 5.2 Reliability & degradation

- The Specialization Classifier runs in the Assistant agent flow; any failure must be caught and logged without failing the overall task creation.
- The `create-specialization` tool must complete agent provisioning atomically where possible. If one agent creation fails, the other two should still be attempted, and failures should be logged individually.
- MCP mapping failure must never block task processing or specialization creation (fire-and-continue pattern).

### 5.3 Idempotency

- Specialization creation is idempotent by name: concurrent calls with the same name must result in a single document. Enforce with a unique index on `specializations.name` (normalized to lowercase).
- System agents for a specialization must not be duplicated on re-run: check existence by `specializationId` before creating.

### 5.4 Security

- Specialization names and descriptions are AI-generated and stored; sanitize and enforce length limits before persisting.
- `specializationId` on system agents is set only during provisioning — not writable via admin PATCH in Phase 1.
- MCP `specializationIds` are not writable via external API.

### 5.5 Observability

- Structured log events per operation: `specialization.classification.started`, `specialization.classification.completed`, `specialization.classification.skipped`, `specialization.classification.failed`, `specialization.created`, `specialization.agents-provisioned`, `specialization.mcps-mapped`, `specialization.mcp-mapping-skipped`.
- Each event includes: `taskId`, `userId`, `specializationId` (when applicable), `specializationIds`, outcome reason.

### 5.6 Accessibility (admin UI)

- Specializations list and detail pages: keyboard navigable, proper heading hierarchy.
- Search input: labeled visually and with `aria-label="Search specializations"`.
- Pagination controls: accessible `aria-label` on Previous/Next buttons.
- Agent status indicator "Not provisioned" uses `role="status"` or equivalent.

### 5.7 Platform

- Web (Next.js App Router) for admin UI.
- MongoDB for persistence; unique index on `specializations.name` (case-insensitive collation or normalized lowercase).
- New domain package `@vassembly/domain-specialization` following monorepo domain package conventions.
- New service handler package or addition to existing service following `service-package-structure.mdc`.

---

## 6. Data Model & API Specification

### 6.1 MongoDB collections

**`specializations`** (new collection)

```json
{
  "_id": "ObjectId",
  "name": "legal",
  "description": "Covers legal research, contract drafting, regulatory compliance, and related tasks.",
  "createdAt": "2026-06-22T10:00:00.000Z",
  "updatedAt": "2026-06-22T10:00:00.000Z"
}
```

Indexes:
- Unique index on `name` (case-insensitive collation or store normalized lowercase)

**Updated `tasks` documents** (schema addition — no migration)

```json
{
  "specializationIds": ["spec_legal_01", "spec_finance_02"]
}
```

**Updated `systemAgents` documents** (schema addition — no migration)

```json
{
  "name": "Legal researcher",
  "specializationId": "spec_legal_01"
}
```

**Updated `mcps` documents** (schema addition — no migration)

```json
{
  "specializationIds": ["spec_legal_01", "spec_research_03"]
}
```

### 6.2 GraphQL queries

```graphql
type Specialization {
  id: ID!
  name: String!
  description: String!
  agentIds: [ID!]!
  mcpIds: [ID!]!
  createdAt: String!
  updatedAt: String!
}

type SpecializationPage {
  items: [Specialization!]!
  page: Int!
  size: Int!
  total: Int!
}

type Query {
  specializations(search: String, page: Int, size: Int): SpecializationPage!
  specialization(id: ID!): Specialization
}
```

Both queries require `role === admin`.

### 6.3 Internal tool interface — `create-specialization`

This tool is not exposed via the API gateway. It is callable only within the agent execution context.

**Input:**

```json
{
  "name": "legal",
  "description": "Covers legal research, contract drafting, and regulatory compliance."
}
```

**Output:**

```json
{
  "specializationId": "spec_legal_01",
  "isNew": true
}
```

**Side effects (in order):**
1. Upsert specialization by normalized name → get/create `specializationId`
2. Create system agents: `"Legal researcher"`, `"Legal worker"`, `"Legal validator"` with `specializationId` set
3. Invoke MCP Specialization Classifier → append `specializationId` to matched MCPs

### 6.4 Error taxonomy

| Code | HTTP (if applicable) | When |
|------|---------------------|------|
| `SPECIALIZATION_NAME_CONFLICT` | 409 | Duplicate specialization name on internal create |
| `SPECIALIZATION_NOT_FOUND` | 404 | GraphQL query with unknown ID |
| `SPECIALIZATION_CLASSIFICATION_SKIPPED` | — (log only) | Empty description, missing credential, malformed output |
| `SPECIALIZATION_AGENT_PROVISION_FAILED` | — (log only) | Agent creation failed during tool execution |
| `SPECIALIZATION_MCP_MAPPING_FAILED` | — (log only) | MCP classifier invocation failed |

### 6.5 System agent seed additions

**`Specialization classifier`** entry in `systemAgents.json`:

```json
{
  "name": "Specialization classifier",
  "description": "Classifies a user prompt into one or more specialization domains. Returns existing specialization names when a match exists, or a new name and description when a new domain is needed.",
  "rule": "You are a specialization classifier. Given a user task description, identify the 1–3 most relevant domain specializations from the list provided. If a matching specialization exists, return its name exactly. If no existing specialization fits, return a new name (lowercase, max 3 words) and a concise description (max 100 words). Prefer fewer specializations. Return only specialization names, one per line. If a new specialization is needed, prefix the line with NEW: followed by name|description.",
  "category": "utility",
  "assignedToolIds": []
}
```

**`MCP specialization classifier`** entry in `systemAgents.json`:

```json
{
  "name": "MCP specialization classifier",
  "description": "Given a new specialization's name and description, identifies which MCPs from the catalog are relevant to that specialization domain.",
  "rule": "You are an MCP specialization classifier. Given a specialization name and description, and a list of available MCPs (each with name and description), return the slugs of MCPs that are relevant to the specialization. Return one MCP slug per line. Return nothing if no MCP is relevant.",
  "category": "utility",
  "assignedToolIds": []
}
```

---

## 7. UI/UX Specifications

### 7.1 Pages & routes

| Audience | Route | Purpose |
|----------|-------|---------|
| Admin | `/specialization` | Paginated list with search |
| Admin | `/specialization/[id]` | Detail: name, description, agents, MCPs |

Auth: all Specialization routes use `ProtectedAuthRoute` (or equivalent) with `roles={['admin']}`.

### 7.2 List page — `/specialization`

**Layout:** Full-page with page header "Specializations", search bar at top, paginated card/table list below.

**Columns / card fields:**
- Name (bold, primary identifier)
- Description (truncated to 80 chars, ellipsis)
- Agent count (e.g., "3 agents")
- MCP count (e.g., "2 MCPs")
- Created date (relative, e.g., "2 days ago")

**Interaction:**
- Search bar: debounced (300 ms), filters by name prefix/contains
- Pagination: default 20 per page; Previous/Next controls; page number indicator
- Row click → navigates to `/specialization/[id]`
- No overflow menu, no checkbox selection, no bulk actions (Phase 1 read-only)

**States:**
- Loading: skeleton rows (following MCP catalog skeleton pattern)
- Empty (no results at all): "No specializations have been created yet. They are generated automatically as users submit tasks."
- Empty (search no match): "No specializations match \"{query}\"."
- Error: "Failed to load specializations." with retry button

### 7.3 Detail page — `/specialization/[id]`

**Layout:** Two sections — metadata header, then two side-by-side panels (Agents, MCPs).

**Metadata header:**
- Name (h1)
- Description (full text)
- Created date

**Agents panel:**
- Title: "Linked Agents"
- Lists 3 expected agent slots: Researcher, Worker, Validator
- Each slot shows: agent name, status badge (active / not provisioned)
- Links to the system agent detail page if agent exists

**MCPs panel:**
- Title: "Mapped MCPs"
- Lists MCPs with `specializationIds` containing this specialization
- Each item: MCP name, MCP slug
- Empty state: "No MCPs mapped to this specialization yet."

**No edit, delete, or action buttons anywhere on this page (Phase 1).**

**States:**
- Loading: skeleton for header and panels
- 404: "Specialization not found." with back link
- Error: "Failed to load specialization details." with retry

### 7.4 Navbar integration

A new **Specializations** item is added to the admin navbar section (alongside System Agents, MCPs, etc.). Visible only to admin role.

---

## 8. Assistant Agent Flow Integration

This section describes where and how Specialization classification integrates into the existing agent execution path.

### 8.1 Updated Assistant agent flow

```
User prompt → Assistant agent
  1. Intent classification     (existing — "Intent classifier" system agent)
  2. Specialization classification  (NEW — "Specialization classifier" system agent)
     ├─ Existing specializations → task.specializationIds set via updateTask
     └─ New specialization needed → create-specialization internal tool
         ├─ Upsert specialization document
         ├─ Provision researcher / worker / validator agents
         └─ MCP Specialization Classifier → update mcp.specializationIds
  3. Route to worker by intent  (existing — unchanged in Phase 1)
```

### 8.2 Classification invocation rules

- Invoked **after** intent classification resolves (sequential, not parallel — specialization may use intent category as additional context).
- Invoked **only** within the Assistant agent tool-call flow — never in standalone async handlers like `generateTaskTitle` or `generateTaskCategory`.
- Runs with the user's AI credential (same credential as other agent invocations in the flow).
- Skip conditions (match `generateTaskCategory` pattern):
  - Task description is empty or under 10 characters
  - User has no active AI integration credential
  - Classifier returns malformed/unparseable output
  - Classifier call throws (network/provider error)

### 8.3 Output normalization — `normalizeGeneratedSpecializations`

Mirrors `normalizeGeneratedCategory`:

1. Split raw output by newlines; trim each line
2. Lines starting with `NEW:` indicate a new specialization (format: `NEW: name|description`)
3. All other lines are matched case-insensitively against existing specialization names
4. Deduplicate; cap at 3 results
5. Return `{ type: 'existing', specializationIds: string[] }` or `{ type: 'new', name: string, description: string }`
6. Return `{ isValid: false, reason: 'empty_output' | 'invalid_output' | 'too_many_results' }` on failure

---

## 9. Out of Scope (Phase 1)

The following items are explicitly deferred to Phase 2 or later:

| Item | Deferred to |
|------|-------------|
| Worker routing: task/schedule/routine/question workers using specialization-scoped agents | Phase 2 |
| End-user-facing specialization display on task detail page | Phase 3 |
| Admin create/edit/archive/delete of specializations | Phase 4 |
| Merge or split specializations | Phase 4 |
| User-visible specialization search or filtering | Phase 3 |
| Specialization-scoped MCP auto-install or activation | Future |
| Specialization confidence scores | Future |

---

## 10. Dependencies

### 10.1 Required dependencies (must exist before implementation)

| Dependency | Current status | Impact if missing |
|------------|---------------|-------------------|
| `SystemAgentModel` exists with `assignedToolIds`, `category`, `status` | Exists | Provisioned agents cannot be created |
| `systemAgents.json` seed + `SYSTEM_AGENT_NAME` enum | Exists | New classifier agents cannot be seeded |
| `TaskModel` supports `updateTask` command | Exists (via `generateTaskCategory` pattern) | `specializationIds` cannot be persisted on task |
| `McpModel` in `domains/mcp` | Exists | MCP mapping cannot be persisted |
| Admin role + JWT role enforcement | Exists (partial — see system-agent PRD) | Admin UI and GraphQL queries cannot be gated |
| Internal tool registration mechanism (e.g., `update-task` pattern) | Exists | `create-specialization` tool cannot be registered |
| Assistant agent flow with Intent classifier invocation | Exists | Specialization classifier cannot be chained |
| AI credential lookup for agent invocation in flow | Exists | Classifier and provisioning calls cannot authenticate |

### 10.2 Assumptions

- Specialization names are lowercase, max 3 words, ASCII-safe (AI enforced via system prompt).
- The platform supports more than 100 specializations in the collection without performance degradation (index on name covers this).
- The "Plan creator" system agent remains a single general agent — it is explicitly NOT provisioned per specialization.
- MCP catalog is loaded in full for the MCP Specialization Classifier prompt (acceptable in Phase 1 with < 200 MCPs; pagination required in future phases).
- System agent creation within `create-specialization` uses the same admin-equivalent context as seed provisioning (not a user-scoped operation).

---

## 11. Acceptance Criteria (QA Checklist)

### Phase 1 — Infrastructure

**Classification flow:**
- [ ] Specialization Classifier invoked in Assistant flow after intent classification
- [ ] Existing specialization match: `task.specializationIds` updated correctly
- [ ] New specialization signal: `create-specialization` tool invoked
- [ ] Classification skipped gracefully when credential missing
- [ ] Classification skipped gracefully when output malformed
- [ ] At most 3 specialization IDs written to task

**Specialization + agent provisioning:**
- [ ] New specialization created with name and description
- [ ] 3 agents provisioned: `"{Name} researcher"`, `"{Name} worker"`, `"{Name} validator"`
- [ ] All 3 agents have `specializationId` set to new specialization
- [ ] Idempotent: duplicate name call returns existing specialization without creating new
- [ ] Agent names follow existing naming convention (title-cased, space-separated)

**MCP mapping:**
- [ ] MCP Specialization Classifier invoked after specialization + agents created
- [ ] Matched MCP `specializationIds` updated with new specialization ID
- [ ] MCP mapping failure does not block specialization/agent creation
- [ ] Existing MCP `specializationIds` for prior specializations preserved (append, not overwrite)

**Admin UI:**
- [ ] `/specialization` accessible by admin, 403 for non-admin
- [ ] Paginated list renders with correct columns
- [ ] Search filters by name
- [ ] Detail page shows name, description, agents (with "Not provisioned" for missing), MCPs
- [ ] No create/edit/delete controls anywhere
- [ ] Loading, empty, and error states implemented for list and detail
- [ ] Specializations navbar link visible only to admins

**GraphQL:**
- [ ] `specializations` query returns paginated results
- [ ] `specialization(id)` returns single result with agentIds and mcpIds
- [ ] Both queries require admin role; non-admin returns 403

**Regression:**
- [ ] Intent classification (`generateTaskCategory`) unchanged
- [ ] Existing system agents unaffected (no `specializationId` required)
- [ ] Task creation flow unaffected; `specializationIds` absence on old tasks causes no errors
- [ ] MCP admin catalog UI (`/mcps`) unaffected

---

## 12. Open Questions & Risks

| # | Question / risk | Owner | Impact |
|---|-----------------|-------|--------|
| OQ-1 | Should Specialization Classifier run in parallel with Intent Classifier or strictly after? README says "after" — confirm sequencing is intentional. | Product | Latency vs context quality |
| OQ-2 | What is the default rule for provisioned researcher / worker / validator agents? Generic or specialization-name-aware? | Product | Phase 2 routing quality |
| OQ-3 | How many MCPs can realistically be included in the MCP Specialization Classifier prompt before context limits are hit? Cap needed? | Engineering | MCP mapping completeness |
| OQ-4 | Should `specializationId` on system agents be writable via admin PATCH in a future phase (e.g., to reassign an agent)? | Product | Phase 4 governance scope |
| OQ-5 | Is the `create-specialization` tool callable by the end user's AI credential or via a system/admin credential? | Security | Credential scoping |
| OQ-6 | Should specialization names be enforced as snake_case, lowercase, or title case in storage vs display? | Engineering | Name uniqueness collation |
| R-1 | MCP catalog prompt may exceed LLM context window with many MCPs | Medium — need truncation strategy | |
| R-2 | Concurrent task submissions may race to create the same specialization | Medium — unique index + idempotent tool mitigate | |
| R-3 | Classification quality depends heavily on system prompt quality for Specialization Classifier | High — needs iteration on rule text post-launch | |
| R-4 | Admin role enforcement not fully wired (per system-agent PRD OQ deps) | High — blocks admin UI gating | |

---

*End of PRD — ready for architecture (`docs/features/specialization/architecture.md`) and design review.*
