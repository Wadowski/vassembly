import { createDb } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskCommentMongodbDao } from '../../clients';
import { TaskCommentModel, taskCommentFactory } from '../../model';

import { sanitizeUserText } from '../shared/sanitizeUserText';

import type { CreateTaskCommentCommandInput, CreateTaskCommentCommandResult } from './types';

const CREATE_DB_SCHEMA = z.object({
  taskId: z.string().min(1),
  userId: z.string().min(1),
  userText: z.string().min(1),
  agentResponse: z.null().optional(),
});

const persistCreate = createDb<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

export const create = async (
  input: CreateTaskCommentCommandInput,
): Promise<CreateTaskCommentCommandResult> => {
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }

  if (!input.taskId) {
    throw new ValidationError('taskId is required');
  }

  let userText: string;
  try {
    userText = sanitizeUserText(input.userText);
  } catch {
    throw new ValidationError('Comment text is required');
  }

  return persistCreate({
    taskId: input.taskId,
    userId: input.userId,
    userText,
    agentResponse: null,
  });
};
