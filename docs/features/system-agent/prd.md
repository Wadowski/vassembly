# Product Requirements Document: System Agents (Vassembly)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-05-25  
**Related PRDs:** [Agent Management](../agent-management/prd.md), [User Settings](../user-settings/prd.md)  
**Feature slug:** `system-agent`

---

## 1. Executive Summary

### 1.1 Problem

Vassembly users today only have **personal agents** scoped to their account. Similar agent definitions are recreated across users, there is no **governed platform catalog**, and admins cannot publish shared agents that all users invoke with **their own AI credentials**. Invoke and admin-role enforcement are partially built but not wired end-to-end, which blocks a safe global-agent experience.

### 1.2 Solution

**System Agents** are admin-defined, globally shared agent definitions stored in a **separate MongoDB collection** (no `userId` ownership). End users see a **read-only catalog**, choose which of **their** AI integration credentials powers system-agent invocations (server-stored preference with first-credential auto-default), and invoke via the **same LangChain flow** as personal agents. Admins manage lifecycle (CRUD, archive) under **role-gated APIs** with audit fields; users never edit catalog entries.

### 1.3 Success metrics

| Metric | Target (90 days post Phase 4) | Measurement |
|--------|-------------------------------|-------------|
| Catalog adoption | ≥ 40% of weekly active users invoke ≥ 1 system agent | Invoke logs by `systemAgentId` |
| Fragmentation reduction | ≥ 25% decrease in new personal agents whose name/rule fuzzy-match a system agent | Analytics on create-agent payloads |
| Admin governance | 100% of system agents have `createdByAdminId` / `updatedByAdminId` on writes | DB audit field completeness |
| Invoke reliability | ≥ 99% invoke success when user preference credential is `connected` | Invoke error rate vs `testConnection` status |
| Misconfiguration clarity | &lt; 5% of invoke failures without a user-actionable message | Support tickets + error code taxonomy |

### 1.4 Phasing summary

| Phase | Deliverable |
|-------|-------------|
| **1 — Foundation** | Admin CRUD, `systemAgents` collection, role-gated API, admin management UI |
| **2 — User visibility** | Read-only catalog API + UI above personal agents |
| **3 — Connection preference** | Per-user preference storage, settings UI, auto-default on first credential |
| **4 — Invoke** | `POST /system-agents/{id}/invoke`, credential validation, invoke UI (depends on personal invoke wiring) |

---

## 2. User Stories

Stories use **Gherkin** acceptance criteria. Personas: **Platform Admin**, **End User**, **Operator** (read-focused operational role; invoke same as user unless noted).

### Admin stories

**SA-1 — Publish a system agent**

```gherkin
As a platform admin
I want to create a system agent with name, rule, and optional metadata
So that all users can discover and invoke a governed definition

Scenario: Successful create
  Given I am authenticated with role admin
  When I submit a valid system agent payload
  Then the record is stored in the systemAgents collection without userId
  And createdByAdminId and updatedByAdminId are set to my user id
  And status is active and removedAt is null

Scenario: Non-admin blocked
  Given I am authenticated with role user
  When I POST to a system-agents management endpoint
  Then I receive 403 Forbidden
  And no system agent record is created
```

**SA-2 — Edit and archive system agents**

```gherkin
As a platform admin
I want to update or archive system agents
So that the catalog stays accurate without deleting audit history

Scenario: Update owned-by-platform record
  Given an active system agent exists
  When I PATCH valid fields as admin
  Then fields update and updatedByAdminId reflects my user id

Scenario: Archive (soft delete)
  Given an active system agent exists
  When I DELETE the system agent
  Then removedAt is set and status becomes archived
  And the agent no longer appears in the user catalog

Scenario: Block hard delete when in use
  Given the system agent has at least one active user connection preference referencing it
  When I attempt permanent delete (if exposed) or archive with active-connection guard
  Then the operation is rejected with a clear error
  And the record remains unchanged
```

**SA-3 — Review admin audit trail**

