import agentDomain, { type AgentInvokeMcpServerConfig } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import skillDomain, { formatSkillsCatalogSection } from '@vassembly/domain-skill';
import systemAgentDomain, { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { MAX_USE_AGENT_DEPTH, SYSTEM_AGENT_NAME } from '@vassembly/constants';
import {
  ExecutionPausedError,
  NotFoundError,
  UserInputWaitingError,
  WrongParamError,
} from '@vassembly/errors';

import { resolveMcpRuntimeMetadata } from '../helpers/resolveMcpRuntimeMetadata';
import { completeTaskPlannerPersistence } from './completeTaskPlannerPersistence';
import { resolveSpecializationMcpIds } from '../helpers/resolveSpecializationMcpIds';
import { buildTaskPlannerAgentsCatalogSection } from './buildTaskPlannerAgentsCatalogSection';
import { loadAssignedInternalTools } from './loadAssignedInternalTools';
import { mapInvokeUsageToTokenUsage } from './mapInvokeUsageToTokenUsage';
import { resolveInvokeErrorDetails } from './resolveInvokeErrorDetails';

import type { AiIntegrationSnapshot, ResolveAndBuildClientResult } from '@vassembly/domain-ai-integration';
import type {
  CredentialScope,
  RecordInternalToolUsageEvent,
  RecordMcpUsageEvent,
  RunAgentInvokeWithToolsParams,
  RunAgentInvokeWithToolsResult,
} from './types';

type ModeledProviderClient = ResolveAndBuildClientResult['client'];

interface ResolveCredentialAndClientParams {
  userId: string;
  agentType: 'personal' | 'system';
  agentId: string;
  connectionOverride?: { integrationCredentialId: string };
  credentialScope?: CredentialScope;
}

interface ResolveCredentialAndClientResult {
  client: ModeledProviderClient;
  integrationSnapshot: AiIntegrationSnapshot;
}

interface InvokePersonalAgentParams {
  userId: string;
  agentId: string;
  message: string;
  client: ModeledProviderClient;
  toolContext: RunAgentInvokeWithToolsParams['toolContext'];
}

interface InvokeSystemAgentParams {
  userId: string;
  agentId: string;
  message: string;
  client: ModeledProviderClient;
  mcpIdsOverride?: string[];
  toolContext: RunAgentInvokeWithToolsParams['toolContext'];
}

interface BuildSkillsCatalogSectionParams {
  specializationId: string;
}

const buildSkillsCatalogSection = async ({
  specializationId,
}: BuildSkillsCatalogSectionParams): Promise<string> => {
  const { items } = await skillDomain.queries.getCatalogBySpecializationId({ specializationId });

  if (items.length === 0) {
    return '## Available Skills\n\n(none)';
  }

  return formatSkillsCatalogSection({ items });
};

const resolveMcpConfigs = async ({
  userId,
  mcpIds,
}: {
  userId: string;
  mcpIds: string[];
}): Promise<{ mcpServerConfigs: AgentInvokeMcpServerConfig[]; skippedMcpIds: string[] }> => {
  if (mcpIds.length === 0) {
    return { mcpServerConfigs: [], skippedMcpIds: [] };
  }

  const metadataByMcpId = await resolveMcpRuntimeMetadata({ mcpIds });
  const configsResult = await userMcpConfigDomain.commands.resolveMcpServerConfigs({
    userId,
    mcpConfigs: mcpIds.map((id) => ({
      mcpId: id,
      slug: metadataByMcpId[id]?.slug ?? '',
      serverUrl: metadataByMcpId[id]?.serverUrl,
    })),
  });

  return {
    mcpServerConfigs: configsResult.serverConfigs,
    skippedMcpIds: configsResult.skippedMcpIds,
  };
};

const resolveCredentialAndClient = async ({
  userId,
  agentType,
  agentId,
  connectionOverride,
  credentialScope = 'user',
}: ResolveCredentialAndClientParams): Promise<ResolveCredentialAndClientResult> => {
  if (credentialScope === 'platform' && agentType !== 'system') {
    throw new WrongParamError('Platform credential scope requires a system agent');
  }

  if (credentialScope === 'platform') {
    const { data: agent } = await systemAgentDomain.queries.getActiveById({ id: agentId });

    if (agent === null) {
      throw new NotFoundError('This platform agent is no longer available.', {
        code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
      });
    }

    return aiIntegrationDomain.commands.resolvePlatformClient();
  }

  if (agentType === 'personal') {
    const { data: agent } = await agentDomain.queries.getById({ id: agentId, userId });
    const credentialId = connectionOverride?.integrationCredentialId ?? agent.integrationCredentialId;

    if (!credentialId) {
      throw new WrongParamError('Agent has no AI integration configured');
    }

    return aiIntegrationDomain.commands.resolveAndBuildClient({
      userId,
      connectionOverride: { integrationCredentialId: credentialId },
    });
  }

  const { data: agent } = await systemAgentDomain.queries.getActiveById({ id: agentId });

  if (agent === null) {
    throw new NotFoundError('This platform agent is no longer available.', {
      code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
    });
  }

  return aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    connectionOverride,
  });
};

