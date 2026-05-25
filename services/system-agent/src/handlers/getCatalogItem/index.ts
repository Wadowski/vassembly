import systemAgentDomain, { throwSystemAgentNotFoundError } from '@vassembly/domain-system-agent';

import type { GetCatalogItemParams, GetCatalogItemResult } from './types';

export const getCatalogItem = async (
  input: GetCatalogItemParams,
): Promise<GetCatalogItemResult> => {
  const { systemAgentId } = input;

  const result = await systemAgentDomain.queries.getActiveById({ id: systemAgentId });

  if (!result.data) {
    throwSystemAgentNotFoundError();
  }

  return {
    item: result.data!,
  };
};
