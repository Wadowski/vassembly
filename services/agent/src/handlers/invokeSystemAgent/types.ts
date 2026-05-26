export interface InvokeSystemAgentParams {
  userId: string;
  systemAgentId: string;
  message: string;
  connectionOverride?: {
    integrationCredentialId: string;
  };
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
