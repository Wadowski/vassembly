import { randomUUID } from 'node:crypto';

import {
  classifySpecializationToolHandler,
  createSpecializationToolHandler,
  updateTaskToolHandler,
} from '@vassembly/service-agent';

import type {
  ClassifySpecializationResult,
  CreateSpecializationToolResult,
  InternalToolContext,
} from '@vassembly/service-agent';

export interface RunTaskSpecializationClassificationParams {
  taskId: string;
  userId: string;
  description: string;
  existingSpecializationIds?: string[] | null;
  abortSignal?: AbortSignal;
}

const parseClassifyResult = (raw: string): ClassifySpecializationResult =>
  JSON.parse(raw) as ClassifySpecializationResult;

const parseCreateResult = (raw: string): CreateSpecializationToolResult =>
  JSON.parse(raw) as CreateSpecializationToolResult;

export const runTaskSpecializationClassification = async ({
  taskId,
  userId,
  description,
  existingSpecializationIds,
  abortSignal,
}: RunTaskSpecializationClassificationParams): Promise<void> => {
  if (existingSpecializationIds && existingSpecializationIds.length > 0) {
    return;
  }

  const toolContext: InternalToolContext = {
    userId,
    taskId,
    invocationId: randomUUID(),
    callerAgentId: '',
    callerAgentType: 'system',
    recursionDepth: 0,
    rootInvokeId: randomUUID(),
    abortSignal,
  };

  const classifyRaw = await classifySpecializationToolHandler(
    { taskId, description },
    toolContext,
  );
  const classifyResult = parseClassifyResult(classifyRaw);

  if (classifyResult.type === 'skipped') {
    return;
  }

  if (classifyResult.type === 'existing') {
    if (classifyResult.specializationIds.length === 0) {
      return;
    }

    await updateTaskToolHandler(
      {
        taskId,
        specializationIds: classifyResult.specializationIds,
      },
      toolContext,
    );
    return;
  }

  const createRaw = await createSpecializationToolHandler(
    { name: classifyResult.name, description: classifyResult.description },
    toolContext,
  );
  const createResult = parseCreateResult(createRaw);

  await updateTaskToolHandler(
    {
      taskId,
      specializationIds: [createResult.specializationId],
    },
    toolContext,
  );
};
