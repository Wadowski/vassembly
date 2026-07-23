import { ForbiddenError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';
import { z } from 'zod';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { toTaskProgressResponse } from '../../model';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { TaskProgressResponse } from '../../model';
import type { GetTaskProgressByCommentIdInput } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
  commentId: z.string().min(1),
  userId: z.string().min(1),
});

export interface GetTaskProgressByCommentIdResult {
  data: TaskProgressResponse | null;
}

export const getTaskProgressByCommentId = async (
  input: GetTaskProgressByCommentIdInput
): Promise<GetTaskProgressByCommentIdResult> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const doc = await collection.findOne({
    commentId: validated.commentId,
    taskId: validated.taskId,
  });

  if (!doc) {
    return { data: null };
  }

  const docData = doc as Record<string, unknown>;

  if (docData.userId !== validated.userId) {
    throw new ForbiddenError('Unauthorized access to task progress');
  }

  const model = taskProgressFactory.create(mapTaskProgressDocument({ document: docData }));
  const response = toTaskProgressResponse({ taskProgress: model });

  return { data: response };
};
