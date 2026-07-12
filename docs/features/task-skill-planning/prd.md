# Product Requirements Document: Deterministic Task Planning via Skills (Vassembly)

**Document status:** Draft for design & engineering handoff  
**Last updated:** 2026-07-01  
**Related PRDs:** [Skill](../skill/prd.md), [Specialization](../specialization/prd.md), [Async LLM Task Execution](../async-llm-task-execution/prd.md), [Agent Internal Tools](../agent-internal-tools/prd.md)  
**Feature slug:** `task-skill-planning`

---

## 1. Executive Summary

### 1.1 Problem

When two users submit tasks with the same goal, the platform produces **different execution plans**. Current task workers (`Task worker`, `Scheduled task worker`, `Routine task worker`) orchestrate per-specialization researcher → worker → validator chains and synthesize an **ephemeral, LLM-improvised plan** that is not grounded in reusable, persisted instructions. There is no mechanism to:

- Select a **known procedure** (skill) for a recurring class of work
- **Provision** a new procedure when none exists and reuse it on subsequent tasks
- Encode **deterministic logic** in scripts rather than free-form model reasoning
- Constrain planning to **skills belonging to the task's assigned specializations**

Skills exist as persisted entities (rule, scripts, specialization linkage) with `create-skill` and `resolve-skill` tools, but they are **not integrated into the task planning path**.

### 1.2 Solution

Introduce a **skill-driven planning pipeline** for all non-question task intents (`task`, `scheduled_task`, `routine_task`):

1. **Research phase (existing pattern, retained):** Per linked specialization, invoke the specialization **researcher** to produce a research summary for the task goal.
2. **Task Planner (new system agent):** Consumes research summaries + task goal; selects and composes a plan from **existing enabled skills** scoped to the task's `specializationIds`. May call `ask_user` for clarification. If no applicable skill exists, delegates to **Skill Planner** and waits for skill creation before replanning.
3. **Skill Planner (new system agent):** For a given specialization + goal, authors a new skill: Markdown **rule** (clear, step-by-step), optional **scripts** with deterministic logic, and **MCP references** drawn from MCPs mapped to that specialization. Persists via `create_skill`.
4. **Skill Script Creators (three new system agents):** `Skill python script creator`, `Skill javascript script creator`, and `Skill bash script creator` — each returns script source code for a stated script goal following language-specific coding standards.

The final plan remains **ephemeral** (returned in the task LLM response, not persisted as a separate entity in this feature). Determinism is achieved by **reusing the same skill rule + scripts** for equivalent goals across users and tasks.

### 1.3 Success Metrics

| Metric | Target (90 days post launch) | Measurement |
|--------|------------------------------|-------------|
| Skill reuse rate | ≥ 60% of task plans for repeat goal classes reference at least one existing skill (not newly created) | Plan logs: `skillIdsUsed` vs `skillsCreated` |
| Cross-user plan consistency | ≥ 80% structural step overlap (same ordered skill steps) for identical normalized goals in the same specialization | Sampled QA comparison |
| Skill provisioning success | ≥ 95% of Skill Planner invocations persist a valid skill via `create_skill` | Tool success rate |
| Clarification discipline | Task Planner asks ≤ 2 clarification rounds before producing a plan or failing | `ask_user` call count per task |
| Question intent unaffected | 0 regressions in Question worker routing | E2E question scenarios pass |

### 1.4 Phasing Summary

| Phase | Deliverable |
|-------|-------------|
| **Phase 1 — Agents & orchestration** | Seed Task Planner, Skill Planner, three Script Creator agents; wire into task/scheduled/routine worker flows; structured logging |
| **Phase 2 — Determinism hardening** | Skill selection normalization, script execution hooks in plan steps (future execution feature), admin visibility of skills used in plan logs |
| **Phase 3 — Plan persistence (optional future)** | Persist plans linked to skills for audit/replay — **out of scope for Phase 1** |

---

## 2. User Personas

| Persona | Description | Primary interaction |
|---------|-------------|---------------------|
| **End User** | Creates tasks via prompt; expects consistent, reliable plans for similar requests | Submits task; may answer clarification questions via task detail UI |
| **Platform Admin** | Observes specializations, skills, and agent catalog | Indirect — reviews skills created by Skill Planner on specialization detail |
| **System (AI)** | Task Planner, Skill Planner, Script Creators, and existing task workers act as automated actors | Agent-to-agent delegation and internal tool calls |

