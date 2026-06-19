export const AiIntegrationProvider = {
  Gemini: 'gemini',
  ChatGpt: 'chatgpt',
  LmStudio: 'lm_studio',
  DeepSeek: 'deep_seek',
  Anthropic: 'anthropic',
} as const;

export const AiIntegrationStatus = {
  Active: 'active',
  Disabled: 'disabled',
  Archived: 'archived',
} as const;

export const AiIntegrationConnectionStatus = {
  Untested: 'untested',
  Connected: 'connected',
  Failed: 'failed',
} as const;
