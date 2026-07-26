import { describe, expect, it } from 'vitest';

import { resolveOnboardingCurrentStepIndex } from './useOnboardingHub';

describe('resolveOnboardingCurrentStepIndex', () => {
  it('should return 0 when email is not verified', () => {
    expect(
      resolveOnboardingCurrentStepIndex({
        emailVerified: false,
        aiIntegrationCreated: false,
      }),
    ).toBe(0);
  });

  it('should return 1 when email is verified but AI integration is missing', () => {
    expect(
      resolveOnboardingCurrentStepIndex({
        emailVerified: true,
        aiIntegrationCreated: false,
      }),
    ).toBe(1);
  });

  it('should return 2 when AI integration is created', () => {
    expect(
      resolveOnboardingCurrentStepIndex({
        emailVerified: true,
        aiIntegrationCreated: true,
      }),
    ).toBe(2);
  });
});
