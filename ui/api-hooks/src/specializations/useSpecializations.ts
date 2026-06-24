import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { LIST_SPECIALIZATIONS_QUERY } from './LIST_SPECIALIZATIONS_QUERY';
import type {
  SpecializationListItem,
  SpecializationsListResponse,
  UseSpecializationsArgs,
  UseSpecializationsResult,
} from './types';

interface GraphQLSpecializationListItem {
  id: string;
  name: string;
  description: string;
  agentIds?: string[] | null;
  mcpIds?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface GraphQLSpecializationsListData {
  specializations?: {
    items: GraphQLSpecializationListItem[];
    total: number;
    page: number;
    size: number;
  };
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

const mapSpecializationListItem = (
  item: GraphQLSpecializationListItem,
): SpecializationListItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  agentIds: item.agentIds ?? undefined,
  mcpIds: item.mcpIds ?? undefined,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const useSpecializations = (): UseSpecializationsResult => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLSpecializationsListData,
    UseSpecializationsArgs
  >(LIST_SPECIALIZATIONS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo((): SpecializationsListResponse | undefined => {
    const specializations = graphQLData?.specializations;
    if (specializations === undefined) {
      return undefined;
    }

    return {
      items: specializations.items.map(mapSpecializationListItem),
      total: specializations.total,
      page: specializations.page,
      size: specializations.size,
    };
  }, [graphQLData]);

  const executeSpecializations = useCallback(
    async (args: UseSpecializationsArgs = {}): Promise<void> => {
      await execute({
        page: args.page ?? DEFAULT_PAGE,
        size: args.size ?? DEFAULT_SIZE,
        search: args.search,
      });
    },
    [execute],
  );

  return {
    data,
    loading: isLoading,
    error,
    execute: executeSpecializations,
  };
};
