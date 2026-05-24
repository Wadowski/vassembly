import type {
  AiIntegrationCredentialDto,
  AiIntegrationProvider,
  AiIntegrationsListResponse,
  GraphQLAiIntegrationCredential,
  GraphQLAiIntegrationsListData,
} from '../types';

const PROVIDERS: AiIntegrationProvider[] = ['gemini', 'chatgpt', 'lm_studio'];

const toProvider = (value: string | null | undefined): AiIntegrationProvider => {
  if (value && PROVIDERS.includes(value as AiIntegrationProvider)) {
    return value as AiIntegrationProvider;
  }
  return 'gemini';
};

const toCredentialDto = (row: GraphQLAiIntegrationCredential): AiIntegrationCredentialDto => ({
  id: row.id ?? '',
  userId: row.userId ?? '',
  name: row.name ?? '',
  provider: toProvider(row.provider),
  hasApiKey: row.hasApiKey ?? false,
  apiKeyHint: row.apiKeyHint ?? null,
  baseUrl: row.baseUrl ?? null,
  organizationId: row.organizationId ?? null,
  status: row.status ?? '',
  connectionStatus: row.connectionStatus ?? '',
  lastTestedAt: row.lastTestedAt ?? null,
  lastConnectionError: row.lastConnectionError ?? null,
  model: row.model ?? undefined,
  agentUsageCount: row.agentUsageCount ?? undefined,
  createdAt: row.createdAt ?? '',
  updatedAt: row.updatedAt ?? '',
  removedAt: row.removedAt ?? null,
});

export const mapAiIntegrationsListData = (
  data?: GraphQLAiIntegrationsListData,
): AiIntegrationsListResponse | undefined => {
  const list = data?.aiIntegrations;
  if (!list) {
    return undefined;
  }

  return {
    items: (list.items ?? []).map(toCredentialDto),
    totalCount: list.totalCount ?? 0,
    page: list.page ?? 0,
    size: list.size ?? 0,
  };
};