---

## 3. User Stories

Stories use **Gherkin** acceptance criteria. IDs follow conventions: `TP-N` (Task Planner), `SP-N` (Skill Planner), `SSC-N` (Skill Script Creator), `INT-N` (integration).

### End-user stories

**TP-1 — Consistent plan for equivalent task goals**

```gherkin
As an end user
I want a plan for my task to follow the same structured steps as another user with the same goal in the same domain
So that outcomes are predictable and trustworthy

Scenario: Two users receive skill-based plans for the same goal
  Given specialization "legal" has enabled skill "contract-review" with a defined rule
  And user A submits task "Review my NDA for risky clauses"
  And user B submits task "Review my NDA for risky clauses"
  When both tasks complete with intent category "task"
  Then both task responses include a plan whose ordered steps follow skill "contract-review"
  And both plans list the same numbered steps derived from the skill rule
```

**TP-2 — Clarification before planning**

```gherkin
As an end user
I want the system to ask focused questions when my task goal is ambiguous
So that the plan matches my intent

Scenario: Task Planner asks one clarification question
  Given I submit task "Set up monitoring"
  And the goal is ambiguous across multiple specializations on my task
  When Task Planner cannot select a single applicable skill without more context
  Then Task Planner calls ask_user with one or more specific questions
  And my task status becomes "waiting"
  And after I answer, planning resumes and produces a plan

Scenario: Task Planner does not ask unnecessary questions
  Given I submit task "Review contract ID 12345 for indemnification clauses"
  And an applicable skill exists for my task's specialization
  When Task Planner runs
  Then Task Planner does not call ask_user
  And a plan is produced in the same execution pass
```

**TP-3 — Scheduled and routine tasks use skill-based planning**

```gherkin
As an end user
I want scheduled and recurring tasks to use the same skill-driven planning as one-off tasks
So that recurring work follows established procedures

Scenario: Scheduled task plan includes schedule-specific sections
  Given I submit "Remind me Friday at 9am to run the weekly sales report"
  And intent category is "scheduled_task"
  And applicable skill "weekly-sales-report" exists for specialization "finance"
  When task execution completes
  Then the response plan includes scheduled execution time
  And execution steps follow skill "weekly-sales-report"

Scenario: Routine task plan includes recurrence sections
  Given I submit "Every Monday summarize inbox priorities"
  And intent category is "routine_task"
  When Task Planner runs after research
  Then the response plan includes recurrence pattern
  And steps follow an applicable skill or a newly provisioned skill
```

**TP-4 — Question intents bypass Task Planner**

```gherkin
As an end user
I want informational questions answered directly without a task execution plan
So that I get answers, not procedural steps

Scenario: Question intent routes to Question worker only
  Given I submit "What is indemnification in contract law?"
  And intent category is "question"
  When the Assistant routes by intent
  Then "Question worker" is invoked
  And Task Planner is not invoked
  And the response is an answer, not a numbered execution plan
```

### Task Planner stories

**TP-5 — Plan from existing skills only within task specializations**

```gherkin
As the platform
I want Task Planner to use skills only from specializations assigned to the task
So that cross-domain skill leakage cannot occur

Scenario: Skills filtered by task specializationIds
  Given task.specializationIds is ["spec_legal_01"]
  And skill "contract-review" exists for "spec_legal_01"
  And skill "deploy-service" exists for "spec_engineering_02"
  When Task Planner selects skills for planning
  Then it may use "contract-review"
  And it must not use "deploy-service"

Scenario: Multiple specializations allow skills from each
  Given task.specializationIds is ["spec_legal_01", "spec_finance_02"]
  And each specialization has at least one applicable enabled skill
  When Task Planner runs
  Then the plan may compose steps from skills in both specializations
  And each referenced skill's specializationId is in task.specializationIds
```

**TP-6 — Task Planner triggers Skill Planner when no skill exists**

