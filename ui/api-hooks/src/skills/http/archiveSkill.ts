import type { HttpClient } from '../../http/types';

import type { SkillItem } from '../types';

export interface ArchiveSkillParams {
  client: HttpClient;
  skillId: string;
}

export const archiveSkill = async ({
  client,
  skillId,
}: ArchiveSkillParams): Promise<SkillItem> => {
  if (skillId === '') {
    throw new Error('Skill id is required');
  }

  return client.delete<SkillItem>({
    path: `/skills/${skillId}`,
    withAuth: true,
  });
};
