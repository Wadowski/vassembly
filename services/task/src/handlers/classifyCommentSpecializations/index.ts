import { randomUUID } from 'node:crypto';

import taskCommentDomain from '@vassembly/domain-task-comment';
import {
  classifySpecializationToolHandler,
  createSpecializationToolHandler,
} from '@vassembly/service-agent';
import { logger } from '@vassembly/logger';

import { aggregateTaskSpecializationIds } from './aggregateTaskSpecializationIds';
import { buildCommentClassificationMessage } from './buildCommentClassificationMessage';

import type { ClassifyCommentSpecializationsHandlerInput } from './types';
import type {
  ClassifySpecializationResult,
  CreateSpecializationToolResult,
  InternalToolContext,
} from '@vassembly/service-agent';

const parseClassifyResult = (raw: string): ClassifySpecializationResult =>
  JSON.parse(raw) as ClassifySpecializationResult;

const parseCreateResult = (raw: string): CreateSpecializationToolResult =>
  JSON.parse(raw) as CreateSpecializationToolResult;

const resolveSpecializationIds = async ({
  classifyResult,
  toolContext,
}: {
  classifyResult: ClassifySpecializationResult;
  toolContext: InternalToolContext;
}): Promise<string[]> => {
  if (classifyResult.type === 'skipped') {
    return [];
  }

  if (classifyResult.type === 'existing') {
    return classifyResult.specializationIds;
  }

  const createRaw = await createSpecializationToolHandler(
    { name: classifyResult.name, description: classifyResult.description },
    toolContext,
  );
  const createResult = parseCreateResult(createRaw);

  return [createResult.specializationId];
};

export const classifyCommentSpecializations = async ({
  taskId,
  userId,
  commentId,
}: ClassifyCommentSpecializationsHandlerInput): Promise<void> => {
  const startedAt = Date.now();

  try {
    const commentResult = await taskCommentDomain.queries.getModelById({ id: commentId });
    const comment = commentResult.data;

    if (!comment) {
      return;
    }

    if (comment.specializationIds && comment.specializationIds.length > 0) {
      return;
    }

    const description = await buildCommentClassificationMessage({ taskId, commentId });

    if (!description.trim()) {
      return;
    }

    const toolContext: InternalToolContext = {
      userId,
      taskId,
      commentId,
      invocationId: randomUUID(),
      callerAgentId: '',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: randomUUID(),
    };

    const classifyRaw = await classifySpecializationToolHandler(
      { taskId, description },
      toolContext,
    );
    const classifyResult = parseClassifyResult(classifyRaw);
    const specializationIds = await resolveSpecializationIds({ classifyResult, toolContext });

    if (specializationIds.length === 0) {
      return;
    }

    await taskCommentDomain.commands.setSpecializationIds({
      commentId,
      specializationIds,
    });

    await aggregateTaskSpecializationIds({ taskId });

    logger('task.comment.specialization.completed', {
      meta: { sessionId: 'TASK_COMMENT_SPECIALIZATION', taskId, userId },
      data: {
        commentId,
        specializationIds,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    logger('task.comment.specialization.failed', {
      meta: { sessionId: 'TASK_COMMENT_SPECIALIZATION', taskId, userId },
      data: {
        commentId,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      },
    });
  }
};
