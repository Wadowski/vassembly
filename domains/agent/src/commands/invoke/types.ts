export interface AgentInvokeMcpServerConfig {
  serverName: string;
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface InternalToolBinding {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface ModeledProviderToolUsage {
  internalToolIdsUsed: string[];
  skippedInternalToolIds: string[];
  skippedMcpToolNames?: string[];
}

export interface ModeledProviderInvokeParams {
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: AgentInvokeMcpServerConfig[];
  internalToolBindings?: InternalToolBinding[];
}

export interface ModeledProviderClient {
  invoke(
    params: ModeledProviderInvokeParams | string,
  ): Promise<{
    message: string;
    toolUsage?: ModeledProviderToolUsage;
    usage?: { promptTokens: number; completionTokens: number; totalTokens?: number };
  }>;
}

export interface InvokeAgentParams {
  modeledProviderClient: ModeledProviderClient;
  agentId: string;
  userId: string;
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: AgentInvokeMcpServerConfig[];
  internalToolBindings?: InternalToolBinding[];
}

export interface InvokeAgentResult {
  message: string;
  toolUsage?: ModeledProviderToolUsage;
  usage?: { promptTokens: number; completionTokens: number; totalTokens?: number };
}
