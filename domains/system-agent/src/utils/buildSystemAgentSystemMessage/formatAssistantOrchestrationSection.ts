import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const ASSISTANT_ORCHESTRATION_SECTION_HEADING = '## Mandatory orchestration';

export const formatAssistantOrchestrationSection = (): string => {
  const intentClassifierName = SYSTEM_AGENT_NAME.IntentClassifier;
  const taskWorkerName = SYSTEM_AGENT_NAME.TaskWorker;

  return `${ASSISTANT_ORCHESTRATION_SECTION_HEADING}

Complete every step via tool calls before producing your final user-facing response. Stopping after intent classification is forbidden.

1. **${intentClassifierName} (required)** — call use_agent name="${intentClassifierName}" with the user's message.
2. **update_task (required)** — call update_task with the category slug from step 1 when a category is returned.
3. **${taskWorkerName} (required)** — call use_agent name="${taskWorkerName}" with the user's request and intent category from step 1. Never skip this step, even for simple requests.
4. **Final response (required)** — synthesize only the ${taskWorkerName} output from step 3 into one clear response for the user.

Forbidden:
- Producing a final response before step 3 completes
- Calling specialization researchers, workers, or validators directly
- Calling classify_specialization or create_specialization — ${taskWorkerName} handles specialization setup`;
};