```gherkin
As the platform
I want a missing skill to be created automatically before planning completes
So that the first occurrence of a novel goal still yields a reusable procedure

Scenario: No matching skill triggers Skill Planner then replans
  Given task.specializationIds is ["spec_legal_01"]
  And no enabled skill matches the task goal for "spec_legal_01"
  When Task Planner runs
  Then Task Planner delegates to Skill Planner for the relevant specialization and goal
  And Task Planner waits for Skill Planner to complete
  And Task Planner creates a plan using the newly created skill
  And the plan references the new skill by name

Scenario: Skill Planner failure surfaces clear task error
  Given no applicable skill exists
  And Skill Planner fails to persist a skill
  When Task Planner completes
  Then the task fails with a user-readable error
  And the error indicates planning could not proceed without a skill
```

**TP-7 — Task Planner consumes research summaries**

```gherkin
As the platform
I want Task Planner to receive research from all linked specialization researchers
So that plans are informed by domain context before skill selection

Scenario: Research gathered before Task Planner
  Given task.specializationIds has 2 specializations
  When the task worker orchestrates planning
  Then each specialization's researcher is invoked first
  And Task Planner receives all research summaries plus the original task goal
  And the final plan reflects research context where relevant
```

### Skill Planner stories

**SP-1 — Create skill with rule, scripts, and MCP references**

```gherkin
As the platform
I want Skill Planner to author a complete skill for a specialization and goal
So that the skill can be reused by Task Planner and future tasks

Scenario: Skill Planner creates skill via create_skill
  Given specialization "spec_legal_01" with mapped MCPs "legal-db" and "web-search"
  And goal "Review NDA for risky clauses"
  When Skill Planner runs
  Then it calls create_skill with name, description, and rule
  And the rule is Markdown with clear numbered steps
  And the rule references applicable MCPs from the specialization's mapped MCP set
  And create_skill returns { skillId, isNew: true }

Scenario: Idempotent skill creation on duplicate name
  Given skill "nda-review" already exists for the specialization
  When Skill Planner calls create_skill with the same name and onDuplicate returnExisting
  Then create_skill returns { skillId, isNew: false }
  And no duplicate skill document is created
```

**SP-2 — Skill rule quality requirements**

```gherkin
As the platform
I want skill rules to be clear and simple
So that Task Planner and future agents interpret them consistently

Scenario: Rule follows structure constraints
  Given Skill Planner authors a skill rule
  Then the rule uses numbered steps
  And each step is actionable and verifiable
  And the rule does not contain vague instructions like "handle appropriately"
  And the rule length is proportional to goal complexity (typically ≤ 2000 characters)
```

**SP-3 — Skill Planner delegates script creation**

```gherkin
As the platform
I want deterministic logic placed in scripts rather than free-form rule text
So that repeated executions behave identically

Scenario: Skill Planner invokes script creator for validation logic
  Given the goal requires deterministic file or data validation
  When Skill Planner authors the skill
  Then it delegates to the appropriate Skill Script Creator with a script goal
  And includes the returned script in create_skill scripts[]
  And the rule instructs when and how to run the script

Scenario: Skill without scripts omits script creator calls
  Given the goal requires only procedural Markdown steps
  When Skill Planner authors the skill
  Then no Script Creator is invoked
  And create_skill is called with scripts: []
```

**SP-4 — MCP references scoped to specialization**

```gherkin
As the platform
I want skills to reference only MCPs mapped to their specialization
So that tools outside the domain are not advertised

Scenario: MCP references from specialization catalog
  Given specialization "spec_legal_01" has MCPs ["legal-db", "web-search"] mapped
  And MCP "github" is not mapped to "spec_legal_01"
  When Skill Planner authors a skill for "spec_legal_01"
  Then the rule may reference "legal-db" and "web-search"
  And the rule must not reference "github"
```

### Skill Script Creator stories

**SSC-1 — Python script creator**

```gherkin
As Skill Planner
I want a Python script generated for a stated script goal
So that deterministic logic is executable and consistent

Scenario: Python script creator returns valid code
  Given script goal "Validate contract PDF has signature block markers"
  When Skill Planner delegates to "Skill python script creator"
  Then the agent returns Python source code only
  And the code follows project Python conventions (typed where applicable, no secrets)
  And the filename suggestion uses prefix "scripts/" and suffix ".py"
```

**SSC-2 — JavaScript script creator**

