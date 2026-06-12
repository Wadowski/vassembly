import { requireWorkspaceModule } from '@vassembly/e2e';

import { seedAiCredentialForUser } from './seedTask';
import type { InitDomainContextParams } from './initDomainContext';

export interface SeedConnectedAiCredentialParams extends InitDomainContextParams {
  userId: string;
}

export const seedConnectedAiCredentialForUser = async ({
  context,
  userId,
}: SeedConnectedAiCredentialParams): Promise<string> => {
  const credentialId = await seedAiCredentialForUser({ context, userId });

  const aiDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });

  await aiDomain.default.commands.update({
    id: credentialId,
    userId,
    data: {
      connectionStatus: aiDomain.AiIntegrationConnectionStatus.Connected,
    },
  });

  return credentialId;
};
