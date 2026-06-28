import type { PlatformAiConfig } from '../types';

const ALLOWED_PROVIDERS = ['gemini', 'deep_seek', 'lm_studio'] as const;

type PlatformAiConfigField = 'apiKey' | 'baseUrl';

const PROVIDER_REQUIRED_FIELDS: Record<string, PlatformAiConfigField[]> = {
  gemini: ['apiKey'],
  deep_seek: ['apiKey', 'baseUrl'],
  lm_studio: ['baseUrl'],
};

const FIELD_ENV_NAMES = {
  apiKey: 'PLATFORM_AI_API_KEY',
  baseUrl: 'PLATFORM_AI_BASE_URL',
  defaultModel: 'PLATFORM_AI_DEFAULT_MODEL',
  provider: 'PLATFORM_AI_PROVIDER',
} as const;

export const validatePlatformAiConfig = (input: PlatformAiConfig): void => {
  const errors: string[] = [];

  if (!input.defaultModel.trim()) {
    errors.push(`${FIELD_ENV_NAMES.defaultModel} is required`);
  }

  if (!ALLOWED_PROVIDERS.includes(input.provider as (typeof ALLOWED_PROVIDERS)[number])) {
    errors.push(`${FIELD_ENV_NAMES.provider} is not allowed for platform AI`);
  }

  const requiredFields = PROVIDER_REQUIRED_FIELDS[input.provider] ?? [];

  for (const field of requiredFields) {
    if (!input[field].trim()) {
      errors.push(`${FIELD_ENV_NAMES[field]} is required`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
};