```gherkin
As a platform admin
I want to see who created and last updated each system agent
So that I can govern changes

Scenario: Admin list includes audit fields
  Given I am admin
  When I GET the admin system-agents list
  Then each item includes createdByAdminId, updatedByAdminId, createdAt, updatedAt
```

**SA-4 — Test invoke with connection override (admin only)**

```gherkin
As a platform admin
I want to invoke a system agent with an optional connection override
So that I can validate behavior before publishing

Scenario: Admin invoke with override
  Given I am admin and a valid credential id is supplied in the invoke body
  When I POST /system-agents/{id}/invoke with connectionOverride
  Then invoke uses that credential for the LangChain client
  And the response matches the standard invoke shape

Scenario: User cannot override
  Given I am a non-admin user
  When I POST invoke with connectionOverride
  Then I receive 403 Forbidden
```

### End-user stories

**SA-7 — Automatic system-agent connection on first credential**

```gherkin
As an end user
I want my first AI credential to become my system-agent connection automatically
So that I can invoke without extra setup

Scenario: First credential auto-preference
  Given I have no system-agent connection preference
  When I successfully create my first AI integration credential
  Then my preference is set to that credential id
  And I see a confirmation toast explaining system agents will use this connection
```

**SA-8 — Choose system-agent connection in settings**

```gherkin
As an end user with multiple AI credentials
I want to select which connection powers system agents
So that I control cost and provider

Scenario: Change preference in AI Connections settings
  Given I have two active credentials
  When I set "Use for system agents" to credential B and save
  Then subsequent invokes use credential B
  And the preference persists server-side across sessions
```

---

## 3. Functional Requirements

Each requirement includes **acceptance criteria** checkboxes for QA.

### 3.1 Data model & collections

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-DM-1 | System agents live in collection `systemAgents`, separate from `agents`. | No `userId` on documents; personal agent queries never return system agents. |
| FR-DM-2 | Per-user connection preference in collection `userSystemAgentPreferences` (or equivalent), keyed by `userId` (unique). | One preference document per user; stores `integrationCredentialId`. |
| FR-DM-3 | Admin audit: `createdByAdminId`, `updatedByAdminId`, `createdAt`, `updatedAt`. | Set on create/update; visible on admin APIs only. |
| FR-DM-4 | Soft delete: `removedAt` + `status: archived`; archived hidden from user catalog. | User catalog query filters `removedAt` null and `status` active. |
| FR-DM-5 | System agent `name` globally unique among non-archived records. | Duplicate name returns 409 on create/update. |

**System agent fields**

| Field | Type | Rules |
|-------|------|--------|
| `name` | string | Required; max 100; unique among active |
| `rule` | string | Required; max 5000 (system prompt) |
| `description` | string | Optional; max 500; shown in catalog when present |
| `category` | enum | Optional: `coding`, `utility`, `onboarding`, `compliance` |
| `status` | enum | `active`, `archived`, `disabled`; default `active` |
| `createdByAdminId` | string | Required on create |
| `updatedByAdminId` | string | Required on every write |
| `removedAt` | timestamp | Nullable |
| `id`, `createdAt`, `updatedAt` | — | System-set per `@vassembly/model` |

**User preference fields**

| Field | Type | Rules |
|-------|------|--------|
| `userId` | string | Required; unique index |
| `integrationCredentialId` | string | Required when preference exists; must belong to `userId` |
| `updatedAt` | timestamp | System-set on write |

### 3.2 Authorization & admin operations

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-AZ-1 | CRUD on management routes requires JWT `role === admin`. | Non-admin → 403; no side effects. |
| FR-AZ-2 | Admins see full list including archived/disabled via admin list endpoint. | Filters by `status` supported. |
| FR-AZ-3 | Users see catalog only; no create/update/delete/archive. | UI hides actions; API returns 403. |
| FR-AZ-4 | Delete/archive protection: block if an active user preference still references the credential **in a way that blocks platform** — *clarification:* block archive/delete of **system agent** if business rule "active connection" means users currently depending on catalog entry; minimum: cannot delete system agent if invoke in flight (optional). **Required:** block delete of **credential** that is the user's system-agent preference without reassignment (existing credential delete rules extended). |
| FR-AZ-5 | Archive system agent: allowed always unless product defines "active connection" guard as users with invoke history — default: **allow archive**; archived agents unavailable for invoke. |

