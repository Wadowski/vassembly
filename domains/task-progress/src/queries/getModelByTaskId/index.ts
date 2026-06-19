import z from 'zod';

import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { TaskProgressModel } from '../../model';

export interface GetModelByTaskIdInput {
  taskId: string;
}

export interface GetModelByTaskIdResult {
  data: TaskProgressModel | null;
}

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const getModelByTaskId = async (
  input: GetModelByTaskIdInput
): Promise<GetModelByTaskIdResult> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const doc = await collection.findOne({
    taskId: validated.taskId,
  });

  if (!doc) {
    return { data: null };
  }

  const model = taskProgressFactory.create(
    mapTaskProgressDocument({ document: doc as Record<string, unknown> }),
  );
  return { data: model };
};
