export interface AgentInvokeMcpServerConfig {
  serverName: string;
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  label?: string;
}

export interface InternalToolBinding {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface ModeledProviderToolUsage {
  internalToolIdsUsed: string[];
  internalToolResults?: Array<{ toolId: string; content: string }>;
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
  recordMcpToolCall?: (input: {
    phase: 'started';
    mcpId: string;
    toolName: string;
    originalToolName: string;
    args: Record<string, unknown>;
    startedAt: Date;
  } | {
    phase: 'completed';
    eventId: string;
    status: 'success' | 'error';
    endedAt: Date;
    durationMs: number;
    errorMessage?: string;
  }) => Promise<string | void>;
  recordInternalToolCall?: (input: {
    phase: 'started';
    internalToolId: string;
    toolName: string;
    args: Record<string, unknown>;
    startedAt: Date;
  } | {
    phase: 'completed';
    eventId: string;
    status: 'success' | 'error';
    endedAt: Date;
    durationMs: number;
    errorMessage?: string;
  }) => Promise<string | void>;
  requireSuccessfulToolLlmName?: string;
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
  recordMcpToolCall?: ModeledProviderInvokeParams['recordMcpToolCall'];
  recordInternalToolCall?: ModeledProviderInvokeParams['recordInternalToolCall'];
  skillsCatalogSection?: string;
  agentsCatalogSection?: string;
  requireSuccessfulToolLlmName?: string;
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
