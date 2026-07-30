import { describe, expect, it } from 'vitest';

import { isOnboardingAllowedRoute } from './isOnboardingAllowedRoute';

describe('isOnboardingAllowedRoute', () => {
  it('should allow /mcps during onboarding', () => {
    expect(isOnboardingAllowedRoute('/mcps')).toBe(true);
  });

  it('should allow /mcps/[id] during onboarding via prefix match', () => {
    expect(isOnboardingAllowedRoute('/mcps/abc123')).toBe(true);
  });

  it('should preserve existing allowlist entries', () => {
    expect(isOnboardingAllowedRoute('/onboarding')).toBe(true);
    expect(isOnboardingAllowedRoute('/settings')).toBe(true);
    expect(isOnboardingAllowedRoute('/agents/ai-integrations/create')).toBe(true);
    expect(isOnboardingAllowedRoute('/verify-email')).toBe(true);
  });

  it('should reject routes outside the onboarding allowlist', () => {
    expect(isOnboardingAllowedRoute('/agents')).toBe(false);
    expect(isOnboardingAllowedRoute('/')).toBe(false);
    expect(isOnboardingAllowedRoute('/dashboard')).toBe(false);
  });
});
