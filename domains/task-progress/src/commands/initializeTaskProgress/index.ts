import z from 'zod';

import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { TaskProgressModel } from '../../model';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { InitializeTaskProgressInput } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
  userId: z.string().min(1),
});

export const initializeTaskProgress = async (
  input: InitializeTaskProgressInput
): Promise<TaskProgressModel> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const now = new Date();

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);
  const existing = await collection.findOne({
    taskId: validated.taskId,
    userId: validated.userId,
  });

  if (existing) {
    const data = existing as Record<string, unknown>;
    return taskProgressFactory.create(mapTaskProgressDocument({ document: data }));
  }

  const newDoc = {
    taskId: validated.taskId,
    userId: validated.userId,
    createdAt: now,
    startedAt: now,
    completedAt: null,
    events: [],
    totalDuration: 0,
    totalTokens: {
      input: 0,
      output: 0,
      total: 0,
    },
    executionAttempt: 1,
  };

  const { insertedId } = await collection.insertOne(newDoc);

  return taskProgressFactory.create(
    mapTaskProgressDocument({
      document: {
        ...newDoc,
        _id: insertedId,
      },
    }),
  );
};