```gherkin
As Skill Planner
I want a Node.js script generated for a stated script goal
So that JavaScript automation steps are deterministic

Scenario: JavaScript script creator returns valid code
  Given script goal "Parse JSON API response and extract error codes"
  When Skill Planner delegates to "Skill javascript script creator"
  Then the agent returns JavaScript source code only
  And the code follows project TypeScript/JavaScript conventions
  And the filename suggestion uses prefix "scripts/" and suffix ".js"
```

**SSC-3 — Bash script creator**

```gherkin
As Skill Planner
I want a Bash script generated for a stated script goal
So that shell automation steps are deterministic

Scenario: Bash script creator returns valid code
  Given script goal "Check file exists and is readable before processing"
  When Skill Planner delegates to "Skill bash script creator"
  Then the agent returns Bash source code only
  And the script uses "set -euo pipefail" unless goal requires otherwise
  And the filename suggestion uses prefix "scripts/" and suffix ".sh"
```

**SSC-4 — Script creator language selection**

```gherkin
As Skill Planner
I want to invoke the correct Script Creator by language
So that scripts match the skill scripts language enum

Scenario: Language maps to agent
  Given Skill Planner needs a script with language "python"
  Then it delegates to "Skill python script creator"
  Given Skill Planner needs a script with language "nodejs"
  Then it delegates to "Skill javascript script creator"
  Given Skill Planner needs a script with language "bash"
  Then it delegates to "Skill bash script creator"
```

### Integration stories

**INT-1 — Task worker orchestration updated**

```gherkin
As the platform
I want task workers to use Task Planner instead of worker/validator planning chains
So that all non-question task plans are skill-driven

Scenario: Task worker delegates research then Task Planner
  Given intent category "task"
  When "Task worker" runs
  Then it invokes researchers for each task specialization
  And it delegates to "Task planner" with research summaries and goal
  And it does not invoke specialization workers or validators for plan synthesis
  And the Task worker returns Task Planner's plan as its output

Scenario: Scheduled and routine workers follow same pattern
  Given intent category "scheduled_task" or "routine_task"
  When the corresponding worker runs
  Then it follows the same research → Task Planner pattern
  And adds schedule- or recurrence-specific sections to the plan output format
```

**INT-2 — Skill catalog available to planners**

```gherkin
As Task Planner
I want visibility into skill name and description for task specializations
So that I can select the correct skill before resolving full rules

Scenario: Task Planner uses skill catalog then resolve_skill
  Given enabled skills exist for task specializations
  When Task Planner selects skill "contract-review"
  Then it resolves the full rule via resolve_skill or Skill resolver delegation
  And composes the plan from the resolved rule steps
```

**INT-3 — Existing tools and agents reused**

```gherkin
As the platform
I want planning to reuse existing internal tools and agents
So that behavior stays consistent with skill and question flows

Scenario: Tools assigned correctly
  Given "Task planner" is seeded
  Then it has agent-use, agent-list, user-ask, and skill-resolve (or resolve_skill) assigned
  Given "Skill planner" is seeded
  Then it has agent-use, skill-create, and agent-list assigned
  Given "Skill resolver" exists
  Then Task Planner may delegate rule retrieval to "Skill resolver"
```

---

## 4. Functional Requirements

### 4.1 System agent seed additions

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-AG-1 | Add system agent `"Task planner"` to seed with category `utility`. | Present in `systemAgents.json`; added to `SYSTEM_AGENT_NAME` enum. |
| FR-AG-2 | Task planner rule instructs: consume research summaries + goal; select skills from task `specializationIds` only; call `ask_user` when needed; delegate to Skill Planner when no skill matches; compose final plan from resolved skill rules. | Rule documented in seed; planning-only (no execution). |
| FR-AG-3 | Task planner assigned tools: `agent-use`, `agent-list`, `user-ask`, `skill-resolve` (minimum). | `assignedToolIds` verified in seed. |
| FR-AG-4 | Add system agent `"Skill planner"` to seed with category `utility`. | Present in seed and enum. |
| FR-AG-5 | Skill planner rule instructs: author clear Markdown rule; reference specialization MCPs only; delegate to Script Creators for deterministic logic; persist via `create_skill`. | Rule documented in seed. |
| FR-AG-6 | Skill planner assigned tools: `agent-use`, `agent-list`, `skill-create` (minimum). | `assignedToolIds` verified in seed. |
| FR-AG-7 | Add `"Skill python script creator"`, `"Skill javascript script creator"`, `"Skill bash script creator"` to seed. | Three agents present; no internal tools assigned. |
| FR-AG-8 | Each Script Creator rule includes language-specific coding standards and requires **code-only** output (no prose wrapper). | Rules documented per agent. |
| FR-AG-9 | All six new agents are internal utility agents — not shown in end-user agent catalog. | Catalog filters exclude utility agents if applicable. |
| FR-AG-10 | Seed idempotent on re-run — no duplicate agents by name. | Migration/seed test passes. |

