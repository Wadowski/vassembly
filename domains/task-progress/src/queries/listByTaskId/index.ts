import { ValidationError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';
import { z } from 'zod';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { TaskProgressModel } from '../../model';
import type { ListByTaskIdInput, ListByTaskIdResult } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const listByTaskId = async (input: ListByTaskIdInput): Promise<ListByTaskIdResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const documents = await collection
    .find({ taskId: parsed.data.taskId })
    .sort({ createdAt: 1 })
    .toArray();

  const data: TaskProgressModel[] = documents.map((document) =>
    taskProgressFactory.create(
      mapTaskProgressDocument({ document: document as Record<string, unknown> }),
    ),
  );

  return { data };
};
