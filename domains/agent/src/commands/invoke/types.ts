export interface AgentInvokeMcpServerConfig {
  serverName: string;
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface ModeledProviderInvokeParams {
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: AgentInvokeMcpServerConfig[];
}

export interface ModeledProviderClient {
  invoke(params: ModeledProviderInvokeParams | string): Promise<{ message: string }>;
}

export interface InvokeAgentParams {
  modeledProviderClient: ModeledProviderClient;
  agentId: string;
  userId: string;
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: AgentInvokeMcpServerConfig[];
}

export interface InvokeAgentResult {
  message: string;
}
