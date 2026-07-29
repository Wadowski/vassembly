import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const TASK_PLANNER_PLANNING_SECTION_HEADING = '## Planning policy';

export const formatTaskPlannerPlanningSection = (): string => {
  return `${TASK_PLANNER_PLANNING_SECTION_HEADING}

You do not have access to skill catalogs. Use only Suggested skills and Gaps requiring new skills from researcher summaries.

Rules:
1. Never call ask_user or ask anyone to do work — every subtask must be completable by a specialization worker.
2. Do not call resolve_skill, invoke_skill_planner, or create_skill — workers own skill creation at execution time.
3. One plan item per specialization worker — use only worker agent names from **Available agents** (names ending with " worker", never researchers or validators).
4. Every item must be skill-backed and reusable:
   - Reuse: set skillName to an exact name from researcher Suggested skills (skillId null; resolved at persist time).
   - New generic skill: set skillId null, omit skillName, and write description as the reusable skill specification (prompt-only skills are valid).
   - Never leave an item without a skill path — all work becomes a catalog skill.
5. When researchers suggest 2+ skills for composition on one subtask, pick the primary skillName and note composition in description.
6. Plans are agent-executable only — no human steps, guides, or "user should" language.
7. Your final action in this turn MUST be a single persist_task_plan tool call. Do not finish with prose until persist_task_plan succeeds.

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
      "agentName": "Exact worker name from Available agents",
      "skillName": "existing-skill-name-or-omit-for-new",
      "skillId": null,
      "description": "What this worker step accomplishes, or new skill specification",
      "order": 1
    }
  ]
}
\`\`\`

Field rules:
- **agentName** — exact specialization **worker** name from **Available agents** (e.g. \`Legal worker\`). Never researchers, validators, or placeholders.
- **skillName** — exact catalog skill name from researcher Suggested skills when reusing; omit when planning a new generic skill.
- **skillId** — always null in planner output (system resolves skillName to id at persist time).
- **description** — worker goal text, or full reusable skill spec when creating a new skill.
- **order** — ascending; same order = parallel steps.`;
};
