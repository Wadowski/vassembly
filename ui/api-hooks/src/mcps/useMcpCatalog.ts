import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { LIST_MCPS_QUERY } from './LIST_MCPS_QUERY';
import type { McpListItem, UseMcpsArgs, UseMcpCatalogResult } from './types';

interface GraphQLMcpListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  slug: string;
  documentationUrl?: string | null;
  repositoryUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GraphQLMcpsListData {
  mcps?: {
    items: GraphQLMcpListItem[];
    total: number;
    page: number;
    size: number;
  };
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

const mapMcpListItem = (item: GraphQLMcpListItem): McpListItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  tags: item.tags,
  iconPath: item.iconPath,
  slug: item.slug,
  documentationUrl: item.documentationUrl ?? undefined,
  repositoryUrl: item.repositoryUrl ?? undefined,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

/**
 * Fetches paginated MCP catalog entries for the listing page.
 */
export function useMcpCatalog(): UseMcpCatalogResult {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLMcpsListData,
    UseMcpsArgs
  >(LIST_MCPS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => {
    const mcps = graphQLData?.mcps;
    if (mcps === undefined) {
      return undefined;
    }

    return {
      items: mcps.items.map(mapMcpListItem),
      total: mcps.total,
      page: mcps.page,
      size: mcps.size,
    };
  }, [graphQLData]);

  const executeMcps = useCallback(
    async (args: UseMcpsArgs = {}): Promise<void> => {
      await execute({
        page: args.page ?? DEFAULT_PAGE,
        size: args.size ?? DEFAULT_SIZE,
        search: args.search,
        tags: args.tags,
      });
    },
    [execute],
  );

  return {
    data,
    loading: isLoading,
    error,
    execute: executeMcps,
  };
}
