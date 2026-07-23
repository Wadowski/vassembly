import z from 'zod';

import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';

import type { ResetTaskProgressInput } from './types';

const VALIDATION_SCHEMA = z.object({
  commentId: z.string().min(1),
});

export const resetTaskProgress = async (input: ResetTaskProgressInput): Promise<void> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  await collection.updateOne(
    { commentId: validated.commentId },
    {
      $unset: {
        completedAt: 1,
      },
      $set: {
        events: [],
        totalDuration: 0,
        totalTokens: {
          input: 0,
          output: 0,
          total: 0,
        },
        updatedAt: new Date(),
      },
      $inc: {
        executionAttempt: 1,
      },
    },
  );
};