const buildRecordMcpToolCall = ({
  recordMcpUsageEvent,
  toolContext,
}: {
  recordMcpUsageEvent?: RecordMcpUsageEvent;
  toolContext: RunAgentInvokeWithToolsParams['toolContext'];
}) => {
  if (!recordMcpUsageEvent) {
    return undefined;
  }

  return async (
    input: Parameters<RecordMcpUsageEvent>[0],
  ): Promise<string | void> => {
    if (input.phase === 'started') {
      return recordMcpUsageEvent({
        ...input,
        agentId: toolContext.callerAgentId,
        invocationId: toolContext.invocationId,
        rootInvokeId: toolContext.rootInvokeId,
      });
    }

    return recordMcpUsageEvent(input);
  };
};

const buildRecordInternalToolCall = ({
  recordInternalToolUsageEvent,
  toolContext,
}: {
  recordInternalToolUsageEvent?: RecordInternalToolUsageEvent;
  toolContext: RunAgentInvokeWithToolsParams['toolContext'];
}) => {
  if (!recordInternalToolUsageEvent) {
    return undefined;
  }

  return async (
    input: Parameters<RecordInternalToolUsageEvent>[0],
  ): Promise<string | void> => {
    if (input.phase === 'started') {
      return recordInternalToolUsageEvent({
        ...input,
        agentId: toolContext.callerAgentId,
        invocationId: toolContext.invocationId,
        rootInvokeId: toolContext.rootInvokeId,
      });
    }

    return recordInternalToolUsageEvent(input);
  };
};

const invokePersonalAgent = async ({
  userId,
  agentId,
  message,
  client,
  toolContext,
}: InvokePersonalAgentParams): Promise<RunAgentInvokeWithToolsResult> => {
  const { data: agent } = await agentDomain.queries.getById({ id: agentId, userId });
  const recordMcpToolCall = buildRecordMcpToolCall({
    recordMcpUsageEvent: toolContext.recordMcpUsageEvent,
    toolContext,
  });
  const recordInternalToolCall = buildRecordInternalToolCall({
    recordInternalToolUsageEvent: toolContext.recordInternalToolUsageEvent,
    toolContext,
  });

  const mcpIds = agent.assignedMcpIds ?? [];
  const assignedToolIds = agent.assignedToolIds ?? [];
  const { mcpServerConfigs, skippedMcpIds } = await resolveMcpConfigs({ userId, mcpIds });
  const { bindings, skippedToolIds } = await loadAssignedInternalTools({
    assignedToolIds,
    toolContext,
  });

  const result = await agentDomain.commands.invoke({
    modeledProviderClient: client,
    agentId,
    userId,
    message,
    systemMessage: agent.rule,
    mcpServerConfigs,
    internalToolBindings: bindings,
    signal: toolContext.abortSignal,
    shouldAbort: toolContext.shouldAbort,
    recordMcpToolCall,
    recordInternalToolCall,
  });

  return {
    message: result.message,
    usage: result.usage,
    metadata: {
      mcpIdsUsed: mcpIds.filter((id) => !skippedMcpIds.includes(id)),
      skippedMcpIds,
      internalToolIdsUsed: result.toolUsage?.internalToolIdsUsed ?? [],
      internalToolResults: result.toolUsage?.internalToolResults,
      skippedInternalToolIds: skippedToolIds,
      maxUseAgentDepth: MAX_USE_AGENT_DEPTH,
    },
  };
};

