import type { HttpClient } from '../../http/types';

import type { SkillItem, UpdateSkillInput } from '../types';

export interface UpdateSkillParams {
  client: HttpClient;
  skillId: string;
  input: UpdateSkillInput;
}

export const updateSkill = async ({
  client,
  skillId,
  input,
}: UpdateSkillParams): Promise<SkillItem> =>
  client.patch<UpdateSkillInput, SkillItem>({
    path: `/skills/${skillId}`,
    body: input,
    withAuth: true,
  });
