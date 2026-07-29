import z from 'zod';
import { ObjectId } from 'mongodb';

import { NotFoundError } from '@vassembly/errors';
import { mongoDb } from '@vassembly/client-mongodb';

import { INTERNAL_TOOL_USAGE_COLLECTION_NAME } from '../../clients';
import { InternalToolUsageStatus } from '../../model';
import { sanitizeErrorMessage, sanitizeToolInput, sanitizeToolOutput } from './shared/sanitizeToolInput';

import type { RecordUsageEventInput, RecordUsageEventResult } from './types';

const STARTED_SCHEMA = z.object({
  phase: z.literal('started'),
  internalToolId: z.string().min(1),
  internalToolDisplayName: z.string().optional(),
  toolName: z.string().min(1),
  userId: z.string().min(1),
  taskId: z.string().nullable().optional(),
  commentId: z.string().nullable().optional(),
  agentId: z.string().min(1),
  invocationId: z.string().optional(),
  rootInvokeId: z.string().optional(),
  startedAt: z.date(),
  input: z.record(z.string(), z.unknown()).optional(),
});

const COMPLETED_SCHEMA = z.object({
  phase: z.literal('completed'),
  eventId: z.string().min(1),
  status: z.enum([InternalToolUsageStatus.Success, InternalToolUsageStatus.Error]),
  endedAt: z.date(),
  durationMs: z.number().min(0),
  errorMessage: z.string().optional(),
  output: z.string().optional(),
});

const recordStarted = async (
  input: z.infer<typeof STARTED_SCHEMA>,
): Promise<{ eventId: string }> => {
  const now = new Date();
  const { value: sanitizedInput, inputTruncated } = sanitizeToolInput(input.input);

  const newDoc = {
    internalToolId: input.internalToolId,
    internalToolDisplayName: input.internalToolDisplayName ?? null,
    toolName: input.toolName,
    userId: input.userId,
    taskId: input.taskId ?? null,
    commentId: input.commentId ?? null,
    agentId: input.agentId,
    invocationId: input.invocationId ?? null,
    rootInvokeId: input.rootInvokeId ?? null,
    status: InternalToolUsageStatus.InProgress,
    startedAt: input.startedAt,
    endedAt: null,
    durationMs: null,
    input: sanitizedInput,
    inputTruncated,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };

  const collection = mongoDb.db.collection(INTERNAL_TOOL_USAGE_COLLECTION_NAME);
  const { insertedId } = await collection.insertOne(newDoc);

  return { eventId: String(insertedId) };
};

const recordCompleted = async (
  input: z.infer<typeof COMPLETED_SCHEMA>,
): Promise<void> => {
  const { value: sanitizedOutput, outputTruncated } = sanitizeToolOutput(input.output);
  const collection = mongoDb.db.collection(INTERNAL_TOOL_USAGE_COLLECTION_NAME);
  const result = await collection.updateOne(
    { _id: new ObjectId(input.eventId) },
    {
      $set: {
        status: input.status,
        endedAt: input.endedAt,
        durationMs: input.durationMs,
        errorMessage: sanitizeErrorMessage(input.errorMessage),
        output: sanitizedOutput,
        outputTruncated,
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError(`Internal tool usage event not found: ${input.eventId}`);
  }
};

export const recordUsageEvent = async (
  input: RecordUsageEventInput,
): Promise<RecordUsageEventResult> => {
  if (input.phase === 'started') {
    const validated = STARTED_SCHEMA.parse(input);
    return recordStarted(validated);
  }

  const validated = COMPLETED_SCHEMA.parse(input);
  await recordCompleted(validated);
};
