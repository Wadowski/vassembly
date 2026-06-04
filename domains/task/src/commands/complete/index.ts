import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus } from '../../model';

import type { CompleteTaskCommandInput, CompleteTaskCommandResult } from './types';

const COMPLETE_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
  llmResponse: z.string().max(5000, 'Response exceeds 5000 characters'),
});

const COMPLETE_DB_SCHEMA = z.object({
  status: z.literal(TaskStatus.Done),
  llmResponse: z.string().max(5000),
  completedAt: z.date(),
});

const persistComplete = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: COMPLETE_DB_SCHEMA,
});

export const complete = async ({
  taskId,
  llmResponse,
}: CompleteTaskCommandInput): Promise<CompleteTaskCommandResult> => {
  const parsed = COMPLETE_INPUT_SCHEMA.safeParse({ taskId, llmResponse });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistComplete({
    id: parsed.data.taskId,
    data: {
      status: TaskStatus.Done,
      llmResponse: parsed.data.llmResponse,
      completedAt: new Date(),
    },
  });
};
