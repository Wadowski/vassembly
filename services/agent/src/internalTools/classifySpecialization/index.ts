import { MAX_SPECIALIZATION_RESULTS, SYSTEM_AGENT_NAME } from '@vassembly/constants';
import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain from '@vassembly/domain-system-agent';
import mcpDomain from '@vassembly/domain-mcp';
import { ValidationError } from '@vassembly/errors';

import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { resolveTaskId } from '../updateTask/resolveTaskId';
import { buildMcpCatalogHintsSectionFromItems } from './buildMcpCatalogHintsSection';
import { logClassificationEvent } from './logClassificationEvent';
import { normalizeGeneratedSpecializations } from './normalizeGeneratedSpecializations';
import { supplementClassificationWithDetectedDomains } from './supplementClassificationWithDetectedDomains';

import type { ClassifySpecializationResult, NewSpecializationEntry } from './types';
import type { AgentInvokeProgressEventInput, InternalToolContext } from '../types';

const MIN_DESCRIPTION_LENGTH = 10;
const CATALOG_PAGE_SIZE = 500;
const MCP_CATALOG_PAGE_SIZE = 200;

interface BuildCatalogMessageParams {
  description: string;
  catalogItems: Array<{ name: string; description: string }>;
  mcpCatalogSection: string;
}

const buildCatalogMessage = ({
  description,
  catalogItems,
  mcpCatalogSection,
}: BuildCatalogMessageParams): string => {
  const catalogLines =
    catalogItems.length === 0
      ? 'No existing specializations.'
      : catalogItems.map((item) => `- ${item.name}: ${item.description}`).join('\n');

  return [
    `Classify the new comment into up to ${MAX_SPECIALIZATION_RESULTS} topic and tool/platform specializations. Use previous comments only as context.`,
    'When the task combines subject-matter work with a named platform or tool, return at least one line for each domain (for example: meals research plus Notion delivery requires both a food-related specialization and a notion specialization).',
    'Do not collapse multi-domain tasks into a single specialization.',
    '',
    description,
    '',
    'Existing specializations:',
    catalogLines,
    '',
    mcpCatalogSection,
    '',
    'Example output for "Create a summary in my Notion about 20 most popular meals":',
    'food & nutrition',
    'notion',
  ].join('\n');
};

const toSkippedResult = ({ reason }: { reason: string }): string =>
  JSON.stringify({ type: 'skipped', reason } satisfies ClassifySpecializationResult);

const buildOutcomeSummary = ({
  existingNames,
  newSpecializations,
}: {
  existingNames: string[];
  newSpecializations: NewSpecializationEntry[];
}): string => {
  const segments: string[] = [];

  if (existingNames.length > 0) {
    segments.push(`Matched: ${existingNames.join(', ')}`);
  }

  if (newSpecializations.length > 0) {
    segments.push(`Created: ${newSpecializations.map((entry) => entry.name).join(', ')}`);
  }

  return segments.join(' · ');
};

const recordProgressSafely = async ({
  context,
  taskId,
  userId,
  input,
}: {
  context: InternalToolContext;
  taskId: string;
  userId: string;
  input: AgentInvokeProgressEventInput;
}): Promise<void> => {
  if (!context.recordAgentInvokeProgress) {
    return;
  }

  try {
    await context.recordAgentInvokeProgress(input);
  } catch (error) {
    logClassificationEvent({
      event: 'specialization.classification.skipped',
      taskId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

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

  const agentResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SpecializationClassifier,
  });
  const classifierAgentId = agentResult.data.id!;

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    await recordProgressSafely({
      context,
      taskId,
      userId: context.userId,
      input: {
        agentId: classifierAgentId,
        state: 'skipped',
        outcomeSummary: 'Skipped: short_description',
      },
    });

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

  const catalogItems = catalogResult.items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
  }));

  const nameById = new Map(catalogItems.map((item) => [item.id, item.name]));

  const mcpCatalogResult = await mcpDomain.queries.getList({
    page: 0,
    size: MCP_CATALOG_PAGE_SIZE,
  });
  const mcpItems = mcpCatalogResult.items.map((mcp) => ({
    name: mcp.name,
    slug: mcp.slug,
    description: mcp.description,
    tags: mcp.tags ?? [],
  }));
  const mcpCatalogSection = buildMcpCatalogHintsSectionFromItems({ mcpItems });
  const classificationMessage = buildCatalogMessage({
    description,
    catalogItems,
    mcpCatalogSection,
  });

  await recordProgressSafely({
    context,
    taskId,
    userId: context.userId,
    input: {
      agentId: classifierAgentId,
      state: 'started',
      inputMessages: classificationMessage,
    },
  });

  let invokeResult;

  try {
    invokeResult = await runAgentInvokeWithTools({
      userId: context.userId,
      agentType: 'system',
      agentId: classifierAgentId,
      message: classificationMessage,
      credentialScope: 'platform',
      toolContext: context,
    });
  } catch (error) {
    await recordProgressSafely({
      context,
      taskId,
      userId: context.userId,
      input: {
        agentId: classifierAgentId,
        state: 'failed',
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
        },
      },
    });

    throw error;
  }

  const normalized = supplementClassificationWithDetectedDomains({
    classification: normalizeGeneratedSpecializations({
      rawOutput: invokeResult.message,
      catalogItems,
    }),
    description,
    catalogItems,
    mcpItems,
  });

  if (!normalized.isValid) {
    await recordProgressSafely({
      context,
      taskId,
      userId: context.userId,
      input: {
        agentId: classifierAgentId,
        state: 'skipped',
        generatedResponse: invokeResult.message,
        outcomeSummary: `Skipped: ${normalized.reason}`,
      },
    });

    logClassificationEvent({
      event: 'specialization.classification.skipped',
      taskId,
      userId: context.userId,
      reason: normalized.reason,
      durationMs: Date.now() - startedAt,
    });

    return toSkippedResult({ reason: normalized.reason });
  }

  const existingNames = normalized.existingSpecializationIds.map(
    (id) => nameById.get(id) ?? id,
  );

  await recordProgressSafely({
    context,
    taskId,
    userId: context.userId,
    input: {
      agentId: classifierAgentId,
      state: 'completed',
      duration: Date.now() - startedAt,
      inputMessages: classificationMessage,
      generatedResponse: invokeResult.message,
      tokenUsage: invokeResult.usage
        ? {
            input: invokeResult.usage.promptTokens,
            output: invokeResult.usage.completionTokens,
            total: invokeResult.usage.totalTokens ?? invokeResult.usage.promptTokens + invokeResult.usage.completionTokens,
          }
        : undefined,
      outcomeSummary: buildOutcomeSummary({
        existingNames,
        newSpecializations: normalized.newSpecializations,
      }),
    },
  });

  logClassificationEvent({
    event: 'specialization.classification.completed',
    taskId,
    userId: context.userId,
    durationMs: Date.now() - startedAt,
  });

  return JSON.stringify({
    type: 'classified',
    existingSpecializationIds: normalized.existingSpecializationIds,
    newSpecializations: normalized.newSpecializations,
  } satisfies ClassifySpecializationResult);
};
