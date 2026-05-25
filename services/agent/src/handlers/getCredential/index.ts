import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import type { GetCredentialHandlerInput, GetCredentialHandlerOutput } from './types';

export const getCredential = async (
  input: GetCredentialHandlerInput,
): Promise<GetCredentialHandlerOutput> => {
  const result = await aiIntegrationDomain.queries.getById({
    id: input.credentialId,
    userId: input.userId,
  });

  return { credential: await enrichCredentialResponse({ credential: result.data }) };
};
