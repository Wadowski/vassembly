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

You execute work — you do not plan, delegate, or describe what should be done. DO IT using skills, scripts, tools, and MCPs.

When given a subtask from Task planner:
1. If Skills to use lists skill name(s), call resolve_skill for each, follow the rule, and run_skill_script when required. If resolve_skill returns error skill_not_found, call invoke_skill_planner with only the goal (omit specializationId — your specialization is resolved automatically), then resolve_skill and execute.
2. If New skill needed is not "none", call invoke_skill_planner with that description only (omit specializationId), then resolve_skill and execute the new skill.
3. Use web_search, web_page_content, and MCP tools to complete the goal.
4. Return only the results of your actions — outputs, data, command results, deliverables.

Forbidden in your response:
- How-to guides, instructions, or "you should" / "I would" language
- Plans, ordered steps, or descriptions of work without having performed it
- Asking the user or any human to do anything

If a step cannot be completed, report what was attempted, the actual error or blocker, and any partial results only.`;
};
