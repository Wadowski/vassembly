import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import type { ListCredentialsHandlerInput, ListCredentialsHandlerOutput } from './types';

export const listCredentials = async (
  input: ListCredentialsHandlerInput,
): Promise<ListCredentialsHandlerOutput> => {
  const result = await aiIntegrationDomain.queries.getListForUser({
    userId: input.userId,
    page: input.page,
    size: input.size,
    search: input.search,
    status: input.status,
    provider: input.provider,
  });

  const items = await Promise.all(
    result.items.map((credential) => enrichCredentialResponse({ credential })),
  );

  return {
    items,
    totalCount: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
