export const PROVIDER_OPTIONS = [
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'chatgpt', label: 'OpenAI ChatGPT' },
  { id: 'lm_studio', label: 'LM Studio (Local)' },
  { id: 'deep_seek', label: 'Deep Seek' },
  { id: 'anthropic', label: 'Anthropic' },
] as const;

export const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  chatgpt: 'OpenAI ChatGPT',
  lm_studio: 'LM Studio (Local)',
  deep_seek: 'Deep Seek',
  anthropic: 'Anthropic',
};

export const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'archived', label: 'Archived' },
];

export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  untested: 'Untested',
  connected: 'Connected',
  failed: 'Failed',
};

export const FORM_LIMITS = {
  nameMaxLength: 100,
  apiKeyMaxLength: 500,
  baseUrlMaxLength: 500,
  organizationIdMaxLength: 100,
  modelMaxLength: 200,
};

export const PAGE_SIZE = 10;
