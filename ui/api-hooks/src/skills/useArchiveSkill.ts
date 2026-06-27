import { useHttpMutation } from '../http/useHttpMutation';

import type { SkillArchiveMutationData, SkillArchiveVariables, SkillItem } from './types';

const resolveArchiveSkillPath = (
  variables: SkillArchiveVariables | undefined,
): string | undefined => {
  const skillId = variables?.skillId;

  if (skillId === undefined || skillId === '') {
    return undefined;
  }

  return `/skills/${skillId}`;
};

export const useArchiveSkill = () =>
  useHttpMutation<
    SkillArchiveMutationData,
    SkillArchiveVariables,
    Record<string, never>,
    SkillItem
  >({
    path: '/skills',
    resolvePath: resolveArchiveSkillPath,
    method: 'delete',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (response) => ({ skill: response }),
    internalErrorMessage: 'Archive skill failed',
  });
