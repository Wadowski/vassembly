import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';

export interface SeedActiveAiCredentialParams {
  context: SeedContext;
  userId: string;
}

export const seedActiveAiCredential = async ({
  context,
  userId,
}: SeedActiveAiCredentialParams): Promise<void> => {
  await ensureDomainInfrastructure({ context });

  const aiIntegrationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });

  await aiIntegrationDomain.default.commands.create({
    userId,
    name: 'E2E Onboarding Integration',
    provider: 'gemini',
    apiKey: 'e2e-onboarding-api-key',
    model: 'gemini-pro',
  });
};
