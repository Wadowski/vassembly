import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';

export interface SeedFirstAiIntegrationForOnboardingParams {
  context: SeedContext;
  userId: string;
}

export const seedFirstAiIntegrationForOnboarding = async ({
  context,
  userId,
}: SeedFirstAiIntegrationForOnboardingParams): Promise<void> => {
  await ensureDomainInfrastructure({ context });

  const aiIntegrationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });
  const userDomain = requireWorkspaceModule<typeof import('@vassembly/domain-user')>({
    moduleName: '@vassembly/domain-user',
  });

  await aiIntegrationDomain.default.commands.create({
    userId,
    name: 'E2E Onboarding Integration',
    provider: 'gemini',
    apiKey: 'e2e-onboarding-api-key',
    model: 'gemini-pro',
  });

  await userDomain.default.commands.completeOnboarding({ userId });
};
