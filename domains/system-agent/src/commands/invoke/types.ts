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
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
}

export interface ModeledProviderClient {
  invoke(params: ModeledProviderInvokeParams | string): Promise<{
    message: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    metadata?: {
      model: string;
      provider: string;
    };
    toolUsage?: ModeledProviderToolUsage;
  }>;
}

export interface InvokeSystemAgentParams {
  modeledProviderClient: ModeledProviderClient;
  systemAgentId: string;
  message: string;
  mcpServerConfigs?: AgentInvokeMcpServerConfig[];
  internalToolBindings?: InternalToolBinding[];
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
  skillsCatalogSection?: string;
}

export interface InvokeSystemAgentResult {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    provider: string;
  };
  toolUsage?: ModeledProviderToolUsage;
}