### 4.2 Task worker orchestration changes

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-TW-1 | `Task worker`, `Scheduled task worker`, and `Routine task worker` rules updated: orchestrate **researcher → Task planner → worker → validator** per specialization (in that order). | Seed rules updated; validators remain in the planning path. |
| FR-TW-2 | Researchers invoked **once per specialization** in `task.specializationIds` before Task Planner. | Order preserved: researcher(s) → Task planner → worker(s) → validator(s). |
| FR-TW-3 | When `task.specializationIds` is empty, task worker **fails** with a clear error — planning cannot proceed without at least one specialization. | Task completes with `errorMessage`; no Skill Planner invocation. |
| FR-TW-4 | Scheduled/routine workers append intent-specific sections (schedule time, recurrence) to Task Planner output per existing output format. | Output includes sections 2–6 from current worker rules where applicable. |
| FR-TW-5 | `Question worker` unchanged — no Task Planner invocation. | Regression test passes. |

### 4.3 Task Planner behavior

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-TP-1 | Task Planner triggered only for intents: `task`, `scheduled_task`, `routine_task`. | Not invoked for `question`. |
| FR-TP-2 | Inputs: original task goal (description) + research summary per linked specialization. | Passed via `use_agent` message payload. |
| FR-TP-3 | Skill selection limited to enabled, non-archived skills where `skill.specializationId ∈ task.specializationIds`. | Cross-specialization skills rejected. |
| FR-TP-4 | Task Planner may call `ask_user`; execution pauses per existing HITL flow until answers submitted. **Round 1:** ask all needed clarification questions in a single `ask_user` call. **Round 2:** at most one follow-up `ask_user` to clarify based on user answers. After 2 rounds, produce a best-effort plan with stated assumptions. | Task enters `waiting`; resumes via `executeTask` Resume mode. |
| FR-TP-5 | When no applicable skill exists, Task Planner delegates to Skill Planner with `{ specializationId, goal }` and **waits** for completion before replanning. | Sequential, not fire-and-forget. |
| FR-TP-6 | Plan output format (minimum): Goal; Assumptions (if any); Ordered steps (numbered, concrete, verifiable); Dependencies/blockers; Referenced skill names. | Matches and extends current task worker output contract. |
| FR-TP-7 | Task Planner resolves full skill rules via `resolve_skill` or `Skill resolver` delegation before composing steps. | Two-tier loading pattern from Skill PRD Phase 3. |
| FR-TP-8 | Plan is returned in task `llmResponse` — **not persisted** as a separate entity in Phase 1. | No new plan collection in Phase 1. |
| FR-TP-9 | Task Planner may compose plans from **multiple skills** — join existing skills when a goal spans reusable procedures, or split a goal into multiple skills when logic can be reused independently. | Plan references all used skill names; `task.skillIdsUsed` populated. |
| FR-TP-10 | After planning, persist `skillIdsUsed: string[]` on the task document via `update_task`. | Field stored on task; exposed via GraphQL and task detail UI. |

### 4.4 Skill Planner behavior

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SP-1 | Input: `{ specializationId, goal }` from Task Planner (or orchestrator). | Validated at delegation boundary. |
| FR-SP-2 | Skill Planner loads MCP catalog filtered to MCPs with `specializationIds` containing input `specializationId`. | MCP references in rule ⊆ specialization MCPs. |
| FR-SP-3 | Skill Planner calls `create_skill` with `onDuplicate: returnExisting` for idempotency. | Duplicate name returns existing skillId. |
| FR-SP-4 | Skill `name` follows agentskills.io constraints (lowercase, hyphens, max 64 chars). | Invalid names rejected at tool boundary. |
| FR-SP-5 | Skill `description` states when to use the skill (max 1024 chars). | Non-empty description persisted. |
| FR-SP-6 | Skill `rule` is Markdown with numbered steps; deterministic checks delegated to scripts. | QA spot-check on seeded scenarios. |
| FR-SP-7 | When scripts required, Skill Planner delegates to the language-appropriate Script Creator; passes script goal and expected filename. | Script included in `create_skill` scripts array. |
| FR-SP-8 | Skill Planner returns `{ skillId, skillName, isNew }` to caller. | Caller can resolve rule and continue planning. |

