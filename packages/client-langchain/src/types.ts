export interface AiProviderTestResult {
  success: boolean;
  models?: string[];
  error?: string;
}

export interface AiProviderInvokeParams {
  model: string;
  message: string;
}

export interface AiProviderInvokeResult {
  message: string;
  model: string;
}

export interface AiProviderClient {
  testConnection(): Promise<AiProviderTestResult>;
  getModels(): Promise<string[]>;
  invoke(params: AiProviderInvokeParams): Promise<AiProviderInvokeResult>;
}

export interface CreateProviderClientParams {
  provider: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export interface ChatGptProviderParams {
  apiKey: string;
  organizationId?: string | null;
}

export interface GeminiProviderParams {
  apiKey: string;
}

export interface LmStudioProviderParams {
  baseUrl: string;
  apiKey?: string | null;
}
