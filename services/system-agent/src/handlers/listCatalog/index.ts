import systemAgentDomain, {
  systemAgentFactory,
  toCatalogListItem,
} from '@vassembly/domain-system-agent';

import type { ListCatalogParams, ListCatalogResult } from './types';

export const listCatalog = async (input: ListCatalogParams): Promise<ListCatalogResult> => {
  const { search, category, page, size } = input;

  const result = await systemAgentDomain.queries.getCatalogList({
    search,
    category,
    page,
    size,
  });

  return {
    items: result.items.map((item) =>
      toCatalogListItem({
        systemAgent: systemAgentFactory.create(item),
      }),
    ),
    total: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
