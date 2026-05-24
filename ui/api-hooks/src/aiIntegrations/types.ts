export type AiIntegrationProvider = 'gemini' | 'chatgpt' | 'lm_studio';

export interface AiIntegrationCredentialDto {
  id: string;
  userId: string;
  name: string;
  provider: AiIntegrationProvider;
  hasApiKey: boolean;
  apiKeyHint?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
  status: string;
  connectionStatus: string;
  lastTestedAt?: string | null;
  lastConnectionError?: string | null;
  agentUsageCount?: number;
  createdAt: string;
  updatedAt: string;
  removedAt?: string | null;
}

export interface AiIntegrationsListResponse {
  items: AiIntegrationCredentialDto[];
  totalCount: number;
  page: number;
  size: number;
}

export interface TestConnectionResult {
  success: boolean;
  models?: string[];
  error?: string;
}

export interface GraphQLAiIntegrationCredential {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  provider?: string | null;
  hasApiKey?: boolean | null;
  apiKeyHint?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
  status?: string | null;
  connectionStatus?: string | null;
  lastTestedAt?: string | null;
  lastConnectionError?: string | null;
  agentUsageCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  removedAt?: string | null;
}

export interface GraphQLAiIntegrationsListData {
  aiIntegrations?: {
    items?: GraphQLAiIntegrationCredential[] | null;
    totalCount?: number | null;
    page?: number | null;
    size?: number | null;
  } | null;
}

export interface ListAiIntegrationsVariables {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  provider?: string;
}

export interface AiIntegrationFormInput {
  name: string;
  provider: AiIntegrationProvider;
  apiKey: string;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export interface AiIntegrationUpdateInput {
  name?: string;
  apiKey?: string;
  baseUrl?: string | null;
  organizationId?: string | null;
}
