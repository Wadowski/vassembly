import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_SKILL_QUERY } from './GET_SKILL_QUERY';
import type { SkillItem, UseSkillArgs, UseSkillResult } from './types';

interface GraphQLSkillData {
  skill?: SkillItem | null;
}

interface GetSkillVariables {
  id: string;
}

export const useSkill = ({ skillId, skip = false }: UseSkillArgs): UseSkillResult => {
  const { data, isLoading, error, refetch } = useApolloQuery<GraphQLSkillData, GetSkillVariables>(
    GET_SKILL_QUERY,
    {
      variables: { id: skillId },
      skip: skip || skillId === '',
      withAuth: true,
    },
  );

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    const skill = data.skill;
    if (skill === null || skill === undefined) {
      return { skill: null };
    }

    return {
      skill: {
        ...skill,
        scripts: skill.scripts ?? [],
      },
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
};
