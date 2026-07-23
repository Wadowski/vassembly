import { ValidationError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';
import { z } from 'zod';

import { TASK_COMMENT_COLLECTION_NAME } from '../../clients';
import { taskCommentFactory } from '../../model';
import { mapTaskCommentDocument } from '../../model/mapTaskCommentDocument';

import type { TaskCommentModel } from '../../model';
import type { ListByTaskIdInput, ListByTaskIdResult } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const listByTaskId = async (input: ListByTaskIdInput): Promise<ListByTaskIdResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const collection = mongoDb.db.collection(TASK_COMMENT_COLLECTION_NAME);

  const cursor = collection
    .find({ taskId: parsed.data.taskId })
    .sort({ createdAt: 1, _id: 1 });

  const documents = await cursor.toArray();

  const data: TaskCommentModel[] = documents.map((document) =>
    taskCommentFactory.create(
      mapTaskCommentDocument({ document: document as Record<string, unknown> }),
    ),
  );

  return { data };
};
