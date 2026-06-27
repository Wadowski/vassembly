import type { HttpClient } from '../../http/types';

import type { CreateSkillInput, SkillItem } from '../types';

export interface CreateSkillParams {
  client: HttpClient;
  input: CreateSkillInput;
}

export const createSkill = async ({
  client,
  input,
}: CreateSkillParams): Promise<SkillItem> =>
  client.post<CreateSkillInput, SkillItem>({
    path: '/skills',
    body: input,
    withAuth: true,
  });
