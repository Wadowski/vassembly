import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import type { AgentDto } from '../agents/types';
import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type { McpConfigurationMutationState } from './types';

interface UnassignMcpFromAgentInput {
  mcpId: string;
  agentId: string;
}

interface UnassignMcpFromAgentResponse {
  agent: AgentDto;
}

/**
 * Removes an MCP assignment from an agent via REST DELETE.
 */
export function useUnassignMcpFromAgent(): readonly [
  (input: UnassignMcpFromAgentInput) => Promise<UnassignMcpFromAgentResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const unassignMcpFromAgent = useCallback(
    async (input: UnassignMcpFromAgentInput): Promise<UnassignMcpFromAgentResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.delete<UnassignMcpFromAgentResponse>({
          path: `/mcps/${input.mcpId}/agents/${input.agentId}`,
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to remove MCP from agent',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [unassignMcpFromAgent, { loading, error }] as const;
}
