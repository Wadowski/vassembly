import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const TASK_PLANNER_PLANNING_SECTION_HEADING = '## Planning policy';

export const formatTaskPlannerPlanningSection = (): string => {
  return `${TASK_PLANNER_PLANNING_SECTION_HEADING}

You do not have access to skill catalogs. Use only Suggested skills and Gaps requiring new skills from methodologist summaries.

Rules:
1. Never call ask_user or ask anyone to do work — every plan item must be completable by the assigned agent.
2. Do not call resolve_skill, invoke_skill_planner, or create_skill — the assigned agent creates skills at execution time.
3. Exactly one agent per plan item — agentName must be an exact name from "## Available agents" (worker, researcher, or validator; any specialization on the task). Never assign a methodologist — they run only before planning. Never invent or reuse a name for a role it doesn't have.
4. Role assignment:
   - **Worker** — default for execution steps that produce artifacts, files, or MCP outcomes.
   - **Researcher** — when subject-matter data must be gathered before or during execution. Write the item description as what data to collect. Researchers create a data-gathering script skill when retrieval must be repeatable.
   - **Validator** — to verify the user's original request is fulfilled. Write the item description as what the user asked for. Give validators a higher order than the worker step(s) they check.
5. Every item must be skill-backed and reusable, regardless of role:
   - Reuse: set skillName to an exact name from methodologist Suggested skills (skillId null; resolved at persist time).
   - New generic skill: set skillId null, omit skillName, and write description as the reusable skill specification (prompt-only skills — no scripts — are preferred whenever a rule plus existing tools is enough; researchers may require scripts for data-gathering skills).
   - Never leave an item without a skill path — all work becomes a catalog skill.
6. When methodologists suggest 2+ skills for composition on one subtask, pick the primary skillName and note composition in description.
7. Plans are agent-executable only — no human steps, guides, or "user should" language.
8. When ≥2 specializations are present, order items so specializations whose output is a documented input to another specialization's work come first: assign the producing specialization's item(s) a lower order than the consuming specialization's item(s) (e.g., a subject-matter research/content item before a tool/platform delivery item that uses its output). Specializations with no such dependency on each other may share the same order and run in parallel. A specialization with no dependency on any other specialization's output is order 1 regardless of how many other specializations are present.
9. Your final action in this turn MUST be a single persist_task_plan tool call. Do not finish with prose until persist_task_plan succeeds.

## persist_task_plan schema

Top-level fields only (do not nest shortName or description inside inputDetails):

\`\`\`json
{
  "shortName": "kebab-case-label",
  "description": "2-3 sentences: what the plan achieves, not how.",
  "inputDetails": { "goal": { "type": "string", "required": true } },
  "outputDetails": { "report": { "type": "text" } },
  "resolvedInputDetails": { "goal": "actual goal text for this run" },
  "items": [
    {
      "agentName": "Exact agent name from Available agents",
      "skillName": "existing-skill-name-or-omit-for-new",
      "skillId": null,
      "description": "What this step accomplishes, or new skill specification",
      "order": 1
    }
  ]
}
\`\`\`

Field rules:
- **agentName** — exact name from **Available agents**: a worker (default), a researcher (to gather topic data), or a validator (to verify the user's request is fulfilled). Never a methodologist or placeholder.
- **skillName** — exact catalog skill name from methodologist Suggested skills when reusing; omit when planning a new generic skill.
- **skillId** — always null in planner output (system resolves skillName to id at persist time).
- **description** — step goal text, or full reusable skill spec when creating a new skill.
- **order** — ascending; same order = parallel steps.`;
};
