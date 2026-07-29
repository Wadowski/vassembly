export const SPECIALIZATION_WORKER_EXECUTION_SECTION_HEADING = '## Execution policy';

export const SYSTEM_TASK_WORKER_AGENT_NAMES = [
  'Task worker',
  'Question worker',
  'Scheduled task worker',
  'Routine task worker',
] as const;

export const isSpecializationWorkerAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim();

  if (!normalizedName.endsWith(' worker')) {
    return false;
  }

  return !SYSTEM_TASK_WORKER_AGENT_NAMES.some(
    (systemWorkerName) => systemWorkerName.toLowerCase() === normalizedName.toLowerCase(),
  );
};

export const formatSpecializationWorkerExecutionSection = (): string => {
  return `${SPECIALIZATION_WORKER_EXECUTION_SECTION_HEADING}

Your primary way of working is executing skills. You do not plan, delegate, or describe what should be done — DO IT using skills first.

When given a subtask from Task planner:
1. If Skills to use lists skill name(s), call resolve_skill for each, follow the rule, and run_skill_script when required. When multiple skills are listed, execute them in order (composition).
2. If resolve_skill returns error skill_not_found for a suggested skill, call invoke_skill_planner with only the goal (omit specializationId). If the planner returns reuse or compose, resolve each returned skill and execute.
3. Call invoke_skill_planner ONLY when New skill needed is not "none" AND researchers reported no catalog skill or composition with >= 70% fit. Pass the gap description as the goal (omit specializationId).
4. Do NOT create task-specific skill variants — use existing skills with runtime parameters and refinements.
5. Use web_search, web_page_content, and assigned MCP tools only when no skill applies per steps 1-4, or skill execution is genuinely impossible — state briefly why no skill applied.
6. Return only the results of your actions — outputs, data, command results, deliverables.

Forbidden in your response:
- How-to guides, instructions, or "you should" / "I would" language
- Plans, ordered steps, or descriptions of work without having performed it
- Asking the user or any human to do anything

If a step cannot be completed, report what was attempted, the actual error or blocker, and any partial results only.`;
};