### 4.5 Skill Script Creator behavior

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SSC-1 | Each Script Creator accepts `{ goal, suggestedFilename? }` via `use_agent` message. | Documented delegation contract. |
| FR-SSC-2 | Output is **source code only** — no markdown fences, no explanation text. | Parser normalizes fenced output if model non-compliant. |
| FR-SSC-3 | Python creator: PEP 8-oriented, typed functions where appropriate, no hardcoded secrets. | Rule in seed. |
| FR-SSC-4 | JavaScript creator: ES module or CommonJS per architecture default; no `eval`; no secrets. | Rule in seed. |
| FR-SSC-5 | Bash creator: `set -euo pipefail` by default; quoted variables; no secrets. | Rule in seed. |
| FR-SSC-6 | Suggested filenames follow `scripts/{kebab-name}.{py|js|sh}`. | Matches skill PRD script filename convention. |
| FR-SSC-7 | Max script size ≤ 512 KB (inherits skill PRD limit). | Oversized output rejected at `create_skill`. |

### 4.6 Intent routing (unchanged boundary)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-IR-1 | `INTENT_CATEGORIES` routing unchanged: question → Question worker; task → Task worker; scheduled_task → Scheduled task worker; routine_task → Routine task worker. | Registry not modified for routing targets. |
| FR-IR-2 | Assistant orchestration unchanged through intent classification and worker delegation. | Only worker internal orchestration changes. |

### 4.7 Observability

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-OB-1 | Log events: `task.planning.started`, `task.planning.skill_selected`, `task.planning.skill_created`, `task.planning.clarification_asked`, `task.planning.completed`, `task.planning.failed`. | Structured logs with `taskId`, `specializationIds`, `skillNames`. |
| FR-OB-2 | Log events: `skill.planning.started`, `skill.planning.script_delegated`, `skill.planning.created`, `skill.planning.failed`. | Includes `specializationId`, `skillId`, `isNew`. |
| FR-OB-3 | Agent invoke progress records Task Planner and Skill Planner delegations. | Visible on task detail progress timeline. |

### 4.8 Task model & UI

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-TM-1 | Add `skillIdsUsed: string[] \| null` to task model, DTO, GraphQL type, and `update_task` command. | Field persisted; nullable; defaults to `null`. |
| FR-TM-2 | Task detail page displays skills used in the plan (name + link to skill detail when resolvable). | Visible on `apps/web` task detail when `skillIdsUsed` is non-empty. |
| FR-TM-3 | GraphQL `task` query returns `skillIdsUsed` for task detail consumers. | Query includes field; no REST read endpoint required. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Area | Target |
|------|--------|
| Research phase (per specialization) | p95 < 15 s per researcher invocation (LLM-bound) |
| Task Planner (existing skills) | p95 < 20 s excluding research and HITL wait |
| Skill Planner (new skill + 1 script) | p95 < 45 s end-to-end |
| Full task with 2 specializations + new skill | p95 < 120 s excluding user answer wait |
| `create_skill` persistence | p95 < 2 s excluding script storage upload |

### 5.2 Reliability & degradation

- Skill Planner failure must fail the task with a clear `errorMessage` — not silently fall back to improvised planning.
- Research failure for one specialization must not block planning for others; Task Planner receives partial research with explicit gap notation.
- Empty `specializationIds` must fail the task with a clear `errorMessage` — see FR-TW-3.
- `create_skill` storage failure rolls back or returns error to Skill Planner; Task Planner surfaces failure to user.
- HITL pause/resume via `ask_user` follows existing `UserInputWaitingError` and `executeTask` Resume semantics without regression.

### 5.3 Determinism & consistency

