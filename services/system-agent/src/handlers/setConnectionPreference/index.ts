import aiIntegrationDomain, {
  AiIntegrationConnectionStatus,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import systemAgentDomain, { throwSystemAgentConnectionInvalidError } from '@vassembly/domain-system-agent';

import { toPreferenceResponse } from '../../helpers/toPreferenceResponse';

import type { SetConnectionPreferenceParams, SetConnectionPreferenceResult } from './types';

const assertValidCredential = ({
  userId,
  credential,
}: {
  userId: string;
  credential: {
    userId?: string;
    status?: string;
    removedAt?: Date | null;
    connectionStatus?: string;
  };
}): void => {
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

export const setConnectionPreference = async (
  input: SetConnectionPreferenceParams,
): Promise<SetConnectionPreferenceResult> => {
  const { userId, integrationCredentialId } = input;

  const credentialResult = await aiIntegrationDomain.queries.getById({
    id: integrationCredentialId,
    userId,
  });

  assertValidCredential({ userId, credential: credentialResult.data });

  const result = await systemAgentDomain.commands.upsertPreference({
    userId,
    integrationCredentialId,
  });

  return {
    preference: toPreferenceResponse({ preference: result.data }),
  };
};