### 3.3 User connection preference

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-CP-1 | On first successful credential create, if no preference exists, set preference to new credential id. | Atomic with credential create or immediate follow-up write; toast shown once. |
| FR-CP-2 | User can PUT own preference to any **owned**, **active**, non-archived credential. | 400 if credential not found or wrong user. |
| FR-CP-3 | Admin can GET any user's preference (support); user can GET only own. | Admin route gated; user route scoped by JWT `sub`. |
| FR-CP-4 | Deleting user's preference credential requires user to pick another (or invoke fails with FR-IV-3). | Settings and invoke errors aligned. |

### 3.4 API surface & filtering

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-API-1 | Routes under `/api/system-agents/*`, distinct from `/api/agents/*`. | No mixed arrays in responses. |
| FR-API-2 | User catalog: `GET /api/system-agents/catalog` — active only, read-only. | Pagination/search optional Phase 2; category filter supported. |
| FR-API-3 | Admin management: `POST`, `GET`, `GET/:id`, `PATCH/:id`, `DELETE/:id`, `POST/:id/restore` under `/api/system-agents`. | Mirror personal agent semantics where applicable. |
| FR-API-4 | Preference: `GET/PUT /api/system-agents/connection-preference` (user); admin GET by userId path TBD. | Documented in §5. |
| FR-API-5 | Invoke: `POST /api/system-agents/:id/invoke`. | Phase 4; see §3.5. |

### 3.5 Invocation

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-IV-1 | Reuse LangChain `getModeledProviderClient` + domain invoke pattern; system-agent domain loads agent **without** `userId` ownership check on agent row. | Same response envelope as personal invoke when personal invoke ships. |
| FR-IV-2 | Resolve credential from user preference unless admin supplies `connectionOverride`. | Users sending override → 403. |
| FR-IV-3 | Before invoke: credential exists, owned by user, status active, `connectionStatus` is `connected` (or run `testConnection` per product decision). | Fail fast with distinct error codes. |
| FR-IV-4 | Request body supports `message` (user prompt) and optional metadata fields aligned with personal invoke. | Documented in §5. |
| FR-IV-5 | Response: `{ message, usage?, metadata? }` — parity with personal agent invoke PRD when finalized. | Contract tests between personal and system invoke. |

