import agentDomain, { type AgentInvokeMcpServerConfig } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import systemAgentDomain, { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';
import { WrongParamError, NotFoundError } from '@vassembly/errors';

import { resolveMcpSlugs } from '../resolveMcpSlugs';
import { loadAssignedInternalTools } from './loadAssignedInternalTools';
import { mapInvokeUsageToTokenUsage } from './mapInvokeUsageToTokenUsage';

import type { AiIntegrationSnapshot, ResolveAndBuildClientResult } from '@vassembly/domain-ai-integration';
import type {
  RunAgentInvokeWithToolsParams,
  RunAgentInvokeWithToolsResult,
} from './types';

type ModeledProviderClient = ResolveAndBuildClientResult['client'];

interface ResolveCredentialAndClientParams {
  userId: string;
  agentType: 'personal' | 'system';
  agentId: string;
  connectionOverride?: { integrationCredentialId: string };
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
  agentId: string;
  message: string;
  client: ModeledProviderClient;
  toolContext: RunAgentInvokeWithToolsParams['toolContext'];
}

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
}: ResolveCredentialAndClientParams): Promise<ResolveCredentialAndClientResult> => {
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
  agentId,
  message,
  client,
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

  const result = await systemAgentDomain.commands.invoke({
    modeledProviderClient: client,
    systemAgentId: agentId,
    message,
    internalToolBindings: bindings,
  });

  return {
    message: result.message,
    usage: result.usage,
    metadata: {
      model: result.metadata?.model,
      provider: result.metadata?.provider,
      mcpIdsUsed: [],
      skippedMcpIds: [],
      internalToolIdsUsed: result.toolUsage?.internalToolIdsUsed ?? [],
      skippedInternalToolIds: skippedToolIds,
      maxUseAgentDepth: MAX_USE_AGENT_DEPTH,
    },
  };
};

export const runAgentInvokeWithTools = async (
  params: RunAgentInvokeWithToolsParams,
): Promise<RunAgentInvokeWithToolsResult> => {
  const { toolContext } = params;
  const recordProgress = toolContext.recordAgentInvokeProgress;
  const invokeStartTime = Date.now();

  const { client, integrationSnapshot } = await resolveCredentialAndClient({
    userId: params.userId,
    agentType: params.agentType,
    agentId: params.agentId,
    connectionOverride: params.connectionOverride,
  });

  if (recordProgress) {
    await recordProgress({
      agentId: params.agentId,
      parentAgentId: toolContext.parentAgentId,
      state: 'started',
      timestamp: new Date(),
      inputMessages: params.message,
      ...integrationSnapshot,
    });
  }

  try {
    const result =
      params.agentType === 'personal'
        ? await invokePersonalAgent({ ...params, client })
        : await invokeSystemAgent({
            agentId: params.agentId,
            message: params.message,
            client,
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
        ...integrationSnapshot,
      });
    }

    return result;
  } catch (error) {
    if (recordProgress) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorType =
        error instanceof Error && 'code' in error
          ? String((error as Error & { code?: string }).code)
          : undefined;

      await recordProgress({
        agentId: params.agentId,
        parentAgentId: toolContext.parentAgentId,
        state: 'failed',
        timestamp: new Date(),
        duration: Date.now() - invokeStartTime,
        errorDetails: {
          message: errorMessage,
          type: errorType,
          stackTrace: error instanceof Error ? error.stack : undefined,
        },
        ...integrationSnapshot,
      });
    }

    throw error;
  }
};
