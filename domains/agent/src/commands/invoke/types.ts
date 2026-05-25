export interface ModeledProviderClient {
  invoke(message: string): Promise<{ message: string }>;
}

export interface InvokeAgentParams {
  modeledProviderClient: ModeledProviderClient;
  agentId: string;
  userId: string;
}

export interface InvokeAgentResult {
  message: string;
}
