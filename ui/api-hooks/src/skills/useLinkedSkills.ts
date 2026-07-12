import { useMemo } from 'react';

import { useSkill } from './useSkill';
import type { UseLinkedSkillsArgs, UseLinkedSkillsResult } from './linkedSkillsTypes';

const MAX_LINKED_SKILLS = 5;

export const useLinkedSkills = ({ ids }: UseLinkedSkillsArgs): UseLinkedSkillsResult => {
  const normalizedIds = useMemo(
    () => ids.filter((id) => id.trim() !== '').slice(0, MAX_LINKED_SKILLS),
    [ids],
  );

  const id0 = normalizedIds[0] ?? '';
  const id1 = normalizedIds[1] ?? '';
  const id2 = normalizedIds[2] ?? '';
  const id3 = normalizedIds[3] ?? '';
  const id4 = normalizedIds[4] ?? '';

  const result0 = useSkill({ skillId: id0, skip: id0 === '' });
  const result1 = useSkill({ skillId: id1, skip: id1 === '' });
  const result2 = useSkill({ skillId: id2, skip: id2 === '' });
  const result3 = useSkill({ skillId: id3, skip: id3 === '' });
  const result4 = useSkill({ skillId: id4, skip: id4 === '' });

  const results = [result0, result1, result2, result3, result4];

  const skills = useMemo((): UseLinkedSkillsResult['skills'] => {
    return normalizedIds.flatMap((id, index) => {
      const skill = results[index]?.data?.skill;

      if (skill === undefined || skill === null) {
        return [];
      }

      return [
        {
          id,
          name: skill.name,
          specializationId: skill.specializationId,
        },
      ];
    });
  }, [normalizedIds, result0.data, result1.data, result2.data, result3.data, result4.data]);

  const loading = normalizedIds.some((id, index) => id !== '' && results[index]?.loading === true);

  return {
    skills,
    loading,
  };
};