### 3.6 UI/UX

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-UI-1 | Admin: **System Agents** page under admin section (new route group), separate nav from `/agents`. | Only visible when `role` admin. |
| FR-UI-2 | User: **Platform Agents** section above **My Agents** in list/picker. | Read-only cards; invoke CTA in Phase 4. |
| FR-UI-3 | Settings → AI Connections: control **Use for system agents** (dropdown of user's credentials). | Saves via PUT preference API. |
| FR-UI-4 | First credential: auto-preference + toast: "This connection will be used for platform agents." | Shown once per user. |
| FR-UI-5 | Empty states: no catalog agents (admin message vs user "None available"); no credentials (link to create AI connection). | Copy in §6. |

### 3.7 Validation & edge rules

| ID | Rule |
|----|------|
| FR-VA-1 | `name`: required, 1–100 chars, trim whitespace, unique case-insensitive among active (define in implementation). |
| FR-VA-2 | `rule`: required, 1–5000 chars. |
| FR-VA-3 | `description`: optional, max 500. |
| FR-VA-4 | `category`: if present, must be enum member. |
| FR-VA-5 | Invoke: reject archived/disabled/missing system agent with 404. |
| FR-VA-6 | Non-admin access to `PATCH/DELETE/POST` management → 403. |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Area | Target |
|------|--------|
| Catalog `GET` | p95 &lt; 300 ms for ≤ 100 active system agents |
| Admin list | p95 &lt; 500 ms with pagination default 20 |
| Invoke | p95 &lt; 30 s bounded by provider; server overhead &lt; 200 ms excluding provider |
| Preference GET/PUT | p95 &lt; 150 ms |

### 4.2 Security

- All endpoints require valid JWT.
- Admin operations enforce `role === admin` server-side (not UI-only).
- Users can only read/write **own** `userSystemAgentPreferences` and **own** credentials.
- System agent `rule` may contain sensitive instructions — treat as **platform confidential** in logs (no full rule in info logs).
- `connectionOverride` accepted only for admin role.
- IDOR: catalog `GET :id` returns 404 for archived agents to non-admins.
- Rate limiting: align with `/api/agents` invoke when introduced.

### 4.3 Scalability

- Unique index on `systemAgents.name` (partial: active only if supported).
- Index `userSystemAgentPreferences.userId` unique.
- Catalog sized for hundreds of agents; pagination required if &gt; 50.

### 4.4 Observability

- Structured logs: `systemAgentId`, `userId`, `credentialId` (not API keys), `invokeDurationMs`, `outcome`.
- Metrics: invoke count, error rate by error code, catalog list latency.
- Admin audit fields enable post-incident tracing without PII in agent rules.

### 4.5 Accessibility (web)

- Platform agents list: keyboard navigable, focus order above personal agents.
- Settings connection selector: labeled "Use for system agents"; screen reader announces current selection.
- Error toasts: `role="alert"` for invoke and preference failures.

### 4.6 Platform

- Web (Next.js App Router) for Phase 1–4 UI.
- API JSON `application/json` consistent with existing `/api/agents` and `/api/ai-integrations`.

---

## 5. Data Model & API Specification

### 5.1 MongoDB collections

**`systemAgents`**

```json
{
  "_id": "ObjectId",
  "name": "Code Review Assistant",
  "description": "Reviews pull requests for style and safety.",
  "rule": "You are a senior engineer...",
  "category": "coding",
  "status": "active",
  "createdByAdminId": "user_admin_1",
  "updatedByAdminId": "user_admin_1",
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T10:00:00.000Z",
  "removedAt": null
}
```

**`userSystemAgentPreferences`**

```json
{
  "_id": "ObjectId",
  "userId": "user_123",
  "integrationCredentialId": "cred_456",
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T11:00:00.000Z"
}
```

### 5.2 REST endpoints (prefix `/api/system-agents`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/` | admin | Create system agent |
| GET | `/` | admin | List all (incl. filters: status, search, page, size) |
| GET | `/:id` | admin | Get one (incl. archived) |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Soft-delete (archive) |
| POST | `/:id/restore` | admin | Restore archived |
| GET | `/catalog` | user, operator | Active catalog for end users |
| GET | `/catalog/:id` | user, operator | Single active agent for detail/invoke setup |
| GET | `/connection-preference` | user | Own preference |
| PUT | `/connection-preference` | user | Set own preference |
| GET | `/connection-preference/users/:userId` | admin | Read user preference (support) |
| POST | `/:id/invoke` | user, operator, admin | Invoke (admin may pass override) |

> **Note:** Route ordering must register `/catalog` and `/connection-preference` before `/:id` to avoid shadowing.

### 5.3 Request/response examples

**POST `/api/system-agents` (admin create)**

Request:

```json
{
  "name": "Onboarding Guide",
  "description": "Helps new users learn the platform.",
  "rule": "You are a friendly onboarding assistant...",
  "category": "onboarding"
}
```

Response `201`:

```json
{
  "id": "sa_abc",
  "name": "Onboarding Guide",
  "description": "Helps new users learn the platform.",
  "rule": "You are a friendly onboarding assistant...",
  "category": "onboarding",
  "status": "active",
  "createdByAdminId": "admin_1",
  "updatedByAdminId": "admin_1",
  "createdAt": "2026-05-25T12:00:00.000Z",
  "updatedAt": "2026-05-25T12:00:00.000Z",
  "removedAt": null
}
```

**GET `/api/system-agents/catalog` (user)**

Response `200`:

```json
{
  "items": [
    {
      "id": "sa_abc",
      "name": "Onboarding Guide",
      "description": "Helps new users learn the platform.",
      "category": "onboarding",
      "status": "active"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

> Catalog responses **omit** `rule` unless product requires preview; default **omit** `rule` in list, include in `GET /catalog/:id` for invoke preview.

**PUT `/api/system-agents/connection-preference` (user)**

Request:

```json
{
  "integrationCredentialId": "cred_456"
}
```

Response `200`:

```json
{
  "userId": "user_123",
  "integrationCredentialId": "cred_456",
  "updatedAt": "2026-05-25T12:30:00.000Z"
}
```

**POST `/api/system-agents/:id/invoke`**

Request (user):

```json
{
  "message": "Summarize our Q1 compliance checklist."
}
```

Request (admin test):

```json
{
  "message": "Hello",
  "connectionOverride": { "integrationCredentialId": "cred_admin_test" }
}
```

Response `200`:

```json
{
  "message": "Here is a summary...",
  "usage": {
    "promptTokens": 120,
    "completionTokens": 80,
    "totalTokens": 200
  },
  "metadata": {
    "model": "gpt-4",
    "provider": "chatgpt"
  }
}
```

**Error examples**

| HTTP | Code | When |
|------|------|------|
| 403 | `FORBIDDEN` | Non-admin on management route |
| 403 | `CONNECTION_OVERRIDE_FORBIDDEN` | User sent `connectionOverride` |
| 404 | `SYSTEM_AGENT_NOT_FOUND` | Missing or archived |
| 409 | `SYSTEM_AGENT_NAME_CONFLICT` | Duplicate name |
| 400 | `VALIDATION_ERROR` | Field constraints |
| 422 | `SYSTEM_AGENT_CONNECTION_REQUIRED` | No preference / no credentials |
| 422 | `SYSTEM_AGENT_CONNECTION_INVALID` | Credential not owned, archived, or failed test |

### 5.4 Separation from personal agents

- Personal agents remain `/api/agents` with `userId` scoping.
- List UIs call **two endpoints** (or one BFF aggregating) — never merge in a single unscoped collection.
- Domain package: `@vassembly/domain-system-agent` (or `system-agent`) for system-specific commands; reuse patterns from `@vassembly/domain-agent`.

---

## 6. UI/UX Specifications

### 6.1 Pages & routes

| Audience | Route (proposed) | Purpose |
|----------|------------------|---------|
| Admin | `/admin/system-agents` | List, create, edit, archive, restore |
| Admin | `/admin/system-agents/create` | Create form |
| Admin | `/admin/system-agents/[id]/edit` | Edit form |
| User | `/agents` (existing) | Add **Platform Agents** section above **My Agents** |
| User | `/settings` → AI Connections | **Use for system agents** selector |
| User | Invoke surface | Same modal/page pattern as personal agent invoke (Phase 4) |

Auth: admin routes use `RequireAuth` (or equivalent) with `roles={['admin']}`; user routes auth-only.

### 6.2 Admin management flows

1. Admin opens System Agents → sees table (name, category, status, updatedAt, updatedBy).
2. Create → form fields: name*, rule*, description, category → save → success toast → list.
3. Edit → same fields → save → audit updated.
4. Archive → confirm dialog → row leaves active list; restore from archived filter.

**States:** Loading skeleton, empty ("No system agents yet"), error banner with retry, validation inline.

### 6.3 User catalog flows

1. User opens Agents → Platform Agents section first (cards: name, description snippet, category badge).
2. Optional category chips filter list client- or server-side.
3. Tap agent → detail drawer/page with full description; invoke button enabled Phase 4.
4. No edit/delete/overflow menu on platform cards.

### 6.4 Connection preference (settings)

- Location: **Settings → AI Connections** (or subsection under existing integrations UI).
- Control: single-select dropdown of user's **active** credentials; label **Use for system agents**.
- Helper text: "Platform agents run using this connection and your API keys."
- On save success: toast "System agent connection updated."
- If only one credential: dropdown pre-selected; still editable when second is added.

### 6.5 First-time experience

1. User creates first credential on `/agents/ai-integrations/create`.
2. On success: backend sets preference + redirect with toast: **"This connection will be used for platform agents. You can change this in Settings."**
3. If user skips ever visiting settings, invoke still works (preference set).

### 6.6 Error & empty copy (user-facing)

| Situation | Copy |
|-----------|------|
| No platform agents | "No platform agents are available right now." |
| Invoke, no credential | "Add an AI connection before using platform agents." |
| Invoke, bad credential | "Your system agent connection isn't working. Update it in Settings or test the connection." |
| Invoke, archived agent | "This platform agent is no longer available." |
| Admin archive confirm | "Archive this platform agent? Users will no longer see or invoke it." |

---

## 7. Permission & Authorization Matrix

| Endpoint | user | operator | admin |
|----------|------|----------|-------|
| POST `/system-agents` | 403 | 403 | allow |
| GET `/system-agents` (admin list) | 403 | 403 | allow |
| GET `/system-agents/:id` | 403 | 403 | allow |
| PATCH `/system-agents/:id` | 403 | 403 | allow |
| DELETE `/system-agents/:id` | 403 | 403 | allow |
| POST `/system-agents/:id/restore` | 403 | 403 | allow |
| GET `/system-agents/catalog` | allow | allow | allow |
| GET `/system-agents/catalog/:id` | allow | allow | allow |
| GET `/connection-preference` | own | own | allow (own) |
| PUT `/connection-preference` | own | own | 403 |
| GET `/connection-preference/users/:userId` | 403 | 403 | allow |
| POST `/system-agents/:id/invoke` | allow, no override | allow, no override | allow + override |

**Notes**

- `operator` role must exist in `AuthTokenRole` and be issuable at login; today only `user` is issued — **dependency**.
- JWT verification must expose `role` to handlers (extend `authorizeRequest`).

---

## 8. Dependencies & Assumptions

### 8.1 Dependencies (must ship or exist first)

| Dependency | Status (2026-05-25) | Impact |
|------------|---------------------|--------|
| JWT `role` claim + admin issuance path | Role in token; login always `user` | Admin CRUD blocked until admins can log in with `admin` |
| `authorizeRequest` returns `role` | Returns `userId` only | All role gates |
| Personal agent invoke API + UI | Domain only | Phase 4 parity; reuse handler patterns |
| LangChain client (`ai-integration`) | Exists | Invoke implementation |
| AI credentials CRUD | Exists | Preference + invoke |
| Admin app route group | Not present | Phase 1 UI |

### 8.2 Assumptions

- Personal agent **invoke response shape** will be the canonical contract for system invoke.
- System agents do **not** embed `integrationCredentialId` on the agent document; connection is always per-user preference.
- **Operators** share user catalog/invoke rights; elevated observability endpoints are out of scope unless added later.
- **Description** is optional for system agents (unlike personal agents where description is required in agent-management PRD).
- **Rule max length 5000** is intentional (personal agents currently 2000) — align validation in both PRDs during implementation.
- Archive does not purge invoke history (if logging added later).

### 8.3 Out of scope

- User-created or user-editable system agents.
- Embedding platform API keys in system agents (users always bring credentials).
- Cross-tenant catalogs.
- Versioned system agent releases / semver per agent.
- GraphQL catalog in v1 (REST first).
- Billing/metering per invoke (future).

---

## 9. Rollout & Success Metrics

### 9.1 Rollout strategy

| Phase | Release gate | Feature flags |
|-------|--------------|---------------|
| 1 | Admin CRUD + API behind admin role; internal dogfood | `system_agents_admin_enabled` |
| 2 | Catalog visible to all authenticated users | `system_agents_catalog_enabled` |
| 3 | Preference API + settings UI + auto-default on credential create | `system_agents_preference_enabled` |
| 4 | Invoke API + UI | `system_agents_invoke_enabled` |

- Ship phases sequentially; do not enable invoke until preference + credential validation stable.
- Migrate zero user data (new collections).
- Runbook: admin creates 2–3 pilot agents before Phase 2 external comms.

### 9.2 Measurement plan

- **Adoption:** weekly unique users with ≥1 catalog view; ≥1 invoke post-Phase 4.
- **Quality:** invoke error rate by `SYSTEM_AGENT_*` codes; time-to-first-successful-invoke after signup.
- **Governance:** count active vs archived agents; admin update frequency.
- **Support:** tickets tagged `system-agent` / misconfiguration errors.

### 9.3 Regression scope

- Personal `/api/agents` unchanged behavior and scoping.
- Credential delete still blocked when used by personal agents; extend tests for system-agent preference.
- Existing `/agents` UI list performance with added catalog section.

---

## 10. Open Questions & Risks

| # | Question / risk | Owner | Impact |
|---|-----------------|-------|--------|
| OQ-1 | Should catalog `GET` include full `rule` or only on detail? | Design | Security / UX |
| OQ-2 | Invoke: require `connectionStatus === connected` or run live test on each invoke? | Engineering | Latency vs reliability |
| OQ-3 | Admin `connectionOverride`: use admin's own credential or any user's (support)? | Product/Security | Support tooling |
| OQ-4 | Is `operator` role in scope for v1 or same as `user` until RBAC expands? | Product | Matrix complexity |
| OQ-5 | Block archive when "active connection" — define metric (preference count vs invoke count)? | Product | Delete protection FR-AZ-4 |
| OQ-6 | Align `rule` max 5000 vs personal 2000 — single constant or product-specific? | Engineering | Validation drift |
| OQ-7 | Admin UI location: new `/admin` layout vs nested under settings | Design | Navigation IA |
| OQ-8 | BFF vs dual fetch for combined agent picker | Engineering | Latency |
| R-1 | Admin role not enforced anywhere today | High — security | |
| R-2 | Invoke not wired for personal agents | High — Phase 4 delay | |
| R-3 | Name uniqueness global may complicate i18n duplicate display names | Medium | |
| R-4 | Auto-preference on credential create races with parallel creates | Low — idempotent upsert | |

---

## Appendix A — Gherkin edge cases

### Empty states

```gherkin
Scenario: User catalog empty
  Given no active system agents exist
  When an end user opens the platform agents section
  Then they see empty state copy "No platform agents are available right now."
  And my agents section still loads normally
```

### Validation

```gherkin
Scenario: Name exceeds max length
  Given I am admin
  When I create a system agent with name length 101
  Then I receive 400 VALIDATION_ERROR
  And the agent is not created

Scenario: Duplicate name
  Given an active system agent named "Helper" exists
  When I create another active agent named "Helper"
  Then I receive 409 SYSTEM_AGENT_NAME_CONFLICT
```

### Interrupted flows

```gherkin
Scenario: Session expires on admin save
  Given my session expired
  When I submit the system agent edit form
  Then I am redirected to login with returnUrl
  And no partial update is applied without auth
```

### System errors

```gherkin
Scenario: Provider timeout on invoke
  Given my connection is valid
  When the provider times out
  Then I receive 504 or 502 with message "The AI provider took too long. Try again."
  And no partial message is shown as success
```

---

## Appendix B — Acceptance checklist (QA)

**Phase 1**

- [ ] Admin can create, list, get, update, archive, restore system agents
- [ ] Non-admin receives 403 on all management endpoints
- [ ] Audit fields populated on create/update
- [ ] Name uniqueness and field validation enforced

**Phase 2**

- [ ] User catalog shows only active, non-archived agents
- [ ] User cannot mutate catalog via API or UI

**Phase 3**

- [ ] First credential sets preference + toast
- [ ] Settings dropdown persists preference across sessions
- [ ] PUT rejects credential not owned by user

**Phase 4**

- [ ] Invoke succeeds with valid preference and connected credential
- [ ] Invoke fails with clear errors for missing/invalid preference
- [ ] Admin override works; user override forbidden
- [ ] Response matches personal invoke contract

---

*End of PRD — ready for architecture (`docs/features/system-agent/architecture.md`) and design review.*
