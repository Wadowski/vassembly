import agentDomain, { type AgentInvokeMcpServerConfig } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import systemAgentDomain, { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';
import { WrongParamError, NotFoundError } from '@vassembly/errors';

import { resolveMcpSlugs } from '../resolveMcpSlugs';
import { loadAssignedInternalTools } from './loadAssignedInternalTools';
import { mapInvokeUsageToTokenUsage } from './mapInvokeUsageToTokenUsage';

import type {
  RunAgentInvokeWithToolsParams,
  RunAgentInvokeWithToolsResult,
} from './types';

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

const invokePersonalAgent = async ({
  userId,
  agentId,
  message,
  connectionOverride,
  toolContext,
}: RunAgentInvokeWithToolsParams): Promise<RunAgentInvokeWithToolsResult> => {
  const { data: agent } = await agentDomain.queries.getById({ id: agentId, userId });
  const credentialId = connectionOverride?.integrationCredentialId ?? agent.integrationCredentialId;

  if (!credentialId) {
    throw new WrongParamError('Agent has no AI integration configured');
  }

  const modeledProviderClient = await aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    connectionOverride: { integrationCredentialId: credentialId },
  });

  const mcpIds = agent.assignedMcpIds ?? [];
  const assignedToolIds = agent.assignedToolIds ?? [];
  const { mcpServerConfigs, skippedMcpIds } = await resolveMcpConfigs({ userId, mcpIds });
  const { bindings, skippedToolIds } = await loadAssignedInternalTools({
    assignedToolIds,
    toolContext,
  });

  const result = await agentDomain.commands.invoke({
    modeledProviderClient,
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
  userId,
  agentId,
  message,
  connectionOverride,
  toolContext,
}: RunAgentInvokeWithToolsParams): Promise<RunAgentInvokeWithToolsResult> => {
  const { data: agent } = await systemAgentDomain.queries.getActiveById({ id: agentId });

  if (agent === null) {
    throw new NotFoundError('This platform agent is no longer available.', {
      code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
    });
  }

  const modeledProviderClient = await aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    connectionOverride,
  });

  const assignedToolIds = agent.assignedToolIds ?? [];
  const { bindings, skippedToolIds } = await loadAssignedInternalTools({
    assignedToolIds,
    toolContext,
  });

  const result = await systemAgentDomain.commands.invoke({
    modeledProviderClient,
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

  if (recordProgress) {
    await recordProgress({
      agentId: params.agentId,
      parentAgentId: toolContext.parentAgentId,
      state: 'started',
      timestamp: new Date(),
      inputMessages: params.message,
    });
  }

  try {
    const result =
      params.agentType === 'personal'
        ? await invokePersonalAgent(params)
        : await invokeSystemAgent(params);

    if (recordProgress) {
      await recordProgress({
        agentId: params.agentId,
        parentAgentId: toolContext.parentAgentId,
        state: 'completed',
        timestamp: new Date(),
        duration: Date.now() - invokeStartTime,
        generatedResponse: result.message,
        tokenUsage: mapInvokeUsageToTokenUsage({ usage: result.usage }),
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
      });
    }

    throw error;
  }
};
