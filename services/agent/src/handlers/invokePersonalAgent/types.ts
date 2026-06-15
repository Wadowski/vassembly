export interface InvokePersonalAgentParams {
  userId: string;
  agentId: string;
  message: string;
}

export interface InvokePersonalAgentResult {
  message: string;
  metadata?: {
    mcpIdsUsed: string[];
    skippedMcpIds: string[];
    internalToolIdsUsed?: string[];
    skippedInternalToolIds?: string[];
    maxUseAgentDepth?: number;
  };
}
