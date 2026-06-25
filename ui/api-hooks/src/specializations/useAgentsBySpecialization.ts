import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { GET_AGENTS_BY_SPECIALIZATION_QUERY } from './GET_AGENTS_BY_SPECIALIZATION_QUERY';
import type {
  AgentsBySpecializationItem,
  UseAgentsBySpecializationArgs,
  UseAgentsBySpecializationResult,
} from './types';

interface GraphQLAgentsBySpecializationData {
  agentsBySpecialization?: {
    items: AgentsBySpecializationItem[];
    total: number;
    page: number;
    size: number;
  };
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;

export const useAgentsBySpecialization = (): UseAgentsBySpecializationResult => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLAgentsBySpecializationData,
    UseAgentsBySpecializationArgs
  >(GET_AGENTS_BY_SPECIALIZATION_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => {
    const agentsBySpecialization = graphQLData?.agentsBySpecialization;
    if (agentsBySpecialization === undefined) {
      return undefined;
    }

    return {
      items: agentsBySpecialization.items,
      total: agentsBySpecialization.total,
      page: agentsBySpecialization.page,
      size: agentsBySpecialization.size,
    };
  }, [graphQLData]);

  const executeAgents = useCallback(
    async (args: UseAgentsBySpecializationArgs): Promise<void> => {
      await execute({
        specializationId: args.specializationId,
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
    execute: executeAgents,
  };
};
