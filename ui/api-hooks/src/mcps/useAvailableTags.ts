import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { AVAILABLE_TAGS_QUERY } from './AVAILABLE_TAGS_QUERY';

interface GraphQLAvailableTagsData {
  availableTags?: {
    tags: string[];
  };
}

export interface UseAvailableTagsResult {
  data?: string[];
  loading: boolean;
  error?: Error;
  execute: () => Promise<void>;
}

export function useAvailableTags(): UseAvailableTagsResult {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLAvailableTagsData,
    Record<string, never>
  >(AVAILABLE_TAGS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => {
    return graphQLData?.availableTags?.tags;
  }, [graphQLData]);

  const executeQuery = useCallback(async () => {
    await execute({});
  }, [execute]);

  return {
    data,
    loading: isLoading,
    error,
    execute: executeQuery,
  };
}