const invokeSystemAgent = async ({
  userId,
  agentId,
  message,
  client,
  mcpIdsOverride,
  toolContext,
}: InvokeSystemAgentParams): Promise<RunAgentInvokeWithToolsResult> => {
  const { data: agent } = await systemAgentDomain.queries.getActiveById({ id: agentId });
  const recordMcpToolCall = buildRecordMcpToolCall({
    recordMcpUsageEvent: toolContext.recordMcpUsageEvent,
    toolContext,
  });
  const recordInternalToolCall = buildRecordInternalToolCall({
    recordInternalToolUsageEvent: toolContext.recordInternalToolUsageEvent,
    toolContext,
  });

  if (agent === null) {
    throw new NotFoundError('This platform agent is no longer available.', {
      code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
    });
  }

  const assignedToolIds = agent.assignedToolIds ?? [];
  const { bindings, skippedToolIds } = await loadAssignedInternalTools({
    assignedToolIds,
    toolContext,
  });

  const skillsCatalogSection =
    agent.specializationId !== undefined &&
    agent.specializationId !== null &&
    agent.specializationId !== ''
      ? await buildSkillsCatalogSection({ specializationId: agent.specializationId })
      : undefined;

  const agentsCatalogSection =
    agent.name === SYSTEM_AGENT_NAME.TaskPlanner &&
    toolContext.specializationIds !== undefined &&
    toolContext.specializationIds !== null &&
    toolContext.specializationIds.length > 0
      ? await buildTaskPlannerAgentsCatalogSection({
          specializationIds: toolContext.specializationIds,
        })
      : undefined;

  const resolvedMcpIdsOverride =
    mcpIdsOverride ??
    (agent.specializationId !== undefined &&
    agent.specializationId !== null &&
    agent.specializationId !== ''
      ? await resolveSpecializationMcpIds({ specializationId: agent.specializationId })
      : undefined);

  const mcpIds = resolvedMcpIdsOverride ?? [];
  const { mcpServerConfigs, skippedMcpIds } =
    resolvedMcpIdsOverride !== undefined
      ? await resolveMcpConfigs({ userId, mcpIds })
      : { mcpServerConfigs: [], skippedMcpIds: [] };

  const hasSpecializationIds =
    toolContext.specializationIds !== undefined &&
    toolContext.specializationIds !== null &&
    toolContext.specializationIds.length > 0;

  const requireSuccessfulToolLlmName =
    agent.name === SYSTEM_AGENT_NAME.TaskPlanner && hasSpecializationIds
      ? 'persist_task_plan'
      : undefined;

  const result = await systemAgentDomain.commands.invoke({
    modeledProviderClient: client,
    systemAgentId: agentId,
    message,
    internalToolBindings: bindings,
    mcpServerConfigs: resolvedMcpIdsOverride !== undefined ? mcpServerConfigs : undefined,
    signal: toolContext.abortSignal,
    shouldAbort: toolContext.shouldAbort,
    recordMcpToolCall,
    recordInternalToolCall,
    skillsCatalogSection,
    agentsCatalogSection,
    requireSuccessfulToolLlmName,
  });

  const invokeResult: RunAgentInvokeWithToolsResult = {
    message: result.message,
    usage: result.usage,
    metadata: {
      model: result.metadata?.model,
      provider: result.metadata?.provider,
      mcpIdsUsed:
        resolvedMcpIdsOverride !== undefined
          ? mcpIds.filter((id) => !skippedMcpIds.includes(id))
          : [],
      skippedMcpIds: resolvedMcpIdsOverride !== undefined ? skippedMcpIds : [],
      internalToolIdsUsed: result.toolUsage?.internalToolIdsUsed ?? [],
      internalToolResults: result.toolUsage?.internalToolResults,
      skippedInternalToolIds: skippedToolIds,
      maxUseAgentDepth: MAX_USE_AGENT_DEPTH,
    },
  };

  if (agent.name === SYSTEM_AGENT_NAME.TaskPlanner && hasSpecializationIds) {
    return completeTaskPlannerPersistence({
      commentId: toolContext.commentId,
      plannerInputMessage: message,
      firstResult: invokeResult,
      continueInvocation: async (continuationMessage: string) => {
        const continuation = await systemAgentDomain.commands.invoke({
          modeledProviderClient: client,
          systemAgentId: agentId,
          message: continuationMessage,
          internalToolBindings: bindings,
          mcpServerConfigs: resolvedMcpIdsOverride !== undefined ? mcpServerConfigs : undefined,
          signal: toolContext.abortSignal,
          shouldAbort: toolContext.shouldAbort,
          recordMcpToolCall,
          recordInternalToolCall,
          skillsCatalogSection,
          agentsCatalogSection,
          requireSuccessfulToolLlmName: 'persist_task_plan',
        });

        return {
          message: continuation.message,
          usage: continuation.usage,
          metadata: {
            model: continuation.metadata?.model,
            provider: continuation.metadata?.provider,
            mcpIdsUsed:
              resolvedMcpIdsOverride !== undefined
                ? mcpIds.filter((id) => !skippedMcpIds.includes(id))
                : [],
            skippedMcpIds: resolvedMcpIdsOverride !== undefined ? skippedMcpIds : [],
            internalToolIdsUsed: continuation.toolUsage?.internalToolIdsUsed ?? [],
            internalToolResults: continuation.toolUsage?.internalToolResults,
            skippedInternalToolIds: skippedToolIds,
            maxUseAgentDepth: MAX_USE_AGENT_DEPTH,
          },
        };
      },
    });
  }

  return invokeResult;
};

