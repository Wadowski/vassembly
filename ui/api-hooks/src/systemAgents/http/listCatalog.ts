import type { HttpClient } from '../../http/types';

import type { ListCatalogInput, ListCatalogOutput } from '../types';

export interface ListCatalogParams {
  client: HttpClient;
  input?: ListCatalogInput;
}

export const listCatalog = async ({
  client,
  input = {},
}: ListCatalogParams): Promise<ListCatalogOutput> =>
  client.get<ListCatalogOutput>({
    path: '/system-agents/catalog',
    query: input as Record<string, string | number | boolean>,
    withAuth: true,
  });
