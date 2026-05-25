export const AI_INTEGRATION_LIST_ALL_STATUSES = 'all' as const;
export const AI_INTEGRATION_LIST_ALL_PROVIDERS = 'all' as const;

export type AiIntegrationListStatusFilter =
  | typeof AI_INTEGRATION_LIST_ALL_STATUSES
  | 'active'
  | 'disabled'
  | 'archived';

export type AiIntegrationListProviderFilter =
  | typeof AI_INTEGRATION_LIST_ALL_PROVIDERS
  | 'gemini'
  | 'chatgpt'
  | 'lm_studio';

export const AI_INTEGRATION_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: AiIntegrationListStatusFilter;
  label: string;
}> = [
  { value: AI_INTEGRATION_LIST_ALL_STATUSES, label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'archived', label: 'Archived' },
];

export const AI_INTEGRATION_PROVIDER_FILTER_OPTIONS: ReadonlyArray<{
  value: AiIntegrationListProviderFilter;
  label: string;
}> = [
  { value: AI_INTEGRATION_LIST_ALL_PROVIDERS, label: 'All providers' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'chatgpt', label: 'OpenAI ChatGPT' },
  { value: 'lm_studio', label: 'LM Studio' },
];
