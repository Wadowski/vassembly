import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain, { toTaskResponse } from '@vassembly/domain-task';
import taskCommentDomain from '@vassembly/domain-task-comment';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { logger } from '@vassembly/logger';

import { executeTask } from '../executeTask';
import { classifyCommentSpecializations } from '../classifyCommentSpecializations';
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

  const taskId = result.data.id!;

  const commentResult = await taskCommentDomain.commands.create({
    taskId,
    userId,
    userText: body.description,
  });

  const commentId = commentResult.data.id!;

  await taskDomain.commands.markInProgress({ taskId, activeCommentId: commentId });

  await taskProgressDomain.commands.initializeTaskProgress({
    taskId,
    userId,
    commentId,
  });

  logger('task.status.in_progress', {
    meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
    data: {
      previousStatus: null,
      newStatus: 'in_progress',
    },
  });

  await classifyCommentSpecializations({
    taskId,
    userId,
    commentId,
  });

  const response = {
    task: toTaskResponse({ task: result.data }),
  };

  void executeTask({
    taskId,
    userId,
    commentId,
  }).catch((error: unknown) => {
    logger('task.execute.unhandled', {
      meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  void generateTaskTitle({
    taskId,
    userId,
  }).catch((error: unknown) => {
    logger('task.title.unhandled', {
      meta: { sessionId: 'TASK_TITLE_GENERATION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  void generateTaskCategory({
    taskId,
    userId,
  }).catch((error: unknown) => {
    logger('task.category.unhandled', {
      meta: { sessionId: 'TASK_CATEGORY_GENERATION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  return response;
};
