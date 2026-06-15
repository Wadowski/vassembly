import z from 'zod';

import { NotFoundError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { TaskProgressModel } from '../../model';
import { taskProgressFactory } from '../../model/factories';
import { mapTaskProgressDocument } from '../../model/mapTaskProgressDocument';

import type { FinalizeTaskProgressInput } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const finalizeTaskProgress = async (
  input: FinalizeTaskProgressInput
): Promise<TaskProgressModel> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const taskProgress = await collection.findOne({ taskId: validated.taskId });

  if (!taskProgress) {
    throw new NotFoundError(`Task progress not found for taskId: ${validated.taskId}`);
  }

  const taskProgressData = taskProgress as Record<string, unknown>;
  const events = (taskProgressData.events as unknown[]) || [];
  const now = new Date();

  let totalDuration = 0;
  let totalInput = 0;
  let totalOutput = 0;

  if (events.length > 0) {
    const firstEvent = events[0] as Record<string, unknown>;
    const lastEvent = events[events.length - 1] as Record<string, unknown>;

    if (
      firstEvent?.timestamp &&
      lastEvent?.timestamp &&
      firstEvent.timestamp instanceof Date &&
      lastEvent.timestamp instanceof Date
    ) {
      totalDuration = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
    }

    for (const event of events) {
      const eventData = event as Record<string, unknown>;
      const tokenUsage = eventData.tokenUsage as Record<string, unknown> | undefined;
      if (tokenUsage) {
        totalInput += (tokenUsage.input as number) || 0;
        totalOutput += (tokenUsage.output as number) || 0;
      }
    }
  }

  const updatedDocument = await collection.findOneAndUpdate(
    { taskId: validated.taskId },
    {
      $set: {
        completedAt: now,
        totalDuration,
        totalTokens: {
          input: totalInput,
          output: totalOutput,
          total: totalInput + totalOutput,
        },
      },
    },
    { returnDocument: 'after' },
  );

  if (!updatedDocument) {
    throw new NotFoundError(`Task progress not found for taskId: ${validated.taskId}`);
  }

  return taskProgressFactory.create(
    mapTaskProgressDocument({ document: updatedDocument as Record<string, unknown> }),
  );
};
