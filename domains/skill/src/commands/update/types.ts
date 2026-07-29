import type { SkillModel } from '../../model';

import type { SkillScriptInput } from '../shared/types';

export interface UpdateSkillCommandInput {
  id: string;
  description?: string;
  input?: string;
  output?: string;
  rule?: string;
  enabled?: boolean;
  scripts?: SkillScriptInput[];
  usesSkillIds?: string[];
}

export interface UpdateSkillCommandResult {
  data: SkillModel;
}
