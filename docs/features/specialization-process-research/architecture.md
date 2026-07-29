# Specialization Process Research — Architecture

**Feature slug:** `specialization-process-research`  
**Status:** Approved for implementation  
**Last updated:** 2026-07-29  
**Extends:** [`task-plan/architecture.md`](../task-plan/architecture.md) · [`task-skill-planning/architecture.md`](../task-skill-planning/architecture.md) · [`subagent-orchestration/architecture.md`](../subagent-orchestration/architecture.md)

---

## 1. Problem

Specialization researchers currently perform **subject-matter research** (findings, sources via web search) before Task Planner runs. Task Planner is restricted to **worker-only** plan items. This produces topic summaries instead of actionable **process/methodology** guidance per specialization, and limits plan composition to workers only.

## 2. Approved requirements (2026-07-29)

### 2.1 Pre-planning researcher phase (unchanged trigger, changed output)

When a task is processing, **before** Task Planner:

- Each specialization's researchers run in parallel (unchanged).
- Researchers know assigned tools/MCPs and the general topic context.
- Researchers output **what the worker should do** to accomplish its part — methodology/process, **not** subject-matter findings.
- `web_search` remains available for methodology discovery.
- **Output format** (replaces Findings/Sources):

```
Process steps: <numbered actionable steps this specialization's agents can execute>
Suggested skills: <unchanged — catalog names with fit %>
Gaps requiring new skills: <unchanged>
Open questions: <agent-only unknowns; or "none">
```

### 2.2 Task Planner

- May assign **workers, researchers, or validators** from **any** specialization on the task.
- **Exactly one agent per plan item.**
- Plans may mix roles and specializations.
- Skill model unchanged: every item must have a skill path (reuse via `skillName` or new spec in `description` with `skillId: null`).
- Skill creation stays at **worker execution** via `invoke_skill_planner` / `create_skill` — planner does not create skills.
- Scope: **Task intent only** (`Task worker`); scheduled/routine workers out of scope.

### 2.3 Execution-time plan items

| Role | When assigned | Behavior |
|------|---------------|----------|
| **Worker** | Primary execution | Skill-first execution; create skill at runtime when needed |
| **Validator** | After worker step(s) | Verify the worker completed what was asked for that topic/goal |
| **Researcher** | Only when open questions remain (mainly user input needed) | Methodology-only; not subject-matter research |

### 2.4 Skill types

- Reinforce **prompt-only** skills path in Skill Planner rules (no script when rule + tools suffice).
- `create_skill` already allows empty `scripts[]`.

### 2.5 Out of scope

- UI changes
- Scheduled/routine task workers
- New domains, DB fields, or internal tools (prompt/orchestration message changes only unless architect finds a hard constraint)

## 3. Current implementation map

| Concern | Location |
|---------|----------|
| Researcher base rules | `services/agent/src/internalTools/createSpecialization/constants.ts` |
| Researcher skill catalog policy | `domains/system-agent/.../formatSpecializationResearcherSkillsSection.ts` |
| Task worker delegation chain | `domains/system-agent/.../formatTaskWorkerOrchestrationSection.ts` |
| Task planner planning policy | `domains/system-agent/.../formatTaskPlannerPlanningSection.ts` |
| Worker execution policy | `domains/system-agent/.../formatSpecializationWorkerExecutionSection.ts` |
| Skill planner script/reuse policy | `domains/system-agent/.../formatSkillPlannerScriptSection.ts` |
| Seed rules (Task worker, Task planner) | `domains/system-agent/seed/systemAgents.json` |
| System message composition | `domains/system-agent/.../buildSystemAgentSystemMessage/index.ts` |
| Plan item execution message | `services/task/.../orchestrateTaskPlanInstance/buildPlanItemWorkerMessage.ts` |
| Plan persistence tool description | `packages/constants/src/internalTools/registry.ts` |

## 4. Success criteria

- Researchers return `Process steps:` (not Findings/Sources) in pre-planning phase.
- Task Planner `persist_task_plan` items may use researcher, worker, or validator `agentName` values.
- Plan execution messages are role-appropriate (worker vs validator vs researcher).
- Prompt-only skills explicitly supported in Skill Planner guidance.
- Unit tests updated for all changed section formatters and orchestration messages.
- E2E: architect decides whether to extend `apps/web/e2e/features/task-plan/`.

## 5. Open for architect

- Exact text for each rule section and seed JSON sync strategy.
- Whether `buildPlanItemWorkerMessage` should be generalized to `buildPlanItemAgentMessage` with role-aware prompts.
- Validator message contract at execution time.
- Backfill strategy for already-provisioned specialization agents (`backfillSpecializationAgentRules` pattern).
