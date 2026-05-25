import aiIntegrationDomain, {
  AiIntegrationConnectionStatus,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import systemAgentDomain, {
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
} from '@vassembly/domain-system-agent';

import type { ResolveInvokeCredentialParams, ResolveInvokeCredentialResult } from './types';

type ValidCredential = {
  userId?: string;
  status?: string;
  removedAt?: Date | null;
  connectionStatus?: string;
};

const assertValidCredential = (
  userId: string,
  credential: ValidCredential | null,
): asserts credential is ValidCredential => {
  if (!credential) {
    throwSystemAgentConnectionInvalidError();
  }

  if (credential.userId !== userId) {
    throwSystemAgentConnectionInvalidError();
  }

  if (credential.status !== AiIntegrationStatus.Active || credential.removedAt) {
    throwSystemAgentConnectionInvalidError();
  }

  if (credential.connectionStatus !== AiIntegrationConnectionStatus.Connected) {
    throwSystemAgentConnectionInvalidError();
  }
};

export const resolveInvokeCredential = async ({
  userId,
  connectionOverride,
}: ResolveInvokeCredentialParams): Promise<ResolveInvokeCredentialResult> => {
  const credentialId = connectionOverride?.integrationCredentialId
    ? connectionOverride.integrationCredentialId
    : (await systemAgentDomain.queries.getPreferenceByUserId({ userId })).data
        ?.integrationCredentialId;

  if (!credentialId) {
    throwSystemAgentConnectionRequiredError();
  }

  const credentialResult = await aiIntegrationDomain.queries.getById({
    id: credentialId,
    userId,
  });

  assertValidCredential(userId, credentialResult.data ?? null);

  return credentialResult.data!;
};
