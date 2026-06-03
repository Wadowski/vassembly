import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain, { toTaskResponse } from '@vassembly/domain-task';

import type { CreateTaskHandlerInput, CreateTaskHandlerOutput } from './types';

export const createTask = async ({ userId, body }: CreateTaskHandlerInput): Promise<CreateTaskHandlerOutput> => {
  const assistant = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.Assistant,
  });

  const result = await taskDomain.commands.create({
    userId,
    description: body.description,
    agentAssignedId: assistant.data.id!,
  });

  return {
    task: toTaskResponse({ task: result.data }),
  };
};