- Equivalent normalized goals in the same specialization must select the same skill name when that skill exists (by description/name matching policy in Task Planner rule).
- Script logic must not embed user-specific or task-specific IDs in generated scripts — parameterize via rule instructions.
- Newly created skills are enabled by default and immediately eligible for `resolve_skill`.

### 5.4 Security

- Script Creators must not emit code that exfiltrates credentials, reads unrelated env vars, or executes arbitrary shell from user input.
- Skill rules and scripts sanitized and length-limited at `create_skill` boundary (inherits skill domain validation).
- Task Planner and Skill Planner are system-only agents — invocable only via `use_agent` from authorized system agents.

### 5.5 Accessibility

- Clarification questions use existing `TaskQuestionForm`.
- Plan output is plain text in `llmResponse` — readable by screen readers on task detail page.
- Skills used section on task detail follows existing page layout and accessibility patterns.

### 5.6 Platform

- New agents seeded in `domains/system-agent/seed/systemAgents.json`.
- Enum updates in `packages/constants/src/SystemAgentName.ts`.
- No new domain collections in Phase 1 — skills use existing `domains/skill`.
- Orchestration changes in task worker seed rules and optionally thin helpers in `services/agent` if architecture requires.

---

## 6. Task Execution Flow Integration

### 6.1 Updated flow (non-question intents)

**Approved orchestration (Option B):** Task Planner is invoked **inside task workers**; Assistant flow is unchanged.

```
POST /tasks → executeTask
  → runTaskSpecializationClassification (existing)
  → Assistant agent
      1. Intent classification (existing)
      2. update_task category (existing)
      3. Route to Task / Scheduled / Routine worker (existing INTENT_CATEGORIES)
           a. Fail if task.specializationIds is empty
           b. For each specializationId: use_agent → "{Name} researcher"
           c. use_agent → "Task planner" (research summaries + goal + intent category)
                ├─ Select/combine skill(s) from specialization skill catalogs
                ├─ resolve_skill / Skill resolver for full rules
                ├─ ask_user (round 1: all questions; round 2: clarification) → pause → resume
                ├─ If no skill: invoke_skill_planner → Skill planner
                │    ├─ use_agent → Script Creator(s) (optional)
                │    ├─ create_skill
                │    └─ return skillId → Task planner replans
                └─ update_task skillIdsUsed
           d. For each specializationId: use_agent → "{Name} worker" (skill-based plan as context)
           e. For each specializationId: use_agent → "{Name} validator"
           f. Worker formats final plan (+ schedule/recurrence sections per intent)
      4. Assistant synthesizes response (existing)
  → task.complete with llmResponse + skillIdsUsed
```

### 6.2 Question intent flow (unchanged)

```
Assistant → Intent classifier → question
  → Question worker → researchers only → synthesized answer
  (Task Planner not invoked)
```

---

## 7. Out of Scope

| Item | Notes |
|------|-------|
| Persisting plans as first-class entities | Ephemeral plan in `llmResponse` only for Phase 1 |
| Executing plan steps automatically | Planning-only; execution is a future feature |
| Running skill scripts during planning | Scripts authored and stored; execution deferred |
| Task Planner for `question` intent | Explicitly excluded |
| Admin analytics dashboard for skill usage | Phase 2+ |
| Modifying skill PRD MCP fields on Skill model | MCP references live in rule text; no new `mcpIds[]` on skill unless architecture adds it |
| `update-skill` internal tool | Admin PATCH / recreate via Skill Planner only |
| Personal agent planning | System agents only |
| Cross-specialization skill creation | Skill Planner creates skills for one specialization per invocation |
| Automatic skill archival or versioning | Future governance |
| Changing specialization researcher/worker/validator provisioning | Unchanged |

---

## 8. Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|-------------------|
| `domains/skill` (create, resolve, catalog queries) | Exists | Cannot persist or resolve skills |
| `create-skill` internal tool (`skill-create`) | Exists | Skill Planner cannot persist |
| `resolve-skill` internal tool (`skill-resolve`) | Exists | Task Planner cannot load full rules |
| `Skill resolver` system agent | Exists | Optional delegation path for rule retrieval |
| `user-ask` internal tool (`ask_user`) | Exists | No clarification flow |
| `agent-use`, `agent-list` tools | Exist | No agent orchestration |
| Specialization classification on tasks | Exists | Empty `specializationIds` degrades planning scope |
| Per-specialization researcher agents | Exists (provisioned via create-specialization) | No research summaries |
| Task worker / scheduled / routine workers | Exist | No routing entry point for Task Planner |
| `domains/task-questions` + HITL resume | Exists | Clarification pause/resume broken |
| Skill script storage (S3/local) | Exists | Script persistence fails |

