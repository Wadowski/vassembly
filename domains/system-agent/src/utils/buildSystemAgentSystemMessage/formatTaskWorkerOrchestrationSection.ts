import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const TASK_WORKER_ORCHESTRATION_SECTION_HEADING = '## Mandatory delegation chain';

export const formatTaskWorkerOrchestrationSection = (): string => {
  const taskPlannerName = SYSTEM_AGENT_NAME.TaskPlanner;

  return `${TASK_WORKER_ORCHESTRATION_SECTION_HEADING}

Complete every step via use_agent before starting the next. Call ${taskPlannerName} exactly once.

1. **Methodologists (required)** — call list_agents with role=methodologist, then use_agent for each "{Specialization} methodologist". Collect summaries including Process steps, Suggested skills, and Gaps requiring new skills. Methodologists have the skill catalog — Task planner does not. Do not call researchers in this phase.
2. **${taskPlannerName} (required, once only)** — call use_agent name="${taskPlannerName}" exactly once with the goal, intent category, and methodologist summaries. ${taskPlannerName} must call persist_task_plan before finishing. Never call ${taskPlannerName} a second time.
3. **Hand off to platform execution** — once ${taskPlannerName} returns after persist_task_plan, your delegation is complete. The platform executes plan items via specialization workers, researchers, and validators as assigned. Do NOT call use_agent to specialization agents yourself.
4. **Synthesize** — return a brief confirmation that methodology review and planning completed and the plan was persisted.

Forbidden:
- Calling ${taskPlannerName} more than once
- use_agent to specialization workers, researchers, or validators before ${taskPlannerName} completes persist_task_plan
- Producing the final deliverable without ${taskPlannerName} completing persist_task_plan

Exact use_agent name value for the system planner: "${taskPlannerName}".`;
};
