import specializationDomain from '@vassembly/domain-specialization';
import { ValidationError } from '@vassembly/errors';

import { syncTaskSpecializationIds } from '../updateTask/syncTaskSpecializationIds';
import { mapMcpsToSpecialization } from './mapMcpsToSpecialization';
import { generateSpecializationAgentDescriptions } from './generateSpecializationAgentDescriptions';
import { logSpecializationEvent } from './logSpecializationEvent';
import { provisionSpecializationAgents } from './provisionSpecializationAgents';

import type { CreateSpecializationToolResult } from './types';
import type { InternalToolContext } from '../types';

export const createSpecializationToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  const description = typeof args.description === 'string' ? args.description.trim() : '';

  if (!name) {
    throw new ValidationError('name is required');
  }

  if (!description) {
    throw new ValidationError('description is required');
  }

  const startedAt = Date.now();

  logSpecializationEvent({
    event: 'specialization.create.started',
    userId: context.userId,
  });

  const createResult = await specializationDomain.commands.create({
    name: name.toLowerCase(),
    description,
  });

  const specializationId = createResult.id;
  const isNew = createResult.isNew;

  if (isNew) {
    const { createdAgentIds } = await provisionSpecializationAgents({
      specializationId,
      specializationName: name,
    });

    void mapMcpsToSpecialization({
      specializationId,
      specializationName: name,
      specializationDescription: description,
      userId: context.userId,
      toolContext: context,
    }).catch((error: unknown) => {
      logSpecializationEvent({
        event: 'specialization.mcp_mapping.failed',
        specializationId,
        userId: context.userId,
        reason: error instanceof Error ? error.message : String(error),
      });
    });

    if (createdAgentIds.length > 0) {
      void generateSpecializationAgentDescriptions({
        agentIds: createdAgentIds,
        specializationName: name,
        specializationId,
        userId: context.userId,
        toolContext: context,
      }).catch((error: unknown) => {
        logSpecializationEvent({
          event: 'specialization.agent.description.failed',
          specializationId,
          userId: context.userId,
          reason: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }

  if (context.taskId !== '') {
    await syncTaskSpecializationIds({
      taskId: context.taskId,
      specializationIds: [specializationId],
      context,
    });
  }

  logSpecializationEvent({
    event: 'specialization.create.completed',
    specializationId,
    userId: context.userId,
    durationMs: Date.now() - startedAt,
  });

  return JSON.stringify({
    specializationId,
    isNew,
  } satisfies CreateSpecializationToolResult);
};
