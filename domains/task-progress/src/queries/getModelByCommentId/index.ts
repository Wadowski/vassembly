import z from 'zod';

import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { TaskProgressModel } from '../../model';

export interface GetModelByCommentIdInput {
  commentId: string;
}

export interface GetModelByCommentIdResult {
  data: TaskProgressModel | null;
}

const VALIDATION_SCHEMA = z.object({
  commentId: z.string().min(1),
});

export const getModelByCommentId = async (
  input: GetModelByCommentIdInput
): Promise<GetModelByCommentIdResult> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const doc = await collection.findOne({
    commentId: validated.commentId,
  });

  if (!doc) {
    return { data: null };
  }

  const model = taskProgressFactory.create(
    mapTaskProgressDocument({ document: doc as Record<string, unknown> }),
  );
  return { data: model };
};
