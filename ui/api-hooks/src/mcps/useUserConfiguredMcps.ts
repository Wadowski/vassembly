import { useCallback, useMemo, useRef } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { GET_USER_CONFIGURED_MCPS_QUERY } from './queries/GET_USER_CONFIGURED_MCPS_QUERY';
import type {
  McpConfigurationStatus,
  McpWithConfigurationStatus,
  UseUserConfiguredMcpsArgs,
  UseUserConfiguredMcpsResult,
} from './types';

interface GraphQLMcpListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  slug: string;
  documentationUrl?: string | null;
  repositoryUrl?: string | null;
  configurationStatus?: McpConfigurationStatus | null;
  enabled?: boolean | null;
  requiresConfiguration?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

interface GraphQLUserConfiguredMcpsData {
  userConfiguredMcps?: {
    items: GraphQLMcpListItem[];
    total: number;
    page: number;
    size: number;
  };
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

const mapMcpListItem = (item: GraphQLMcpListItem): McpWithConfigurationStatus => ({
  id: item.id,
  name: item.name,
  description: item.description,
  tags: item.tags,
  iconPath: item.iconPath,
  slug: item.slug,
  documentationUrl: item.documentationUrl ?? undefined,
  repositoryUrl: item.repositoryUrl ?? undefined,
  configurationStatus: item.configurationStatus ?? 'configured',
  enabled: item.enabled ?? false,
  requiresConfiguration: item.requiresConfiguration ?? false,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

/**
 * Fetches paginated MCPs configured by the current user with catalog metadata.
 */
export function useUserConfiguredMcps(): UseUserConfiguredMcpsResult {
  const lastArgsRef = useRef<UseUserConfiguredMcpsArgs>({
    page: DEFAULT_PAGE,
    size: DEFAULT_SIZE,
  });

  const { execute, data, isLoading, error } = useApolloLazyQuery<
    GraphQLUserConfiguredMcpsData,
    UseUserConfiguredMcpsArgs
  >(GET_USER_CONFIGURED_MCPS_QUERY, {
    fetchPolicy: 'cache-and-network',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    const configuredMcps = data?.userConfiguredMcps;
    if (configuredMcps === undefined) {
      return undefined;
    }

    return {
      items: configuredMcps.items.map(mapMcpListItem),
      total: configuredMcps.total,
      page: configuredMcps.page,
      size: configuredMcps.size,
    };
  }, [data]);

  const executeConfiguredMcps = useCallback(
    async (args: UseUserConfiguredMcpsArgs = {}): Promise<void> => {
      const nextArgs = {
        page: args.page ?? DEFAULT_PAGE,
        size: args.size ?? DEFAULT_SIZE,
      };
      lastArgsRef.current = nextArgs;
      await execute(nextArgs);
    },
    [execute],
  );

  const refetch = useCallback((): void => {
    void executeConfiguredMcps(lastArgsRef.current);
  }, [executeConfiguredMcps]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
    execute: executeConfiguredMcps,
    refetch,
  };
}