const assertNotAborted = async (
  toolContext: RunAgentInvokeWithToolsParams['toolContext'],
): Promise<void> => {
  if (toolContext.abortSignal?.aborted) {
    throw new ExecutionPausedError();
  }

  if (toolContext.shouldAbort && (await toolContext.shouldAbort())) {
    throw new ExecutionPausedError();
  }
};

export const runAgentInvokeWithTools = async (
  params: RunAgentInvokeWithToolsParams,
): Promise<RunAgentInvokeWithToolsResult> => {
  const { toolContext } = params;
  const invokeStartTime = Date.now();
  const credentialSource = params.credentialScope ?? 'user';
  const recordProgress =
    credentialSource === 'platform' ? undefined : toolContext.recordAgentInvokeProgress;

  await assertNotAborted(toolContext);

  const { client, integrationSnapshot } = await resolveCredentialAndClient({
    userId: params.userId,
    agentType: params.agentType,
    agentId: params.agentId,
    connectionOverride: params.connectionOverride,
    credentialScope: params.credentialScope,
  });

  if (recordProgress) {
    await assertNotAborted(toolContext);
    await recordProgress({
      agentId: params.agentId,
      parentAgentId: toolContext.parentAgentId,
      state: 'started',
      timestamp: new Date(),
      inputMessages: params.message,
      credentialSource,
      ...integrationSnapshot,
    });
  }

  try {
    await assertNotAborted(toolContext);
    const result =
      params.agentType === 'personal'
        ? await invokePersonalAgent({ ...params, client })
        : await invokeSystemAgent({
            userId: params.userId,
            agentId: params.agentId,
            message: params.message,
            client,
            mcpIdsOverride: params.mcpIdsOverride,
            toolContext: params.toolContext,
          });

    if (recordProgress) {
      await recordProgress({
        agentId: params.agentId,
        parentAgentId: toolContext.parentAgentId,
        state: 'completed',
        timestamp: new Date(),
        duration: Date.now() - invokeStartTime,
        generatedResponse: result.message,
        tokenUsage: mapInvokeUsageToTokenUsage({ usage: result.usage }),
        credentialSource,
        ...integrationSnapshot,
      });
    }

    return result;
  } catch (error: unknown) {
    if (recordProgress && error instanceof UserInputWaitingError) {
      await recordProgress({
        agentId: params.agentId,
        parentAgentId: toolContext.parentAgentId,
        state: 'waiting',
        timestamp: new Date(),
        duration: Date.now() - invokeStartTime,
        credentialSource,
        ...integrationSnapshot,
      });
    } else if (recordProgress && !(error instanceof ExecutionPausedError)) {
      const errorDetails = resolveInvokeErrorDetails(error);

      await recordProgress({
        agentId: params.agentId,
        parentAgentId: toolContext.parentAgentId,
        state: 'failed',
        timestamp: new Date(),
        duration: Date.now() - invokeStartTime,
        errorDetails,
        credentialSource,
        ...integrationSnapshot,
      });
    }

    throw error;
  }
};
