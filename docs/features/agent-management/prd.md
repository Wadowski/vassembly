# Product Requirements Document: Agent Management

## 1. Executive Summary

**Feature overview:** Agent Management lets authenticated users create, view, edit, archive (soft-delete), and restore personalized agent definitions stored in the database. Each agent is owned by exactly one user; the product surfaces name, category, description, rule text, lifecycle timestamps, status, and soft-delete state.

**Problem and value proposition:** Builders and organizers need a single place to save and manage agent configurations (name, category, description, rules) without leaving the product. The feature reduces fragmented storage, enforces per-user isolation, and supports discoverability via search and filters while keeping deleted data auditable via soft delete.

**Target users and use cases:** *Power builders* maintain many agents and rely on search, filters, and pagination. *Casual organizers* create a small set of agents and need simple forms, clear validation, and safe delete/restore. Primary use cases: create/update agents, browse and find agents, archive unwanted agents, restore mistakes, and rely on automatic cleanup when a user account is deleted.

---

## 2. Feature Overview

**System description:** The Agent management system is a user-scoped catalog of agent records. Agents are configuration records only in v1—no execution, scheduling, or runtime binding is in scope.

**Core capabilities:**

- **Create:** Authenticated user creates an agent with required fields; server assigns `userId` from JWT, timestamps, default `status` = `active`, `removedAt` = null.
- **Read (list):** Paginated list with optional search (name, description), optional status filter, defaulting to active non-deleted agents.
- **Read (single):** Retrieve a single agent by ID for edit form prefill; requires ownership (same userId).
- **Update:** Partial update of allowed fields for owned agents only; cannot change `userId`; **cannot update agents with `removedAt` set (must restore first)**.
- **Delete (archive):** Soft delete via `removedAt` timestamp; record remains for audit/compliance.
- **Restore:** Clear `removedAt` for owned archived/soft-deleted agents per rules below.

**User access control:** Every operation is scoped to the authenticated user. Users see, create, update, delete, and restore only agents where `userId` matches the JWT user id. Cross-user access must be denied with an authorization-appropriate error (not revealing existence).

**Field definitions:**

| Field        | Type        | Rules |
|-------------|-------------|--------|
| name        | string      | Required |
| category    | enum        | Required: `coding`, `personal`, `utility` |
| description | string      | Required |
| rule        | string      | Required; v1 strict string (no structured JSON schema) |
| userId      | string      | Required; set by system from JWT on create |
| status      | enum        | `active`, `archived`, `disabled`; default `active` |
| createdAt   | timestamp   | System-set |
| updatedAt   | timestamp   | System-set on write |
| removedAt   | timestamp   | Nullable; null = not soft-deleted |

**Lifecycle alignment (soft delete vs status):** On `DELETE /api/agents/:id`, the system sets `removedAt` to the current server time **and** sets `status` to `archived` so the archived filter and soft-delete semantics stay aligned. Default list queries return only agents with `removedAt` null and `status` = `active`. `POST .../restore` sets `removedAt` to null and `status` to `active`.

---

## 3. User Stories & Acceptance Criteria

### Story 1: Create Agent

**As a** logged-in user, **I want** to create an agent with name, category, description, and rule **so that** it appears in my agent list.

**Acceptance criteria:**

```gherkin
Scenario: Successful create with valid payload
Given I am authenticated
When I submit the create form with valid name, category, description, and rule
Then the agent is persisted with my userId, status active, removedAt null
And I see a success notification
And I am redirected to the agent list
And the new agent appears when the list is filtered for active agents

Scenario: Create rejected when unauthenticated
Given I am not authenticated
When I attempt to create an agent via API or UI
Then creation is denied
And no agent record is created

Scenario: Validation errors on create
Given I am authenticated
When I submit with missing required fields or over max length
Then inline errors indicate the offending fields
And the agent is not created
```

### Story 2: View Agent List (search, filter, pagination)

**As a** logged-in user, **I want** to see my agents with search, status filter, and pagination **so that** I can find and manage them efficiently.

**Acceptance criteria:**

