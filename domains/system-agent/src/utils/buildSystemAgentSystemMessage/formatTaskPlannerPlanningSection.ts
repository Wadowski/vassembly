export const TASK_PLANNER_PLANNING_SECTION_HEADING = '## Planning policy';

export const formatTaskPlannerPlanningSection = (): string => {
  return `${TASK_PLANNER_PLANNING_SECTION_HEADING}

You do not have access to skill catalogs. Use only Suggested skills and Gaps requiring new skills from researcher summaries.

Rules:
1. Never call ask_user or ask anyone to do work — every subtask must be completable by a specialization worker.
2. Do not call resolve_skill, invoke_skill_planner, or create_skill — workers own skills.
3. Only put skill names in Skills to use when they appear verbatim in a researcher's Suggested skills list — never invent or normalize skill names.
4. When researchers report a skill gap, set New skill needed on the subtask — the worker will create and run the skill.
5. Plans are agent-executable only — no human steps, guides, or "user should" language.`;
};
