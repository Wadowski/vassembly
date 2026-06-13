'use client';

import { useCallback, useState } from 'react';

import type { McpWithAgentsAgent } from '@vassembly/ui-api-hooks';
import { useMcpWithAgents, useUnassignMcpFromAgent } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useRouter } from 'next/navigation';

import type { McpAgentsSectionProps, McpAgentsUnassignTarget } from './types';

export interface UseMcpAgentsSectionResult {
  agents: McpWithAgentsAgent[];
  isLoading: boolean;
  isEmpty: boolean;
  unassignTarget: McpAgentsUnassignTarget | null;
  isUnassigning: boolean;
  handleEdit: (editHref: string) => void;
  openUnassign: (agent: McpWithAgentsAgent) => void;
  closeUnassign: () => void;
  confirmUnassign: () => Promise<void>;
}

export const useMcpAgentsSection = ({
  mcpId,
}: McpAgentsSectionProps): UseMcpAgentsSectionResult => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const { data, loading, refetch } = useMcpWithAgents({ mcpId });
  const [unassignMcpFromAgent, { loading: isUnassigning }] = useUnassignMcpFromAgent();
  const [unassignTarget, setUnassignTarget] = useState<McpAgentsUnassignTarget | null>(null);

  const agents = data?.agents ?? [];

  const handleEdit = useCallback(
    (editHref: string): void => {
      router.push(editHref);
    },
    [router],
  );

  const openUnassign = useCallback((agent: McpWithAgentsAgent): void => {
    setUnassignTarget({
      agentId: agent.id,
      agentName: agent.name,
    });
  }, []);

  const closeUnassign = useCallback((): void => {
    setUnassignTarget(null);
  }, []);

  const confirmUnassign = useCallback(async (): Promise<void> => {
    if (unassignTarget === null) {
      return;
    }

    const result = await unassignMcpFromAgent({
      mcpId,
      agentId: unassignTarget.agentId,
    });

    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: 'Unable to remove MCP from agent',
        duration: 5000,
      });
      return;
    }

    snackbar.show({
      variant: 'success',
      message: 'MCP removed from agent',
      duration: 4000,
    });
    setUnassignTarget(null);
    refetch?.();
  }, [mcpId, refetch, snackbar, unassignMcpFromAgent, unassignTarget]);

  return {
    agents,
    isLoading: loading,
    isEmpty: !loading && agents.length === 0,
    unassignTarget,
    isUnassigning,
    handleEdit,
    openUnassign,
    closeUnassign,
    confirmUnassign,
  };
};
