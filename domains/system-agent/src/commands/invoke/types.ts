export interface ModeledProviderClient {
  invoke(prompt: string): Promise<{
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
  }>;
}

export interface InvokeSystemAgentParams {
  modeledProviderClient: ModeledProviderClient;
  systemAgentId: string;
  message: string;
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
}
