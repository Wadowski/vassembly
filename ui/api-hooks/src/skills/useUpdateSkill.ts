import { useHttpMutation } from '../http/useHttpMutation';

import type { SkillItem, SkillUpdateMutationData, SkillUpdateVariables } from './types';

const resolveSkillPath = (variables: SkillUpdateVariables | undefined): string | undefined => {
  const skillId = variables?.skillId;

  if (skillId === undefined || skillId === '') {
    return undefined;
  }

  return `/skills/${skillId}`;
};

export const useUpdateSkill = () =>
  useHttpMutation<
    SkillUpdateMutationData,
    SkillUpdateVariables,
    SkillUpdateVariables['body'],
    SkillItem
  >({
    path: '/skills',
    resolvePath: resolveSkillPath,
    method: 'patch',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ skill: response }),
    internalErrorMessage: 'Update skill failed',
  });
