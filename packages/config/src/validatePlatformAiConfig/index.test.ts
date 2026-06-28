import { describe, expect, it } from 'vitest';

import type { PlatformAiConfig } from '../types';

import { validatePlatformAiConfig } from './index';

const VALID_GEMINI_CONFIG: PlatformAiConfig = {
  provider: 'gemini',
  apiKey: 'gemini-secret-key-value',
  baseUrl: '',
  defaultModel: 'gemini-2.0-flash',
};

const VALID_DEEP_SEEK_CONFIG: PlatformAiConfig = {
  provider: 'deep_seek',
  apiKey: 'deepseek-secret-key-value',
  baseUrl: 'https://api.deepseek.com/v1',
  defaultModel: 'deepseek-chat',
};

const VALID_LM_STUDIO_CONFIG: PlatformAiConfig = {
  provider: 'lm_studio',
  apiKey: '',
  baseUrl: 'http://localhost:1234/v1',
  defaultModel: 'local-model',
};

describe('validatePlatformAiConfig', () => {
  it('should pass when gemini config has apiKey and defaultModel', () => {
    expect(() => validatePlatformAiConfig(VALID_GEMINI_CONFIG)).not.toThrow();
  });

  it('should pass when deep_seek config has apiKey, baseUrl, and defaultModel', () => {
    expect(() => validatePlatformAiConfig(VALID_DEEP_SEEK_CONFIG)).not.toThrow();
  });

  it('should pass when lm_studio config has baseUrl and defaultModel without apiKey', () => {
    expect(() => validatePlatformAiConfig(VALID_LM_STUDIO_CONFIG)).not.toThrow();
  });

  it('should throw when defaultModel is missing', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_GEMINI_CONFIG,
        defaultModel: '',
      }),
    ).toThrow(/PLATFORM_AI_DEFAULT_MODEL|defaultModel/i);
  });

  it('should throw when provider is not allowed for platform AI', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_GEMINI_CONFIG,
        provider: 'chatgpt',
      }),
    ).toThrow(/not allowed for platform AI/i);
  });

  it('should throw when gemini config is missing apiKey', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_GEMINI_CONFIG,
        apiKey: '',
      }),
    ).toThrow(/PLATFORM_AI_API_KEY|apiKey/i);
  });

  it('should throw when deep_seek config is missing apiKey', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_DEEP_SEEK_CONFIG,
        apiKey: '',
      }),
    ).toThrow(/PLATFORM_AI_API_KEY|apiKey/i);
  });

  it('should throw when deep_seek config is missing baseUrl', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_DEEP_SEEK_CONFIG,
        baseUrl: '',
      }),
    ).toThrow(/PLATFORM_AI_BASE_URL|baseUrl/i);
  });

  it('should throw when lm_studio config is missing baseUrl', () => {
    expect(() =>
      validatePlatformAiConfig({
        ...VALID_LM_STUDIO_CONFIG,
        baseUrl: '',
      }),
    ).toThrow(/PLATFORM_AI_BASE_URL|baseUrl/i);
  });

  it('should not include apiKey value in error message when validation fails', () => {
    let errorMessage = '';

    try {
      validatePlatformAiConfig({
        ...VALID_GEMINI_CONFIG,
        apiKey: '',
        defaultModel: '',
      });
    } catch (error: unknown) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    expect(errorMessage).not.toContain('gemini-secret-key-value');
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
