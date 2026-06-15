import { describe, it, expect } from 'vitest';

import { getProviderLabel } from './getProviderLabel';

describe('getProviderLabel', () => {
  it('should return human-readable label for known provider', () => {
    expect(getProviderLabel({ provider: 'chatgpt' })).toBe('OpenAI ChatGPT');
  });

  it('should return raw provider when label is unknown', () => {
    expect(getProviderLabel({ provider: 'custom-provider' })).toBe('custom-provider');
  });

  it('should return empty string when provider is null', () => {
    expect(getProviderLabel({ provider: null })).toBe('');
  });
});
