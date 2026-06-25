# Product Requirements Document: Skill (Vassembly)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-06-24  
**Related PRDs:** [Specialization](../specialization/prd.md), [System Agent](../system-agent/prd.md), [Agent Internal Tools](../agent-internal-tools/prd.md)  
**Feature slug:** `skill`  
**Standard reference:** [Agent Skills open standard](https://agentskills.io/specification)

---

## 1. Executive Summary

### 1.1 Problem

Specializations organize domain knowledge (agents, MCPs) but lack a structured way to package **reusable agent instructions and executable scripts** per domain. Platform operators cannot inspect what skills exist for a specialization, what instructions they contain, or what scripts they bundle. There is no persistence layer aligned with the [Agent Skills](https://agentskills.io/home) format (`SKILL.md` + optional `scripts/`).

### 1.2 Solution

Introduce a **Skill** entity linked to a **Specialization** via `specializationId`. Each skill stores:

- **Metadata** (`name`, `description`) per agentskills.io frontmatter
- **Rule** — the Markdown instruction body (equivalent to `SKILL.md` content after frontmatter)
- **Scripts** — metadata in MongoDB; script **code** stored externally (AWS S3 in production, local disk when running locally)

MVP delivers **read-only admin visibility**: list skills on the specialization detail page, navigate to a skill detail page showing the rule and a script code viewer with syntax highlighting.

### 1.3 Success metrics

| Metric | Target (90 days post MVP) | Measurement |
|--------|---------------------------|-------------|
| Skill catalog coverage | ≥ 1 skill per active specialization (where skills are provisioned) | `skills` collection count grouped by `specializationId` |
| Admin discoverability | Admin can open any skill from specialization detail in ≤ 2 clicks | E2E smoke scenario pass rate |
| Script viewer reliability | Script content loads for 100% of skills with stored scripts | API success rate on script content fetch |
| Standard alignment | 100% of stored skills have valid `name` + `description` per agentskills.io constraints | Validation at write boundary |

### 1.4 Phasing summary

| Phase | Deliverable |
|-------|-------------|
| **MVP — Read & view** | Skill domain + service, S3/local script storage, GraphQL reads, script content REST read, admin UI (list on specialization detail + skill detail page) |
| **Phase 2 — Provisioning** | Agent internal tool(s) to create/update skills; upload scripts to storage |
| **Phase 3 — Agent consumption** | System agents load skills by specialization at runtime |
| **Phase 4 — Full agentskills.io** | `references/`, `assets/` folders; optional frontmatter fields (`license`, `compatibility`, `metadata`, `allowed-tools`) |

---

## 2. User Personas

| Persona | Description | Primary interaction (MVP) |
|---------|-------------|---------------------------|
| **Platform Admin** | Inspects specialization catalog, agents, MCPs, and now skills | Read-only skill list + detail UI |
| **System (AI)** | Future: provisions skills via internal tools | Out of MVP UI scope |
| **End User** | No direct skill interaction in MVP | — |

---

## 3. User Stories

Stories use **Gherkin** acceptance criteria. IDs follow the `SK-N` convention.

### Admin stories

**SK-1 — View skills on specialization detail**

```gherkin
As a platform admin
I want to see all skills linked to a specialization on its detail page
So that I can understand what agent capabilities exist for that domain

Scenario: Specialization with skills shows skills panel
  Given I am authenticated as admin
  And a specialization "Legal" exists with 2 skills
  When I navigate to the specialization detail page for "Legal"
  Then I see a "Skills" section
  And I see skill "contract-review" with its description
  And I see skill "legal-research" with its description

Scenario: Specialization with no skills shows empty state
  Given I am authenticated as admin
  And a specialization "Finance" exists with 0 skills
  When I navigate to the specialization detail page for "Finance"
  Then I see a "Skills" section
  And I see "No skills linked to this specialization yet."

Scenario: Non-admin cannot access specialization detail
  Given I am authenticated without admin role
  When I navigate to "/specialization/{specializationId}"
  Then I see the admin-only access message
```

**SK-2 — Navigate to skill detail**

```gherkin
As a platform admin
I want to open a skill's detail page from the specialization detail list
So that I can read its instructions and scripts

Scenario: Admin opens skill detail from specialization
  Given I am authenticated as admin
  And specialization "Legal" has skill "contract-review"
  When I navigate to the specialization detail page for "Legal"
  And I click the skill "contract-review"
  Then I am on "/specialization/{specializationId}/skills/{skillId}"
  And I see the skill name "contract-review"
  And I see the skill description
  And I see the skill rule (instructions) content
```

**SK-3 — View skill rule and scripts**

```gherkin
As a platform admin
I want to read a skill's instructions and browse its script files
So that I can audit what the skill teaches an agent to do

Scenario: Skill detail shows rule and script list
  Given I am authenticated as admin
  And skill "contract-review" has a rule with workflow instructions
  And skill "contract-review" has scripts "scripts/validate.py" and "scripts/run-check.sh"
  When I navigate to the skill detail page for "contract-review"
  Then I see the rule content in a readable format
  And I see script "scripts/validate.py" in the scripts list
  And I see script "scripts/run-check.sh" in the scripts list
  And the first script's code is displayed by default

Scenario: Selecting a script switches displayed code
  Given I am on the skill detail page for "contract-review"
  And scripts "scripts/validate.py" and "scripts/run-check.sh" exist
  When I select script "scripts/run-check.sh"
  Then I see the code content of "scripts/run-check.sh"
  And I do not see the code content of "scripts/validate.py" as the active view

Scenario: Skill with no scripts hides script viewer
  Given skill "legal-research" has a rule but no scripts
  When I navigate to the skill detail page for "legal-research"
  Then I see the rule content
  And I see "No scripts bundled with this skill."
```

**SK-4 — Script syntax highlighting**

```gherkin
As a platform admin
I want script code displayed with syntax highlighting appropriate to its language
So that I can read scripts efficiently

Scenario: Python script uses Python highlighting
  Given skill "contract-review" has script "scripts/validate.py" with language "python"
  When I view that script on the skill detail page
  Then the code viewer applies Python syntax highlighting

Scenario: Node.js script uses JavaScript highlighting
  Given a skill has script "scripts/build.js" with language "nodejs"
  When I view that script on the skill detail page
  Then the code viewer applies JavaScript syntax highlighting

Scenario: Bash script uses shell highlighting
  Given a skill has script "scripts/setup.sh" with language "bash"
  When I view that script on the skill detail page
  Then the code viewer applies Bash/shell syntax highlighting
```

**SK-5 — Skill detail not found**

```gherkin
As a platform admin
I want clear feedback when a skill does not exist
So that I am not shown stale or incorrect data

Scenario: Unknown skill ID returns not found
  Given I am authenticated as admin
  When I navigate to "/specialization/{specializationId}/skills/nonexistent-id"
  Then I see "Skill not found."
  And I see a link back to the parent specialization detail page
```

**SK-6 — No skill mutation UI in MVP**

```gherkin
As a platform admin
I want to understand that skills are read-only in MVP
So that I do not expect create or edit controls

Scenario: No create/edit/delete UI on skill pages
  Given I am on a specialization detail page or skill detail page
  Then there is no "Create skill" button
  And there is no edit or delete action on any skill item
```

---

## 4. Functional Requirements

### 4.1 Skill data model

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-DM-1 | A `skills` MongoDB collection stores skills linked to a specialization. | Documents persist with `specializationId` FK. |
| FR-DM-2 | Required fields: `name`, `description`, `rule`, `specializationId`. | Validation enforces agentskills.io constraints on `name` and `description`. |
| FR-DM-3 | `name`: lowercase letters, numbers, hyphens only; max 64 chars; no leading/trailing/consecutive hyphens. | Invalid names rejected at write boundary. |
| FR-DM-4 | `description`: non-empty; max 1024 chars. | Invalid descriptions rejected at write boundary. |
| FR-DM-5 | `rule`: non-empty string (Markdown body; equivalent to `SKILL.md` content after YAML frontmatter). | Stored in MongoDB; returned via GraphQL. |
| FR-DM-6 | `scripts`: array of script metadata subdocuments (may be empty). | Each entry has `filename`, `language`, `storageKey`. |
| FR-DM-7 | Script code is **not** stored inline in MongoDB. | Only `storageKey` references external storage. |
| FR-DM-8 | `language` enum: `python` \| `nodejs` \| `bash`. | Invalid language rejected at write boundary. |
| FR-DM-9 | `filename` follows agentskills.io convention (e.g. `scripts/foo.py`). | Relative path within skill directory. |
| FR-DM-10 | Skills are immutable in MVP from admin UI (no update/delete REST for admins). | No admin mutation endpoints in MVP. |

**Skill document shape**

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | System-set |
| `specializationId` | string | Required; references `specializations.id` |
| `name` | string | Required; agentskills.io `name` constraints |
| `description` | string | Required; max 1024 |
| `rule` | string | Required; Markdown instructions |
| `scripts` | `SkillScript[]` | Optional; default `[]` |
| `createdAt` | timestamp | System-set |
| `updatedAt` | timestamp | System-set |

**SkillScript subdocument**

| Field | Type | Rules |
|-------|------|-------|
| `filename` | string | Required; e.g. `scripts/validate.py` |
| `language` | enum | Required; `python` \| `nodejs` \| `bash` |
| `storageKey` | string | Required; S3 key or local relative path |

### 4.2 Script storage

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-ST-1 | Production: script code stored in AWS S3 using `@vassembly/client-aws-s3`. | `getFile` retrieves content by `storageKey`. |
| FR-ST-2 | Local development: script code stored on local disk at a configurable root path. | Same `storageKey` convention; filesystem read. |
| FR-ST-3 | Storage abstraction hides S3 vs local behind a single interface in domain or shared package. | Service/domain callers do not branch on environment. |
| FR-ST-4 | Key convention: `skills/{skillId}/scripts/{filename}` (or architecture-approved equivalent). | Keys deterministic and unique per skill+filename. |
| FR-ST-5 | Missing script file in storage returns 404 with clear error code. | UI shows script-unavailable state. |

### 4.3 API surface — reads (MVP)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-API-1 | GraphQL query `skillsBySpecialization(specializationId)` returns skills for a specialization (metadata only; no script code). | Returns `[]` when none; admin-only. |
| FR-API-2 | GraphQL query `skill(id)` returns single skill with metadata, `rule`, and script metadata list (no inline code). | Returns null for unknown ID; admin-only. |
| FR-API-3 | REST `GET /api/skills/:skillId/scripts/:filename` returns script source code as `text/plain` (or JSON wrapper per architecture). | Admin-only; 404 when skill/script missing. |
| FR-API-4 | GraphQL `specialization(id)` response may optionally include nested `skills` (architecture decision) OR UI uses separate `skillsBySpecialization` query. | No N+1 without pagination cap. |
| FR-API-5 | No user-facing REST write endpoints for skills in MVP. | Creation deferred to Phase 2 internal tools. |
| FR-API-6 | All skill read endpoints require authenticated admin role. | Non-admin → 403. |

### 4.4 Authorization

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-AZ-1 | All skill GraphQL queries require `role === admin`. | Non-admin → 403. |
| FR-AZ-2 | Script content REST endpoint requires admin role. | Non-admin → 403. |
| FR-AZ-3 | Skill creation in MVP is not exposed via public API (seed or internal tooling only). | No `POST /api/skills` in MVP unless architecture specifies internal-only route. |

### 4.5 Admin UI

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-UI-1 | Specialization detail page (`/specialization/[id]`) gains a **Skills** panel/section. | Follows existing Agents/MCPs panel pattern. |
| FR-UI-2 | Skills panel lists: name, description (truncated), link to skill detail. | Empty state when no skills. |
| FR-UI-3 | Skill detail route: `/specialization/[id]/skills/[skillId]` (preferred nested route). | Breadcrumb/back to parent specialization. |
| FR-UI-4 | Skill detail shows: name (h1), description, rule (formatted Markdown or preformatted text). | Loading, 404, error states. |
| FR-UI-5 | Skill detail shows script file list; selecting one loads and displays code. | Only one script code visible at a time. |
| FR-UI-6 | Syntax highlighting by `language`: python → Python, nodejs → JavaScript, bash → Bash/shell. | Reuse existing code display component if available. |
| FR-UI-7 | No create, edit, or delete controls on skill UI in MVP. | Read-only. |
| FR-UI-8 | Admin role required for all skill routes. | `ProtectedAuthRoute` with `roles={['admin']}`. |
| FR-UI-9 | Loading, empty, and error states for skills panel and skill detail. | Match specialization/MCP patterns. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Area | Target |
|------|--------|
| Skills list by specialization | p95 < 200 ms for ≤ 50 skills per specialization |
| Skill detail (metadata + rule) | p95 < 200 ms |
| Script content fetch | p95 < 500 ms for scripts ≤ 100 KB |
| Specialization detail page (with skills panel) | No regression > 50 ms vs current detail load |

### 5.2 Reliability

- Script storage read failures must not crash specialization detail page; skill list still renders.
- Skill detail page shows inline error for failed script fetch with retry affordance.

### 5.3 Security

- Sanitize and length-limit `name`, `description`, `rule` at write boundary.
- Script content served only to admin; no public signed URLs in MVP.
- `storageKey` is server-internal; never expose bucket credentials to client.

### 5.4 Observability

- Log events: `skill.read`, `skill.script.read`, `skill.script.not_found`, `skill.storage.error`.
- Include `skillId`, `specializationId`, `filename`, `storageBackend` (s3 \| local).

### 5.5 Platform

- MongoDB for skill metadata; indexes registered in `apps/api/src/bootstrap/mongoIndexes.ts`.
- New packages: `@vassembly/domain-skill`, `@vassembly/service-skill`.
- Reuse `@vassembly/client-aws-s3` for production script reads/writes.

---

## 6. Data Model & API Specification (draft)

### 6.1 MongoDB collection — `skills`

```json
{
  "_id": "skill_contract_review_01",
  "specializationId": "spec_legal_01",
  "name": "contract-review",
  "description": "Reviews contracts for risky clauses and suggests redlines. Use when the user asks to review or analyze a contract.",
  "rule": "# Contract Review\n\n1. Identify parties...\n2. Flag indemnification...",
  "scripts": [
    {
      "filename": "scripts/validate.py",
      "language": "python",
      "storageKey": "skills/skill_contract_review_01/scripts/validate.py"
    }
  ],
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:00.000Z"
}
```

**Indexes (minimum):**
- `{ specializationId: 1, name: 1 }` unique (skill name unique per specialization)
- `{ specializationId: 1 }` for list-by-specialization queries

### 6.2 GraphQL (draft)

```graphql
enum SkillScriptLanguage {
  python
  nodejs
  bash
}

type SkillScript {
  filename: String!
  language: SkillScriptLanguage!
}

type Skill {
  id: ID!
  specializationId: ID!
  name: String!
  description: String!
  rule: String!
  scripts: [SkillScript!]!
  createdAt: String!
  updatedAt: String!
}

type Query {
  skillsBySpecialization(specializationId: ID!): [Skill!]!
  skill(id: ID!): Skill
}
```

### 6.3 REST — script content (draft)

```
GET /api/skills/:skillId/scripts/:filename
Authorization: Bearer <admin token>
Response: 200 text/plain (script source) | 404 | 403
```

*Final shape (plain text vs JSON, URL encoding for filename) — see architecture doc.*

### 6.4 Mapping to Agent Skills standard

| agentskills.io | Vassembly storage |
|----------------|-------------------|
| `SKILL.md` YAML `name` | `Skill.name` |
| `SKILL.md` YAML `description` | `Skill.description` |
| `SKILL.md` Markdown body | `Skill.rule` |
| `scripts/*` files | `Skill.scripts[]` metadata + external storage |
| `references/`, `assets/` | Out of MVP scope |

---

## 7. UI/UX Specifications

### 7.1 Pages & routes

| Audience | Route | Purpose |
|----------|-------|---------|
| Admin | `/specialization/[id]` | Existing detail + new Skills panel |
| Admin | `/specialization/[id]/skills/[skillId]` | Skill rule + script viewer |

Auth: `ProtectedAuthRoute` with `roles={['admin']}`.

### 7.2 Specialization detail — Skills panel

**Placement:** Third panel below or beside Agents/MCPs (layout per design; default: full-width section below existing panels).

**Each skill row:**
- Name (bold, monospace or code style — agentskills.io names are hyphenated)
- Description (truncated ~80 chars)
- Click → `/specialization/[id]/skills/[skillId]`

**Empty state:** "No skills linked to this specialization yet."

### 7.3 Skill detail page

**Header:**
- Back link: "← Back to {Specialization name}"
- Name (h1)
- Description (full text)

**Rule section:**
- Heading: "Instructions" or "Rule"
- Rendered Markdown or preformatted block (match system agent rule display if exists)

**Scripts section:**
- Heading: "Scripts"
- Left: file list (filenames)
- Right: code viewer with syntax highlighting
- Default selection: first script alphabetically by filename
- Empty: "No scripts bundled with this skill."

**States:** loading skeleton, 404, error with retry (rule load vs script load may fail independently).

---

## 8. Out of Scope (MVP)

| Item | Deferred to |
|------|-------------|
| Admin create/edit/delete skill UI | Phase 2 |
| Agent internal tool `create-skill` / `update-skill` | Phase 2 |
| `references/` and `assets/` folders | Phase 4 |
| Optional SKILL.md frontmatter (`license`, `compatibility`, `metadata`, `allowed-tools`) | Phase 4 |
| Agents loading skills at runtime | Phase 3 |
| Skill search / global skill catalog page | Future |
| Script upload via UI | Phase 2 |
| Versioning / audit history of skill changes | Future |

---

## 9. Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|-------------------|
| `domains/specialization` + admin UI | Exists | No parent entity to link skills |
| `@vassembly/client-aws-s3` | Exists (unused in app flows) | No production script storage |
| S3 bucket config (`config.aws.s3.bucketName`) | Type exists; wiring TBD | Production storage unavailable |
| Admin role + GraphQL admin gating | Exists (specialization pattern) | Cannot secure skill reads |
| Code syntax highlighting component | TBD — search UI packages | Plain text fallback only |

---

## 10. Acceptance Criteria (QA Checklist)

### MVP

**Data & API:**
- [ ] Skill documents persist with `specializationId`, `name`, `description`, `rule`, `scripts[]`
- [ ] `skillsBySpecialization` returns correct list; empty array when none
- [ ] `skill(id)` returns metadata + rule + script list (no inline code)
- [ ] Script content endpoint returns file contents for valid skill+filename
- [ ] Script content endpoint returns 404 for missing skill or script
- [ ] All endpoints admin-gated

**Storage:**
- [ ] Local dev reads scripts from configured local root
- [ ] Production path uses S3 via `client-aws-s3`
- [ ] `storageKey` convention documented and consistent

**Admin UI:**
- [ ] Skills panel on specialization detail lists skills with links
- [ ] Skills panel empty state renders correctly
- [ ] Skill detail page shows name, description, rule
- [ ] Script list + single-script code viewer works
- [ ] Syntax highlighting correct per language
- [ ] 404 for unknown skill
- [ ] No create/edit/delete controls
- [ ] Non-admin blocked on skill routes

**E2E:**
- [ ] Gherkin scenarios SK-1 through SK-6 covered in `apps/web/e2e/features/skills/`

**Regression:**
- [ ] Specialization detail (agents, MCPs) unchanged when skills panel empty
- [ ] Existing specialization GraphQL queries unaffected

---

## 11. Open Questions

| # | Question | Owner | Default recommendation |
|---|----------|-------|------------------------|
| OQ-1 | Route: nested `/specialization/[id]/skills/[skillId]` vs standalone `/skill/[id]`? | Product | Nested — preserves specialization context and breadcrumbs |
| OQ-2 | Script content via GraphQL field vs separate REST GET? | Engineering | REST GET — avoids large payloads in GraphQL; follows read convention for binary/large text |
| OQ-3 | Seed skills in dev/test or require manual DB + file setup for E2E? | Engineering | E2E seed fixture (like specialization MCP seed) |
| OQ-4 | Render `rule` as Markdown or plain preformatted text? | Design | Markdown if system agent rule viewer exists; else preformatted |
| OQ-5 | Unique constraint: skill `name` globally or per `specializationId`? | Product | Per specialization (matches agentskills.io folder-per-skill within domain) |
| OQ-6 | Local storage root path env var name and default? | Engineering | e.g. `SKILL_SCRIPT_STORAGE_PATH=./.data/skill-scripts` |
| OQ-7 | MVP skill data: manual seed, migration script, or internal tool only? | Product | Seed + optional internal tool stub for Phase 2 |
| OQ-8 | Max script file size limit? | Engineering | 512 KB per script for MVP |

---

*End of PRD — pending architecture (`docs/features/skill/architecture.md`) and user approval before implementation.*
