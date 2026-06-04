import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain, { toTaskResponse } from '@vassembly/domain-task';
import { logger } from '@vassembly/logger';

import { executeTask } from '../executeTask';

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

  const response = {
    task: toTaskResponse({ task: result.data }),
  };

  void executeTask({
    taskId: result.data.id!,
    userId,
  }).catch((error: unknown) => {
    logger('task.execute.unhandled', {
      meta: { sessionId: 'TASK_EXECUTION', taskId: result.data.id, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  return response;
};
