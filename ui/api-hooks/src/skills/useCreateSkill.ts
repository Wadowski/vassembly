import { useHttpMutation } from '../http/useHttpMutation';

import type { SkillCreateMutationData, SkillCreateVariables, SkillItem } from './types';

export const useCreateSkill = () =>
  useHttpMutation<SkillCreateMutationData, SkillCreateVariables, SkillCreateVariables['body'], SkillItem>({
    path: '/skills',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ skill: response }),
    internalErrorMessage: 'Create skill failed',
  });
