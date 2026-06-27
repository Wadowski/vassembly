import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { LIST_SKILLS_BY_SPECIALIZATION_QUERY } from './LIST_SKILLS_BY_SPECIALIZATION_QUERY';
import type { UseSkillsBySpecializationArgs, UseSkillsBySpecializationResult } from './types';

interface GraphQLSkillsBySpecializationData {
  skillsBySpecialization?: {
    items: Array<{
      id: string;
      specializationId: string;
      name: string;
      description: string;
      enabled: boolean;
    }>;
    total: number;
    page: number;
    size: number;
  };
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;

export const useSkillsBySpecialization = (): UseSkillsBySpecializationResult => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLSkillsBySpecializationData,
    UseSkillsBySpecializationArgs
  >(LIST_SKILLS_BY_SPECIALIZATION_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => {
    const skillsBySpecialization = graphQLData?.skillsBySpecialization;
    if (skillsBySpecialization === undefined) {
      return undefined;
    }

    return {
      items: skillsBySpecialization.items,
      total: skillsBySpecialization.total,
      page: skillsBySpecialization.page,
      size: skillsBySpecialization.size,
    };
  }, [graphQLData]);

  const executeSkills = useCallback(
    async (args: UseSkillsBySpecializationArgs): Promise<void> => {
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
    execute: executeSkills,
  };
};
