export interface AiProviderTestResult {
  success: boolean;
  models?: string[];
  error?: string;
}

import type { McpServerConfig } from './mcp/types';

export interface InternalToolBinding {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface AiProviderInvokeParams {
  model: string;
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: McpServerConfig[];
  internalToolBindings?: InternalToolBinding[];
  signal?: AbortSignal;
}

export interface AiProviderInvokeResult {
  message: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolUsage?: {
    internalToolIdsUsed: string[];
    skippedInternalToolIds: string[];
    skippedMcpToolNames?: string[];
  };
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

export interface DeepSeekProviderParams {
  apiKey: string;
  baseUrl?: string | null;
}

export interface AnthropicProviderParams {
  apiKey: string;
}