---

## 9. Acceptance Criteria (QA Checklist)

### Agent seed & registry

- [ ] `Task planner`, `Skill planner`, three Script Creators in `systemAgents.json`
- [ ] All six names in `SYSTEM_AGENT_NAME` enum
- [ ] Correct `assignedToolIds` per FR-AG-3 and FR-AG-6
- [ ] Task / Scheduled / Routine worker rules delegate to Task Planner (FR-TW-1)
- [ ] Question worker rule unchanged (FR-TW-5)

### Task Planner

- [ ] Plans use skills only from `task.specializationIds` (TP-5)
- [ ] `ask_user` pauses and resumes correctly (TP-2)
- [ ] Skill Planner invoked when no skill matches (TP-6)
- [ ] Plan includes referenced skill names (FR-TP-6)
- [ ] Not invoked for question intent (TP-4)

### Skill Planner

- [ ] Creates skill via `create_skill` with valid name, description, rule (SP-1)
- [ ] MCP references only from specialization-mapped MCPs (SP-4)
- [ ] Idempotent duplicate name handling (SP-1)
- [ ] Delegates to Script Creators when needed (SP-3)

### Script Creators

- [ ] Each returns code-only output for script goal (SSC-1–SSC-3)
- [ ] Correct language agent selected (SSC-4)
- [ ] Scripts persist through `create_skill` (integration)

### End-to-end

- [ ] Two equivalent tasks produce structurally consistent plans when skill exists (TP-1)
- [ ] First-of-kind goal triggers skill creation then plan (TP-6)
- [ ] Scheduled/routine plans include schedule/recurrence sections (TP-3)
- [ ] Progress timeline shows planner delegations (FR-OB-3)
- [ ] Task completes with plan in `llmResponse`; no plan document in DB (FR-TP-8)
- [ ] `skillIdsUsed` persisted on task and shown on task detail page (FR-TP-10, FR-TM-1–FR-TM-3)
- [ ] Validators invoked after Task Planner per specialization (FR-TW-1)
- [ ] Empty `specializationIds` fails with clear error (FR-TW-3)

### Regression

- [ ] Question tasks still answer without plans (TP-4)
- [ ] Specialization classification unchanged
- [ ] Intent classification and routing unchanged
- [ ] Pause/resume during `ask_user` unchanged
- [ ] Existing skills and admin skill UI unaffected

### E2E (recommended)

- [ ] Gherkin scenarios TP-1 through TP-7, SP-1 through SP-4, SSC-1 through SSC-4, INT-1 through INT-3 covered in `apps/web/e2e/features/task-skill-planning/` (or service integration tests where UI unchanged)

---

## 10. Decisions (approved 2026-07-01)

| # | Question | Decision |
|---|----------|----------|
| OQ-1 | Task Planner invocation path | **Option B:** Via task workers only; Assistant flow unchanged (`Assistant → intent → task worker → …`) |
| OQ-2 | Multi-skill plans | **Yes** — compose multiple skills; join existing or split goal when logic is reusable |
| OQ-3 | Empty `specializationIds` | **Fail** with clear error |
| OQ-4 | `skillIdsUsed` on task | **Yes** — persist on task document and show on task detail page |
| OQ-5 | Equivalent-goal normalization (QA) | Lowercase trim + remove filler words; same intent category |
| OQ-6 | Script Creator tools | No tools in Phase 1 — validation at `create_skill` boundary only |
| OQ-7 | Clarification rounds | **2 max** — round 1 asks all questions at once; round 2 clarifies user input; then best-effort plan |
| OQ-8 | Outdated skill on duplicate name | No — use existing skill as-is; admin edits via UI |
| OQ-9 | JavaScript script language enum | `nodejs` per skill PRD; agent named "javascript" |
| OQ-10 | Validators after Task Planner | **Yes** — flow: researchers → Task planner → workers → validators per specialization |

---

*End of PRD — approved for implementation.*