```gherkin
Scenario: Default list shows active non-deleted agents
Given I am authenticated
And I own agents in various statuses and some soft-deleted
When I open the agent list with no filter changes
Then I see only agents with status active and removedAt null
And pagination defaults to page 0 and size 10

Scenario: Search matches name and description only
Given I am authenticated
When I enter a search term that appears only in an agent rule
Then that agent is not returned in search results
When I enter a search term that appears in name or description
Then matching owned agents are returned

Scenario: Status filter for disabled and archived
Given I am authenticated
When I select status filter disabled
Then I see my agents with status disabled and removedAt null
When I select status filter archived
Then I see my agents with status archived including soft-deleted rows

Scenario: Pagination
Given I have more agents than the page size
When I go to the next page
Then I see the next offset of results
And page and size query parameters align with displayed data

Scenario: Unauthorized access
Given I am not authenticated
When I open the agents route
Then I am blocked from viewing the page and data
```

### Story 3: Update Agent

**As a** logged-in user, **I want** to edit my agent fields **so that** I can keep definitions accurate.

**Acceptance criteria:**

```gherkin
Scenario: Successful partial update
Given I am authenticated
And I own an agent
When I PATCH allowed fields with valid values
Then the agent reflects the changes
And updatedAt is refreshed
And userId is unchanged

Scenario: Cannot update another user's agent
Given two distinct users and an agent owned by the other user
When I attempt to PATCH that agent id
Then the operation is denied
And no data is leaked about existence where policy requires uniform denial

Scenario: Validation on update
Given I am authenticated and own an agent
When I send invalid lengths or invalid enum/category
Then the API/UI returns validation errors
And the agent remains unchanged
```

### Story 4: Delete / Archive Agent

**As a** logged-in user, **I want** to soft-delete an agent **so that** it no longer appears in my default list but can be audited or restored.

**Acceptance criteria:**

```gherkin
Scenario: Soft delete sets removedAt and archived status
Given I am authenticated
And I own an active agent
When I delete the agent
Then removedAt is set to a non-null timestamp
And status becomes archived
And the agent disappears from the default active list

Scenario: Delete someone else's agent denied
Given I am authenticated
When I DELETE an id belonging to another user
Then the request fails with forbidden/not found per product security policy

Scenario: Repeated delete is idempotent or stable
Given an agent already soft-deleted
When I DELETE again
Then the system does not create duplicate audit anomalies
And response behavior is consistent (success no-op or clear error — implementation choice documented in tech spec)
```

### Story 5: Restore Agent

**As a** logged-in user, **I want** to restore an archived/soft-deleted agent **so that** I recover from mistakes.

**Acceptance criteria:**

```gherkin
Scenario: Restore clears soft delete and reactivates
Given I own an agent with removedAt set and status archived
When I POST restore
Then removedAt becomes null
And status becomes active
And the agent appears in the default list

Scenario: Restore non-archived/non-deleted agent
Given I own an agent with removedAt null and status active
When I POST restore
Then API returns an error explaining restore is not applicable
And no change occurs

Scenario: Restore denied for other user's agent
Given an agent owned by another user
When I POST restore for that id
Then the request is denied
```

---

## 4. API Specifications

**Global requirements:**

- **Authentication:** All endpoints require a valid JWT.
- **Authorization:** All operations apply only to agents where `userId` equals the authenticated user id from the JWT. Use IDOR-safe patterns (same error shape for non-owned ids as for missing ids if that is the product security standard).
- **Content-Type:** `application/json` for bodies.
- **Timestamps:** ISO-8601 in responses unless the codebase standard differs (document in implementation).

---

### a) `POST /api/agents` — Create agent

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Body** | `name` string (required, max 100), `category` enum `coding \| personal \| utility` (required), `description` string (required, max 500), `rule` string (required, max 2000) |
| **Server-set** | `userId` from JWT, `status` = `active`, `removedAt` = null, `createdAt`, `updatedAt` |

**Success:** `201 Created` with body:

```json
{
  "id": "string",
  "name": "string",
  "category": "coding | personal | utility",
  "description": "string",
  "rule": "string",
  "userId": "string",
  "status": "active",
  "createdAt": "string",
  "updatedAt": "string",
  "removedAt": null
}
```

**Errors:**

- `401` — missing/invalid JWT
- `400` — validation (field required, max length, invalid category)
- `429` — rate limited (if enabled)

---

### b) `GET /api/agents` — List agents

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Query** | `search` string (optional; matches name + description only), `status` enum or repeated param (optional; when omitted, default **active only**), `page` number (optional, default `0`, 0-indexed), `size` number (optional, default `10`, max cap e.g. 50—define in implementation) |

