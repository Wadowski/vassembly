import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import type { RestoreCredentialHandlerInput, RestoreCredentialHandlerOutput } from './types';

export const restoreCredential = async (
  input: RestoreCredentialHandlerInput,
): Promise<RestoreCredentialHandlerOutput> => {
  const result = await aiIntegrationDomain.commands.restore({
    id: input.credentialId,
    userId: input.userId,
  });

  return { credential: await enrichCredentialResponse({ credential: result.data }) };
};
