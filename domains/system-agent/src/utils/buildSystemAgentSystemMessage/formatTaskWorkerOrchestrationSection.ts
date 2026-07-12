import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const TASK_WORKER_ORCHESTRATION_SECTION_HEADING = '## Mandatory delegation chain';

export const MAX_TASK_WORKER_VALIDATOR_RETRIES = 3;

export const formatTaskWorkerOrchestrationSection = (): string => {
  const taskPlannerName = SYSTEM_AGENT_NAME.TaskPlanner;

  return `${TASK_WORKER_ORCHESTRATION_SECTION_HEADING}

Complete every step via use_agent before starting the next. Never call specialization workers until "${taskPlannerName}" returns. Validators are mandatory — never skip step 4.

1. **Researchers (required)** — call list_agents with role=researcher, then use_agent for each "{Specialization} researcher". Collect summaries including Suggested skills and Gaps requiring new skills. Researchers have the skill catalog — Task planner does not.
2. **${taskPlannerName} (required)** — call use_agent name="${taskPlannerName}" with the goal, intent category, and researcher summaries. On a retry (step 5), also pass the previous subtask list and validator issues. ${taskPlannerName} plans agent-only work from researcher skill suggestions — it never asks the user questions and never calls Skill planner.
3. **Route subtasks to workers (required)** — ${taskPlannerName} returns a numbered subtask list with Skills to use and New skill needed per subtask. For each subtask: call list_agents with role=worker scoped to that specialization, then use_agent to the matching "{Specialization} worker" with that subtask only. Workers execute using skills, tools, and MCPs — they create missing skills via invoke_skill_planner when New skill needed is set.
4. **Validators (mandatory, never skip)** — for each worker invoked in step 3, call list_agents with role=validator scoped to the same specialization, then use_agent to the matching "{Specialization} validator" with the subtask goal and worker output. Collect "STATUS: pass" or "STATUS: issues".
5. **Retry loop** — if every validator reports "STATUS: pass", stop and synthesize the final result. If any reports "STATUS: issues", repeat from step 2 with prior subtasks and validator issues. Retry at most ${MAX_TASK_WORKER_VALIDATOR_RETRIES} times; then report unresolved issues.

Forbidden before step 2 completes:
- use_agent to any specialization worker or validator
- Producing the final deliverable without ${taskPlannerName} output

Forbidden at any point:
- Skipping step 4 for any worker that ran in step 3
- Calling Skill planner directly — specialization workers invoke it when a subtask requires a new skill

Exact use_agent name value for the system planner: "${taskPlannerName}".`;
};
