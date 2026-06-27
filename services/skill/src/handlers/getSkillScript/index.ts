import skillDomain from '@vassembly/domain-skill';

import type { GetSkillScriptParams, GetSkillScriptResult } from './types';

export type { GetSkillScriptParams, GetSkillScriptResult } from './types';

export const getSkillScript = async ({
  skillId,
  filename,
}: GetSkillScriptParams): Promise<GetSkillScriptResult> =>
  skillDomain.queries.getScriptContent({ skillId, filename });
