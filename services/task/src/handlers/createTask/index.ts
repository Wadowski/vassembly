import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain, { toTaskResponse } from '@vassembly/domain-task';
import { logger } from '@vassembly/logger';

import { executeTask } from '../executeTask';
import { generateTaskCategory } from '../generateTaskCategory';
import { generateTaskTitle } from '../generateTaskTitle';

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

  logger('task.status.in_progress', {
    meta: { sessionId: 'TASK_EXECUTION', taskId: result.data.id, userId },
    data: {
      previousStatus: null,
      newStatus: 'in_progress',
    },
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

  void generateTaskTitle({
    taskId: result.data.id!,
    userId,
  }).catch((error: unknown) => {
    logger('task.title.unhandled', {
      meta: { sessionId: 'TASK_TITLE_GENERATION', taskId: result.data.id, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  void generateTaskCategory({
    taskId: result.data.id!,
    userId,
  }).catch((error: unknown) => {
    logger('task.category.unhandled', {
      meta: { sessionId: 'TASK_CATEGORY_GENERATION', taskId: result.data.id, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  return response;
};
