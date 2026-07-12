import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { resolveTaskId } from '../updateTask/resolveTaskId';
import { logClassificationEvent } from './logClassificationEvent';
import { normalizeGeneratedSpecializations } from './normalizeGeneratedSpecializations';

import type { ClassifySpecializationResult } from './types';
import type { InternalToolContext } from '../types';

const MIN_DESCRIPTION_LENGTH = 10;
const CATALOG_PAGE_SIZE = 500;

const buildCatalogMessage = ({
  description,
  catalogItems,
}: {
  description: string;
  catalogItems: Array<{ name: string; description: string }>;
}): string => {
  const catalogLines =
    catalogItems.length === 0
      ? 'No existing specializations.'
      : catalogItems.map((item) => `- ${item.name}: ${item.description}`).join('\n');

  return ['Task description:', description, '', 'Existing specializations:', catalogLines].join('\n');
};

const toSkippedResult = ({ reason }: { reason: string }): string =>
  JSON.stringify({ type: 'skipped', reason } satisfies ClassifySpecializationResult);

export const classifySpecializationToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const taskId = resolveTaskId({ args, context });
  const description = typeof args.description === 'string' ? args.description.trim() : '';

  if (!taskId) {
    throw new ValidationError('taskId is required');
  }

  if (!description) {
    throw new ValidationError('description is required');
  }

  const startedAt = Date.now();

  logClassificationEvent({
    event: 'specialization.classification.started',
    taskId,
    userId: context.userId,
  });

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    logClassificationEvent({
      event: 'specialization.classification.skipped',
      taskId,
      userId: context.userId,
      reason: 'short_description',
      durationMs: Date.now() - startedAt,
    });

    return toSkippedResult({ reason: 'short_description' });
  }

  const catalogResult = await specializationDomain.queries.getList({
    page: 0,
    size: CATALOG_PAGE_SIZE,
  });

  const existingByLowerName = new Map(
    catalogResult.items.map((item) => [item.name.toLowerCase(), item.id]),
  );

  const agentResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SpecializationClassifier,
  });

  const invokeResult = await runAgentInvokeWithTools({
    userId: context.userId,
    agentType: 'system',
    agentId: agentResult.data.id!,
    message: buildCatalogMessage({
      description,
      catalogItems: catalogResult.items.map((item) => ({
        name: item.name,
        description: item.description,
      })),
    }),
    credentialScope: 'platform',
    toolContext: context,
  });

  const normalized = normalizeGeneratedSpecializations({
    rawOutput: invokeResult.message,
    existingByLowerName,
  });

  if (!normalized.isValid) {
    logClassificationEvent({
      event: 'specialization.classification.skipped',
      taskId,
      userId: context.userId,
      reason: normalized.reason,
      durationMs: Date.now() - startedAt,
    });

    return toSkippedResult({ reason: normalized.reason });
  }

  logClassificationEvent({
    event: 'specialization.classification.completed',
    taskId,
    userId: context.userId,
    durationMs: Date.now() - startedAt,
  });

  if (normalized.type === 'new') {
    return JSON.stringify({
      type: 'new',
      name: normalized.name,
      description: normalized.description,
    } satisfies ClassifySpecializationResult);
  }

  return JSON.stringify({
    type: 'existing',
    specializationIds: normalized.specializationIds,
  } satisfies ClassifySpecializationResult);
};
