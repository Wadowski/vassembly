export interface LmStudioClientParams {
  baseUrl: string;
  apiKey?: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  models?: string[];
  error?: string;
}

export interface InvokeParams {
  model: string;
  message: string;
}

export interface InvokeResult {
  message: string;
  model: string;
}

export interface LmStudioClientInterface {
  testConnection(): Promise<TestConnectionResult>;
  getModels(): Promise<string[]>;
  invoke(params: InvokeParams): Promise<InvokeResult>;
}
