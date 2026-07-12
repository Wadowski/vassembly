import agentDomain, { type AgentInvokeMcpServerConfig } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import skillDomain, { formatSkillsCatalogSection } from '@vassembly/domain-skill';
import systemAgentDomain, { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';
import {
  ExecutionPausedError,
  NotFoundError,
  UserInputWaitingError,
  WrongParamError,
} from '@vassembly/errors';

import { resolveMcpSlugs } from '../helpers/resolveMcpSlugs';
import { loadAssignedInternalTools } from './loadAssignedInternalTools';
import { mapInvokeUsageToTokenUsage } from './mapInvokeUsageToTokenUsage';
import { resolveInvokeErrorDetails } from './resolveInvokeErrorDetails';

import type { AiIntegrationSnapshot, ResolveAndBuildClientResult } from '@vassembly/domain-ai-integration';
import type {
  CredentialScope,
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

  const slugByMcpId = await resolveMcpSlugs({ mcpIds });
  const configsResult = await userMcpConfigDomain.commands.resolveMcpServerConfigs({
    userId,
    mcpConfigs: mcpIds.map((id) => ({ mcpId: id, slug: slugByMcpId[id] ?? '' })),
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

const invokePersonalAgent = async ({
  userId,
  agentId,
  message,
  client,
  toolContext,
}: InvokePersonalAgentParams): Promise<RunAgentInvokeWithToolsResult> => {
  const { data: agent } = await agentDomain.queries.getById({ id: agentId, userId });

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
  });

  return {
    message: result.message,
    usage: result.usage,
    metadata: {
      mcpIdsUsed: mcpIds.filter((id) => !skippedMcpIds.includes(id)),
      skippedMcpIds,
      internalToolIdsUsed: result.toolUsage?.internalToolIdsUsed ?? [],
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

  const mcpIds = mcpIdsOverride ?? [];
  const { mcpServerConfigs, skippedMcpIds } =
    mcpIdsOverride !== undefined
      ? await resolveMcpConfigs({ userId, mcpIds })
      : { mcpServerConfigs: [], skippedMcpIds: [] };

  const result = await systemAgentDomain.commands.invoke({
    modeledProviderClient: client,
    systemAgentId: agentId,
    message,
    internalToolBindings: bindings,
    mcpServerConfigs: mcpIdsOverride !== undefined ? mcpServerConfigs : undefined,
    signal: toolContext.abortSignal,
    shouldAbort: toolContext.shouldAbort,
    skillsCatalogSection,
  });

  return {
    message: result.message,
    usage: result.usage,
    metadata: {
      model: result.metadata?.model,
      provider: result.metadata?.provider,
      mcpIdsUsed: mcpIdsOverride !== undefined ? mcpIds.filter((id) => !skippedMcpIds.includes(id)) : [],
      skippedMcpIds: mcpIdsOverride !== undefined ? skippedMcpIds : [],
      internalToolIdsUsed: result.toolUsage?.internalToolIdsUsed ?? [],
      skippedInternalToolIds: skippedToolIds,
      maxUseAgentDepth: MAX_USE_AGENT_DEPTH,
    },
  };
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
