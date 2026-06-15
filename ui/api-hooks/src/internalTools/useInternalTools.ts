import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { INTERNAL_TOOLS_QUERY } from './queries/INTERNAL_TOOLS_QUERY';
import type { InternalToolDto, UseInternalToolsResult } from './types';
import { InternalToolAccessScope } from './types';

interface GraphQLInternalToolRow {
  id: string;
  displayName: string;
  description: string;
  accessScope: string;
}

interface GraphQLInternalToolsData {
  internalTools?: GraphQLInternalToolRow[];
}

const toInternalToolAccessScope = (value: string): InternalToolAccessScope => {
  const scopes = Object.values(InternalToolAccessScope) as string[];
  if (scopes.includes(value)) {
    return value as InternalToolAccessScope;
  }

  return InternalToolAccessScope.SYSTEM_AND_PERSONAL;
};

const mapInternalTool = (tool: GraphQLInternalToolRow): InternalToolDto => ({
  id: tool.id,
  displayName: tool.displayName,
  description: tool.description,
  accessScope: toInternalToolAccessScope(tool.accessScope),
});

export const useInternalTools = (): UseInternalToolsResult => {
  const { data: graphQLData, isLoading, error, refetch } = useApolloQuery<
    GraphQLInternalToolsData,
    Record<string, never>
  >(INTERNAL_TOOLS_QUERY, {
    fetchPolicy: 'cache-and-network',
    withAuth: true,
  });

  const data = useMemo(() => {
    return graphQLData?.internalTools?.map(mapInternalTool);
  }, [graphQLData]);

  return {
    data,
    loading: isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
};
