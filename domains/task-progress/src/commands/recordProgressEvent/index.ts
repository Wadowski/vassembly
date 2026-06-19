import z from 'zod';

import { NotFoundError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';

import { TASK_PROGRESS_COLLECTION_NAME } from '../../clients';
import { ProgressEventModel, ProgressEventState } from '../../model';

import type { RecordProgressEventInput } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
  agentId: z.string().min(1),
  state: z.nativeEnum(ProgressEventState),
  timestamp: z.date().optional(),
  duration: z.number().optional(),
  inputMessages: z.string().optional(),
  generatedResponse: z.string().optional(),
  tokenUsage: z
    .object({
      input: z.number(),
      output: z.number(),
      total: z.number(),
    })
    .optional(),
  errorDetails: z
    .object({
      message: z.string(),
      type: z.string().optional(),
      stackTrace: z.string().optional(),
    })
    .optional(),
  parentAgentId: z.string().optional(),
  integrationName: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export const recordProgressEvent = async (
  input: RecordProgressEventInput
): Promise<ProgressEventModel> => {
  const validated = VALIDATION_SCHEMA.parse(input);

  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);

  const newEvent: ProgressEventModel = {
    id: new Date().getTime().toString(),
    agentId: validated.agentId,
    state: validated.state,
    timestamp: validated.timestamp || new Date(),
    duration: validated.duration,
    inputMessages: validated.inputMessages,
    generatedResponse: validated.generatedResponse,
    tokenUsage: validated.tokenUsage,
    errorDetails: validated.errorDetails,
    parentAgentId: validated.parentAgentId,
    integrationName: validated.integrationName,
    provider: validated.provider,
    model: validated.model,
  };

  const result = await collection.updateOne(
    { taskId: validated.taskId },
    { $push: { events: newEvent } } as unknown as Parameters<typeof collection.updateOne>[1]
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError(`Task progress not found for taskId: ${validated.taskId}`);
  }

  return newEvent;
};