**Scope:** Only agents for current user. Default: `removedAt` is null **and** `status` = `active`. When `status` is explicitly provided, filter by that status; for `archived`, include rows with `removedAt` set (soft-deleted) **or** `status` = `archived` per §2 alignment.

**Success:** `200 OK` with body:

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "category": "coding | personal | utility",
      "description": "string",
      "rule": "string",
      "userId": "string",
      "status": "active | archived | disabled",
      "createdAt": "string",
      "updatedAt": "string",
      "removedAt": "string | null"
    }
  ],
  "page": 0,
  "size": 10,
  "total": 0
}
```

**Errors:** `401`, `400` (invalid pagination), `429` (optional)

---

### c) `GET /api/agents/:id` — Retrieve single agent

|| Aspect | Specification |
||--------|----------------|
|| **Auth** | Required (JWT) |
|| **Path** | `id` — agent identifier |

**Scope:** Only returns agent if owned by current user (userId matches).

**Success:** `200 OK` with body:

```json
{
  "id": "string",
  "name": "string",
  "category": "coding | personal | utility",
  "description": "string",
  "rule": "string",
  "userId": "string",
  "status": "active | archived | disabled",
  "createdAt": "string",
  "updatedAt": "string",
  "removedAt": "string | null"
}
```

**Errors:**
- `401` — missing/invalid JWT
- `404` / `403` — not found or not owned by current user (per IDOR policy)
- `429` — rate limited (if enabled)

---

### d) `PATCH /api/agents/:id` — Update agent

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Path** | `id` — agent identifier |
| **Body** | Partial: any of `name`, `category`, `description`, `rule`, `status` (enum) with same validation as create for provided fields; **must not** allow writing `userId`, `createdAt`, `removedAt` via this endpoint (use delete/restore flows) |

**Precondition:** Agent **must not** have `removedAt` set. If `removedAt` is not null, reject update with `400` or `409` and error message "Agent has been deleted; restore before updating."

**Success:** `200 OK` with full updated agent object (same shape as create response).

**Errors:**

- `401`
- `404` / `403` — not found or not owned (per IDOR policy)
- `400` — validation or agent is in removed state
- `409` — optional if business rules forbid certain status transitions

---

### e) `DELETE /api/agents/:id` — Soft delete (archive)

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Path** | `id` |

**Success:** `200 OK` or `204 No Content` with optional body echoing updated agent including `removedAt` and `status` = `archived`.

**Errors:** `401`, `404`/`403`

---

### f) `POST /api/agents/:id/restore` — Restore

| Aspect | Specification |
|--------|----------------|
| **Auth** | Required (JWT) |
| **Path** | `id` |

**Precondition:** Agent owned by user; `removedAt` was not null **or** product-defined “archived and restorable” state.

**Success:** `200 OK` with agent object: `removedAt` = null, `status` = `active`.

**Errors:** `401`, `404`/`403`, `400` (not restorable)

---

## 5. Search & Filter Behavior

| Concern | Behavior |
|---------|----------|
| **Search fields** | `name`, `description` only (case-folding and partial match per platform standard; full-text index supports matching policy) |
| **Excluded from search** | `rule` (and `userId`, timestamps) |
| **Filter** | `status` ∈ { `active`, `disabled`, `archived` }; multi-select not required for v1 unless UX specifies single-select only (default: single-select dropdown) |
| **Pagination** | Offset-based: `page` (0-indexed), `size` |
| **Defaults** | `page=0`, `size=10`, implicit status = `active`, `removedAt` null |
| **Ordering** | Recommend `createdAt` descending (newest first); document if different |

---

## 6. UI/UX Requirements

### a) Agent List Page

- **Table columns:** Name, Category, Status, Created Date, Actions (Edit, Delete).
- **Search:** Search box; **on-submit** or debounced real-time—either is acceptable if performance and API rate limits are respected; default recommendation **debounced** (e.g. 300ms) or explicit submit to limit load.
- **Status filter:** Dropdown: Active (default), Disabled, Archived.
- **Pagination:** Prev/next or numbered controls; must reflect `page`, `size`, `total` from API.
- **Primary action:** “Create Agent” button → navigate to create form.
- **Access:** Protected route; only logged-in users.
- **Navigation:** “Agents” link in app drawer when logged in; styling consistent with existing nav.

### b) Create / Update Agent Page

- **Fields:** Name (text), Category (dropdown: coding, personal, utility), Description (textarea), Rule (textarea or large text).
- **Validation:** All required; name max 100; description max 500; rule max 2000; category required.
- **Actions:** Submit (“Create Agent” / “Update Agent”); **Cancel** returns to list without confirmation.
- **Errors:** Inline field errors from API/ client validation.
- **Success:** Snackbar (or equivalent toast) + redirect to list.
- **Access:** Logged-in users only.

### c) Navigation

- Add **Agents** to drawer for authenticated sessions only; inactive/hidden when logged out.

**UI states for QA:** loading skeleton/spinner on list load, disabled submit while pending, empty state when no agents match filters, error banner for global fetch failures.

---

## 7. Data Model & MongoDB

- **Collection:** `agents`
- **Indexes (required):**
  - `{ userId: 1, status: 1, createdAt: -1 }` (or compose as needed for list default)
  - `{ userId: 1, removedAt: 1 }` for soft-delete filtering
  - Text index on `{ name: "text", description: "text" }` scoped considerations: multi-key text index with `userId` filter on every query to avoid cross-user leakage in ranking (application always filters `userId`)
- **Schema validation:** Recommended MongoDB JSON Schema enforcing required fields, enum bounds, max string lengths, and types for timestamps; optional if team uses application-layer validation only (dependency on org standard).

---

## 8. Security & Authentication

- JWT on all endpoints; reject without valid token.
- **Authorization:** Strict ownership on `userId`; no reads or writes for other users’ resources.
- **IDOR:** Verify ownership **before** returning or mutating; avoid different error messages that reveal existence if security policy demands uniformity.
- **Soft delete:** Records remain with `removedAt` for audit/compliance; backups and retention follow org policy (out of scope here).
- **Rate limiting:** **Optional** v1—consider on `POST /api/agents` and `GET /api/agents` to mitigate abuse.
- **Unbounded data:** Enforce pagination max `size`; cap search result processing; indexes to prevent full collection scans per user scope.
- **User account deletion:** When a user account is deleted in the User domain, **soft-delete all agents** for that `userId` (set `removedAt`—and align `status` to `archived` per §2). Event-driven vs batch job is an implementation dependency.

---

## 9. Success Metrics & KPIs

| Metric | Definition |
|--------|------------|
| Agent creation rate | Count of agents created per user per calendar month |
| List engagement | Page views; count of searches; count of filter changes |
| Update / delete frequency | Distinct agents updated/deleted per month |
| Error rates | Ratio of failed creates; auth failures (`401`/denied); validation errors |

(Reporting tooling and dashboards are implementation-dependent.)

---

## 10. Assumptions & Dependencies

- User authentication is live; JWT contains stable **user id** claim understood by API and web app.
- User domain owns account lifecycle and triggers or jobs to soft-delete agents on user deletion.
- MongoDB cluster available with index creation permissions.
- Next.js/React app can call authenticated API routes with existing token attachment pattern.
- Server clock is authoritative for `createdAt`, `updatedAt`, `removedAt`.
- **Concurrent update handling:** Last-write-wins approach; no optimistic locking required for v1. `updatedAt` timestamp is used for tracking changes, not for conflict detection.

---

## 11. Out of Scope (v1)

- Agent execution, invocation, or runtime usage
- Bulk create/delete/update
- Sharing agents between users or teams
- Version history / diff / rollback beyond restore
- Rule validation, parsing, or structured JSON schema for `rule`

---

## Clarifications & Edge Cases (for Architecture / Design)

1. **Edit form data source:** `GET /api/agents/:id` endpoint is now in scope for edit form prefill.
2. **PATCH on soft-deleted agents:** **REJECT** with `400` status and error message "Agent has been deleted; restore before updating."
3. **Status `disabled`:** Semantics—user manually sets via PATCH vs system-only; PRD allows user updates to `status` if included in PATCH; UX should expose disable only if product wants it (filter exists).
4. **Search with special characters:** Escape/limit patterns to avoid regex injection if regex-based search is used.
5. **Concurrent updates:** **Last-write-wins policy** (no optimistic locking v1); `updatedAt` tracks changes, not conflict detection.
6. **Restore idempotency:** Second restore on already-active agent → `400` with stable error code for UI.
7. **Account deletion race:** User deleted mid-session—tokens invalidated per auth standard; agent soft-delete job must complete or be consistent with GDPR/retention policy (legal out of scope; behavior specified).

---

*Document version: 1.0 — Prepared for architecture planning and UI design.*
